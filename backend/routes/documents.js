var express = require('express');
var Document = require('../models/Document');
var Sister = require('../models/Sister');
var { protect, authorize } = require('../middleware/auth');
var { logActivity } = require('../utils/audit');
var drive = require('../utils/drive');
var { computeChecksum, decodeDataUrl, uploadDocumentBuffer } = require('../utils/documents');

var router = express.Router();

router.get('/', protect, authorize('admin', 'superadmin', 'moderator'), async function(req, res) {
  try {
    var filter = {};
    if (req.query.sisterId) filter.sisterId = req.query.sisterId;
    if (req.query.category) filter.category = req.query.category;
    var docs = await Document.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/storage-status', protect, authorize('admin', 'superadmin'), async function(req, res) {
  try {
    res.json({
      success: true,
      data: {
        configured: drive.isConfigured(),
        mode: drive.isConfigured() ? 'google-drive' : 'local-metadata-only'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', protect, authorize('admin', 'superadmin'), async function(req, res) {
  try {
    var payload = req.body || {};
    var fileData = payload.fileData || null;
    var docFields = Object.assign({}, payload);
    delete docFields.fileData;

    var checksum = null;
    if (fileData) {
      var decoded = decodeDataUrl(fileData);
      var buffer = decoded ? decoded.buffer : Buffer.from(String(fileData), 'base64');
      var mimeType = decoded ? decoded.mimeType : (docFields.mimeType || 'application/octet-stream');
      checksum = computeChecksum(buffer);

      if (drive.isConfigured() && docFields.sisterId) {
        var sister = await Sister.findById(docFields.sisterId);
        var sisterName = sister ? ((sister.firstName || '') + ' ' + (sister.lastName || '')).trim() : '';
        var uploaded = await uploadDocumentBuffer(docFields.sisterId, sisterName, buffer, mimeType,
          docFields.originalName || docFields.fileName || 'document');
        docFields.driveFileId = uploaded.driveFileId;
        docFields.webViewLink = uploaded.webViewLink;
        docFields.uploadStatus = 'synced';
      } else {
        docFields.uploadStatus = drive.isConfigured() ? 'pending' : 'metadata-only';
      }
      docFields.checksumSha256 = checksum;
      docFields.mimeType = mimeType || docFields.mimeType;
      docFields.fileSize = buffer.length || docFields.fileSize;
    }

    var doc = await Document.create(docFields);
    await logActivity('doc.create', 'document', doc.id, doc.originalName || doc.fileName, 'Added document' + (doc.driveFileId ? ' (stored in Google Drive)' : ''), req.user);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    if (/UNIQUE|unique|duplicate/i.test(err.message)) {
      return res.status(409).json({ success: false, error: 'This document already exists for the selected sister.' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id/open', protect, authorize('admin', 'superadmin', 'moderator'), async function(req, res) {
  try {
    var doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    if (doc.webViewLink) {
      return res.redirect(doc.webViewLink);
    }
    res.status(400).json({ success: false, error: 'No file link available for this document' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id/download', protect, authorize('admin', 'superadmin', 'moderator'), async function(req, res) {
  try {
    var doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    if (!drive.isConfigured() || !doc.driveFileId) {
      return res.status(400).json({ success: false, error: 'No remote file available for this document' });
    }
    var buffer = await drive.downloadFileBuffer(doc.driveFileId);
    if (!buffer) {
      return res.status(404).json({ success: false, error: 'File not found in Google Drive' });
    }
    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="' + encodeURIComponent(doc.originalName || doc.fileName || 'document') + '"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', protect, authorize('admin', 'superadmin'), async function(req, res) {
  try {
    var existing = await Document.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    var update = Object.assign({}, req.body);
    delete update.fileData;
    delete update.id;

    var doc = await Document.findOneAndUpdate(
      { id: req.params.id },
      { $set: Object.assign({}, update, { updatedAt: new Date().toISOString() }) }
    );
    await logActivity('doc.update', 'document', req.params.id, doc.originalName || doc.fileName, 'Updated document metadata', req.user);
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', protect, authorize('admin', 'superadmin'), async function(req, res) {
  try {
    var doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    if (doc.driveFileId && drive.isConfigured()) {
      try {
        await drive.trashFile(doc.driveFileId);
      } catch (err) {
        console.error('Drive trash failed for ' + doc.driveFileId + ': ' + err.message);
      }
    }
    await Document.softDelete({ id: req.params.id }, { userId: req.user ? req.user.id : null });
    await logActivity('doc.delete', 'document', req.params.id, doc.originalName || doc.fileName, 'Soft-deleted document', req.user);
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;