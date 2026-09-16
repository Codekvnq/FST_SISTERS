var Utils = {
  formatDate: function(d) {
    if (!d) return 'Not set';
    return new Date(d).toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'});
  },
  formatDateShort: function(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-US', {year:'numeric',month:'short',day:'numeric'});
  },
  formatDateRelative: function(d) {
    if (!d) return '';
    var now = new Date();
    var dt = new Date(d);
    var diff = Math.floor((now - dt) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff/60) + 'm ago';
    if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
    if (diff < 2592000) return Math.floor(diff/86400) + 'd ago';
    return Utils.formatDateShort(d);
  },
  sisterName: function(s) {
    if (!s) return '';
    var parts = [s.firstName || ''];
    if (s.middleName && s.middleName.trim()) parts.push(s.middleName.trim());
    if (s.lastName) parts.push(s.lastName);
    return parts.join(' ');
  },
  getInitials: function(fn, ln, mn) {
    var i = ((fn||'')[0]||'')+((ln||'')[0]||'');
    if (mn && mn.trim()) i = ((fn||'')[0]||'') + ((mn||'')[0]||'') + ((ln||'')[0]||'');
    return i;
  },
  capitalize: function(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase()+s.slice(1);
  },
  getStatusBadge: function(s) {
    var map = {active:'badge-active',retired:'badge-retired',inactive:'badge-inactive',deceased:'badge-inactive'};
    return map[s]||'badge-inactive';
  },
  getDocCategory: function(c) {
    var map = {certificate:'Certificate',letter:'Letter',education:'Education',application:'Application',evaluation:'Evaluation',report:'Report',other:'Other'};
    return map[c]||c;
  },
  getDocSubcategory: function(s) {
    var map = {
      birth:'Birth Certificate',
      baptismal:'Baptismal Certificate',
      medical_baptismal_acceptance:'Medical Report, Baptism Card & Acceptance to Postulancy',
      workshop:'Workshop Certificate',
      asec:'ASEC Certificate',
      icf:'ICF Certificate',
      appointment:'Appointment Letter',
      renewal:'Renewal Letter',
      acceptance:'Acceptance Letter',
      app_fst:'Application & Recommendation to join FST',
      app_first_prof:'Application to First Profession',
      app_renew_vows:'Application to Renew Religious Vows',
      renewal_vows:'Renewal of Vows',
      formula_vows:'Formula of Vows & Appointment',
      eval_novice:'Community Evaluation on a Novice',
      eval_peer:'Novices Peer Evaluations',
      eval_personal:'Personal Evaluation',
      eval_self:'Self Evaluations',
      report_exposure:'Exposure Report',
      report_results:'Results Slip & Inventory',
      report_sacred:'Sacred Story & Inventory',
      autobiography:'Autobiography & Expectation',
      other:'Other'
    };
    return map[s]||s;
  },
  getFileIconClass: function(ext) {
    var map = {
      pdf:'doc-file-pdf',
      doc:'doc-file-doc',
      docx:'doc-file-doc',
      xls:'doc-file-xls',
      xlsx:'doc-file-xls',
      csv:'doc-file-xls',
      jpg:'doc-file-img',
      jpeg:'doc-file-img',
      png:'doc-file-img',
      gif:'doc-file-img',
      svg:'doc-file-img',
      webp:'doc-file-img',
      txt:'doc-file-txt',
      zip:'doc-file-zip',
      rar:'doc-file-zip',
      '7z':'doc-file-zip'
    };
    return map[ext]||'doc-file-other';
  },
  getFileIconLabel: function(ext) {
    var map = {
      pdf:'PDF',
      doc:'DOC',
      docx:'DOC',
      xls:'XLS',
      xlsx:'XLS',
      csv:'CSV',
      jpg:'IMG',
      jpeg:'IMG',
      png:'IMG',
      gif:'IMG',
      svg:'IMG',
      webp:'IMG',
      txt:'TXT',
      zip:'ZIP',
      rar:'ZIP',
      '7z':'ZIP'
    };
    return map[ext]||'FIL';
  },
  isImageExt: function(ext) {
    return ['jpg','jpeg','png','gif','svg','webp'].indexOf(ext) !== -1;
  },
  getDocCategoryBadge: function(cat) {
    var map = {
      certificate:'badge-active',
      letter:'badge-warning',
      application:'badge-inactive',
      evaluation:'badge-inactive',
      report:'badge-inactive',
      education:'badge-active',
      other:'badge-inactive'
    };
    return map[cat]||'badge-inactive';
  },
  getFileIconHtml: function(ext, fileName) {
    var cls = Utils.getFileIconClass(ext);
    var label = Utils.getFileIconLabel(ext);
    return '<span class="doc-file-icon ' + cls + '">' + label + '</span>';
  },
  formatFileSize: function(bytes) {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/1048576).toFixed(1) + ' MB';
  },
  qs: function(id) {
    return document.getElementById(id);
  },
  showEl: function(id) {
    var el = this.qs(id);
    if (el) el.style.display = 'block';
  },
  hideEl: function(id) {
    var el = this.qs(id);
    if (el) el.style.display = 'none';
  },
  getUrlParam: function(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  },
  requiredDocTypes: function() {
    return [
      { cat:'certificate', sub:'birth', label:'Birth Certificate' },
      { cat:'certificate', sub:'baptismal', label:'Baptismal Certificate' },
      { cat:'letter', sub:'acceptance', label:'Acceptance Letter' },
      { cat:'certificate', sub:'workshop', label:'Workshop Certificate' },
      { cat:'education', sub:'other', label:'Education Document' },
      { cat:'certificate', sub:'medical_baptismal_acceptance', label:'Medical Report & Baptism Card' }
    ];
  },
  getSisterDocProgress: function(sisterId, allDocs) {
    var required = Utils.requiredDocTypes();
    var sisterDocs = allDocs.filter(function(d){ return d.sisterId === sisterId; });
    var completed = 0;
    for (var i=0; i<required.length; i++) {
      var r = required[i];
      var found = sisterDocs.some(function(d){ return d.category === r.cat && d.subcategory === r.sub; });
      if (found) completed++;
    }
    return { completed: completed, total: required.length, pct: Math.round((completed/required.length)*100) };
  }
};
