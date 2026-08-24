(function () {
  "use strict";

  const CFG = window.APP_CONFIG;
  const gate = document.getElementById("results-gate");
  const panel = document.getElementById("results-panel");
  const pwInput = document.getElementById("results-password");
  const pwBtn = document.getElementById("results-unlock");
  const pwError = document.getElementById("results-pw-error");
  const refreshBtn = document.getElementById("results-refresh");
  const purgeBtn = document.getElementById("results-purge");
  const hoverPreview = document.getElementById("hover-preview");
  const hoverPreviewImg = document.getElementById("hover-preview-img");
  const summaryTableBody = document.querySelector("#summary-table tbody");
  const categoryRankTableBody = document.querySelector("#category-rank-table tbody");
  const commentsList = document.getElementById("comments-list");
  const resultsStatus = document.getElementById("results-status");

  let manifest = null;
  let unlocked = false;

  function tryUnlock() {
    if (pwInput.value === CFG.RESULTS_PASSWORD) {
      unlocked = true;
      gate.style.display = "none";
      panel.style.display = "block";
      loadResults();
    } else {
      pwError.textContent = "Incorrect password.";
    }
  }

  pwBtn.addEventListener("click", tryUnlock);
  pwInput.addEventListener("keydown", (e) => { if (e.key === "Enter") tryUnlock(); });
  refreshBtn.addEventListener("click", loadResults);
  purgeBtn.addEventListener("click", purgeResults);

  function apiUrl(params) {
    const url = new URL(CFG.APPS_SCRIPT_URL);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    if (CFG.RESULTS_ACCESS_TOKEN) url.searchParams.set("token", CFG.RESULTS_ACCESS_TOKEN);
    return url.toString();
  }

  async function purgeResults() {
    const sure = confirm(
      "Delete ALL submitted ratings and comments? This cannot be undone."
    );
    if (!sure) return;
    const reallySure = confirm(
      "Really sure? Everyone's ratings will be permanently erased."
    );
    if (!reallySure) return;

    purgeBtn.disabled = true;
    resultsStatus.textContent = "Purging...";
    try {
      await fetch(CFG.APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ type: "purge", token: CFG.RESULTS_ACCESS_TOKEN })
      });
      // no-cors means we can't read the response; assume success and re-verify by reloading.
      setTimeout(loadResults, 800);
    } catch (err) {
      resultsStatus.textContent = "Could not purge results.";
    } finally {
      purgeBtn.disabled = false;
    }
  }

  async function loadManifest() {
    if (manifest) return manifest;
    const r = await fetch("manifest.json");
    manifest = await r.json();
    return manifest;
  }

  function labelLookup(m) {
    const map = {};
    Object.values(m).forEach((section) => {
      section.items.forEach((item) => { map[item.id] = item; });
    });
    return map;
  }

  async function loadResults() {
    resultsStatus.textContent = "Loading...";
    summaryTableBody.innerHTML = "";
    categoryRankTableBody.innerHTML = "";
    commentsList.innerHTML = "";

    if (!CFG.APPS_SCRIPT_URL || CFG.APPS_SCRIPT_URL.indexOf("PASTE_YOUR") === 0) {
      resultsStatus.textContent = "Backend not configured yet — see README.md.";
      return;
    }

    const m = await loadManifest();
    const lookup = labelLookup(m);

    try {
      const r = await fetch(apiUrl({ action: "results" }), { method: "GET" });
      const data = await r.json();
      if (data.error) {
        resultsStatus.textContent = "Access denied by backend — check RESULTS_ACCESS_TOKEN.";
        return;
      }
      const submissions = data.submissions || [];
      resultsStatus.textContent = `${submissions.length} submission(s).`;

      const totals = {}; // id -> {sum, count}
      const categoryTotals = {}; // slug -> {sum, count}
      submissions.forEach((s) => {
        const ratings = s.ratings || {};
        Object.keys(ratings).forEach((id) => {
          if (!totals[id]) totals[id] = { sum: 0, count: 0 };
          totals[id].sum += Number(ratings[id]) || 0;
          totals[id].count += 1;
        });
        const catRank = s.categoryRanking || {};
        Object.keys(catRank).forEach((slug) => {
          if (!categoryTotals[slug]) categoryTotals[slug] = { sum: 0, count: 0 };
          categoryTotals[slug].sum += Number(catRank[slug]) || 0;
          categoryTotals[slug].count += 1;
        });
      });

      Object.entries(m)
        .sort((a, b) => {
          const avgA = categoryTotals[a[0]] ? categoryTotals[a[0]].sum / categoryTotals[a[0]].count : 99;
          const avgB = categoryTotals[b[0]] ? categoryTotals[b[0]].sum / categoryTotals[b[0]].count : 99;
          return avgA - avgB;
        })
        .forEach(([slug, section]) => {
          const t = categoryTotals[slug];
          const avg = t ? (t.sum / t.count).toFixed(2) : "—";
          const count = t ? t.count : 0;
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${section.title}</td><td><span class="avg-badge">${avg}</span></td><td>${count}</td>`;
          categoryRankTableBody.appendChild(tr);
        });

      Object.entries(lookup)
        .sort((a, b) => {
          const avgA = totals[a[0]] ? totals[a[0]].sum / totals[a[0]].count : 0;
          const avgB = totals[b[0]] ? totals[b[0]].sum / totals[b[0]].count : 0;
          return avgB - avgA;
        })
        .forEach(([id, item]) => {
          const t = totals[id];
          const avg = t ? (t.sum / t.count).toFixed(2) : "—";
          const count = t ? t.count : 0;
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td><img class="results-thumb" src="${item.file}" alt=""></td>
            <td>${item.label}<br><span style="color:var(--ink-soft);font-size:0.75rem;">${id}</span></td>
            <td><span class="avg-badge">${avg}</span></td>
            <td>${count}</td>`;
          summaryTableBody.appendChild(tr);
        });

      const withComments = submissions
        .filter((s) => s.comments && s.comments.trim().length > 0)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      if (withComments.length === 0) {
        commentsList.innerHTML = '<p style="color:var(--ink-soft);">No comments yet.</p>';
      } else {
        withComments.forEach((s) => {
          const div = document.createElement("div");
          div.className = "comment-item";
          const when = s.timestamp ? new Date(s.timestamp).toLocaleString() : "";
          div.innerHTML = `<div class="meta">${when}</div><div>${escapeHtml(s.comments)}</div>`;
          commentsList.appendChild(div);
        });
      }
    } catch (err) {
      resultsStatus.textContent = "Could not load results. Check Apps Script deployment / CORS settings.";
    }
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function setupHoverPreview() {
    summaryTableBody.addEventListener("mouseover", (e) => {
      const img = e.target.closest(".results-thumb");
      if (!img) return;
      hoverPreviewImg.src = img.src;
      hoverPreview.classList.add("active");
    });
    summaryTableBody.addEventListener("mousemove", (e) => {
      if (!hoverPreview.classList.contains("active")) return;
      positionHoverPreview(e.clientX, e.clientY);
    });
    summaryTableBody.addEventListener("mouseout", (e) => {
      const img = e.target.closest(".results-thumb");
      if (!img) return;
      hoverPreview.classList.remove("active");
    });
  }

  function positionHoverPreview(x, y) {
    const margin = 24;
    const previewSize = 320;
    let left = x + margin;
    let top = y + margin;
    if (left + previewSize > window.innerWidth) left = x - margin - previewSize;
    if (top + previewSize > window.innerHeight) top = window.innerHeight - previewSize - margin;
    hoverPreview.style.left = `${Math.max(margin, left)}px`;
    hoverPreview.style.top = `${Math.max(margin, top)}px`;
  }

  setupHoverPreview();
})();
