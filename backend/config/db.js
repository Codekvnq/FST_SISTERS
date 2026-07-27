var fs = require('fs');
var path = require('path');
var sqlite3 = require('sqlite3').verbose();

var dbPath = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'fst-sisters.db');
var dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

var db = new sqlite3.Database(dbPath, function(err) {
  if (err) {
    console.error('SQLite connection error:', err.message);
    return;
  }
  console.log('SQLite connected at ' + dbPath);
});

var connectDB = async function() {
  return new Promise(function(resolve, reject) {
    db.get('SELECT 1', function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
};

module.exports = { connectDB, db };
