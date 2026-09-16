/* ==================== SAMPLE DATA ==================== */
(function() {
  if (Store.get('initialized')) return;

  Store.set('users', [
    { id:'user_001', username:'superadmin', email:'superadmin@fst.org', role:'superadmin', sisterId:null },
    { id:'user_002', username:'admin', email:'admin@fst.org', role:'admin', sisterId:null },
    { id:'user_003', username:'moderator', email:'moderator@fst.org', role:'moderator', sisterId:null }
  ]);

  Store.set('sisters', [
    { id:'FST-2024-001', firstName:'Maria', lastName:'Garcia', middleName:'Cruz', dateOfBirth:'1985-03-15', placeOfBirth:'Manila, Philippines', dates:{ acceptance:'2010-06-01', investiture:'2011-01-15', firstProfession:'2012-03-20', finalProfession:'2015-11-10', silverJubilee:null, renewals:[{year:2013,date:'2013-03-20'},{year:2014,date:'2014-03-20'}] }, education:[{ institution:'University of Santo Tomas', qualification:'Bachelor of Arts in Education', yearStart:2003, yearEnd:2007 },{ institution:'De La Salle University', qualification:'Master of Arts in Teaching', yearStart:2008, yearEnd:2010 }], contact:{ email:'maria.garcia@fst.org', phone:'+63 917 123 4567', address:'123 Sisters Convent, Quezon City', emergencyContact:'Juan Garcia - +63 917 987 6543' }, status:'active', createdAt:'2024-01-01' },
    { id:'FST-2024-002', firstName:'Teresa', lastName:'Santos', middleName:'Reyes', dateOfBirth:'1980-08-22', placeOfBirth:'Cebu City, Philippines', dates:{ acceptance:'2005-09-01', investiture:'2006-03-15', firstProfession:'2007-06-20', finalProfession:'2010-12-08', silverJubilee:'2031-06-20', renewals:[] }, education:[{ institution:'University of San Carlos', qualification:'Bachelor of Science in Nursing', yearStart:1998, yearEnd:2003 }], contact:{ email:'teresa.santos@fst.org', phone:'+63 932 123 4567', address:'456 Sacred Heart, Cebu City', emergencyContact:'Pedro Santos - +63 932 987 6543' }, status:'active', createdAt:'2024-01-01' },
    { id:'FST-2024-003', firstName:'Rosa', lastName:'Dela Cruz', middleName:'Mendoza', dateOfBirth:'1975-12-08', placeOfBirth:'Davao City, Philippines', dates:{ acceptance:'2000-01-15', investiture:'2000-08-01', firstProfession:'2001-12-08', finalProfession:'2004-12-08', silverJubilee:'2026-12-08', renewals:[{year:2002,date:'2002-12-08'},{year:2003,date:'2003-12-08'}] }, education:[{ institution:'Ateneo de Davao', qualification:'Bachelor of Science in Social Work', yearStart:1993, yearEnd:1998 }], contact:{ email:'rosa.delacruz@fst.org', phone:'+63 922 123 4567', address:'789 Holy Cross, Davao City', emergencyContact:'Ana Dela Cruz - +63 922 987 6543' }, status:'active', createdAt:'2024-01-01' },
    { id:'FST-2024-004', firstName:'Luz', lastName:'Fernandez', middleName:'Torres', dateOfBirth:'1970-05-20', placeOfBirth:'Iloilo City, Philippines', dates:{ acceptance:'1995-06-01', investiture:'1996-01-15', firstProfession:'1997-05-20', finalProfession:'2000-05-20', silverJubilee:'2022-05-20', renewals:[] }, education:[{ institution:'University of Iloilo', qualification:'Bachelor of Secondary Education', yearStart:1988, yearEnd:1993 }], contact:{ email:'luz.fernandez@fst.org', phone:'+63 33 123 4567', address:'321 Grace Lane, Iloilo City', emergencyContact:'Jose Fernandez - +63 33 987 6543' }, status:'retired', createdAt:'2024-01-01' },
    { id:'FST-2024-005', firstName:'Carmen', lastName:'Lopez', middleName:'Rivera', dateOfBirth:'1990-09-12', placeOfBirth:'Zamboanga City, Philippines', dates:{ acceptance:'2018-07-01', investiture:'2019-01-20', firstProfession:'2020-09-12', finalProfession:null, silverJubilee:null, renewals:[{year:2021,date:'2020-09-12'},{year:2022,date:'2021-09-12'},{year:2023,date:'2022-09-12'}] }, education:[{ institution:'Western Mindanao State University', qualification:'Bachelor of Science in Community Development', yearStart:2008, yearEnd:2013 }], contact:{ email:'carmen.lopez@fst.org', phone:'+63 62 123 4567', address:'567 Faith Street, Zamboanga City', emergencyContact:'Miguel Lopez - +63 62 987 6543' }, status:'active', createdAt:'2024-01-01' },
    { id:'FST-2024-006', firstName:'Elena', lastName:'Gonzales', middleName:'Cruz', dateOfBirth:'1988-02-28', placeOfBirth:'Baguio City, Philippines', dates:{ acceptance:'2015-03-01', investiture:'2015-09-15', firstProfession:'2016-06-20', finalProfession:'2019-06-20', silverJubilee:null, renewals:[] }, education:[{ institution:'University of the Cordilleras', qualification:'Bachelor of Science in Social Work', yearStart:2006, yearEnd:2011 }], contact:{ email:'elena.gonzales@fst.org', phone:'+63 74 123 4567', address:'890 Mountain View, Baguio City', emergencyContact:'Roberto Gonzales - +63 74 987 6543' }, status:'active', createdAt:'2024-01-01' }
  ]);

  Store.set('documents', [
    { id:'doc_1', sisterId:'FST-2024-001', category:'certificate', subcategory:'birth', fileName:'birth_cert_garcia.pdf', originalName:'Birth Certificate - Garcia.pdf', fileSize:245000, uploadedAt:'2024-01-15' },
    { id:'doc_2', sisterId:'FST-2024-001', category:'certificate', subcategory:'baptismal', fileName:'baptismal_garcia.pdf', originalName:'Baptismal Certificate - Garcia.pdf', fileSize:189000, uploadedAt:'2024-01-15' },
    { id:'doc_3', sisterId:'FST-2024-001', category:'letter', subcategory:'acceptance', fileName:'acceptance_letter_2010.pdf', originalName:'Acceptance Letter 2010.pdf', fileSize:156000, uploadedAt:'2024-01-15' },
    { id:'doc_4', sisterId:'FST-2024-002', category:'certificate', subcategory:'birth', fileName:'birth_cert_santos.pdf', originalName:'Birth Certificate - Santos.pdf', fileSize:267000, uploadedAt:'2024-01-20' },
    { id:'doc_5', sisterId:'FST-2024-003', category:'certificate', subcategory:'workshop', fileName:'workshop_cert_2022.pdf', originalName:'Workshop Certificate 2022.pdf', fileSize:312000, uploadedAt:'2024-02-01' },
    { id:'doc_6', sisterId:'FST-2024-001', category:'education', subcategory:'other', fileName:'diploma_garcia.pdf', originalName:'Diploma - UST.pdf', fileSize:456000, uploadedAt:'2024-01-15' }
  ]);

  Store.set('activityLog', [
    { id: 'act_seed_' + Date.now(), type: 'system.setup', action: 'Initialized', entityType: 'system', entityName: 'Sample database', entityId: '', detail: 'Seeded ' + Store.get('sisters', []).length + ' sisters and ' + Store.get('documents', []).length + ' documents', userName: 'System', timestamp: new Date().toISOString() }
  ]);

  Store.set('initialized', true);
})();

/* ==================== USERNAME BACKFILL MIGRATION ==================== */
(function() {
  var users = Store.get('users', []);
  if (!Array.isArray(users) || users.length === 0) return;
  var changed = false;
  var DEFAULTS = { 'superadmin@fst.org': 'superadmin', 'admin@fst.org': 'admin', 'moderator@fst.org': 'moderator' };
  for (var i = 0; i < users.length; i++) {
    if (!users[i] || (users[i].username && String(users[i].username).trim())) continue;
    var email = String(users[i].email || '').toLowerCase();
    var name = DEFAULTS[email] || email.split('@')[0] || ('user_' + (i + 1));
    users[i].username = name;
    changed = true;
  }
  if (changed) Store.set('users', users);
})();

/* ==================== API WRITE-THROUGH ==================== */
function apiToken() {
  try {
    var t = Store.get('token');
    if (t) return t;
    return localStorage.getItem('fst_token') || '';
  } catch(e) { return ''; }
}

function apiPush(method, path, body) {
  var token = apiToken();
  if (!token) return;
  try {
    fetch(path, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(body || {})
    }).catch(function() {});
  } catch(e) {}
}

/* ==================== AUTH ==================== */
var Auth = {
  currentUser: null,

  init: function() {
    this.currentUser = Store.get('currentUser');
    if (!this.currentUser) {
      try {
        var rawUser = JSON.parse(localStorage.getItem('fst_current_user') || 'null');
        if (rawUser) {
          Store.set('currentUser', rawUser);
          this.currentUser = rawUser;
        }
      } catch (e) {
        this.currentUser = null;
      }
    }
    return this.currentUser;
  },

  login: function(identifier, password) {
    /* Login is handled by the backend against the database. This fallback is
       intentionally disabled so credentials are never stored or verified locally. */
    return { success: false, error: 'Check with the server for valid credentials' };
  },

  recordLogin: function() {
    var u = this.currentUser;
    if (!u) return;
    var users = Store.get('users', []);
    for (var i = 0; i < users.length; i++) {
      if (users[i].id === u.id || users[i].email === u.email || users[i].username === u.username) {
        var last = 0;
        if (users[i].lastLogin) { try { last = new Date(users[i].lastLogin).getTime(); } catch(e) {} }
        users[i].lastLogin = new Date().toISOString();
        Store.set('users', users);
        var now = Date.now();
        if (!last || (now - last) > 60000) {
          var log = Store.get('activityLog', []);
          log.push({
            id: 'act_' + now + '_' + Math.random().toString(36).slice(2, 6),
            type: 'auth.login',
            action: 'Logged in',
            entityType: 'system',
entityName: u.username || u.email || '',
            entityId: u.id || '',
            detail: 'Role: ' + (u.role || ''),
            userName: u.name || u.username || (u.email ? u.email.split('@')[0] : ''),
            userRole: u.role || '',
            timestamp: new Date().toISOString()
          });
          if (log.length > 500) log = log.slice(-500);
          Store.set('activityLog', log);
        }
        return;
      }
    }
  },

  logout: function() {
    var u = this.currentUser;
    if (u) {
      var users = Store.get('users', []);
      for (var i = 0; i < users.length; i++) {
if (users[i].id === u.id || users[i].email === u.email || users[i].username === u.username) {
          users[i].lastLogout = new Date().toISOString();
          Store.set('users', users);
          break;
        }
      }
      var log = Store.get('activityLog', []);
      var now = Date.now();
      log.push({
        id: 'act_' + now + '_' + Math.random().toString(36).slice(2, 6),
        type: 'auth.logout',
        action: 'Logged out',
        entityType: 'system',
        entityName: u.username || u.email || '',
        entityId: u.id || '',
        detail: 'Role: ' + (u.role || ''),
        userName: u.name || u.username || (u.email ? u.email.split('@')[0] : ''),
        userRole: u.role || '',
        timestamp: new Date().toISOString()
      });
      if (log.length > 500) log = log.slice(-500);
      Store.set('activityLog', log);
    }
    this.currentUser = null;
    Store.remove('currentUser');
    Store.remove('token');
    localStorage.removeItem('fst_current_user');
    localStorage.removeItem('fst_token');
  },

  isLoggedIn: function() { return this.currentUser !== null; },
  isAdmin: function() { return this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.role === 'superadmin' || this.currentUser.role === 'moderator'); },
  isModerator: function() { return this.currentUser && this.currentUser.role === 'moderator'; },
  isSuperAdmin: function() { return this.currentUser && this.currentUser.role === 'superadmin'; },
  isSister: function() { return false; },
  getSisterId: function() { return null; },

  redirect: function() {
    if (!this.isLoggedIn()) { window.location.href = 'index.html'; return; }
    if (this.isSuperAdmin()) { window.location.href = 'superadmin.html'; return; }
    if (this.isAdmin()) { window.location.href = 'dashboard.html'; return; }
    window.location.href = 'index.html';
  },

  guard: function() {
    this.init();
    if (!this.isLoggedIn() || !this.isAdmin()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },

  guardAdmin: function() {
    if (!this.guard()) return false;
    if (!this.isAdmin()) {
      this.redirect();
      return false;
    }
    return true;
  },

  guardSuperAdmin: function() {
    if (!this.guard()) return false;
    if (!this.isSuperAdmin()) {
      this.redirect();
      return false;
    }
    return true;
  }
};

/* ==================== DATA API ==================== */
var Data = {
  getSisters: function() { return Store.get('sisters', []); },

  getSisterById: function(id) {
    var sisters = Store.get('sisters', []);
    for (var i = 0; i < sisters.length; i++) {
      if (sisters[i].id === id) return sisters[i];
    }
    return null;
  },

  generateSisterId: function() {
    var sisters = Store.get('sisters', []);
    var year = new Date().getFullYear();
    var maxNum = 0;
    for (var i = 0; i < sisters.length; i++) {
      var match = sisters[i].id && sisters[i].id.match(/^FST-\d{4}-(\d+)$/);
      if (match) {
        var num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    return 'FST-' + year + '-' + String(maxNum + 1).padStart(3, '0');
  },

  addSister: function(data) {
    var sisters = Store.get('sisters', []);
    data.id = data.id || Data.generateSisterId();
    data.createdAt = new Date().toISOString();
    sisters.push(data);
    Store.set('sisters', sisters);
    apiPush('POST', '/api/sisters', { record: data });
    return data;
  },

  updateSister: function(id, data) {
    var sisters = Store.get('sisters', []);
    for (var i = 0; i < sisters.length; i++) {
      if (sisters[i].id === id) {
        for (var k in data) { if (data.hasOwnProperty(k)) sisters[i][k] = data[k]; }
        sisters[i].updatedAt = new Date().toISOString();
        Store.set('sisters', sisters);
        apiPush('PUT', '/api/sisters/' + encodeURIComponent(id), data);
        return sisters[i];
      }
    }
    return null;
  },

  deleteSister: function(id) {
    var sisters = Store.get('sisters', []).filter(function(s) { return s.id !== id; });
    Store.set('sisters', sisters);
    var docs = Store.get('documents', []).filter(function(d) { return d.sisterId !== id; });
    Store.set('documents', docs);
    apiPush('DELETE', '/api/sisters/' + encodeURIComponent(id));
    if (Data.afterDocChange) Data.afterDocChange();
  },

  getDocuments: function(sisterId, category) {
    var docs = Store.get('documents', []);
    if (sisterId) docs = docs.filter(function(d) { return d.sisterId === sisterId; });
    if (category) docs = docs.filter(function(d) { return d.category === category; });
    return docs;
  },

  addDocument: function(data) {
    var docs = Store.get('documents', []);
    data.id = data.id || 'doc_' + new Date().getTime();
    data.uploadedAt = data.uploadedAt || new Date().toISOString();
    docs.push(data);
    Store.set('documents', docs);
    apiPush('POST', '/api/documents', data);
    if (Data.afterDocChange) Data.afterDocChange();
    return data;
  },

  updateDocument: function(id, data) {
    var docs = Store.get('documents', []);
    for (var i = 0; i < docs.length; i++) {
      if (docs[i].id === id) {
        for (var k in data) { if (data.hasOwnProperty(k)) docs[i][k] = data[k]; }
        docs[i].updatedAt = new Date().toISOString();
        Store.set('documents', docs);
        apiPush('PUT', '/api/documents/' + encodeURIComponent(id), data);
        if (Data.afterDocChange) Data.afterDocChange();
        return docs[i];
      }
    }
    return null;
  },

  deleteDocument: function(id) {
    var docs = Store.get('documents', []);
    Store.set('documents', docs.filter(function(d){ return d.id !== id; }));
    apiPush('DELETE', '/api/documents/' + encodeURIComponent(id));
    if (Data.afterDocChange) Data.afterDocChange();
  },

  getCustomReminders: function() {
    return Store.get('customReminders', []).slice().sort(function(a,b){
      return new Date(a.date) - new Date(b.date);
    });
  },

  saveCustomReminder: function(reminder) {
    var list = Store.get('customReminders', []);
    if (reminder.id) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === reminder.id) { list[i] = reminder; Store.set('customReminders', list); return reminder; }
      }
    }
    reminder.id = reminder.id || 'rm_' + new Date().getTime();
    reminder.createdAt = reminder.createdAt || new Date().toISOString();
    list.push(reminder);
    Store.set('customReminders', list);
    return reminder;
  },

  deleteCustomReminder: function(id) {
    var list = Store.get('customReminders', []);
    Store.set('customReminders', list.filter(function(r){ return r.id !== id; }));
  },

  getRecentDocuments: function(count) {
    var docs = Store.get('documents', []);
    docs.sort(function(a,b){return (b.uploadedAt||'').localeCompare(a.uploadedAt||'');});
    return docs.slice(0, count||3);
  },

  getUsers: function() {
    return Store.get('users', []).map(function(u) {
      var r = {};
      for (var k in u) { if (k !== 'password') r[k] = u[k]; }
      return r;
    });
  },

  getStats: function() {
    var sisters = Store.get('sisters', []);
    var docs = Store.get('documents', []);
    var users = Store.get('users', []);
    return {
      totalSisters: sisters.length,
      activeSisters: sisters.filter(function(s){return s.status==='active';}).length,
      retiredSisters: sisters.filter(function(s){return s.status==='retired';}).length,
      inactiveSisters: sisters.filter(function(s){return s.status!=='active'&&s.status!=='retired';}).length,
      totalDocuments: docs.length,
      totalUsers: users.length
    };
  }
};
