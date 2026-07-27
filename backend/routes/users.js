var express = require('express');
var User = require('../models/User');
var { protect, authorize } = require('../middleware/auth');

var router = express.Router();

router.get('/', protect, authorize('superadmin'), async function(req, res) {
  try {
    var users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', protect, authorize('superadmin'), async function(req, res) {
  try {
    var existing = await User.findOne({ email: req.body.email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }
    var user = await User.create(req.body);
    res.status(201).json({ success: true, data: user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', protect, authorize('superadmin'), async function(req, res) {
  try {
    if (req.body.email) {
      var existing = await User.findOne({ email: req.body.email.toLowerCase().trim(), _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ success: false, error: 'Email already exists' });
      }
    }

    var user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (req.body.email) user.email = req.body.email;
    if (req.body.role) user.role = req.body.role;
    if (req.body.password) user.password = req.body.password;
    if (req.body.sisterId !== undefined) user.sisterId = req.body.sisterId;

    await user.save();
    res.json({ success: true, data: user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', protect, authorize('superadmin'), async function(req, res) {
  try {
    var user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
