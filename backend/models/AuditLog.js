var db = require('../config/db').db;
var createModel = require('./sqliteModel');
var ensureColumn = createModel.ensureColumn;

var schemaReady = new Promise(function(resolve, reject) {
  db.serialize(function() {
    db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        action TEXT,
        entityType TEXT,
        entityId TEXT,
        entityName TEXT,
        detail TEXT,
        userId TEXT,
        userName TEXT,
        userRole TEXT,
        timestamp TEXT,
        createdAt TEXT,
        updatedAt TEXT
      )
    `, function(err) {
      if (err) return reject(err);
      Promise.all([
        ensureColumn('audit_logs', 'createdAt', 'TEXT'),
        ensureColumn('audit_logs', 'updatedAt', 'TEXT')
      ]).then(function() {
        db.run('CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entityType, entityId)', function(err2) {
          if (err2) return reject(err2);
          resolve(true);
        });
      }).catch(reject);
    });
  });
});

schemaReady.catch(function(err) {
  console.error('AuditLogs schema init failed:', err.message);
});

var AuditLogModel = createModel('audit_logs', {
  action: '',
  entityType: '',
  entityId: '',
  entityName: '',
  detail: '',
  userId: '',
  userName: '',
  userRole: '',
  timestamp: null
}, null, { softDelete: false });

AuditLogModel.ensureSchema = function() { return schemaReady; };

module.exports = AuditLogModel;