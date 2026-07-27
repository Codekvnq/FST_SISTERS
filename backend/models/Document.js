var db = require('../config/db').db;
var createModel = require('./sqliteModel');

var DocumentModel = createModel('documents', {
  sisterId: '',
  category: 'other',
  subcategory: 'other',
  fileName: '',
  originalName: '',
  fileSize: 0,
  fileData: null,
  mimeType: 'application/octet-stream',
  createdAt: null,
  updatedAt: null
});

var ensureTable = function() {
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
        createdAt TEXT,
        updatedAt TEXT
      )
    `);
  });
};

ensureTable();

module.exports = DocumentModel;
