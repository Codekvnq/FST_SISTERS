var crypto = require('crypto');
var db = require('../config/db').db;

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

function buildWhere(filter) {
  if (!filter || Object.keys(filter).length === 0) return { sql: '', params: [] };

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

class Query {
  constructor(tableName, filter) {
    this.tableName = tableName;
    this.filter = filter || {};
    this.projection = null;
    this.sortValue = null;
    this.limitValue = null;
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
    return runFind(this.tableName, this.filter, this.projection, this.sortValue, this.limitValue);
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

function runFind(tableName, filter, projection, sortValue, limitValue) {
  return new Promise(function(resolve, reject) {
    var where = buildWhere(filter);
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

function runOne(tableName, filter, projection) {
  return runFind(tableName, filter, projection, null, 1).then(function(rows) {
    return rows[0] || null;
  });
}

function runInsert(tableName, data) {
  return new Promise(function(resolve, reject) {
    var values = {};
    Object.keys(data).forEach(function(key) {
      values[key] = normalizeValue(data[key]);
    });
    if (!values.id) {
      values.id = 'item_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    }
    if (!values.createdAt) values.createdAt = new Date().toISOString();
    if (!values.updatedAt) values.updatedAt = values.createdAt;

    var columns = Object.keys(values);
    var placeholders = columns.map(function() { return '?'; }).join(', ');
    var params = columns.map(function(key) { return values[key]; });
    var sql = 'INSERT INTO ' + tableName + ' (' + columns.join(', ') + ') VALUES (' + placeholders + ')';
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve(values);
    });
  });
}

function runUpdate(tableName, id, data) {
  return new Promise(function(resolve, reject) {
    var values = {};
    Object.keys(data).forEach(function(key) {
      values[key] = normalizeValue(data[key]);
    });
    values.updatedAt = new Date().toISOString();
    var columns = Object.keys(values);
    var assignments = columns.map(function(key) { return key + ' = ?'; }).join(', ');
    var params = columns.map(function(key) { return values[key]; });
    params.push(id);
    var sql = 'UPDATE ' + tableName + ' SET ' + assignments + ' WHERE id = ?';
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve(null);
    });
  });
}

function createModel(tableName, defaultFields) {
  return {
    find: function(filter) {
      return new Query(tableName, filter || {});
    },
    findOne: function(filter) {
      return runOne(tableName, filter || {});
    },
    findById: function(id) {
      return runOne(tableName, { id: id });
    },
    countDocuments: function(filter) {
      return new Promise(function(resolve, reject) {
        var where = buildWhere(filter || {});
        var sql = 'SELECT COUNT(*) as count FROM ' + tableName + where.sql;
        db.get(sql, where.params, function(err, row) {
          if (err) return reject(err);
          resolve(row ? row.count : 0);
        });
      });
    },
    create: function(data) {
      return runInsert(tableName, Object.assign({}, defaultFields, data));
    },
    insertMany: function(items) {
      return Promise.all(items.map(function(item) { return runInsert(tableName, Object.assign({}, defaultFields, item)); }));
    },
    findByIdAndDelete: function(id) {
      return new Promise(function(resolve, reject) {
        db.get('SELECT * FROM ' + tableName + ' WHERE id = ?', [id], function(err, row) {
          if (err) return reject(err);
          if (!row) return resolve(null);
          db.run('DELETE FROM ' + tableName + ' WHERE id = ?', [id], function(deleteErr) {
            if (deleteErr) return reject(deleteErr);
            resolve(mapRow(row));
          });
        });
      });
    },
    findOneAndDelete: function(filter) {
      return new Promise(function(resolve, reject) {
        runOne(tableName, filter || {}).then(function(item) {
          if (!item) return resolve(null);
          db.run('DELETE FROM ' + tableName + ' WHERE id = ?', [item.id], function(deleteErr) {
            if (deleteErr) return reject(deleteErr);
            resolve(item);
          });
        }).catch(reject);
      });
    },
    findOneAndUpdate: function(filter, update) {
      return new Promise(function(resolve, reject) {
        runOne(tableName, filter || {}).then(function(item) {
          if (!item) return resolve(null);
          var merged = Object.assign({}, item, update.$set || update);
          runUpdate(tableName, item.id, merged).then(function() {
            resolve(Object.assign({}, item, merged));
          }).catch(reject);
        }).catch(reject);
      });
    },
    deleteMany: function(filter) {
      return new Promise(function(resolve, reject) {
        var where = buildWhere(filter || {});
        var sql = 'DELETE FROM ' + tableName + where.sql;
        db.run(sql, where.params, function(err) {
          if (err) return reject(err);
          resolve(true);
        });
      });
    }
  };
}

module.exports = createModel;
