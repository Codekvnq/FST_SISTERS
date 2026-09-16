var fs = require('fs');
var path = require('path');
var cron = require('node-cron');
var User = require('../models/User');
var Sister = require('../models/Sister');
var Document = require('../models/Document');
var drive = require('./drive');

var BACKUP_DIR = path.join(__dirname, '..', '..', 'backups');
var DB_SOURCE = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'fst-sisters.db');

var ensureBackupDir = function() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
};

var uploadToDrive = async function(localPath, date) {
  if (!drive.isConfigured()) return { uploaded: false, reason: 'not-configured' };
  try {
    var root = await drive.getRootFolder();
    var backupFolder = await drive.ensureFolder('Backups', root.id);
    var data = fs.readFileSync(localPath);
    var base = path.basename(localPath);
    await drive.uploadFileBuffer(data, 'application/json', base, backupFolder.id);
    return { uploaded: true };
  } catch (err) {
    console.error('Drive backup upload failed:', err.message);
    return { uploaded: false, reason: err.message };
  }
};

var runBackup = async function() {
  try {
    ensureBackupDir();
    var date = new Date().toISOString().split('T')[0];
    var timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    var sisters = await Sister.find().exec();
    var users = await User.find().exec();
    var documents = await Document.find().exec();

    var data = {
      backupDate: new Date().toISOString(),
      backupType: 'full',
      sisters: sisters,
      users: users,
      documents: documents
    };

    var filename = 'fst-backup-' + timestamp + '.json';
    var filepath = path.join(BACKUP_DIR, filename);
    if (data.sisters) {
      for (var i = 0; i < data.sisters.length; i++) {
        if (data.sisters[i] && data.sisters[i].avatarBlob) {
          data.sisters[i].avatarBlob = String(data.sisters[i].avatarBlob);
        }
      }
    }
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log('Backup created: ' + filename + ' (' + data.sisters.length + ' sisters, ' + data.users.length + ' users, ' + data.documents.length + ' documents)');

    var dbCopy = null;
    if (fs.existsSync(DB_SOURCE)) {
      dbCopy = path.join(BACKUP_DIR, 'fst-db-' + timestamp + '.db');
      fs.copyFileSync(DB_SOURCE, dbCopy);
    }

    var driveResult = null;
    if (drive.isConfigured()) {
      driveResult = await uploadToDrive(filepath, date);
      if (dbCopy) {
        await uploadToDrive(dbCopy, date);
      }
    }

    var keepCount = parseInt(process.env.BACKUP_KEEP || '14', 10);
    var backupFiles = fs.readdirSync(BACKUP_DIR)
      .filter(function(f) { return f.startsWith('fst-backup-') || f.startsWith('fst-db-'); })
      .map(function(f) { return { name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }; })
      .sort(function(a, b) { return b.time - a.time; });

    while (backupFiles.length > keepCount) {
      var oldest = backupFiles.pop();
      fs.unlinkSync(path.join(BACKUP_DIR, oldest.name));
      console.log('Removed old backup: ' + oldest.name);
    }

    return { success: true, filename: filename, drive: driveResult };
  } catch (err) {
    console.error('Backup failed: ' + err.message);
    return { success: false, error: err.message };
  }
};

var scheduleBackups = function() {
  cron.schedule('0 2 * * *', function() {
    console.log('Running scheduled daily backup...');
    runBackup();
  });
  console.log('Daily backup scheduled (runs at 02:00)');
};

module.exports = { runBackup, scheduleBackups };