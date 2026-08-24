# T6100 Logo Rebrand — Feedback Site

Static site (works on GitHub Pages) for rating logo/rebrand directions
across three sections: Craft Label, Heraldic Crest, Embroidery.

- Sliders run 1–5, default 1.
- Only **5 total** ratings of "5" can be used across the whole form (a budget bar
  at the top tracks this).
- A separate 1–3 ranking (favorite to least favorite) for the three style
  directions themselves, shown to the left of each section's images —
  always a valid 1/2/3 permutation (sliders swap instead of colliding).
- Comments field at the bottom.
- A password-gated "Results" tab (password: `jake`) shows average ratings
  per design, average direction ranking, all comments, a hover-to-preview
  on each thumbnail, and a **Purge all results** button to wipe the sheet
  and start fresh.

This is a static site, so it needs a tiny free backend to actually store and
read back submissions across everyone who fills it out. That's done with a
Google Apps Script "Web App" backed by a Google Sheet — no server, no cost.

## ⚠️ About the previous setup

An earlier version of this site had the real Apps Script URL committed
directly into `config.js` and pushed to this **public** GitHub repo — meaning
it's sitting in the git history where anyone (or a bot scanning public repos)
could find it and either spam fake submissions or read all your comments,
bypassing the results password entirely (that password was only ever a
client-side UI gate, not real access control).

This update fixes both problems:

1. **The secret no longer lives in git.** `config.js` is now generated at
   deploy time by a GitHub Actions workflow, from GitHub repo secrets —
   `config.template.js` (the checked-in placeholder) is all that's tracked.
2. **The backend itself now checks a token** (`ACCESS_TOKEN`) before handing
   out results or allowing a purge — so even someone who finds the URL can't
   read or wipe your data without also knowing the token. Submitting a
   rating (the normal form) stays open to anyone, which is the intended
   behavior.

**You should also rotate the old URL** since it's already exposed in git
history (rewriting that history on a public repo doesn't really undo the
exposure — treat it as burned): make a **new** Apps Script deployment (step
5 below creates a new URL) rather than reusing the old one, and consider
deleting the old deployment from Apps Script's Deploy → Manage deployments.

## One-time setup

### 1. Google Sheet + Apps Script backend (~3 minutes)

1. Create a new Google Sheet (sheets.new).
2. Rename the first tab to `Submissions` (must match exactly).
3. Add a header row: `timestamp | ratings_json | category_ranking_json | comments`
4. Extensions → Apps Script. Delete the placeholder code and paste in the
   contents of [`apps-script.gs`](apps-script.gs) from this repo.
5. **Set the access token**: in the Apps Script editor, click the gear icon
   (Project Settings) → Script Properties → Add script property.
   - Property: `ACCESS_TOKEN`
   - Value: any long random string (e.g. generate one with
     `python3 -c "import secrets; print(secrets.token_urlsafe(24))"`) —
     keep this value, you'll need it again in step 3 below.
6. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Click Deploy, authorize it (it'll warn "unverified app" — that's expected
   for your own script: Advanced → Go to project (unsafe) → Allow).
8. Copy the **Web app URL** it gives you (ends in `/exec`).

If you ever edit `apps-script.gs`'s logic, you need to **Deploy → Manage
deployments → Edit → New version** for changes to go live (saving alone
doesn't republish the web app).

### 2. Wire the secrets into GitHub (so they never touch git)

1. In this repo on GitHub: **Settings → Secrets and variables → Actions →
   New repository secret**. Add two:
   - `APPS_SCRIPT_URL` — the URL from step 1.8 above.
   - `RESULTS_ACCESS_TOKEN` — the same value you set as `ACCESS_TOKEN` in
     Apps Script's script properties.
2. **Settings → Pages → Build and deployment → Source** — change this to
   **GitHub Actions** (not "Deploy from a branch"). The workflow at
   [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds
   `config.js` from `config.template.js` + those secrets on every push to
   `main`, then deploys.
3. Push to `main` (or re-run the workflow from the Actions tab) and the site
   goes live at `https://<you>.github.io/<repo>/`.

## Changing the results password

Edit `RESULTS_PASSWORD` in `config.template.js` (and your local `config.js`
if you use one) and commit. This is still just a UI gate for convenience —
the real protection against reading/purging results is the `ACCESS_TOKEN`
check on the backend (section above), which nobody can bypass just by
reading the page's source.

## Purging results

Results tab → **Purge all results** (after unlocking with the password).
Asks for confirmation twice, then clears every row in the `Submissions`
sheet except the header. This is permanent — there's no undo beyond Google
Sheets' own version history (File → Version history in the Sheet itself,
if you need to recover something).

## Local preview

1. Copy `config.template.js` to `config.js` and fill in real values
   (`config.js` is gitignored, so this stays on your machine).
2. Open `index.html` in a browser, or serve the folder with any static file
   server.

## Adding/removing images

Images live in `assets/images/<craft-label|heraldic|embroidery>/` and are
listed in `manifest.json`. Add a file to the folder and a matching entry
`{ "id", "file", "label" }` to the right section in `manifest.json`.
