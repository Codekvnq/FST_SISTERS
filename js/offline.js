/* Minimal offline save-queue: failed writes are stored locally and retried
   automatically when the connection returns. No offline browsing. */
var OfflineQueue = {
  key: 'fst_pendingOps',
  maxOps: 50,

  all: function() {
    try { return Store.get(this.key, []); } catch (e) { return []; }
  },

  enqueue: function(method, url, body) {
    var ops = this.all();
    if (ops.length >= this.maxOps) ops.shift();
    ops.push({ method: method, url: url, body: body, createdAt: new Date().toISOString(), id: 'op_' + Date.now() });
    try {
      Store.set(this.key, ops);
    } catch (e) {}
  },

  pending: function() {
    return this.all().length;
  },

  isOnline: function() {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  getToken: function() {
    return Store.get('token') || localStorage.getItem('fst_token') || '';
  },

  deliver: function(op) {
    var token = this.getToken();
    var req = {
      method: op.method || 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) req.headers['Authorization'] = 'Bearer ' + token;
    if (op.body) req.body = JSON.stringify(op.body);
    return fetch(op.url, req).then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res;
    });
  },

  flush: function() {
    var ops = this.all();
    if (!ops.length) return Promise.resolve(0);
    var queue = this;
    var delivered = 0;
    var kept = [];
    var chain = Promise.resolve();
    ops.forEach(function(op) {
      chain = chain.then(function() {
        return queue.deliver(op).then(function() {
          delivered++;
        }).catch(function() {
          kept.push(op);
        });
      });
    });
    return chain.then(function() {
      try { Store.set(queue.key, kept); } catch (e) {}
      return delivered;
    });
  },

  init: function() {
    if (typeof window === 'undefined') return;
    var queue = this;
    var tryFlush = function() {
      if (queue.isOnline()) {
        queue.flush().then(function(count) {
          if (count > 0 && window.showToast) {
            showToast(count + ' pending change' + (count === 1 ? '' : 's') + ' synced', null, null, 'success');
          }
        });
      }
    };
    window.addEventListener('online', tryFlush);
    if (queue.pending() > 0 && queue.isOnline()) {
      setTimeout(tryFlush, 500);
    }
  }
};

if (typeof window !== 'undefined' && !window.__offlineQueueInit) {
  OfflineQueue.init();
  window.__offlineQueueInit = true;
}