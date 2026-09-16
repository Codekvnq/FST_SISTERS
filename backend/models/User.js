var db = require('../config/db').db;
var createModel = require('./sqliteModel');
var ensureColumn = createModel.ensureColumn;

var schemaReady = new Promise(function(resolve, reject) {
  db.serialize(function() {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT,
        sisterId TEXT,
        version INTEGER DEFAULT 1,
        deletedAt TEXT,
        deletedBy TEXT,
        createdAt TEXT,
        updatedAt TEXT
      )
    `, function(err) {
      if (err) return reject(err);
      db.all("PRAGMA table_info(users)", function(err2, rows) {
        if (err2) return reject(err2);
        var hasUsername = (rows || []).some(function(r) { return r.name === 'username'; });
        var ops = [];
        if (!hasUsername) {
          ops.push(new Promise(function(res, rej) {
            db.run("ALTER TABLE users ADD COLUMN username TEXT", function(e) {
              if (e) return rej(e); res(true);
            });
          }));
        }
        ops.push(ensureColumn('users', 'version', 'INTEGER DEFAULT 1'));
        ops.push(ensureColumn('users', 'deletedAt', 'TEXT'));
        ops.push(ensureColumn('users', 'deletedBy', 'TEXT'));
        ops.push(ensureColumn('users', 'displayName', 'TEXT'));
        ops.push(ensureColumn('users', 'phone', 'TEXT'));
        ops.push(ensureColumn('users', 'avatar', 'TEXT'));
        Promise.all(ops).then(function() {
          resolve(true);
        }).catch(function(alterErr) {
          reject(alterErr);
        });
      });
    });
  });
});

schemaReady.catch(function(err) {
  console.error('User schema init failed:', err.message);
});

var UserModel = createModel('users', {
  username: '',
  email: '',
  password: '',
  role: 'sister',
  sisterId: null,
  displayName: null,
  phone: null,
  avatar: null,
  version: 1,
  deletedAt: null,
  deletedBy: null,
  createdAt: null,
  updatedAt: null
}, schemaReady);

UserModel.ensureSchema = function() { return schemaReady; };

UserModel.toJSON = function(user) {
  if (!user) return user;
  var copy = Object.assign({}, user);
  delete copy.password;
  return copy;
};

module.exports = UserModel;