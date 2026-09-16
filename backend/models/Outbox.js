var db = require('../config/db').db;
var createModel = require('./sqliteModel');

var schemaReady = false;
var ensureTable = function() {
  if (schemaReady) return Promise.resolve(true);
  return new Promise(function(resolve, reject) {
    db.serialize(function() {
      db.run(`
        CREATE TABLE IF NOT EXISTS outbox (
          id TEXT PRIMARY KEY,
          seq INTEGER,
          entityType TEXT,
          entityId TEXT,
          operation TEXT,
          payload TEXT,
          status TEXT DEFAULT 'pending',
          attempts INTEGER DEFAULT 0,
          nextRetryAt TEXT,
          createdAt TEXT,
          updatedAt TEXT
        )
      `, function(err) {
        if (err) return reject(err);
        db.run('CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox(status, nextRetryAt)', function(err2) {
          if (err2) return reject(err2);
          schemaReady = true;
          resolve(true);
        });
      });
    });
  });
};

ensureTable().catch(function(err) {
  console.error('Outbox schema init failed:', err.message);
});

var OutboxModel = createModel('outbox', {}, null, { softDelete: false });

OutboxModel.ensureSchema = ensureTable;

module.exports = OutboxModel;