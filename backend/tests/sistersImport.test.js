var test = require('node:test');
var assert = require('node:assert/strict');
var { parseSisterImportContent } = require('../utils/sisterImport');

test('parses JSON sister records into normalized records', function() {
  var payload = JSON.stringify([
    {
      id: 'FST-1001',
      firstName: 'Maria',
      lastName: 'Garcia',
      email: 'maria@example.org',
      phone: '+63 917 123 4567',
      acceptanceDate: '2024-01-01',
      status: 'active'
    }
  ]);

  var result = parseSisterImportContent('json', payload);
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].id, 'FST-1001');
  assert.equal(result.records[0].contact.email, 'maria@example.org');
  assert.equal(result.records[0].dates.acceptance, '2024-01-01');
  assert.equal(result.records[0].status, 'active');
});

test('parses CSV sister rows into normalized records', function() {
  var payload = 'id,firstName,lastName,email,phone,address,status\nFST-1002,Teresa,Santos,teresa@example.org,+63 918 111 2222,Quezon City,active';

  var result = parseSisterImportContent('csv', payload);
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].firstName, 'Teresa');
  assert.equal(result.records[0].contact.phone, '+63 918 111 2222');
  assert.equal(result.records[0].contact.address, 'Quezon City');
});
