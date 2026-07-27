require('dotenv').config();
var express = require('express');
var cors = require('cors');
var path = require('path');
var dbConfig = require('./config/db');
var connectDB = dbConfig.connectDB;
var seedData = require('./utils/seed');
var backup = require('./utils/backup');

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
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
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

// Seed endpoint (for development)
app.get('/api/seed', async function(req, res) {
  try {
    await seedData();
    res.json({ success: true, data: { message: 'Sample data seeded' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Catch-all: serve index.html for SPA routing
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Connect DB, seed, then start
var start = async function() {
  try {
    await connectDB();
    await seedData();
    backup.scheduleBackups();
    console.log('SQLite database ready. Backend fully operational.');
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
