var Store = {
  prefix: 'fst_',
  get: function(key, def) {
    try {
      var v = localStorage.getItem(this.prefix + key);
      return v ? JSON.parse(v) : (def !== undefined ? def : null);
    } catch(e) { return def !== undefined ? def : null; }
  },
  set: function(key, val) {
    try { localStorage.setItem(this.prefix + key, JSON.stringify(val)); return true; }
    catch(e) { return false; }
  },
  remove: function(key) {
    localStorage.removeItem(this.prefix + key);
  }
};
