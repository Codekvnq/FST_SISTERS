var fs = require('fs');
var path = require('path');
var cron = require('node-cron');
var User = require('../models/User');
var Sister = require('../models/Sister');
var Document = require('../models/Document');

var BACKUP_DIR = path.join(__dirname, '..', '..', 'backups');

var ensureBackupDir = function() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
};

var runBackup = async function() {
  try {
    ensureBackupDir();
    var date = new Date().toISOString().split('T')[0];
    var timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    var data = {
      backupDate: new Date().toISOString(),
      sisters: await Sister.find().lean(),
      users: await User.find().lean(),
      documents: await Document.find().lean()
    };

    var filename = 'fst-backup-' + timestamp + '.json';
    var filepath = path.join(BACKUP_DIR, filename);

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log('Backup created: ' + filename + ' (' + data.sisters.length + ' sisters, ' + data.users.length + ' users, ' + data.documents.length + ' documents)');

    var backupFiles = fs.readdirSync(BACKUP_DIR)
      .filter(function(f) { return f.startsWith('fst-backup-'); })
      .map(function(f) { return { name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }; })
      .sort(function(a, b) { return b.time - a.time; });

    while (backupFiles.length > 12) {
      var oldest = backupFiles.pop();
      fs.unlinkSync(path.join(BACKUP_DIR, oldest.name));
      console.log('Removed old backup: ' + oldest.name);
    }

    return { success: true, filename: filename };
  } catch (err) {
    console.error('Backup failed: ' + err.message);
    return { success: false, error: err.message };
  }
};

var scheduleBackups = function() {
  cron.schedule('0 0 1 * *', function() {
    console.log('Running scheduled monthly backup...');
    runBackup();
  });
  console.log('Monthly backup scheduled (runs on 1st of each month)');
};

module.exports = { runBackup, scheduleBackups };
