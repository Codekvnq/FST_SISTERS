function normalizeRecord(raw) {
  var record = {
    id: raw.id || raw.sisterId || raw.SisterID || '',
    firstName: raw.firstName || raw.first_name || raw.firstname || '',
    lastName: raw.lastName || raw.last_name || raw.lastname || '',
    middleName: raw.middleName || raw.middle_name || raw.middlename || '',
    dateOfBirth: raw.dateOfBirth || raw.date_of_birth || raw.dob || '',
    placeOfBirth: raw.placeOfBirth || raw.place_of_birth || raw.birthPlace || '',
    dates: {},
    education: [],
    contact: {},
    status: raw.status || 'active',
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString()
  };

  var dates = record.dates;
  dates.acceptance = raw.acceptanceDate || raw.acceptance_date || raw.acceptance || raw.dates && raw.dates.acceptance || '';
  dates.investiture = raw.investitureDate || raw.investiture_date || raw.investiture || raw.dates && raw.dates.investiture || '';
  dates.firstProfession = raw.firstProfessionDate || raw.first_profession_date || raw.firstProfession || raw.dates && raw.dates.firstProfession || '';
  dates.finalProfession = raw.finalProfessionDate || raw.final_profession_date || raw.finalProfession || raw.dates && raw.dates.finalProfession || '';
  dates.silverJubilee = raw.silverJubileeDate || raw.silver_jubilee_date || raw.silverJubilee || raw.dates && raw.dates.silverJubilee || '';
  dates.renewals = raw.renewals || (raw.dates && raw.dates.renewals) || [];

  var contact = record.contact;
  contact.email = raw.email || raw.contact && raw.contact.email || '';
  contact.phone = raw.phone || raw.contact && raw.contact.phone || '';
  contact.address = raw.address || raw.contact && raw.contact.address || '';
  contact.emergencyContact = raw.emergencyContact || raw.emergency_contact || raw.contact && raw.contact.emergencyContact || '';

  if (raw.education) {
    record.education = Array.isArray(raw.education) ? raw.education : [raw.education];
  }

  return record;
}

function parseSisterImportContent(format, content) {
  var normalizedFormat = (format || 'json').toLowerCase();
  var records = [];

  if (normalizedFormat === 'csv') {
    var lines = String(content || '').trim().split(/\r?\n/).filter(function(line) { return line.trim(); });
    if (!lines.length) return { records: [], errors: ['CSV file is empty'] };
    var headers = lines[0].split(',').map(function(item) { return item.trim(); });
    for (var i = 1; i < lines.length; i++) {
      var row = lines[i].split(',');
      var raw = {};
      headers.forEach(function(header, index) {
        raw[header] = row[index] ? row[index].trim() : '';
      });
      records.push(normalizeRecord(raw));
    }
  } else {
    try {
      var parsed = JSON.parse(String(content || ''));
      if (Array.isArray(parsed)) {
        records = parsed.map(normalizeRecord);
      } else if (parsed && Array.isArray(parsed.data)) {
        records = parsed.data.map(normalizeRecord);
      } else if (parsed && parsed.sisters) {
        records = parsed.sisters.map(normalizeRecord);
      } else {
        records = [normalizeRecord(parsed)];
      }
    } catch (err) {
      return { records: [], errors: [err.message] };
    }
  }

  return { records: records, errors: [] };
}

module.exports = { normalizeRecord, parseSisterImportContent };
