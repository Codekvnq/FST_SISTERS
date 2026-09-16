var MAX_AVATAR_BYTES = 200 * 1024;

var RESIZE_SIZE = 256;

var processAvatar = async function(buffer, inputMime) {
  if (!buffer || !buffer.length) return null;
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error('Image is too large (max 5 MB)');
  }
  try {
    var sharp = require('sharp');
    var resized = await sharp(buffer)
      .rotate()
      .resize(RESIZE_SIZE, RESIZE_SIZE, { fit: 'cover', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    if (resized.length > MAX_AVATAR_BYTES) {
      throw new Error('Resized avatar exceeds size limit');
    }
    return {
      buffer: resized,
      mimeType: 'image/webp',
      originalSize: buffer.length,
      size: resized.length
    };
  } catch (sharpErr) {
    if (String(sharpErr.message).indexOf('exceeds size limit') === -1) {
      console.error('Avatar resize failed, storing original:', sharpErr.message);
    } else {
      throw sharpErr;
    }
  }
  if (buffer.length > MAX_AVATAR_BYTES) {
    throw new Error('Image exceeds size limit');
  }
  return {
    buffer: buffer,
    mimeType: inputMime || 'image/jpeg',
    originalSize: buffer.length,
    size: buffer.length
  };
};

module.exports = { processAvatar: processAvatar, MAX_AVATAR_BYTES: MAX_AVATAR_BYTES };