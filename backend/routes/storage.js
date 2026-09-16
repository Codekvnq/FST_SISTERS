var express = require('express');
var { db } = require('../config/db');
var { protect, authorize } = require('../middleware/auth');

var router = express.Router();

var tableReady = new Promise(function(resolve, reject) {
  db.run(
    'CREATE TABLE IF NOT EXISTS storage_config (key TEXT PRIMARY KEY, value TEXT, updatedAt TEXT)',
    function(err) {
      if (err) return reject(err);
      resolve(true);
    }
  );
});

var writeConfig = function(key, value) {
  return new Promise(function(resolve, reject) {
    tableReady.then(function() {
      db.run(
        'INSERT INTO storage_config (key, value, updatedAt) VALUES (?, ?, ?) ' +
        'ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt',
        [key, JSON.stringify(value), new Date().toISOString()],
        function(err) {
          if (err) return reject(err);
          resolve(true);
        }
      );
    }).catch(reject);
  });
};

var readConfig = function(key) {
  return new Promise(function(resolve, reject) {
    tableReady.then(function() {
      db.get('SELECT value FROM storage_config WHERE key = ?', [key], function(err, row) {
        if (err) return reject(err);
        if (!row || !row.value) return resolve(null);
        try {
          resolve(JSON.parse(row.value));
        } catch (e) {
          resolve(null);
        }
      });
    }).catch(reject);
  });
};

router.get('/gdrive', protect, authorize('superadmin', 'admin'), async function(req, res) {
  try {
    var cfg = await readConfig('gdrive');
    res.json({ success: true, data: cfg || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/gdrive', protect, authorize('superadmin', 'admin'), async function(req, res) {
  try {
    var body = req.body || {};
    var cfg = {
      link: String(body.link || '').trim(),
      on: body.on === true,
      lastSync: body.lastSync || null,
      lastError: body.lastError || null
    };
    await writeConfig('gdrive', cfg);
    res.json({ success: true, data: cfg });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/gdrive', protect, authorize('superadmin', 'admin'), async function(req, res) {
  try {
    await tableReady;
    await new Promise(function(resolve, reject) {
      db.run('DELETE FROM storage_config WHERE key = ?', ['gdrive'], function(err) {
        if (err) return reject(err);
        resolve(true);
      });
    });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;