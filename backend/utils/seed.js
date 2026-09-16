var User = require('../models/User');
var Sister = require('../models/Sister');
var Document = require('../models/Document');
var { encrypt } = require('./crypto');

var seedData = async function() {
  await User.ensureSchema();
  var userCount = await User.countDocuments();
  var hasData = userCount > 0;

  var users = [
    { id: 'user_001', username: 'superadmin', email: 'superadmin@fst.org', password: encrypt('admin123'), role: 'superadmin', sisterId: null },
    { id: 'user_002', username: 'admin', email: 'admin@fst.org', password: encrypt('admin456'), role: 'admin', sisterId: null },
    { id: 'user_003', username: 'moderator', email: 'moderator@fst.org', password: encrypt('mod123'), role: 'moderator', sisterId: null }
  ];

  if (!hasData) {
    console.log('Seeding database with sample data...');
    await User.insertMany(users);
  } else {
    console.log('Database already has data, ensuring demo accounts exist and are current');
    for (var i = 0; i < users.length; i++) {
      var demo = users[i];
      var existingByEmail = await User.findOne({ email: demo.email });
      if (existingByEmail) {
        await User.findOneAndUpdate({ email: demo.email }, { $set: { username: demo.username, password: demo.password, role: demo.role, sisterId: demo.sisterId } });
      } else {
        var existingById = await User.findOne({ id: demo.id });
        if (existingById) {
          await User.findOneAndUpdate({ id: demo.id }, { $set: { username: demo.username, email: demo.email, password: demo.password, role: demo.role, sisterId: demo.sisterId } });
        } else {
          await User.create(demo);
        }
      }
    }
  }

  var sisters = [
    { id:'FST-2024-001', firstName:'Maria', lastName:'Garcia', middleName:'Cruz', dateOfBirth:'1985-03-15', placeOfBirth:'Manila, Philippines', dates:{ acceptance:'2010-06-01', investiture:'2011-01-15', firstProfession:'2012-03-20', finalProfession:'2015-11-10', silverJubilee:null, renewals:[{year:2013,date:'2013-03-20'},{year:2014,date:'2014-03-20'}] }, education:[{institution:'University of Santo Tomas',qualification:'Bachelor of Arts in Education',yearStart:2003,yearEnd:2007},{institution:'De La Salle University',qualification:'Master of Arts in Teaching',yearStart:2008,yearEnd:2010}], contact:{email:'maria.garcia@fst.org',phone:'+63 917 123 4567',address:'123 Sisters Convent, Quezon City',emergencyContact:'Juan Garcia - +63 917 987 6543'}, status:'active' },
    { id:'FST-2024-002', firstName:'Teresa', lastName:'Santos', middleName:'Reyes', dateOfBirth:'1980-08-22', placeOfBirth:'Cebu City, Philippines', dates:{ acceptance:'2005-09-01', investiture:'2006-03-15', firstProfession:'2007-06-20', finalProfession:'2010-12-08', silverJubilee:'2031-06-20', renewals:[] }, education:[{institution:'University of San Carlos',qualification:'Bachelor of Science in Nursing',yearStart:1998,yearEnd:2003}], contact:{email:'teresa.santos@fst.org',phone:'+63 932 123 4567',address:'456 Sacred Heart, Cebu City',emergencyContact:'Pedro Santos - +63 932 987 6543'}, status:'active' },
    { id:'FST-2024-003', firstName:'Rosa', lastName:'Dela Cruz', middleName:'Mendoza', dateOfBirth:'1975-12-08', placeOfBirth:'Davao City, Philippines', dates:{ acceptance:'2000-01-15', investiture:'2000-08-01', firstProfession:'2001-12-08', finalProfession:'2004-12-08', silverJubilee:'2026-12-08', renewals:[{year:2002,date:'2002-12-08'},{year:2003,date:'2003-12-08'}] }, education:[{institution:'Ateneo de Davao',qualification:'Bachelor of Science in Social Work',yearStart:1993,yearEnd:1998}], contact:{email:'rosa.delacruz@fst.org',phone:'+63 922 123 4567',address:'789 Holy Cross, Davao City',emergencyContact:'Ana Dela Cruz - +63 922 987 6543'}, status:'active' },
    { id:'FST-2024-004', firstName:'Luz', lastName:'Fernandez', middleName:'Torres', dateOfBirth:'1970-05-20', placeOfBirth:'Iloilo City, Philippines', dates:{ acceptance:'1995-06-01', investiture:'1996-01-15', firstProfession:'1997-05-20', finalProfession:'2000-05-20', silverJubilee:'2022-05-20', renewals:[] }, education:[{institution:'University of Iloilo',qualification:'Bachelor of Secondary Education',yearStart:1988,yearEnd:1993}], contact:{email:'luz.fernandez@fst.org',phone:'+63 33 123 4567',address:'321 Grace Lane, Iloilo City',emergencyContact:'Jose Fernandez - +63 33 987 6543'}, status:'retired' },
    { id:'FST-2024-005', firstName:'Carmen', lastName:'Lopez', middleName:'Rivera', dateOfBirth:'1990-09-12', placeOfBirth:'Zamboanga City, Philippines', dates:{ acceptance:'2018-07-01', investiture:'2019-01-20', firstProfession:'2020-09-12', finalProfession:null, silverJubilee:null, renewals:[{year:2021,date:'2020-09-12'},{year:2022,date:'2021-09-12'},{year:2023,date:'2022-09-12'}] }, education:[{institution:'Western Mindanao State University',qualification:'Bachelor of Science in Community Development',yearStart:2008,yearEnd:2013}], contact:{email:'carmen.lopez@fst.org',phone:'+63 62 123 4567',address:'567 Faith Street, Zamboanga City',emergencyContact:'Miguel Lopez - +63 62 987 6543'}, status:'active' },
    { id:'FST-2024-006', firstName:'Elena', lastName:'Gonzales', middleName:'Cruz', dateOfBirth:'1988-02-28', placeOfBirth:'Baguio City, Philippines', dates:{ acceptance:'2015-03-01', investiture:'2015-09-15', firstProfession:'2016-06-20', finalProfession:'2019-06-20', silverJubilee:null, renewals:[] }, education:[{institution:'University of the Cordilleras',qualification:'Bachelor of Science in Social Work',yearStart:2006,yearEnd:2011}], contact:{email:'elena.gonzales@fst.org',phone:'+63 74 123 4567',address:'890 Mountain View, Baguio City',emergencyContact:'Roberto Gonzales - +63 74 987 6543'}, status:'active' }
  ];

  var documents = [
    { id:'doc_001', sisterId:'FST-2024-001', category:'certificate', subcategory:'birth', fileName:'birth_cert_garcia.pdf', originalName:'Birth Certificate - Garcia.pdf', fileSize:245000 },
    { id:'doc_002', sisterId:'FST-2024-001', category:'certificate', subcategory:'baptismal', fileName:'baptismal_garcia.pdf', originalName:'Baptismal Certificate - Garcia.pdf', fileSize:189000 },
    { id:'doc_003', sisterId:'FST-2024-001', category:'letter', subcategory:'acceptance', fileName:'acceptance_letter_2010.pdf', originalName:'Acceptance Letter 2010.pdf', fileSize:156000 },
    { id:'doc_004', sisterId:'FST-2024-002', category:'certificate', subcategory:'birth', fileName:'birth_cert_santos.pdf', originalName:'Birth Certificate - Santos.pdf', fileSize:267000 },
    { id:'doc_005', sisterId:'FST-2024-003', category:'certificate', subcategory:'workshop', fileName:'workshop_cert_2022.pdf', originalName:'Workshop Certificate 2022.pdf', fileSize:312000 },
    { id:'doc_006', sisterId:'FST-2024-001', category:'education', subcategory:'other', fileName:'diploma_garcia.pdf', originalName:'Diploma - University of Santo Tomas.pdf', fileSize:456000 }
  ];

  if (!hasData) {
    await Sister.insertMany(sisters);
    await Document.insertMany(documents);
  }

  console.log('Sample data seeded successfully');
  console.log('  Users: ' + users.length);
  console.log('  Sisters: ' + sisters.length);
  console.log('  Documents: ' + documents.length);
  console.log('');
  console.log('Demo accounts:');
  console.log('  Superadmin: superadmin@fst.org / admin123');
  console.log('  Admin:      admin@fst.org / admin456');
  console.log('  Moderator:  moderator@fst.org / mod123');
};

module.exports = seedData;
