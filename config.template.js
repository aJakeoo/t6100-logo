// This is the checked-in TEMPLATE — the real secrets never live in git.
// GitHub Actions fills in the placeholders below at deploy time from repo
// secrets (Settings > Secrets and variables > Actions) and writes the
// real config.js as a build artifact only. See README.md.
//
// For local testing, copy this file to config.js and fill in real values —
// config.js is gitignored, so it stays local.
window.APP_CONFIG = {
  APPS_SCRIPT_URL: "__APPS_SCRIPT_URL__",
  RESULTS_ACCESS_TOKEN: "__RESULTS_ACCESS_TOKEN__",
  RESULTS_PASSWORD: "jake",
  MAX_FIVES: 5
};
