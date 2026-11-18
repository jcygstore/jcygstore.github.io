/* JCYG STORE · Flechas accesibles para la galería de fotos y videos.
   Se integra sin modificar app.js ni la sincronización de colores existente. */
(() => {
  'use strict';

  const feed = document.getElementById('feed');
  if (!feed || !('MutationObserver' in window)) return;

  const desktopAdmin = document.getElementById('desktop-admin-entry');
  desktopAdmin?.addEventListener('click', () => {
    const originalAdmin = feed.querySelector('.admin-entry');
    originalAdmin?.click();
  });

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

  function enhanceTikTok(card) {
    const actions = card.querySelector('.actions');
    const addButton = actions?.querySelector('.cart-side');
    if (!actions || !addButton || actions.querySelector('.tiktok-side')) return;

    const link = document.createElement('a');
    link.className = 'act tiktok-side';
    const userAgent = navigator.userAgent || '';
    const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    link.href = isMobileDevice
      ? 'https://vm.tiktok.com/ZS9fofpRxe7Qd-3lCcB/'
      : 'https://www.tiktok.com/@jcyg.store?is_from_webapp=1&sender_device=pc';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.title = 'Visitar JCYG STORE en TikTok';
    link.setAttribute('aria-label', 'Visitar JCYG STORE en TikTok');
    const tiktokMark = 'M12.525.02c1.31-.02 2.62-.01 3.92-.02.08 1.53.63 3.05 1.74 4.14 1.1 1.08 2.62 1.59 4.1 1.73v4.01c-1.39-.05-2.78-.35-4.03-.95-.55-.26-1.06-.6-1.56-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.78-1.35 3.93-1.3 1.91-3.56 3.15-5.87 3.19-1.42.08-2.84-.31-4.04-1.07-1.99-1.27-3.34-3.55-3.37-5.92-.02-1.47.39-2.93 1.16-4.18 1.25-2.04 3.51-3.41 5.91-3.48.28-.01.56-.02.84-.01v4.11c-.94-.31-2-.22-2.86.29-.63.38-1.12.98-1.32 1.69-.17.58-.13 1.22.1 1.79.36.87 1.21 1.54 2.15 1.69.63.12 1.29.01 1.85-.31.66-.38 1.14-1.07 1.28-1.82.07-.42.05-.85.05-1.27V.02z';
    link.innerHTML = `
      <span class="ico tiktok-ico" aria-hidden="true">
        <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" aria-hidden="true">
          <path class="tiktok-cyan" d="${tiktokMark}" transform="translate(-.9 .55)"/>
          <path class="tiktok-pink" d="${tiktokMark}" transform="translate(.9 -.55)"/>
          <path class="tiktok-white" d="${tiktokMark}"/>
        </svg>
      </span>
      <small>TikTok</small>`;
    addButton.insertAdjacentElement('afterend', link);
  }

  function enhanceAll() {
    feed.querySelectorAll('.product-stage').forEach(enhanceStage);
    feed.querySelectorAll('.card').forEach(enhanceTikTok);
  }

  const observer = new MutationObserver(() => enhanceAll());
  observer.observe(feed, { childList: true, subtree: true });
  enhanceAll();
  window.addEventListener('resize', enhanceAll, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(enhanceAll, 180), { passive: true });
})();
