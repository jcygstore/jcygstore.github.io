/* JCYG STORE · Flechas accesibles para la galería de fotos y videos.
   Se integra sin modificar app.js ni la sincronización de colores existente. */
(() => {
  'use strict';

  const feed = document.getElementById('feed');
  if (!feed || !('MutationObserver' in window)) return;

  const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const svg = (direction) => direction === 'prev'
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5-7 7 7 7"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 5 7 7-7 7"/></svg>';

  function makeArrow(direction, gallery) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `gallery-arrow gallery-arrow-${direction}`;
    button.setAttribute('aria-label', direction === 'prev' ? 'Ver foto o video anterior' : 'Ver foto o video siguiente');
    button.setAttribute('title', direction === 'prev' ? 'Anterior' : 'Siguiente');
    button.innerHTML = svg(direction);
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const slides = Array.from(gallery.children).filter((node) => node.classList && node.classList.contains('product-slide'));
      if (slides.length < 2) return;
      const width = gallery.clientWidth || gallery.getBoundingClientRect().width;
      if (!width) return;
      const current = Math.max(0, Math.min(slides.length - 1, Math.round(gallery.scrollLeft / width)));
      const next = Math.max(0, Math.min(slides.length - 1, current + (direction === 'next' ? 1 : -1)));
      const targetLeft = next * width;
      if (typeof gallery.scrollTo === 'function') {
        try {
          gallery.scrollTo({ left: targetLeft, behavior: reducedMotion() ? 'auto' : 'smooth' });
        } catch (_) {
          gallery.scrollLeft = targetLeft;
        }
      } else {
        gallery.scrollLeft = targetLeft;
      }
    });
    return button;
  }

  function updateArrowState(stage, gallery) {
    const previous = stage.querySelector('.gallery-arrow-prev');
    const next = stage.querySelector('.gallery-arrow-next');
    if (!previous || !next) return;
    const max = Math.max(0, gallery.scrollWidth - gallery.clientWidth);
    previous.disabled = gallery.scrollLeft <= 2;
    next.disabled = gallery.scrollLeft >= max - 2;
  }

  function enhanceStage(stage) {
    const gallery = stage.querySelector('.product-gallery');
    if (!gallery) return;

    // Se retiran los puntos; el carrusel sigue actualizando el color asociado
    // mediante el evento de scroll que ya existe en app.js.
    const dots = stage.querySelector('.product-gallery-dots');
    if (dots) dots.remove();

    const slides = Array.from(gallery.children).filter((node) => node.classList && node.classList.contains('product-slide'));
    const oldPrevious = stage.querySelector('.gallery-arrow-prev');
    const oldNext = stage.querySelector('.gallery-arrow-next');

    if (slides.length < 2) {
      oldPrevious?.remove();
      oldNext?.remove();
      return;
    }

    if (!oldPrevious) stage.appendChild(makeArrow('prev', gallery));
    if (!oldNext) stage.appendChild(makeArrow('next', gallery));

    if (gallery.dataset.arrowsReady !== 'true') {
      gallery.dataset.arrowsReady = 'true';
      gallery.addEventListener('scroll', () => updateArrowState(stage, gallery), { passive: true });
    }
    updateArrowState(stage, gallery);
  }

  function enhanceAll() {
    feed.querySelectorAll('.product-stage').forEach(enhanceStage);
  }

  const observer = new MutationObserver(() => enhanceAll());
  observer.observe(feed, { childList: true, subtree: true });
  enhanceAll();
  window.addEventListener('resize', enhanceAll, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(enhanceAll, 180), { passive: true });
})();
