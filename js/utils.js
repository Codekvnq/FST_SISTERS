var Utils = {
  formatDate: function(d) {
    if (!d) return 'Not set';
    return new Date(d).toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'});
  },
  formatDateShort: function(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-US', {year:'numeric',month:'short',day:'numeric'});
  },
  getInitials: function(fn, ln) {
    return ((fn||'')[0]||'')+((ln||'')[0]||'');
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
    var map = {certificate:'Certificate',letter:'Letter',education:'Education',other:'Other'};
    return map[c]||c;
  },
  getDocSubcategory: function(s) {
    var map = {birth:'Birth Certificate',baptismal:'Baptismal Certificate',workshop:'Workshop Certificate',asec:'ASEC Certificate',icf:'ICF Certificate',appointment:'Appointment Letter',renewal:'Renewal Letter',acceptance:'Acceptance Letter',other:'Other'};
    return map[s]||s;
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
  }
};
