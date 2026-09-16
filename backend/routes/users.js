var express = require('express');
var User = require('../models/User');
var { protect, authorize } = require('../middleware/auth');
var { encrypt, decrypt } = require('../utils/crypto');
var { validatePassword } = require('../utils/password');
var { logActivity } = require('../utils/audit');

var router = express.Router();

router.get('/', protect, authorize('superadmin'), async function(req, res) {
  try {
    var users = await User.find().sort({ createdAt: -1 });
    users = users.map(function(u) { return User.toJSON(u); });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', protect, authorize('superadmin'), async function(req, res) {
  try {
    var user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: User.toJSON(user) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', protect, authorize('superadmin'), async function(req, res) {
  try {
    var email = String(req.body.email || '').toLowerCase().trim();
    var username = String(req.body.username || '').trim() || email;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }
    if (!req.body.password) {
      return res.status(400).json({ success: false, error: 'Password is required' });
    }
    var pwCheck = validatePassword(req.body.password);
    if (!pwCheck.ok) {
      return res.status(400).json({ success: false, error: pwCheck.error });
    }
    var existing = await User.findOne({ email: email });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }
    var user = await User.create({
      id: 'user_' + Date.now(),
      username: username,
      email: email,
      password: encrypt(String(req.body.password)),
      role: req.body.role || 'moderator',
      sisterId: req.body.sisterId || null,
      displayName: req.body.displayName || null,
      phone: req.body.phone || null
    });
    await logActivity('user.create', 'user', user.id, user.username, 'Created user account', req.user);
    res.status(201).json({ success: true, data: User.toJSON(user) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', protect, authorize('superadmin'), async function(req, res) {
  try {
    var user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (req.body.version !== undefined && req.body.version !== null) {
      if (Number(req.body.version) !== Number(user.version)) {
        return res.status(409).json({
          success: false,
          error: 'This record was updated elsewhere. Reload and re-apply your changes.',
          data: { current: User.toJSON(user) }
        });
      }
    }

    var set = {};
    if (req.body.email) {
      var email = String(req.body.email).toLowerCase().trim();
      var existing = await User.findOne({ email: email });
      if (existing && existing.id !== req.params.id) {
        return res.status(400).json({ success: false, error: 'Email already exists' });
      }
      set.email = email;
    }
    if (req.body.username) set.username = String(req.body.username).trim();
    if (req.body.role) set.role = req.body.role;
    if (req.body.password) {
      var pwCheck = validatePassword(req.body.password);
      if (!pwCheck.ok) {
        return res.status(400).json({ success: false, error: pwCheck.error });
      }
      set.password = encrypt(String(req.body.password));
    }
    if (req.body.sisterId !== undefined) set.sisterId = req.body.sisterId || null;
    if (req.body.displayName !== undefined) set.displayName = req.body.displayName || null;
    if (req.body.phone !== undefined) set.phone = req.body.phone || null;
    if (req.body.avatar !== undefined) set.avatar = req.body.avatar || null;

    var updated = await User.findOneAndUpdate({ id: req.params.id }, { $set: Object.assign({}, set, { updatedAt: new Date().toISOString() }) });
    await logActivity('user.update', 'user', req.params.id, user.username, 'Updated user account', req.user);
    res.json({ success: true, data: User.toJSON(updated || user) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id/profile', protect, async function(req, res) {
  try {
    var isSelf = req.user && String(req.user.id) === String(req.params.id);
    var isSuper = req.user && req.user.role === 'superadmin';
    if (!isSelf && !isSuper) {
      return res.status(403).json({ success: false, error: 'You can only update your own profile' });
    }
    var user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    var set = {};
    if (req.body.displayName !== undefined) set.displayName = req.body.displayName || null;
    if (req.body.phone !== undefined) set.phone = req.body.phone || null;
    if (req.body.sisterId !== undefined) set.sisterId = req.body.sisterId || null;
    if (req.body.avatar !== undefined) set.avatar = req.body.avatar || null;
    if (Object.keys(set).length === 0) {
      return res.status(400).json({ success: false, error: 'Nothing to update' });
    }
    set.updatedAt = new Date().toISOString();
    var updated = await User.findOneAndUpdate({ id: req.params.id }, { $set: set });
    await logActivity('user.profile', 'user', req.params.id, user.username, 'Updated own profile', req.user);
    res.json({ success: true, data: User.toJSON(updated || user) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', protect, authorize('superadmin'), async function(req, res) {
  try {
    var user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    if (user.id === 'user_001') {
      return res.status(400).json({ success: false, error: 'The default superadmin account cannot be deleted' });
    }
    await User.softDelete({ id: req.params.id }, { userId: req.user ? req.user.id : null });
    await logActivity('user.delete', 'user', req.params.id, user.username, 'Soft-deleted user account', req.user);
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;