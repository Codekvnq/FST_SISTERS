var express = require('express');
var jwt = require('jsonwebtoken');
var User = require('../models/User');
var { protect } = require('../middleware/auth');
var { encrypt, decrypt } = require('../utils/crypto');
var { validatePassword } = require('../utils/password');

var router = express.Router();
var jwtSecret = process.env.JWT_SECRET || 'fst-dev-secret-change-me';

var generateToken = function(userId) {
  return jwt.sign({ id: userId }, jwtSecret, { expiresIn: '30d' });
};

router.post('/login', async function(req, res) {
  try {
    var { email, username, password } = req.body;
    var identifier = String(username || email || '').trim().toLowerCase();
    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: 'Please provide username and password' });
    }

    var user = await User.findOne({ email: identifier });
    if (!user) {
      user = await User.findOne({ username: identifier });
    }
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    var isMatch = password === decrypt(user.password || '');
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    var allowedRoles = ['superadmin', 'admin', 'moderator'];
    if (allowedRoles.indexOf(user.role) === -1) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    var token = generateToken(user.id);
    res.json({
      success: true,
      data: {
        token: token,
        user: User.toJSON(user)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/me', protect, async function(req, res) {
  try {
    res.json({ success: true, data: User.toJSON(req.user) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/defaults', async function(req, res) {
  try {
    if (String(process.env.NODE_ENV || '').trim() === 'production') {
      return res.status(404).json({ success: false, error: 'Not available in production mode' });
    }
    var creds = String(process.env.DEMO_CREDENTIALS || 'superadmin/admin123, admin/admin456, moderator/mod123')
      .split(',')
      .map(function(entry) {
        var parts = entry.split('/').map(function(p) { return p.trim(); });
        return { username: parts[0], password: parts[1] || '' };
      })
      .filter(function(c) { return c.username; });
    res.json({ success: true, data: creds });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/change-password', protect, async function(req, res) {
  try {
    var { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Please provide current and new password' });
    }
    var pwCheck = validatePassword(newPassword);
    if (!pwCheck.ok) {
      return res.status(400).json({ success: false, error: pwCheck.error });
    }
    var user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    var isMatch = currentPassword === decrypt(user.password || '');
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }
    await User.findOneAndUpdate({ id: user.id }, { $set: { password: encrypt(String(newPassword)) } });
    res.json({ success: true, data: { message: 'Password updated successfully' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
