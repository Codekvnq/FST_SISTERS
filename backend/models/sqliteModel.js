var db = require('../config/db').db;

var SYNCABLE_TABLES = ['sisters', 'documents', 'users'];

function normalizeValue(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

function parseValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    try {
      var parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    } catch (err) {}
  }
  return value;
}

function mapRow(row) {
  if (!row) return null;
  var out = {};
  for (var key in row) {
    out[key] = parseValue(row[key]);
  }
  return out;
}

function buildWhere(filter, softDelete) {
  if (softDelete && (!filter || Object.keys(filter).length === 0)) {
    return { sql: ' WHERE deletedAt IS NULL', params: [] };
  }

  var clauses = [];
  var params = [];

  function addClause(key, value) {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      return;
    }
    if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      if (value.$regex) {
        clauses.push(key + ' LIKE ?');
        params.push('%' + value.$regex + '%');
      } else if (value.$ne) {
        clauses.push(key + ' != ?');
        params.push(value.$ne);
      }
      return;
    }
    clauses.push(key + ' = ?');
    params.push(value);
  }

  if (filter.$or) {
    var grouped = [];
    filter.$or.forEach(function(item) {
      var sub = [];
      Object.keys(item).forEach(function(key) {
        if (key === '$regex') return;
        if (typeof item[key] === 'object' && item[key] && item[key].$regex) {
          sub.push(key + ' LIKE ?');
          params.push('%' + item[key].$regex + '%');
        } else {
          sub.push(key + ' = ?');
          params.push(item[key]);
        }
      });
      if (sub.length) {
        grouped.push('(' + sub.join(' AND ') + ')');
      }
    });
    if (grouped.length) {
      clauses.push(grouped.join(' OR '));
    }
  }

  Object.keys(filter).forEach(function(key) {
    if (key === '$or') return;
    addClause(key, filter[key]);
  });

  if (softDelete && !filter.hasOwnProperty('deletedAt')) {
    clauses.push('deletedAt IS NULL');
  }

  return { sql: clauses.length ? ' WHERE ' + clauses.join(' AND ') : '', params: params };
}

function buildOrder(sort) {
  if (!sort) return '';
  var parts = [];
  Object.keys(sort).forEach(function(key) {
    parts.push(key + ' ' + (sort[key] < 0 ? 'DESC' : 'ASC'));
  });
  return parts.length ? ' ORDER BY ' + parts.join(', ') : '';
}

function applyProjection(rows, projection) {
  if (!projection) return rows;
  if (projection === '-password') {
    return rows.map(function(row) {
      if (row && row.password !== undefined) delete row.password;
      return row;
    });
  }
  return rows;
}

var enqueueOutbox = function(operation, entityType, entityId, payload) {
  return new Promise(function(resolve) {
    if (SYNCABLE_TABLES.indexOf(entityType) === -1) {
      return resolve();
    }
    db.get('SELECT COALESCE(MAX(seq), 0) AS m FROM outbox', function(err, row) {
      if (err) {
        return resolve();
      }
      var id = entityType + '_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
      var next = (row && row.m ? row.m : 0) + 1;
      db.run(
        'INSERT INTO outbox (id, seq, entityType, entityId, operation, payload, status, attempts, nextRetryAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, next, entityType, String(entityId), operation, normalizeValue(payload), 'pending', 0, null, new Date().toISOString(), new Date().toISOString()],
        function(insertErr) {
          if (insertErr) {
            console.error('Outbox enqueue failed:', insertErr.message);
          }
          resolve();
        }
      );
    });
  });
};

function runFind(tableName, filter, projection, sortValue, limitValue, softDelete) {
  return new Promise(function(resolve, reject) {
    var where = buildWhere(filter, softDelete);
    var sql = 'SELECT * FROM ' + tableName + where.sql + buildOrder(sortValue);
    if (limitValue) {
      sql += ' LIMIT ' + limitValue;
    }
    db.all(sql, where.params, function(err, rows) {
      if (err) return reject(err);
      var mapped = (rows || []).map(mapRow);
      mapped = applyProjection(mapped, projection);
      resolve(mapped);
    });
  });
}

function runOne(tableName, filter, projection, softDelete) {
  return runFind(tableName, filter, projection, null, 1, softDelete).then(function(rows) {
    return rows[0] || null;
  });
}

function runInsert(tableName, data, softDelete) {
  return new Promise(function(resolve, reject) {
    var values = {};
    Object.keys(data).forEach(function(key) {
      values[key] = normalizeValue(data[key]);
    });
    if (!values.id) {
      values.id = 'item_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    }
    if (values.createdAt === undefined || values.createdAt === null) values.createdAt = new Date().toISOString();
    if (values.updatedAt === undefined || values.updatedAt === null) values.updatedAt = values.createdAt;
    if (softDelete) {
      if (values.version === undefined || values.version === null) values.version = 1;
      if (values.deletedAt === undefined || values.deletedAt === null) values.deletedAt = null;
    }

    var columns = Object.keys(values);
    var placeholders = columns.map(function() { return '?'; }).join(', ');
    var params = columns.map(function(key) { return values[key]; });
    var sql = 'INSERT INTO ' + tableName + ' (' + columns.join(', ') + ') VALUES (' + placeholders + ')';
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      var record = Object.assign({}, values);
      if (tableName === 'users' && record.password) delete record.password;
      enqueueOutbox('create', tableName, record.id, record).then(function() {
        resolve(values);
      });
    });
  });
}

function runUpdate(tableName, id, data, softDelete) {
  return new Promise(function(resolve, reject) {
    var readVersion = softDelete
      ? new Promise(function(res, rej) {
          db.get('SELECT version FROM ' + tableName + ' WHERE id = ?', [id], function(err, row) {
            if (err) return rej(err);
            res(row ? row.version : 0);
          });
        })
      : Promise.resolve(0);
    readVersion.then(function(currentVersion) {
      var values = {};
      Object.keys(data).forEach(function(key) {
        values[key] = normalizeValue(data[key]);
      });
      values.updatedAt = new Date().toISOString();
      if (softDelete) {
        values.version = (currentVersion || 0) + 1;
      }
      var columns = Object.keys(values);
      var assignments = columns.map(function(key) { return key + ' = ?'; }).join(', ');
      var params = columns.map(function(key) { return values[key]; });
      params.push(id);
      var sql = 'UPDATE ' + tableName + ' SET ' + assignments + ' WHERE id = ?';
      db.run(sql, params, function(updateErr) {
        if (updateErr) return reject(updateErr);
        var payload = Object.assign({}, data);
        payload.id = id;
        payload.updatedAt = values.updatedAt;
        if (softDelete) payload.version = values.version;
        if (tableName === 'users' && payload.password) delete payload.password;
        enqueueOutbox('update', tableName, id, payload).then(function() {
          resolve(values.version);
        });
      });
    }).catch(reject);
  });
}

function ensureColumn(tableName, columnName, columnType) {
  return new Promise(function(resolve, reject) {
    db.all('PRAGMA table_info(' + tableName + ')', function(err, rows) {
      if (err) return reject(err);
      var has = (rows || []).some(function(r) { return r.name === columnName; });
      if (has) return resolve(true);
      db.run('ALTER TABLE ' + tableName + ' ADD COLUMN ' + columnName + ' ' + columnType, function(alterErr) {
        if (alterErr) return reject(alterErr);
        resolve(true);
      });
    });
  });
}

function createModel(tableName, defaultFields, schemaReadyPromise, options) {
  options = options || {};
  var softDelete = options.softDelete !== false;
  var ready = schemaReadyPromise || Promise.resolve();

  function wrapQuery(fn) {
    return function() {
      var args = arguments;
      return ready.then(function() {
        return fn.apply(null, args);
      });
    };
  }

  return {
    find: function(filter) {
      return new Query(tableName, filter || {}, softDelete, ready);
    },
    findOne: wrapQuery(function(filter) {
      return runOne(tableName, filter || {}, null, softDelete);
    }),
    findById: wrapQuery(function(id) {
      return runOne(tableName, { id: id }, null, softDelete);
    }),
    countDocuments: wrapQuery(function(filter) {
      return new Promise(function(resolve, reject) {
        var where = buildWhere(filter || {}, softDelete);
        var sql = 'SELECT COUNT(*) as count FROM ' + tableName + where.sql;
        db.get(sql, where.params, function(err, row) {
          if (err) return reject(err);
          resolve(row ? row.count : 0);
        });
      });
    }),
    create: wrapQuery(function(data) {
      return runInsert(tableName, Object.assign({}, defaultFields, data), softDelete);
    }),
    insertMany: wrapQuery(function(items) {
      return Promise.all(items.map(function(item) { return runInsert(tableName, Object.assign({}, defaultFields, item), softDelete); }));
    }),
    findByIdAndDelete: wrapQuery(function(id) {
      return new Promise(function(resolve, reject) {
        db.get('SELECT * FROM ' + tableName + ' WHERE id = ?', [id], function(err, row) {
          if (err) return reject(err);
          if (!row) return resolve(null);
          db.run('DELETE FROM ' + tableName + ' WHERE id = ?', [id], function(deleteErr) {
            if (deleteErr) return reject(deleteErr);
            enqueueOutbox('delete', tableName, id, { id: id }).then(function() {
              resolve(mapRow(row));
            });
          });
        });
      });
    }),
    findOneAndDelete: wrapQuery(function(filter) {
      return new Promise(function(resolve, reject) {
        runOne(tableName, filter || {}, null, softDelete).then(function(item) {
          if (!item) return resolve(null);
          db.run('DELETE FROM ' + tableName + ' WHERE id = ?', [item.id], function(deleteErr) {
            if (deleteErr) return reject(deleteErr);
            enqueueOutbox('delete', tableName, item.id, { id: item.id }).then(function() {
              resolve(item);
            });
          });
        }).catch(reject);
      });
    }),
    softDelete: wrapQuery(function(filter, meta) {
      return new Promise(function(resolve, reject) {
        runOne(tableName, filter || {}, null, softDelete).then(function(item) {
          if (!item) return resolve(null);
          var deletedAt = new Date().toISOString();
          var deletedBy = meta && meta.userId ? meta.userId : null;
          runUpdate(tableName, item.id, { deletedAt: deletedAt, deletedBy: deletedBy }, softDelete).then(function(version) {
            resolve(Object.assign({}, item, { deletedAt: deletedAt, deletedBy: deletedBy, version: version || item.version }));
          }).catch(reject);
        }).catch(reject);
      });
    }),
    deleteMany: wrapQuery(function(filter) {
      return new Promise(function(resolve, reject) {
        var where = buildWhere(filter || {}, softDelete);
        db.all('SELECT id FROM ' + tableName + where.sql, where.params, function(err, rows) {
          if (err) return reject(err);
          var sql = 'DELETE FROM ' + tableName + where.sql;
          db.run(sql, where.params, function(deleteErr) {
            if (deleteErr) return reject(deleteErr);
            var ids = (rows || []).map(function(r) { return r.id; });
            Promise.all(ids.map(function(id) {
              return enqueueOutbox('delete', tableName, id, { id: id });
            })).then(function() {
              resolve(true);
            });
          });
        });
      });
    }),
    findOneAndUpdate: wrapQuery(function(filter, update) {
      return new Promise(function(resolve, reject) {
        runOne(tableName, filter || {}, null, softDelete).then(function(item) {
          if (!item) return resolve(null);
          var merged = Object.assign({}, item, update.$set || update);
          runUpdate(tableName, item.id, merged, softDelete).then(function(version) {
            var out = Object.assign({}, item, merged);
            out.updatedAt = merged.updatedAt;
            if (softDelete) out.version = version;
            resolve(out);
          }).catch(reject);
        }).catch(reject);
      });
    }),
    ensureColumn: function(columnName, columnType) {
      return ready.then(function() {
        return ensureColumn(tableName, columnName, columnType);
      });
    }
  };
}

class Query {
  constructor(tableName, filter, softDelete, ready) {
    this.tableName = tableName;
    this.filter = filter || {};
    this.projection = null;
    this.sortValue = null;
    this.limitValue = null;
    this.softDelete = softDelete;
    this.ready = ready;
  }

  select(value) {
    this.projection = value;
    return this;
  }

  sort(value) {
    this.sortValue = value;
    return this;
  }

  limit(value) {
    this.limitValue = value;
    return this;
  }

  exec() {
    return this.ready.then(function() {
      return runFind(this.tableName, this.filter, this.projection, this.sortValue, this.limitValue, this.softDelete);
    }.bind(this));
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

module.exports = createModel;
module.exports.enqueueOutbox = enqueueOutbox;
module.exports.ensureColumn = ensureColumn;