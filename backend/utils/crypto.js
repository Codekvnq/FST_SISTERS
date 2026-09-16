var crypto = require('crypto');

var PREFIX = 'enc:v1:';

var getKey = function() {
  var secret = process.env.FST_PASSWORD_KEY || process.env.JWT_SECRET || 'fst-dev-password-key-change-me';
  return crypto.createHash('sha256').update(String(secret)).digest();
};

var encrypt = function(plaintext) {
  if (plaintext == null || plaintext === '') return '';
  var iv = crypto.randomBytes(12);
  var cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  var enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  var tag = cipher.getAuthTag();
  return PREFIX + iv.toString('base64') + ':' + tag.toString('base64') + ':' + enc.toString('base64');
};

var decrypt = function(stored) {
  if (stored == null || stored === '') return '';
  if (typeof stored !== 'string' || stored.indexOf(PREFIX) !== 0) {
    return stored;
  }
  var parts = stored.slice(PREFIX.length).split(':');
  if (parts.length !== 3) return stored;
  try {
    var decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(parts[0], 'base64'));
    decipher.setAuthTag(Buffer.from(parts[1], 'base64'));
    return decipher.update(Buffer.from(parts[2], 'base64'), 'utf8', 'utf8') + decipher.final('utf8');
  } catch (e) {
    return '';
  }
};

module.exports = { encrypt: encrypt, decrypt: decrypt };