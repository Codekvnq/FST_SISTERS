var db = require('../config/db').db;
var supabase = require('./supabase');

var MAX_ATTEMPTS = 10;
var BATCH_SIZE = 20;

var runSyncBatch = async function() {
  if (!supabase.isEnabled()) return;
  var cutoff = new Date().toISOString();
  return new Promise(function(resolve, reject) {
    db.all(
      "SELECT * FROM outbox WHERE status = 'pending' AND (nextRetryAt IS NULL OR nextRetryAt <= ?) ORDER BY seq ASC LIMIT ?",
      [cutoff, BATCH_SIZE],
      async function(err, rows) {
        if (err) {
          console.error('Sync query failed:', err.message);
          return resolve();
        }
        if (!rows || rows.length === 0) return resolve();
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          try {
            var payload = row.payload ? JSON.parse(row.payload) : {};
            if (row.entityType === 'users') delete payload.password;
            if (row.entityType === 'documents') delete payload.fileData;
            var ok = false;
            if (row.operation === 'delete') {
              var res = await supabase.deleteRecord(row.entityType, row.entityId);
              ok = res.success;
            } else {
              var res = await supabase.upsertRecord(row.entityType, payload);
              ok = res.success;
            }
            if (ok) {
              db.run("UPDATE outbox SET status = 'synced', updatedAt = ? WHERE seq = ?", [new Date().toISOString(), row.seq]);
            } else {
              var attempts = (row.attempts || 0) + 1;
              var backoffMs = Math.min(Math.pow(2, attempts) * 1000, 86400000);
              var nextRetry = attempts >= MAX_ATTEMPTS ? null : new Date(Date.now() + backoffMs).toISOString();
              if (attempts >= MAX_ATTEMPTS) {
                db.run("UPDATE outbox SET status = 'failed', attempts = ?, nextRetryAt = NULL, updatedAt = ? WHERE seq = ?", [attempts, new Date().toISOString(), row.seq]);
              } else {
                db.run("UPDATE outbox SET attempts = ?, nextRetryAt = ?, updatedAt = ? WHERE seq = ?", [attempts, nextRetry, new Date().toISOString(), row.seq]);
              }
            }
          } catch (e) {
            console.error('Sync row error:', e.message);
            var attempts = (row.attempts || 0) + 1;
            var backoffMs = Math.min(Math.pow(2, attempts) * 1000, 86400000);
            db.run("UPDATE outbox SET attempts = ?, nextRetryAt = ?, updatedAt = ? WHERE seq = ?", [attempts, new Date(Date.now() + backoffMs).toISOString(), new Date().toISOString(), row.seq]);
          }
        }
        resolve();
      }
    );
  });
};

var startWorker = function(intervalMs) {
  if (!supabase.isEnabled()) {
    console.log('Sync worker not started (Supabase not configured)');
    return;
  }
  var interval = intervalMs || 30000;
  console.log('Sync worker started (interval ' + interval + 'ms)');
  setInterval(function() {
    runSyncBatch().catch(function(err) {
      console.error('Sync batch error:', err.message);
    });
  }, interval);
  setInterval(function() {
    pruneSynced();
  }, 86400000);
};

var pruneSynced = function(olderThanMs) {
  var cutoff = new Date(Date.now() - (olderThanMs || 604800000)).toISOString();
  db.run("DELETE FROM outbox WHERE status = 'synced' AND updatedAt < ?", [cutoff]);
};

module.exports = {
  runSyncBatch: runSyncBatch,
  startWorker: startWorker,
  pruneSynced: pruneSynced
};