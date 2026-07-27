var db = require('../config/db').db;
var createModel = require('./sqliteModel');

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
  createdAt: null,
  updatedAt: null
});

var ensureTable = function() {
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
        createdAt TEXT,
        updatedAt TEXT
      )
    `);
  });
};

ensureTable();

module.exports = SisterModel;
