// Paste this into script.google.com (Extensions > Apps Script, from a Google Sheet)
// Sheet needs one tab named "Submissions" with header row:
// timestamp | ratings_json | category_ranking_json | comments

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Submissions");
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    JSON.stringify(data.ratings || {}),
    JSON.stringify(data.categoryRanking || {}),
    data.comments || ""
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
        comments: row[3]
      });
    }
    return ContentService.createTextOutput(JSON.stringify({ submissions: submissions }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
