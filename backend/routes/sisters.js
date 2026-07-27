var express = require('express');
var Sister = require('../models/Sister');
var { protect, authorize } = require('../middleware/auth');
var { parseSisterImportContent } = require('../utils/sisterImport');

var router = express.Router();

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

router.post('/', protect, authorize('admin', 'superadmin'), async function(req, res) {
  try {
    var payload = req.body || {};
    var record = payload.record || payload;
    var existing = await Sister.findOne({ id: record.id });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Sister ID already exists' });
    }

    var sister = await Sister.create(record);
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
        created.push(await Sister.create(record));
      }
    }

    res.status(201).json({ success: true, data: { imported: created.length, records: created } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', protect, authorize('admin', 'superadmin'), async function(req, res) {
  try {
    var sister = await Sister.findOneAndUpdate(
      { id: req.params.id },
      { $set: Object.assign({}, req.body, { updatedAt: new Date().toISOString() }) },
      { new: true, runValidators: true }
    );
    if (!sister) {
      return res.status(404).json({ success: false, error: 'Sister not found' });
    }
    res.json({ success: true, data: sister });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', protect, authorize('admin', 'superadmin'), async function(req, res) {
  try {
    var sister = await Sister.findOneAndDelete({ id: req.params.id });
    if (!sister) {
      return res.status(404).json({ success: false, error: 'Sister not found' });
    }
    var Document = require('../models/Document');
    await Document.deleteMany({ sisterId: req.params.id });
    var User = require('../models/User');
    await User.deleteMany({ sisterId: req.params.id });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
