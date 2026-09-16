var { createClient } = require('@supabase/supabase-js');

var client = null;
var enabled = false;

var SUPABASE_URL = process.env.SUPABASE_URL || '';
var SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (SUPABASE_URL && SUPABASE_KEY) {
  client = createClient(SUPABASE_URL, SUPABASE_KEY);
  enabled = true;
}

var isEnabled = function() {
  return enabled;
};

var getClient = function() {
  return client;
};

var normalizeRow = function(row) {
  if (!row) return {};
  var out = {};
  for (var key in row) {
    if (row[key] === undefined) continue;
    var col = key.toLowerCase();
    if (typeof row[key] === 'object' && row[key] !== null && !(row[key] instanceof Buffer)) {
      out[col] = JSON.stringify(row[key]);
    } else if (row[key] instanceof Buffer) {
      out[col] = null;
    } else {
      out[col] = row[key];
    }
  }
  return out;
};

var upsertRecord = async function(table, row) {
  if (!enabled || !client) return { success: false, error: 'Supabase not configured' };
  try {
    var payload = normalizeRow(row);
    var { error } = await client.from(table).upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Supabase upsert failed (' + table + '):', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('Supabase upsert exception (' + table + '):', err.message);
    return { success: false, error: err.message };
  }
};

var deleteRecord = async function(table, id) {
  if (!enabled || !client) return { success: false, error: 'Supabase not configured' };
  try {
    var { error } = await client.from(table).delete().eq('id', id);
    if (error) {
      console.error('Supabase delete failed (' + table + '):', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('Supabase delete exception (' + table + '):', err.message);
    return { success: false, error: err.message };
  }
};

var testConnection = async function() {
  if (!enabled || !client) {
    console.log('Supabase sync disabled (no credentials)');
    return;
  }
  try {
    var { error } = await client.from('sisters').select('id').limit(1);
    if (error) {
      console.warn('Supabase connection test failed:', error.message);
    } else {
      console.log('Supabase connected');
    }
  } catch (err) {
    console.warn('Supabase connection exception:', err.message);
  }
};

module.exports = {
  isEnabled: isEnabled,
  getClient: getClient,
  upsertRecord: upsertRecord,
  deleteRecord: deleteRecord,
  testConnection: testConnection
};