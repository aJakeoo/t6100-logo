// Paste this into script.google.com (Extensions > Apps Script, from a Google Sheet)
// Sheet needs one tab named "Submissions" with header row:
// timestamp | ratings_json | category_ranking_json | comments | shape
//
// (If you already have a live sheet from before the "shape" question was
// added, just add a "shape" header in column E - existing rows are fine
// as-is, they'll just read as no shape answer.)

function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Submissions");

  if (body.type === "purge") {
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  sheet.appendRow([
    body.timestamp || new Date().toISOString(),
    JSON.stringify(body.ratings || {}),
    JSON.stringify(body.categoryRanking || {}),
    body.comments || "",
    body.shape || ""
  ]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var action = e.parameter.action;
  if (action === "results") {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Submissions");
    var rows = sheet.getDataRange().getValues();
    var submissions = [];
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      if (!row[0]) continue;
      var ratings = {};
      try { ratings = JSON.parse(row[1]); } catch (err) { ratings = {}; }
      var categoryRanking = {};
      try { categoryRanking = JSON.parse(row[2]); } catch (err) { categoryRanking = {}; }
      submissions.push({
        timestamp: row[0],
        ratings: ratings,
        categoryRanking: categoryRanking,
        comments: row[3],
        shape: row[4] || ""
      });
    }
    return ContentService.createTextOutput(JSON.stringify({ submissions: submissions }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
