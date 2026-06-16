/**
 * ZuZu Beach Tournament — score write-back endpoint (Google Apps Script).
 * ────────────────────────────────────────────────────────────────────────
 * This is the ONLY component that writes into the Google Sheets. The public
 * site stays read-only; the admin page sends score edits to a Netlify
 * Function, which forwards them here with a shared secret.
 *
 * It writes the per-set score cells of the "Resultate" sheet
 * (L,N = set 1 · O,Q = set 2 · R,T = set 3) and, when provided, the Court
 * column (C). The Result columns (H/J), the "Tableau" tab and the "Rangliste"
 * tab are all FORMULAS that recompute from those cells automatically — we never
 * touch them. Each field is only written when present in the request, so a
 * score edit never clears the court and a court edit never clears scores.
 *
 * SETUP (see apps-script/SETUP.md for the full walkthrough):
 *   1. Open either Google Sheet → Extensions → Apps Script.
 *   2. Paste this file as Code.gs.
 *   3. Set SECRET below to a long random string.
 *   4. Deploy ▸ New deployment ▸ Web app
 *        - Execute as: Me (the sheet owner)
 *        - Who has access: Anyone
 *   5. Copy the /exec URL → Netlify env var  APPSCRIPT_URL
 *      Put the same SECRET → Netlify env var  APPSCRIPT_SECRET
 */

// ⚠️  Replace this with a long random string and store the SAME value in the
//     Netlify env var APPSCRIPT_SECRET. Requests without it are rejected.
var SECRET = 'CHANGE_ME_to_a_long_random_string';

// The two tournament spreadsheets (same IDs as DATA_SOURCES in script.js).
var SPREADSHEETS = {
  men:   '1iTfEsqh3IfRWuk-ajwDwyPvAP7wJvIUVLUpvcH-qawM',
  women: '1yrTfHietiohzpGIVlMJIjzZoNoNeme1sZTdXG50JX4c'
};

var RESULTATE_SHEET = 'Resultate';
var MATCH_NUMBER_COL = 1; // column A holds the match number
var COURT_COL = 3;        // column C holds the court

// 1-indexed columns of the two per-set score cells in the "Resultate" sheet.
// Set 1 → L (12) / N (14) · Set 2 → O (15) / Q (17) · Set 3 → R (18) / T (20).
var SET_COLS = [
  { a: 12, b: 14 },
  { a: 15, b: 17 },
  { a: 18, b: 20 }
];

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (body.secret !== SECRET) {
      return out({ ok: false, error: 'forbidden' });
    }
    var id = SPREADSHEETS[body.tournament];
    if (!id) {
      return out({ ok: false, error: 'bad_tournament' });
    }
    var matchNumber = Number(body.matchNumber);
    if (!matchNumber || matchNumber < 1) {
      return out({ ok: false, error: 'bad_match' });
    }
    var sheet = SpreadsheetApp.openById(id).getSheetByName(RESULTATE_SHEET);
    if (!sheet) {
      return out({ ok: false, error: 'no_resultate_sheet' });
    }

    // Find the row whose match-number column equals matchNumber.
    var lastRow = sheet.getLastRow();
    var numbers = sheet.getRange(1, MATCH_NUMBER_COL, lastRow, 1).getValues();
    var targetRow = -1;
    for (var r = 0; r < numbers.length; r++) {
      if (Number(numbers[r][0]) === matchNumber) { targetRow = r + 1; break; }
    }
    if (targetRow === -1) {
      return out({ ok: false, error: 'match_not_found' });
    }

    // Write set scores only when provided. A given [a,b] sets both cells; a
    // missing/blank set clears both cells so stale scores don't linger.
    if (Array.isArray(body.sets)) {
      for (var i = 0; i < SET_COLS.length; i++) {
        var s = body.sets[i];
        var aVal = (s && s.length === 2 && s[0] !== '' && s[0] !== null) ? Number(s[0]) : '';
        var bVal = (s && s.length === 2 && s[1] !== '' && s[1] !== null) ? Number(s[1]) : '';
        sheet.getRange(targetRow, SET_COLS[i].a).setValue(aVal);
        sheet.getRange(targetRow, SET_COLS[i].b).setValue(bVal);
      }
    }

    // Write the court only when the field is present (empty string clears it).
    if (Object.prototype.hasOwnProperty.call(body, 'court')) {
      var courtVal = (body.court === '' || body.court === null) ? '' : Number(body.court);
      sheet.getRange(targetRow, COURT_COL).setValue(courtVal);
    }

    SpreadsheetApp.flush();

    return out({ ok: true, matchNumber: matchNumber, row: targetRow });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

// Apps Script web apps can't set arbitrary HTTP status codes, so callers must
// check the {ok} flag in the JSON body rather than the HTTP status.
function out(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
