# T6100 Logo Rebrand — Feedback Site

Static site (works on GitHub Pages) for rating logo/rebrand directions
across three sections: Craft Label, Heraldic Crest, Embroidery.

- Sliders run 1–5, default 1.
- Only **5 total** ratings of "5" can be used across the whole form (a budget bar
  at the top tracks this).
- A separate 1–3 ranking (favorite to least favorite) for the three style
  directions themselves, always a valid 1/2/3 permutation (sliders swap
  instead of colliding).
- Comments field at the bottom.
- A password-gated "Results" tab (password: `jake`) shows average ratings per
  design and all submitted comments.

This is a static site, so it needs a tiny free backend to actually store and
read back submissions across everyone who fills it out. That's done with a
Google Apps Script "Web App" backed by a Google Sheet — no server, no cost.

## One-time setup (you do this, ~3 minutes)

1. Create a new Google Sheet (sheets.new).
2. Rename the first tab to `Submissions` (must match exactly).
3. Add a header row: `timestamp | ratings_json | category_ranking_json | comments`
4. Extensions → Apps Script. Delete the placeholder code and paste in the
   contents of [`apps-script.gs`](apps-script.gs) from this repo.
5. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Click Deploy, authorize it (it'll warn "unverified app" — that's expected
   for your own script, click Advanced → Go to project (unsafe) → Allow).
7. Copy the **Web app URL** it gives you (ends in `/exec`).
8. Open [`config.js`](config.js) in this repo and replace
   `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE` with that URL.
9. Commit and push. GitHub Pages will pick it up automatically.

If you ever edit `apps-script.gs`'s logic, you need to **Deploy → Manage
deployments → Edit → New version** for changes to go live (saving alone
doesn't republish the web app).

## Changing the results password

Edit `RESULTS_PASSWORD` in `config.js`. This is a light deterrent only —
it's checked client-side, so treat it as "keep casual visitors out," not
real security. The Sheet itself (only you can access it) is the real
source of truth.

## Local preview

Just open `index.html` in a browser, or serve the folder with any static
file server. Submissions/results won't work until `config.js` has a real
Apps Script URL — the page will tell you that.

## Adding/removing images

Images live in `assets/images/<craft-label|heraldic|embroidery>/` and are
listed in `manifest.json`. Add a file to the folder and a matching entry
`{ "id", "file", "label" }` to the right section in `manifest.json`.
