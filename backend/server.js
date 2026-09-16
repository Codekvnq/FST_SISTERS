require('dotenv').config({ path: require('path').join(__dirname, '.env') });
var express = require('express');
var cors = require('cors');
var path = require('path');
var dbConfig = require('./config/db');
var connectDB = dbConfig.connectDB;
var backup = require('./utils/backup');
var supabase = require('./utils/supabase');
var syncWorker = require('./utils/sync');

var app = express();
var PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..')));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sisters', require('./routes/sisters'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/api/health', function(req, res) {
  var db = require('./config/db').db;
  db.get("SELECT COUNT(*) AS pending FROM outbox WHERE status = 'pending'", function(err, row) {
    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        supabase: supabase.isEnabled() ? 'connected' : 'disabled',
        drive: (function() {
          try { return require('./utils/drive').isConfigured() ? 'connected' : 'disabled'; }
          catch (e) { return 'disabled'; }
        })(),
        outboxPending: err ? null : (row ? row.pending : 0)
      }
    });
  });
});

// Sync status (superadmin)
app.get('/api/sync/status', require('./middleware/auth').protect, require('./middleware/auth').authorize('superadmin'), function(req, res) {
  var db = require('./config/db').db;
  db.get("SELECT COUNT(*) AS total, SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending, SUM(CASE WHEN status='synced' THEN 1 ELSE 0 END) AS synced, SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failed FROM outbox", function(err, row) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    db.all("SELECT entityType, operation, status, COUNT(*) AS count FROM outbox GROUP BY entityType, operation, status ORDER BY entityType, operation", function(err2, breakdown) {
      if (err2) return res.status(500).json({ success: false, error: err2.message });
      res.json({
        success: true,
        data: {
          enabled: supabase.isEnabled(),
          totals: row,
          breakdown: breakdown || []
        }
      });
    });
  });
});

// Manual sync trigger (superadmin)
app.post('/api/sync/run', require('./middleware/auth').protect, require('./middleware/auth').authorize('superadmin'), async function(req, res) {
  try {
    await syncWorker.runSyncBatch();
    res.json({ success: true, data: { message: 'Sync batch completed' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Audit trail (superadmin)
app.get('/api/audit', require('./middleware/auth').protect, require('./middleware/auth').authorize('superadmin'), async function(req, res) {
  try {
    var limit = parseInt(req.query.limit || '200', 10);
    if (limit > 1000) limit = 1000;
    var { db } = require('./config/db');
    db.all('SELECT * FROM audit_logs ORDER BY rowid DESC LIMIT ' + limit, function(err, rows) {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows || [] });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Manual backup endpoint (superadmin calls this)
app.post('/api/backup', async function(req, res) {
  var result = await backup.runBackup();
  if (result.success) {
    res.json({ success: true, data: { message: 'Backup created', filename: result.filename } });
  } else {
    res.status(500).json({ success: false, error: result.error });
  }
});

// Seed endpoint (for development only)
if (process.env.NODE_ENV !== 'production') {
  var seedData = require('./utils/seed');
  app.get('/api/seed', async function(req, res) {
    try {
      await seedData();
      res.json({ success: true, data: { message: 'Sample data seeded' } });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}

// Catch-all: serve index.html for SPA routing
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Connect DB, seed (dev only), then start
var start = async function() {
  try {
    await connectDB();
    if (process.env.NODE_ENV !== 'production') {
      var seedData = require('./utils/seed');
      await seedData();
    } else {
      console.log('Production mode — skipping seed');
    }
    await supabase.testConnection();
    backup.scheduleBackups();
    syncWorker.startWorker(30000);
    console.log('Backend fully operational.');
  } catch (err) {
    console.error('Database initialization failed:', err.message);
  }

  var server = app.listen(PORT, function() {
    console.log('FST Sisters server running at http://localhost:' + PORT);
  });

  server.on('error', function(err) {
    if (err.code === 'EADDRINUSE') {
      console.error('Port ' + PORT + ' is already in use. Please stop the other process or change PORT.');
    } else {
      console.error(err);
    }
    process.exit(1);
  });
};

start();