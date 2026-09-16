var db = require('../config/db').db;
var createModel = require('./sqliteModel');
var ensureColumn = createModel.ensureColumn;

var schemaReady = new Promise(function(resolve, reject) {
  db.serialize(function() {
    db.run(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        sisterId TEXT,
        category TEXT,
        subcategory TEXT,
        fileName TEXT,
        originalName TEXT,
        fileSize INTEGER,
        fileData TEXT,
        mimeType TEXT,
        driveFileId TEXT,
        webViewLink TEXT,
        checksumSha256 TEXT,
        uploadStatus TEXT,
        thumbnailPath TEXT,
        version INTEGER DEFAULT 1,
        deletedAt TEXT,
        deletedBy TEXT,
        createdAt TEXT,
        updatedAt TEXT
      )
    `, function(err) {
      if (err) return reject(err);
      Promise.all([
        ensureColumn('documents', 'uploadedAt', 'TEXT'),
        ensureColumn('documents', 'version', 'INTEGER DEFAULT 1'),
        ensureColumn('documents', 'deletedAt', 'TEXT'),
        ensureColumn('documents', 'deletedBy', 'TEXT'),
        ensureColumn('documents', 'driveFileId', 'TEXT'),
        ensureColumn('documents', 'webViewLink', 'TEXT'),
        ensureColumn('documents', 'checksumSha256', 'TEXT'),
        ensureColumn('documents', 'uploadStatus', 'TEXT'),
        ensureColumn('documents', 'thumbnailPath', 'TEXT')
]).then(function() {
        return new Promise(function(resolveBackfill, rejectBackfill) {
          db.run('UPDATE documents SET uploadedAt = createdAt WHERE uploadedAt IS NULL AND createdAt IS NOT NULL', function(bErr) {
            if (bErr) return rejectBackfill(bErr);
            db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_docs_sister_file ON documents(sisterId, originalName) WHERE deletedAt IS NULL', function(uErr) {
              if (uErr && !/already exists|already exists/i.test(String(uErr.message))) {
                console.warn('Could not create unique index on documents(sisterId, originalName): ' + uErr.message);
              }
              resolveBackfill(true);
            });
          });
        });
      }).then(function() {
        resolve(true);
      }).catch(function(alterErr) {
        console.error('Document schema migration failed:', alterErr.message);
        reject(alterErr);
      });
    });
  });
});

schemaReady.catch(function(err) {
  console.error('Document schema init failed:', err.message);
});

var DocumentModel = createModel('documents', {
  sisterId: '',
  category: 'other',
  subcategory: 'other',
  fileName: '',
  originalName: '',
  fileSize: 0,
  fileData: null,
  mimeType: 'application/octet-stream',
  driveFileId: null,
  webViewLink: null,
  checksumSha256: null,
  uploadStatus: 'pending',
  thumbnailPath: null,
  uploadedAt: null,
  version: 1,
  deletedAt: null,
  deletedBy: null,
  createdAt: null,
  updatedAt: null
}, schemaReady);

DocumentModel.ensureSchema = function() { return schemaReady; };

module.exports = DocumentModel;