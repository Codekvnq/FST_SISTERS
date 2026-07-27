var express = require('express');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var User = require('../models/User');
var { protect } = require('../middleware/auth');

var router = express.Router();
var jwtSecret = process.env.JWT_SECRET || 'fst-dev-secret-change-me';

var generateToken = function(userId) {
  return jwt.sign({ id: userId }, jwtSecret, { expiresIn: '30d' });
};

router.post('/login', async function(req, res) {
  try {
    var { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    var user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    var isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
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

module.exports = router;
