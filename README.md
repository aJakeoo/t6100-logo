# T6100 Logo Rebrand - Feedback Site

Static site (works on GitHub Pages) for rating logo/rebrand directions
across three sections: Craft Label, Heraldic Crest, Embroidery.

- Sliders run 1–5, default 1.
- Only **5 total** ratings of "5" can be used across the whole form (a budget bar
  at the top tracks this).
- A separate 1–3 ranking (favorite to least favorite) for the three style
  directions themselves, shown to the left of each section's images -
  always a valid 1/2/3 permutation (sliders swap instead of colliding).
- A square / circle / pentagon logo shape question.
- Comments field at the bottom.
- A password-gated "Results" tab (password: `jake`) shows average ratings
  per design, average direction ranking, all comments, a hover-to-preview
  on each thumbnail, and a **Purge all results** button to wipe the sheet
  and start fresh.

This is a static site, so it needs a tiny free backend to actually store and
read back submissions across everyone who fills it out. That's done with a
Google Apps Script "Web App" backed by a Google Sheet - no server, no cost.

The Apps Script URL lives in [`config.js`](config.js), committed as-is. It
only runs the specific functions in [`apps-script.gs`](apps-script.gs) -
append/read/clear rows in one Sheet - it can't touch anything else in your
Google account. Worst case if someone finds the URL: spam submissions, or
reading/purging that one feedback sheet. If that sheet ever holds anything
sensitive, swap to a fresh deployment (Apps Script → Deploy → Manage
deployments) rather than reusing this one.

## One-time setup (~3 minutes)

1. Create a new Google Sheet (sheets.new).
2. Rename the first tab to `Submissions` (must match exactly).
3. Add a header row: `timestamp | ratings_json | category_ranking_json | comments | shape`
4. Extensions → Apps Script. Delete the placeholder code and paste in the
   contents of [`apps-script.gs`](apps-script.gs) from this repo.
5. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Click Deploy, authorize it (it'll warn "unverified app" - that's expected
   for your own script, click Advanced → Go to project (unsafe) → Allow).
7. Copy the **Web app URL** it gives you (ends in `/exec`).
8. Open [`config.js`](config.js) in this repo and replace `APPS_SCRIPT_URL`
   with that URL.
9. Commit and push. GitHub Pages will pick it up automatically (Settings →
   Pages → Source → Deploy from a branch → `main` / root).

If you ever edit `apps-script.gs`'s logic, you need to **Deploy → Manage
deployments → Edit → New version** for changes to go live (saving alone
doesn't republish the web app).

## Changing the results password

Edit `RESULTS_PASSWORD` in `config.js`. This is a light deterrent only -
it's checked client-side, so treat it as "keep casual visitors out," not
real security. The Sheet itself (only you can access it) is the real
source of truth.

## Purging results

Results tab → **Purge all results** (after unlocking with the password).
Asks for confirmation twice, then clears every row in the `Submissions`
sheet except the header. This is permanent - there's no undo beyond Google
Sheets' own version history (File → Version history in the Sheet itself,
if you need to recover something).

## Local preview

Just open `index.html` in a browser, or serve the folder with any static
file server. Submissions/results won't work until `config.js` has a real
Apps Script URL - the page will tell you that.

## Adding/removing images

Images live in `assets/images/<craft-label|heraldic|embroidery>/` and are
listed in `manifest.json`. Add a file to the folder and a matching entry
`{ "id", "file", "label" }` to the right section in `manifest.json`.
