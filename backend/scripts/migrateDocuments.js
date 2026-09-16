require('dotenv').config();
var Sister = require('../models/Sister');
var Document = require('../models/Document');
var drive = require('../utils/drive');
var { migrateFileDataToDrive } = require('../utils/documents');

var main = async function() {
  await Sister.ensureSchema();
  await Document.ensureSchema();
  if (!drive.isConfigured()) {
    console.error('Google Drive credentials not configured. Set GOOGLE_SERVICE_ACCOUNT* or GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN.');
    process.exit(1);
  }
  var limit = parseInt(process.argv[2] || '50', 10);
  console.log('Migrating up to ' + limit + ' document blobs to Google Drive...');
  var result = await migrateFileDataToDrive({ limit: limit });
  console.log('Done. Uploaded=' + result.uploaded + ' skipped=' + result.skipped + ' failed=' + result.failed);
  if (result.errors && result.errors.length) {
    console.log('Errors:');
    result.errors.forEach(function(e) { console.log('  ' + e.id + ': ' + e.error); });
  }
  process.exit(0);
};

main().catch(function(err) {
  console.error(err.message);
  process.exit(1);
});