(function () {
  "use strict";

  const galleryRoot = document.getElementById("gallery-sections");
  const hoverPreview = document.getElementById("hover-preview");
  const hoverPreviewImg = document.getElementById("hover-preview-img");

  const sections = {}; // slug -> { title, items, grid, selectedIds: [] (most recent first) }

  function buildCard(item) {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = item.id;
    card.innerHTML = `
      <div class="thumb" data-file="${item.file}">
        <img src="${item.file}" alt="${item.label}" loading="lazy">
      </div>
      <div class="body">
        <div class="label">${item.label}</div>
      </div>`;
    return card;
  }

  function renderGrid(slug) {
    const state = sections[slug];
    const byId = {};
    state.items.forEach((item) => { byId[item.id] = item; });

    const ordered = [
      ...state.selectedIds.map((id) => byId[id]),
      ...state.items.filter((item) => state.selectedIds.indexOf(item.id) === -1)
    ];

    state.grid.innerHTML = "";
    ordered.forEach((item) => {
      const card = buildCard(item);
      if (state.selectedIds.indexOf(item.id) !== -1) card.classList.add("selected");
      state.grid.appendChild(card);
    });
  }

  function toggleSelect(slug, id) {
    const state = sections[slug];
    const idx = state.selectedIds.indexOf(id);
    if (idx === -1) {
      state.selectedIds.unshift(id);
    } else {
      state.selectedIds.splice(idx, 1);
    }
    renderGrid(slug);
  }

  function renderSection(slug, section) {
    const wrap = document.createElement("section");
    wrap.className = "rating-section";
    wrap.dataset.slug = slug;
    wrap.innerHTML = `<h2>${section.title}</h2>`;

    const grid = document.createElement("div");
    grid.className = "grid";
    wrap.appendChild(grid);
    galleryRoot.appendChild(wrap);

    sections[slug] = { title: section.title, items: section.items, grid, selectedIds: [] };
    renderGrid(slug);
  }

  function showPreview(file) {
    hoverPreviewImg.src = file;
    hoverPreview.classList.add("active");
  }

  function hidePreview() {
    hoverPreview.classList.remove("active");
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

  function setupInteractions() {
    galleryRoot.addEventListener("mouseover", (e) => {
      const thumb = e.target.closest(".thumb");
      if (!thumb) return;
      showPreview(thumb.dataset.file);
    });
    galleryRoot.addEventListener("mousemove", (e) => {
      const thumb = e.target.closest(".thumb");
      if (!thumb) return;
      positionHoverPreview(e.clientX, e.clientY);
    });
    galleryRoot.addEventListener("mouseout", (e) => {
      const thumb = e.target.closest(".thumb");
      if (!thumb) return;
      hidePreview();
    });
    galleryRoot.addEventListener("click", (e) => {
      const thumb = e.target.closest(".thumb");
      if (!thumb) return;
      const card = thumb.closest(".card");
      const wrap = thumb.closest(".rating-section");
      toggleSelect(wrap.dataset.slug, card.dataset.id);
    });
  }

  function init() {
    fetch("manifest.json")
      .then((r) => r.json())
      .then((manifest) => {
        ["craft-label", "heraldic", "embroidery"].forEach((slug) => {
          if (manifest[slug]) renderSection(slug, manifest[slug]);
        });
      });
    setupInteractions();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
