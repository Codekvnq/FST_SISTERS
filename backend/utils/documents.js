var crypto = require('crypto');
var drive = require('./drive');
var Document = require('../models/Document');

var computeChecksum = function(buffer) {
  if (!buffer) return null;
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

var isBase64DataUrl = function(s) {
  return typeof s === 'string' && s.indexOf('data:') === 0;
};

var decodeDataUrl = function(s) {
  if (!isBase64DataUrl(s)) return null;
  var comma = s.indexOf(',');
  if (comma === -1) return null;
  var meta = s.slice(0, comma);
  var mime = (meta.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
  var b64 = s.slice(comma + 1);
  return { mimeType: mime, buffer: Buffer.from(b64, 'base64') };
};

var uploadDocumentBuffer = async function(sisterId, sisterName, fileBuffer, mimeType, name) {
  var folder = await drive.getSisterFolder(sisterId, sisterName);
  var file = await drive.uploadFileBuffer(fileBuffer, mimeType, name, folder.id);
  return {
    driveFileId: file.id,
    webViewLink: file.webViewLink || ('https://drive.google.com/file/d/' + file.id + '/view')
  };
};

var migrateFileDataToDrive = async function(opts) {
  opts = opts || {};
  var limit = opts.limit || 50;
  var docs = await Document.find().exec();
  var result = { uploaded: 0, skipped: 0, failed: 0, errors: [] };
  var count = 0;

  for (var i = 0; i < docs.length; i++) {
    if (count >= limit) break;
    var doc = docs[i];
    if (!doc.fileData) {
      result.skipped++;
      continue;
    }
    count++;
    try {
      var decoded = decodeDataUrl(doc.fileData);
      if (!decoded) {
        decoded = { mimeType: doc.mimeType || 'application/octet-stream', buffer: Buffer.from(doc.fileData, 'base64') };
      }
      var checksum = computeChecksum(decoded.buffer);
      if (opts.skipExisting && doc.driveFileId) {
        result.skipped++;
        continue;
      }
      var sister = null;
      if (doc.sisterId) {
        try { sister = await require('../models/Sister').findById(doc.sisterId); } catch (e) {}
      }
      var sisterName = sister ? ((sister.firstName || '') + ' ' + (sister.lastName || '')).trim() : '';
      var uploaded = await uploadDocumentBuffer(doc.sisterId || 'Unknown', sisterName, decoded.buffer, decoded.mimeType, doc.originalName || doc.fileName || 'document');
      var updateSet = {
        driveFileId: uploaded.driveFileId,
        webViewLink: uploaded.webViewLink,
        checksumSha256: checksum,
        mimeType: decoded.mimeType,
        uploadStatus: 'synced',
        fileSize: decoded.buffer.length,
        fileData: null
      };
      await Document.findOneAndUpdate({ id: doc.id }, { $set: updateSet });
      result.uploaded++;
    } catch (err) {
      result.failed++;
      result.errors.push({ id: doc.id, error: err.message });
    }
  }

  return result;
};

module.exports = {
  computeChecksum: computeChecksum,
  isBase64DataUrl: isBase64DataUrl,
  decodeDataUrl: decodeDataUrl,
  uploadDocumentBuffer: uploadDocumentBuffer,
  migrateFileDataToDrive: migrateFileDataToDrive
};