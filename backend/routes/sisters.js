var express = require('express');
var Sister = require('../models/Sister');
var { protect, authorize } = require('../middleware/auth');
var { parseSisterImportContent } = require('../utils/sisterImport');
var { logActivity } = require('../utils/audit');
var { processAvatar } = require('../utils/avatar');

var router = express.Router();

function getAllSisterIds() {
  var db = require('../config/db').db;
  return new Promise(function(resolve, reject) {
    db.all('SELECT id FROM sisters', function(err, rows) {
      if (err) return reject(err);
      resolve((rows || []).map(function(r) { return r.id; }));
    });
  });
}

function generateSisterId(existingIds) {
  var year = new Date().getFullYear();
  var maxNum = 0;
  for (var i = 0; i < existingIds.length; i++) {
    var match = existingIds[i] && String(existingIds[i]).match(/^FST-\d{4}-(\d+)$/);
    if (match) {
      var num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return 'FST-' + year + '-' + String(maxNum + 1).padStart(3, '0');
}

function buildFilter(query) {
  var filter = {};
  if (query.search) {
    var search = query.search.toLowerCase();
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { id: { $regex: search, $options: 'i' } }
    ];
  }
  if (query.status) {
    filter.status = query.status;
  }
  return filter;
}

function decodeDataUrl(s) {
  if (typeof s !== 'string' || s.indexOf('data:') !== 0) return null;
  var comma = s.indexOf(',');
  if (comma === -1) return null;
  var meta = s.slice(0, comma);
  var mime = (meta.match(/data:([^;]+)/) || [])[1] || 'image/jpeg';
  return { mimeType: mime, buffer: Buffer.from(s.slice(comma + 1), 'base64') };
}

router.get('/', protect, authorize('admin', 'superadmin', 'moderator'), async function(req, res) {
  try {
    var filter = buildFilter(req.query);
    var sort = { createdAt: -1 };
    var sisters = await Sister.find(filter).sort(sort);
    res.json({ success: true, data: sisters });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/search', protect, authorize('admin', 'superadmin', 'moderator'), async function(req, res) {
  try {
    var query = req.query.q;
    if (!query || query.length < 2) {
      return res.json({ success: true, data: [] });
    }
    var sisters = await Sister.find({
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { id: { $regex: query, $options: 'i' } }
      ]
    }).limit(10).sort({ createdAt: -1 });
    res.json({ success: true, data: sisters });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/stats', protect, authorize('admin', 'superadmin', 'moderator'), async function(req, res) {
  try {
    var totalSisters = await Sister.countDocuments();
    var activeSisters = await Sister.countDocuments({ status: 'active' });
    var retiredSisters = await Sister.countDocuments({ status: 'retired' });
    var Document = require('../models/Document');
    var totalDocuments = await Document.countDocuments();
    var recentSisters = await Sister.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      data: { totalSisters, activeSisters, retiredSisters, totalDocuments, recentSisters }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', protect, authorize('admin', 'superadmin', 'moderator'), async function(req, res) {
  try {
    var sister = await Sister.findOne({ id: req.params.id });
    if (!sister) {
      return res.status(404).json({ success: false, error: 'Sister not found' });
    }
    res.json({ success: true, data: sister });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id/avatar', protect, authorize('admin', 'superadmin', 'moderator'), async function(req, res) {
  try {
    var sister = await Sister.findOne({ id: req.params.id });
    if (!sister || !sister.avatarBlob) {
      return res.status(404).json({ success: false, error: 'No avatar' });
    }
    res.setHeader('Content-Type', sister.avatarMime || 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=86400');
    res.send(sister.avatarBlob);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', protect, authorize('admin', 'superadmin'), async function(req, res) {
  try {
    var payload = req.body || {};
    var record = payload.record || payload;

    if (!record.id) {
      var ids = await getAllSisterIds();
      record.id = generateSisterId(ids);
    } else {
      var existing = await Sister.findOne({ id: record.id });
      if (existing) {
        return res.status(400).json({ success: false, error: 'Sister ID already exists' });
      }
    }

    var dupError = await findDuplicateSister(record);
    if (dupError) {
      return res.status(400).json({ success: false, error: dupError });
    }

    var sister = await Sister.create(record);
    await logActivity('sister.create', 'sister', sister.id, UtilsName(sister), 'Added new sister', req.user);
    res.status(201).json({ success: true, data: sister });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/import', protect, authorize('admin', 'superadmin'), async function(req, res) {
  try {
    var format = req.body && req.body.format ? req.body.format : 'json';
    var content = req.body && req.body.content ? req.body.content : '';
    var parsed = parseSisterImportContent(format, content);

    if (parsed.errors && parsed.errors.length) {
      return res.status(400).json({ success: false, error: parsed.errors[0] });
    }

    var created = [];
    for (var i = 0; i < parsed.records.length; i++) {
      var record = parsed.records[i];
      if (!record.id) {
        continue;
      }
      var existing = await Sister.findOne({ id: record.id });
      if (!existing) {
        var dupError = await findDuplicateSister(record);
        if (!dupError) {
          created.push(await Sister.create(record));
        }
      }
    }

    await logActivity('sister.import', 'sister', '', created.length + ' imported', 'Imported sisters from file', req.user);
    res.status(201).json({ success: true, data: { imported: created.length, records: created } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', protect, authorize('admin', 'superadmin'), async function(req, res) {
  try {
    var existing = await Sister.findOne({ id: req.params.id });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Sister not found' });
    }

    if (req.body.version !== undefined && req.body.version !== null) {
      if (Number(req.body.version) !== Number(existing.version)) {
        return res.status(409).json({
          success: false,
          error: 'This record was updated elsewhere. Reload and re-apply your changes.',
          data: { current: existing }
        });
      }
    }

    var update = Object.assign({}, req.body);
    delete update.id;
    delete update.version;

    var dupError = await findDuplicateSister(req.body, req.params.id);
    if (dupError) {
      return res.status(400).json({ success: false, error: dupError });
    }

    var sister = await Sister.findOneAndUpdate(
      { id: req.params.id },
      { $set: Object.assign({}, update, { updatedAt: new Date().toISOString() }) }
    );
    await logActivity('sister.update', 'sister', req.params.id, UtilsName(sister), 'Updated sister record', req.user);
    res.json({ success: true, data: sister });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:id/avatar', protect, authorize('admin', 'superadmin'), async function(req, res) {
  try {
    var sister = await Sister.findOne({ id: req.params.id });
    if (!sister) {
      return res.status(404).json({ success: false, error: 'Sister not found' });
    }
    var fileData = req.body && (req.body.fileData || req.body.avatarBlob);
    if (!fileData) {
      return res.status(400).json({ success: false, error: 'Image data required' });
    }
    var decoded = decodeDataUrl(fileData) || { mimeType: 'image/jpeg', buffer: Buffer.from(String(fileData), 'base64') };
    var processed = await processAvatar(decoded.buffer, decoded.mimeType);
    var updated = await Sister.findOneAndUpdate(
      { id: req.params.id },
      { $set: {
          avatarBlob: processed.buffer,
          avatarMime: processed.mimeType,
          avatarUpdatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    );
    await logActivity('sister.avatar', 'sister', req.params.id, UtilsName(sister), 'Updated profile photo', req.user);
    res.json({ success: true, data: { avatarMime: processed.mimeType, size: processed.size, updated: !!updated } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', protect, authorize('admin', 'superadmin'), async function(req, res) {
  try {
    var sister = await Sister.findOne({ id: req.params.id });
    if (!sister) {
      return res.status(404).json({ success: false, error: 'Sister not found' });
    }
    await Sister.softDelete({ id: req.params.id }, { userId: req.user ? req.user.id : null });
    var Document = require('../models/Document');
    await Document.softDelete({ sisterId: req.params.id }, { userId: req.user ? req.user.id : null });
    var User = require('../models/User');
    await User.softDelete({ sisterId: req.params.id }, { userId: req.user ? req.user.id : null });
    await logActivity('sister.delete', 'sister', req.params.id, UtilsName(sister), 'Soft-deleted sister and related records', req.user);
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function UtilsName(sister) {
  if (!sister) return '';
  return ((sister.firstName || '') + ' ' + (sister.middleName || '') + ' ' + (sister.lastName || '')).trim().replace(/\s+/g, ' ');
}

function normEmail(v) {
  return String(v || '').trim().toLowerCase();
}

async function findDuplicateSister(record, excludeId) {
  var all = await Sister.find({}).exec();
  var email = normEmail(record.contact && record.contact.email);
  var firstName = String(record.firstName || '').trim().toLowerCase();
  var lastName = String(record.lastName || '').trim().toLowerCase();
  var dob = String(record.dateOfBirth || '').trim();

  for (var i = 0; i < all.length; i++) {
    var s = all[i];
    if (excludeId && s.id === excludeId) continue;
    if (email && normEmail(s.contact && s.contact.email) === email) {
      return 'A sister with this email already exists (' + UtilsName(s) + ', ' + s.id + ').';
    }
    if (firstName && lastName && dob &&
        String(s.firstName || '').trim().toLowerCase() === firstName &&
        String(s.lastName || '').trim().toLowerCase() === lastName &&
        String(s.dateOfBirth || '').trim() === dob) {
      return 'A sister with this full name and birth date already exists (' + UtilsName(s) + ', ' + s.id + ').';
    }
  }
  return null;
}

module.exports = router;