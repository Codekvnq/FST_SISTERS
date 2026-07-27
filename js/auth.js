/* ==================== SAMPLE DATA ==================== */
(function() {
  if (Store.get('initialized')) return;

  Store.set('users', [
    { id:'user_1', email:'superadmin@fst.org', password:'admin123', role:'superadmin', sisterId:null },
    { id:'user_2', email:'admin@fst.org', password:'admin456', role:'admin', sisterId:null },
    { id:'user_3', email:'moderator@fst.org', password:'mod123', role:'moderator', sisterId:null }
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

  Store.set('initialized', true);
})();

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

  login: function(email, password) {
    var users = Store.get('users', []);
    for (var i = 0; i < users.length; i++) {
      if (users[i].email === email && users[i].password === password) {
        var u = {};
        for (var k in users[i]) { if (k !== 'password') u[k] = users[i][k]; }
        this.currentUser = u;
        Store.set('currentUser', u);
        return { success: true, user: u };
      }
    }
    return { success: false, error: 'Invalid email or password' };
  },

  logout: function() {
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

  addSister: function(data) {
    var sisters = Store.get('sisters', []);
    data.id = data.id || 'FST-' + new Date().getFullYear() + '-' + String(sisters.length + 1).padStart(3,'0');
    data.createdAt = new Date().toISOString();
    sisters.push(data);
    Store.set('sisters', sisters);
    return data;
  },

  updateSister: function(id, data) {
    var sisters = Store.get('sisters', []);
    for (var i = 0; i < sisters.length; i++) {
      if (sisters[i].id === id) {
        for (var k in data) { if (data.hasOwnProperty(k)) sisters[i][k] = data[k]; }
        sisters[i].updatedAt = new Date().toISOString();
        Store.set('sisters', sisters);
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
  },

  getDocuments: function(sisterId, category) {
    var docs = Store.get('documents', []);
    if (sisterId) docs = docs.filter(function(d) { return d.sisterId === sisterId; });
    if (category) docs = docs.filter(function(d) { return d.category === category; });
    return docs;
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
