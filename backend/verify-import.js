const http = require('http');

function requestJson(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async function main() {
  const login = await requestJson({
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: 'admin@fst.org', password: 'admin456' }));

  const token = login.data.token;
  const importPayload = JSON.stringify({
    format: 'json',
    content: '[{"id":"FST-IMPORT-001","firstName":"Ana","lastName":"Rivera","email":"ana@example.org","status":"active"}]'
  });

  const result = await requestJson({
    hostname: 'localhost',
    port: 5001,
    path: '/api/sisters/import',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  }, importPayload);

  console.log(JSON.stringify(result));
})();
