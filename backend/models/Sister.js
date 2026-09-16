var db = require('../config/db').db;
var createModel = require('./sqliteModel');
var ensureColumn = createModel.ensureColumn;

var schemaReady = new Promise(function(resolve, reject) {
  db.serialize(function() {
    db.run(`
      CREATE TABLE IF NOT EXISTS sisters (
        id TEXT PRIMARY KEY,
        firstName TEXT,
        lastName TEXT,
        middleName TEXT,
        dateOfBirth TEXT,
        placeOfBirth TEXT,
        dates TEXT,
        education TEXT,
        contact TEXT,
        status TEXT,
        avatarBlob BLOB,
        avatarMime TEXT,
        avatarUpdatedAt TEXT,
        version INTEGER DEFAULT 1,
        deletedAt TEXT,
        deletedBy TEXT,
        createdAt TEXT,
        updatedAt TEXT
      )
    `, function(err) {
      if (err) return reject(err);
      Promise.all([
        ensureColumn('sisters', 'version', 'INTEGER DEFAULT 1'),
        ensureColumn('sisters', 'deletedAt', 'TEXT'),
        ensureColumn('sisters', 'deletedBy', 'TEXT'),
        ensureColumn('sisters', 'avatarBlob', 'BLOB'),
        ensureColumn('sisters', 'avatarMime', 'TEXT'),
        ensureColumn('sisters', 'avatarUpdatedAt', 'TEXT')
      ]).then(function() {
        resolve(true);
      }).catch(function(alterErr) {
        console.error('Sister schema migration failed:', alterErr.message);
        reject(alterErr);
      });
    });
  });
});

schemaReady.catch(function(err) {
  console.error('Sister schema init failed:', err.message);
});

var SisterModel = createModel('sisters', {
  id: '',
  firstName: '',
  lastName: '',
  middleName: '',
  dateOfBirth: '',
  placeOfBirth: '',
  dates: {},
  education: [],
  contact: {},
  status: 'active',
  version: 1,
  avatarBlob: null,
  avatarMime: null,
  avatarUpdatedAt: null,
  deletedAt: null,
  deletedBy: null,
  createdAt: null,
  updatedAt: null
}, schemaReady);

SisterModel.ensureSchema = function() { return schemaReady; };

module.exports = SisterModel;