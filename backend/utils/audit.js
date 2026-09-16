var AuditLog = require('../models/AuditLog');

var logActivity = async function(action, entityType, entityId, entityName, detail, user) {
  try {
    await AuditLog.create({
      action: action || '',
      entityType: entityType || '',
      entityId: String(entityId || ''),
      entityName: entityName || '',
      detail: detail || '',
      userId: user && user.id ? user.id : '',
      userName: user && (user.username || user.name || (user.email ? user.email.split('@')[0] : '')) || '',
      userRole: user && user.role ? user.role : '',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Audit log write failed:', err.message);
  }
};

module.exports = { logActivity: logActivity };