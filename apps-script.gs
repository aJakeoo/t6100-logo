// Paste this into script.google.com (Extensions > Apps Script, from a Google Sheet)
// Sheet needs one tab named "Submissions" with header row:
// timestamp | ratings_json | category_ranking_json | comments
//
// One-time setup for the access token (protects reading + purging results):
//   Project Settings (gear icon) > Script Properties > Add script property
//   Name: ACCESS_TOKEN   Value: <a long random string you make up>
// Use that same value as the RESULTS_ACCESS_TOKEN secret in GitHub (see README.md).
// Anyone with only the web app URL can still submit ratings (doPost, intentionally
// open), but reading or purging results requires this token.

function checkToken_(e) {
  var required = PropertiesService.getScriptProperties().getProperty("ACCESS_TOKEN");
  if (!required) return true; // no token configured yet -> leave open (dev convenience)
  return e.parameter.token === required;
}

function doPost(e) {
  var body = JSON.parse(e.postData.contents);

  if (body.type === "purge") {
    if (body.token !== PropertiesService.getScriptProperties().getProperty("ACCESS_TOKEN")) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "forbidden" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Submissions");
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Submissions");
  sheet.appendRow([
    body.timestamp || new Date().toISOString(),
    JSON.stringify(body.ratings || {}),
    JSON.stringify(body.categoryRanking || {}),
    body.comments || ""
  ]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var action = e.parameter.action;
  if (action === "results") {
    if (!checkToken_(e)) {
      return ContentService.createTextOutput(JSON.stringify({ error: "forbidden" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
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
