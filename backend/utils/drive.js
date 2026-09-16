var https = require('https');
var crypto = require('crypto');
var fs = require('fs');

var ROOT_FOLDER_NAME = 'FST Sisters Documents';

var usingServiceAccount = function() {
  return !!(process.env.GOOGLE_SERVICE_ACCOUNT || process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH);
};

var usingOAuth = function() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);
};

var isConfigured = function() {
  return usingServiceAccount() || usingOAuth();
};

var tokenCache = { accessToken: null, expiresAt: 0 };

function requestJson(method, url, headers, bodyBuffer) {
  return new Promise(function(resolve, reject) {
    var parsed = new URL(url);
    var options = {
      method: method,
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: headers || {}
    };
    var req = https.request(options, function(res) {
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() {
        var raw = Buffer.concat(chunks).toString('utf8');
        var json = null;
        try { json = JSON.parse(raw); } catch (e) {}
        resolve({
          status: res.statusCode,
          body: json,
          raw: raw
        });
      });
    });
    req.on('error', reject);
    if (bodyBuffer) req.write(bodyBuffer);
    req.end();
  });
}

function signJwt(privateKey, payload) {
  var header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  var data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  var signer = crypto.createSign('RSA-SHA256');
  signer.update(header + '.' + data);
  var sig = signer.sign(privateKey, 'base64url');
  return header + '.' + data + '.' + sig;
}

var getServiceAccount = function() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  }
  var p = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH;
  if (p && fs.existsSync(p)) {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  return null;
};

var normalizePrivateKey = function(key) {
  if (!key) return '';
  return String(key).replace(/\\n/g, '\n');
};

var fetchAccessToken = async function() {
  var now = Date.now();
  if (tokenCache.accessToken && tokenCache.expiresAt > now + 30000) {
    return tokenCache.accessToken;
  }

  if (usingServiceAccount()) {
    var sa = getServiceAccount();
    if (!sa || !sa.client_email || !sa.private_key) {
      throw new Error('Service account incomplete');
    }
    var nowSec = Math.floor(Date.now() / 1000);
    var jwt = signJwt(normalizePrivateKey(sa.private_key), {
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/drive.file',
      aud: 'https://oauth2.googleapis.com/token',
      iat: nowSec,
      exp: nowSec + 3600
    });
    var res = await requestJson('POST', 'https://oauth2.googleapis.com/token', {
      'Content-Type': 'application/x-www-form-urlencoded'
    }, Buffer.from('grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + encodeURIComponent(jwt)));
    if (!res.body || !res.body.access_token) {
      throw new Error('Service account token exchange failed: ' + (res.body && res.body.error_description));
    }
    tokenCache.accessToken = res.body.access_token;
    tokenCache.expiresAt = now + (res.body.expires_in || 3600) * 1000;
    return tokenCache.accessToken;
  }

  if (usingOAuth()) {
    var body = 'grant_type=refresh_token' +
      '&client_id=' + encodeURIComponent(process.env.GOOGLE_CLIENT_ID) +
      '&client_secret=' + encodeURIComponent(process.env.GOOGLE_CLIENT_SECRET) +
      '&refresh_token=' + encodeURIComponent(process.env.GOOGLE_REFRESH_TOKEN);
    var res2 = await requestJson('POST', 'https://oauth2.googleapis.com/token', {
      'Content-Type': 'application/x-www-form-urlencoded'
    }, Buffer.from(body));
    if (!res2.body || !res2.body.access_token) {
      throw new Error('OAuth token refresh failed: ' + (res2.body && res2.body.error_description));
    }
    tokenCache.accessToken = res2.body.access_token;
    tokenCache.expiresAt = now + (res2.body.expires_in || 3600) * 1000;
    return tokenCache.accessToken;
  }

  throw new Error('Google Drive not configured');
};

var getAuthHeaders = async function() {
  var token = await fetchAccessToken();
  return {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json; charset=UTF-8'
  };
};

var getFile = async function(fileId, fields) {
  if (!isConfigured()) throw new Error('Google Drive not configured');
  var headers = await getAuthHeaders();
  var fieldsStr = fields || 'id,name,mimeType,webViewLink,size,createdTime,parents';
  var res = await requestJson('GET', 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(fileId) + '?fields=' + encodeURIComponent(fieldsStr), headers);
  if (res.status !== 200) throw new Error('Drive getFile failed: ' + res.raw);
  return res.body;
};

var listFiles = async function(query, fields) {
  if (!isConfigured()) throw new Error('Google Drive not configured');
  var headers = await getAuthHeaders();
  var fieldsStr = fields || 'files(id,name,mimeType,webViewLink,size,createdTime,parents)';
  var res = await requestJson('GET', 'https://www.googleapis.com/drive/v3/files?q=' + encodeURIComponent(query) + '&fields=' + encodeURIComponent(fieldsStr), headers);
  if (res.status !== 200) throw new Error('Drive listFiles failed: ' + res.raw);
  return res.body && res.body.files ? res.body.files : [];
};

var findFolderByName = async function(parentId, name) {
  var q = "mimeType='application/vnd.google-apps.folder' and trashed=false and name='" + name.replace(/'/g, "\\'") + "'";
  if (parentId) q += " and '" + parentId + "' in parents";
  var files = await listFiles(q, 'files(id,name)');
  return files.length ? files[0] : null;
};

var createFolder = async function(name, parentId) {
  var headers = await getAuthHeaders();
  var metadata = {
    name: name,
    mimeType: 'application/vnd.google-apps.folder'
  };
  if (parentId) metadata.parents = [parentId];
  var res = await requestJson('POST', 'https://www.googleapis.com/drive/v3/files', headers, Buffer.from(JSON.stringify(metadata)));
  if (res.status !== 200) throw new Error('Drive createFolder failed: ' + res.raw);
  return res.body;
};

var ensureFolder = async function(name, parentId) {
  var existing = await findFolderByName(parentId, name);
  if (existing) return existing;
  return createFolder(name, parentId);
};

var getRootFolder = async function() {
  return ensureFolder(ROOT_FOLDER_NAME, null);
};

var getSisterFolder = async function(sisterId, sisterName) {
  var root = await getRootFolder();
  var label = sisterName && sisterName.trim().length ? sisterName.trim() : sisterId;
  return ensureFolder(sisterId + ' - ' + label, root.id);
};

var uploadFileBuffer = async function(fileBuffer, mimeType, name, parentId) {
  if (!isConfigured()) throw new Error('Google Drive not configured');
  var token = await fetchAccessToken();
  var boundary = 'FST_' + Date.now() + '_' + Math.floor(Math.random() * 1e9);
  var metadataJson = JSON.stringify({
    name: name,
    parents: [parentId]
  });
  var pre = Buffer.from(
    '--' + boundary + '\r\n' +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    metadataJson + '\r\n' +
    '--' + boundary + '\r\n' +
    'Content-Type: ' + (mimeType || 'application/octet-stream') + '\r\n\r\n'
  );
  var post = Buffer.from('\r\n--' + boundary + '--\r\n');
  var body = Buffer.concat([pre, fileBuffer, post]);

  var url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true';
  var parsed = new URL(url);
  var options = {
    method: 'POST',
    hostname: parsed.hostname,
    path: parsed.pathname + parsed.search,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'multipart/related; boundary=' + boundary,
      'Content-Length': body.length
    }
  };
  return new Promise(function(resolve, reject) {
    var req = https.request(options, function(res) {
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() {
        var raw = Buffer.concat(chunks).toString('utf8');
        var json = null;
        try { json = JSON.parse(raw); } catch (e) {}
        if (res.statusCode !== 200) {
          return reject(new Error('Drive upload failed (' + res.statusCode + '): ' + (json && json.error ? JSON.stringify(json.error) : raw)));
        }
        resolve(json);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

var trashFile = async function(fileId) {
  var headers = await getAuthHeaders();
  var res = await requestJson('PATCH', 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(fileId), headers, Buffer.from(JSON.stringify({ trashed: true })));
  if (res.status !== 200) throw new Error('Drive trashFile failed: ' + res.raw);
  return res.body;
};

var downloadFileBuffer = async function(fileId) {
  var token = await fetchAccessToken();
  var url = 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(fileId) + '?alt=media&supportsAllDrives=true';
  var parsed = new URL(url);
  return new Promise(function(resolve, reject) {
    var options = {
      method: 'GET',
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: { 'Authorization': 'Bearer ' + token }
    };
    var req = https.request(options, function(res) {
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() {
        if (res.statusCode !== 200) {
          return reject(new Error('Drive download failed (' + res.statusCode + ')'));
        }
        resolve(Buffer.concat(chunks));
      });
    });
    req.on('error', reject);
    req.end();
  });
};

var uploadDocs = async function(buffers) {
  if (!isConfigured()) throw new Error('Google Drive not configured');
  var root = await getRootFolder();
  var out = [];
  for (var i = 0; i < buffers.length; i++) {
    var b = buffers[i];
    var folder = await ensureFolder(b.sisterLabel || 'General', root.id);
    var meta = await uploadFileBuffer(b.data, b.mimeType, b.name, folder.id);
    out.push({ fileId: meta.id, webViewLink: meta.webViewLink });
  }
  return out;
};

module.exports = {
  isConfigured: isConfigured,
  getRootFolder: getRootFolder,
  getSisterFolder: getSisterFolder,
  uploadFileBuffer: uploadFileBuffer,
  uploadDocs: uploadDocs,
  getFile: getFile,
  listFiles: listFiles,
  trashFile: trashFile,
  downloadFileBuffer: downloadFileBuffer,
  findFolderByName: findFolderByName,
  createFolder: createFolder,
  ensureFolder: ensureFolder
};