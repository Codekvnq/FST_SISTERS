/*
  ============================================================================
  FST SISTERS -> GOOGLE DRIVE SYNC SCRIPT
  ============================================================================
  SETUP (one time, ~3 minutes):

  1. Go to https://script.google.com and click "New project".
  2. Delete any default code and paste THIS ENTIRE FILE into the editor.
  3. Click the floppy-disk "Save" icon. Project name: "FST Drive Sync".
  4. Click the blue "Deploy" button -> "New deployment".
  5. In the dialog: type = "Web app".
  6. "Execute as"  = "Me" (this chooses WHICH Google account's Drive is used).
  7. "Who has access" = "Anyone".
  8. Click "Deploy". Authorize the script with your Google account (its Drive access).
  9. Copy the "Web app URL" (ends with /exec).
 10. Paste that URL into the dashboard:  Admin Panel -> External Storage
     Connector -> Google Drive field, then "Save & Connect".

  What it does (automatically):
   - Creates a top-level folder in your Drive called "FST Sisters Documents".
   - Inside it, one subfolder per Sister: "FST-2024-001 - Maria Garcia".
   - In each subfolder, one file per document record named
     "<docId> - <original name>.json" containing the document metadata
     (category, size, upload date, ...). This is a browsable, searchable
     mirror/backup of the document inventory.
   - Files for documents deleted in the system are moved to Drive trash.
   - New documents added later are synced automatically by the app.
  ============================================================================
*/

var TOP_FOLDER_NAME = 'FST Sisters Documents';

function doGet(e) {
  return handle_();
}

function doPost(e) {
  return handle_(e);
}

function handle_(e) {
  var out = { success: false };
  try {
    var raw = '';
    if (e && e.postData && e.postData.contents) {
      raw = e.postData.contents;
    } else if (e && e.parameter && e.parameter.payload) {
      raw = e.parameter.payload;
    }
    var data = {};
    try { data = JSON.parse(raw); } catch (err) {}

    var action = data.action || 'sync';
    if (action === 'ping') {
      var pingFolder = ensureFolder();
      out = { success: true, folderId: pingFolder.getId(), folderUrl: pingFolder.getUrl(), folderName: TOP_FOLDER_NAME };
    } else {
      var folder = ensureFolder();
      var docs = Array.isArray(data.docs) ? data.docs : [];
      var sisters = Array.isArray(data.sisters) ? data.sisters : [];

      var sisMap = {};
      for (var i = 0; i < sisters.length; i++) {
        var s = sisters[i];
        if (s && s.id) sisMap[s.id] = ((s.firstName || '') + ' ' + (s.lastName || '')).trim();
      }

      var want = {};
      var created = 0, skipped = 0, removed = 0;

      for (var d = 0; d < docs.length; d++) {
        var doc = docs[d];
        if (!doc || !doc.id) continue;
        var sisId = doc.sisterId || 'Unknown';
        var sisLabel = sisMap[sisId] && sisMap[sisId].length ? sisMap[sisId] : 'Unknown';
        var sisFolder = ensureNestedFolder(folder, cleanName(sisId + ' - ' + sisLabel));
        var base = cleanName(doc.originalName || doc.fileName || 'document');
        if (base.toLowerCase().indexOf('.json') !== base.length - 5) base += '.json';
        var fileName = cleanName(doc.id) + ' - ' + base;
        var key = sisFolder.getId() + '/' + fileName;
        want[key] = true;

        var existing = getFileByName(sisFolder, fileName);
        if (existing) {
          skipped++;
        } else {
          var blob = Utilities.newBlob(JSON.stringify(doc, null, 2), 'application/json', fileName);
          sisFolder.createFile(blob);
          created++;
        }
      }

      // Remove (trash) files that no longer exist in the system -> true mirror
      var subFolders = folder.getFolders();
      while (subFolders.hasNext()) {
        var sf = subFolders.next();
        var files = sf.getFiles();
        while (files.hasNext()) {
          var fl = files.next();
          var k = sf.getId() + '/' + fl.getName();
          if (!want[k]) {
            try { fl.setTrashed(true); removed++; } catch (err) {}
          }
        }
      }

      out = {
        success: true,
        folderId: folder.getId(),
        folderUrl: folder.getUrl(),
        folderName: TOP_FOLDER_NAME,
        docs: docs.length,
        created: created,
        skipped: skipped,
        removed: removed
      };
    }
  } catch (err) {
    out = { success: false, error: String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function ensureFolder() {
  var it = DriveApp.getFoldersByName(TOP_FOLDER_NAME);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(TOP_FOLDER_NAME);
}

function ensureNestedFolder(parent, name) {
  var it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return parent.createFolder(name);
}

function getFileByName(folder, name) {
  var it = folder.getFilesByName(name);
  return it.hasNext() ? it.next() : null;
}

function cleanName(name) {
  return String(name || 'n/a')
    .replace(/[\\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}