var jwt = require('jsonwebtoken');
var User = require('../models/User');

var jwtSecret = process.env.JWT_SECRET || 'fst-dev-secret-change-me';

var protect = async function(req, res, next) {
  var token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized, no token' });
  }

  try {
    var decoded = jwt.verify(token, jwtSecret);
    var user = await User.findById(decoded.id);
    req.user = user ? User.toJSON(user) : null;
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Not authorized, token failed' });
  }
};

var authorize = function() {
  var roles = Array.prototype.slice.call(arguments);
  return function(req, res, next) {
    if (roles.indexOf(req.user.role) === -1) {
      return res.status(403).json({ success: false, error: 'Not authorized for this action' });
    }
    next();
  };
};

module.exports = { protect, authorize };
