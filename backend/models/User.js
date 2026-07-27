var bcrypt = require('bcryptjs');
var db = require('../config/db').db;
var createModel = require('./sqliteModel');

var UserModel = createModel('users', {
  email: '',
  password: '',
  role: 'sister',
  sisterId: null,
  createdAt: null,
  updatedAt: null
});

var ensureTable = function() {
  db.serialize(function() {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT,
        sisterId TEXT,
        createdAt TEXT,
        updatedAt TEXT
      )
    `);
  });
};

ensureTable();

UserModel.matchPassword = async function(user, enteredPassword) {
  return await bcrypt.compare(enteredPassword, user.password);
};

UserModel.toJSON = function(user) {
  if (!user) return user;
  var copy = Object.assign({}, user);
  delete copy.password;
  return copy;
};

module.exports = UserModel;
