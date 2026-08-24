(function () {
  "use strict";

  const galleryRoot = document.getElementById("gallery-sections");
  const hoverPreview = document.getElementById("hover-preview");
  const hoverPreviewImg = document.getElementById("hover-preview-img");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");

  function renderSection(section) {
    const wrap = document.createElement("section");
    wrap.className = "rating-section";
    wrap.innerHTML = `<h2>${section.title}</h2>`;

    const grid = document.createElement("div");
    grid.className = "grid";

    section.items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="thumb" data-file="${item.file}">
          <img src="${item.file}" alt="${item.label}" loading="lazy">
        </div>
        <div class="body">
          <div class="label">${item.label}</div>
        </div>`;
      grid.appendChild(card);
    });

    wrap.appendChild(grid);
    galleryRoot.appendChild(wrap);
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
      lightboxImg.src = thumb.dataset.file;
      lightbox.classList.add("active");
    });
    lightbox.addEventListener("click", () => lightbox.classList.remove("active"));
  }

  function init() {
    fetch("manifest.json")
      .then((r) => r.json())
      .then((manifest) => {
        ["craft-label", "heraldic", "embroidery"].forEach((slug) => {
          if (manifest[slug]) renderSection(manifest[slug]);
        });
      });
    setupInteractions();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
