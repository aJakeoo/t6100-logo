(function () {
  "use strict";

  const CFG = window.APP_CONFIG;
  const MAX_FIVES = CFG.MAX_FIVES || 5;

  let manifest = null;
  const ratings = {}; // id -> value
  const fivesUsed = new Set();
  const categoryRanking = {}; // slug -> 1..3

  const surveyRoot = document.getElementById("survey-sections");
  const budgetBar = document.getElementById("budget-bar");
  const statusMsg = document.getElementById("submit-status");
  const submitBtn = document.getElementById("submit-btn");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");

  function setFill(input) {
    const min = Number(input.min) || 0;
    const max = Number(input.max) || 100;
    const val = Number(input.value);
    const pct = ((val - min) / (max - min)) * 100;
    input.style.setProperty("--fill", pct + "%");
  }

  function pulse(input) {
    input.classList.remove("just-set");
    // force reflow so the animation restarts on repeated same-frame triggers
    void input.offsetWidth;
    input.classList.add("just-set");
  }

  function updateBudgetBar() {
    const dots = [];
    for (let i = 0; i < MAX_FIVES; i++) {
      dots.push(`<span class="dot ${i < fivesUsed.size ? "used" : ""}"></span>`);
    }
    budgetBar.innerHTML =
      `<span><strong>${fivesUsed.size} / ${MAX_FIVES}</strong> top ratings (5) used</span>` +
      `<span class="dots">${dots.join("")}</span>` +
      `<span style="color:var(--ink-soft);font-size:0.85rem;">Give a 5 to your favorites only — you have ${MAX_FIVES} to hand out across the whole form.</span>`;
  }

  function renderSection(slug, section) {
    const wrap = document.createElement("section");
    wrap.className = "rating-section";
    wrap.innerHTML = `<h2>${section.title}</h2><p class="hint">Slide each design from 1 (not for us) to 5 (love it). Default is 1.</p>`;

    const body = document.createElement("div");
    body.className = "rating-section-body";

    const rankCol = document.createElement("div");
    rankCol.className = "category-rank-col";
    rankCol.dataset.slug = slug;
    rankCol.innerHTML = `
      <div class="rank-title">${section.title} rank</div>
      <div class="rank-hint">1 = favorite direction, 3 = least favorite</div>
      <div class="rank-slider-wrap">
        <input type="range" min="1" max="3" step="1" value="${categoryRanking[slug]}" data-slug="${slug}" class="rank-slider">
        <span class="value rank-value">${categoryRanking[slug]}</span>
      </div>`;
    body.appendChild(rankCol);
    setFill(rankCol.querySelector(".rank-slider"));

    const grid = document.createElement("div");
    grid.className = "grid";

    section.items.forEach((item) => {
      ratings[item.id] = 1;
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.id = item.id;
      card.innerHTML = `
        <div class="thumb" data-file="${item.file}">
          <img src="${item.file}" alt="${item.label}" loading="lazy">
        </div>
        <div class="body">
          <div class="label">${item.label}</div>
          <div class="slider-row">
            <input type="range" min="1" max="5" step="1" value="1" data-id="${item.id}">
            <span class="value">1</span>
          </div>
          <div class="tick-row"><span></span><span></span><span></span><span></span><span></span></div>
        </div>`;
      grid.appendChild(card);
      setFill(card.querySelector('input[type="range"]'));
    });

    body.appendChild(grid);
    wrap.appendChild(body);
    surveyRoot.appendChild(wrap);
  }

  function attachRankHandlers() {
    surveyRoot.querySelectorAll(".rank-slider").forEach((input) => {
      input.addEventListener("input", () => onRankInput(input));
    });
  }

  function onRankInput(input) {
    const slug = input.dataset.slug;
    const newVal = parseInt(input.value, 10);
    const oldVal = categoryRanking[slug];
    if (newVal === oldVal) return;

    const conflictSlug = Object.keys(categoryRanking).find(
      (s) => s !== slug && categoryRanking[s] === newVal
    );
    if (conflictSlug) {
      categoryRanking[conflictSlug] = oldVal;
      const conflictInput = surveyRoot.querySelector(`.rank-slider[data-slug="${conflictSlug}"]`);
      const conflictValueEl = conflictInput.closest(".rank-slider-wrap").querySelector(".rank-value");
      conflictInput.value = String(oldVal);
      conflictValueEl.textContent = String(oldVal);
      setFill(conflictInput);
    }

    categoryRanking[slug] = newVal;
    input.closest(".rank-slider-wrap").querySelector(".rank-value").textContent = String(newVal);
    setFill(input);
    pulse(input);
  }

  function attachSliderHandlers() {
    surveyRoot.querySelectorAll('input[type="range"][data-id]').forEach((input) => {
      input.addEventListener("input", () => onSliderInput(input));
    });
  }

  function onSliderInput(input) {
    const id = input.dataset.id;
    const card = input.closest(".card");
    const valueEl = card.querySelector(".value");
    let val = parseInt(input.value, 10);

    if (val === 5 && !fivesUsed.has(id) && fivesUsed.size >= MAX_FIVES) {
      // Block: revert to 4
      val = 4;
      input.value = "4";
      flashStatus(`You've already used all ${MAX_FIVES} of your 5-star ratings. Lower another design first.`, "error");
    }

    if (val === 5) {
      fivesUsed.add(id);
    } else {
      fivesUsed.delete(id);
    }

    ratings[id] = val;
    valueEl.textContent = String(val);
    valueEl.classList.toggle("is-five", val === 5);
    setFill(input);
    pulse(input);
    updateBudgetBar();
  }

  let statusTimer = null;
  function flashStatus(msg, kind) {
    statusMsg.textContent = msg;
    statusMsg.className = "status-msg " + (kind || "");
    if (statusTimer) clearTimeout(statusTimer);
    if (kind === "error") {
      statusTimer = setTimeout(() => {
        statusMsg.textContent = "";
        statusMsg.className = "status-msg";
      }, 4000);
    }
  }

  function setupLightbox() {
    surveyRoot.addEventListener("click", (e) => {
      const thumb = e.target.closest(".thumb");
      if (!thumb) return;
      lightboxImg.src = thumb.dataset.file;
      lightbox.classList.add("active");
    });
    lightbox.addEventListener("click", () => lightbox.classList.remove("active"));
  }

  async function submitForm() {
    submitBtn.disabled = true;
    flashStatus("Submitting...", "");
    const payload = {
      type: "submission",
      timestamp: new Date().toISOString(),
      ratings: ratings,
      categoryRanking: categoryRanking,
      comments: document.getElementById("comments").value.trim()
    };

    if (!CFG.APPS_SCRIPT_URL || CFG.APPS_SCRIPT_URL.indexOf("PASTE_YOUR") === 0) {
      flashStatus("Backend not configured yet — ask the site owner to finish setup (see README).", "error");
      submitBtn.disabled = false;
      return;
    }

    try {
      await fetch(CFG.APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      flashStatus("Thanks! Your ratings were submitted.", "success");
      document.getElementById("comments").value = "";
    } catch (err) {
      flashStatus("Something went wrong submitting. Please try again.", "error");
      submitBtn.disabled = false;
    }
  }

  function initTabs() {
    document.querySelectorAll("nav.tabs button").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("nav.tabs button").forEach((b) => b.classList.remove("active"));
        document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.target).classList.add("active");
      });
    });
  }

  function init() {
    fetch("manifest.json")
      .then((r) => r.json())
      .then((data) => {
        manifest = data;
        const slugs = ["craft-label", "heraldic", "embroidery"];
        slugs.forEach((slug, i) => {
          if (manifest[slug]) categoryRanking[slug] = i + 1; // default distinct ranks 1,2,3
        });
        slugs.forEach((slug) => {
          if (manifest[slug]) renderSection(slug, manifest[slug]);
        });
        attachSliderHandlers();
        attachRankHandlers();
        updateBudgetBar();
      });

    setupLightbox();
    initTabs();
    submitBtn.addEventListener("click", submitForm);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
