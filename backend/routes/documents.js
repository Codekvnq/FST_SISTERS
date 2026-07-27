var express = require('express');
var Document = require('../models/Document');
var { protect, authorize } = require('../middleware/auth');

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

router.post('/', protect, authorize('admin', 'superadmin'), async function(req, res) {
  try {
    var doc = await Document.create(req.body);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', protect, authorize('admin', 'superadmin'), async function(req, res) {
  try {
    var doc = await Document.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
