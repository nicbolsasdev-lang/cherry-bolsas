(() => {
  const root = document.querySelector('.hero-v2');
  if (!root) return;
  const canvas = document.getElementById('hero-canvas');
  const viewer = document.getElementById('bag-viewer');
  const object = document.getElementById('bag-object');
  const slides = [...root.querySelectorAll('.bag-slide')];
  const dots = [...root.querySelectorAll('.bag-dot')];
  const autoplay = document.getElementById('bag-autoplay');
  const name = document.getElementById('hero-product-name');
  const indexLabel = document.getElementById('bag-index');
  const live = document.getElementById('bag-live-status');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const names = slides.map((slide, i) => slide.dataset?.name || slide.querySelector('img').alt || `Bolsa ${i + 1}`);
  let index = 0;
  let timer = null;
  let cleanup = null;
  let busy = false;
  let userPaused = motion.matches;
  let onScreen = true;
  let dragging = false;
  let focused = false;
  let start = { x: 0, y: 0 };
  let dragAxis = null;
  let pointerId = null;

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  function canPlay() {
    return !userPaused && !dragging && !focused && onScreen && !document.hidden;
  }

  function syncPlayback() {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    const play = canPlay();
    root.classList.toggle('is-playing', play);
    root.classList.toggle('is-holding', !play);
    autoplay.setAttribute('aria-pressed', String(userPaused));
    autoplay.setAttribute('aria-label', userPaused ? 'Retomar troca automática' : 'Pausar troca automática');
    if (play) {
      // Restart the selected progress bar when a new three-second period begins.
      const bar = dots[index]?.firstElementChild;
      if (bar) {
        bar.style.animation = 'none';
        void bar.offsetWidth;
        bar.style.animation = '';
      }
      timer = window.setInterval(() => select(index + 1, false), 3000);
    }
  }

  function resetPose() {
    viewer.classList.remove('is-tracking');
    object.style.setProperty('--drag-x', '0px');
    object.style.setProperty('--drag-y', '0px');
    object.style.setProperty('--tilt-x', '0deg');
    object.style.setProperty('--tilt-y', '0deg');
    object.style.setProperty('--tilt-z', '0deg');
  }

  function select(target, manual = true) {
    const next = (target + slides.length) % slides.length;
    if (next === index || busy || dragging) return;
    const image = slides[next].querySelector('img');
    if (!image.complete || !image.naturalWidth) return;
    busy = true;
    const outgoing = slides[index];
    outgoing.classList.remove('is-active');
    outgoing.classList.add('is-leaving');
    outgoing.setAttribute('aria-hidden', 'true');
    index = next;
    slides[index].classList.remove('is-leaving');
    slides[index].classList.add('is-active');
    slides[index].setAttribute('aria-hidden', 'false');
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
      dot.setAttribute('aria-pressed', String(i === index));
    });
    if (name) name.textContent = names[index];
    if (indexLabel) indexLabel.textContent = String(index + 1).padStart(2, '0');
    if (manual) live.textContent = `${names[index]}. Bolsa ${index + 1} de ${slides.length}.`;
    window.clearTimeout(cleanup);
    cleanup = window.setTimeout(() => {
      outgoing.classList.remove('is-leaving');
      busy = false;
    }, motion.matches ? 170 : 820);
    resetPose();
    syncPlayback();
  }

  document.getElementById('bag-prev')?.addEventListener('click', () => select(index - 1));
  document.getElementById('bag-next')?.addEventListener('click', () => select(index + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => select(i)));
  autoplay.addEventListener('click', () => {
    userPaused = !userPaused;
    syncPlayback();
  });

  viewer.addEventListener('pointerdown', event => {
    if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return;
    if (busy) return;
    dragging = true;
    dragAxis = event.pointerType === 'mouse' ? 'x' : null;
    pointerId = event.pointerId;
    start = { x: event.clientX, y: event.clientY };
    viewer.setPointerCapture(event.pointerId);
    viewer.classList.add('is-dragging');
    syncPlayback();
  });

  viewer.addEventListener('pointermove', event => {
    if (dragging && event.pointerId !== pointerId) return;
    if (dragging) {
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      // Let a vertical touch gesture scroll the page as usual.
      if (!dragAxis && Math.hypot(dx, dy) > 7) {
        dragAxis = Math.abs(dy) > Math.abs(dx) * 1.25 ? 'y' : 'x';
        if (dragAxis === 'y') { endDrag(); return; }
      }
      const width = canvas.getBoundingClientRect().width;
      object.style.setProperty('--drag-x', `${clamp(dx * 0.65, -width * 0.18, width * 0.18)}px`);
      object.style.setProperty('--drag-y', `${clamp(dy * 0.4, -65, 65)}px`);
      object.style.setProperty('--tilt-y', `${clamp(dx * 0.18, -24, 24)}deg`);
      object.style.setProperty('--tilt-x', `${clamp(-dy * 0.15, -16, 16)}deg`);
      object.style.setProperty('--tilt-z', `${clamp(dx * 0.035, -6, 6)}deg`);
    } else if (event.pointerType === 'mouse' && !motion.matches) {
      const rect = viewer.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5);
      const y = clamp((event.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5);
      viewer.classList.add('is-tracking');
      object.style.setProperty('--tilt-y', `${x * 22}deg`);
      object.style.setProperty('--tilt-x', `${y * -16}deg`);
      object.style.setProperty('--tilt-z', `${x * 3}deg`);
    }
  });

  function endDrag() {
    if (!dragging) return;
    const id = pointerId;
    dragging = false;
    pointerId = null;
    dragAxis = null;
    viewer.classList.remove('is-dragging');
    if (viewer.hasPointerCapture(id)) viewer.releasePointerCapture(id);
    resetPose();
    syncPlayback();
  }

  viewer.addEventListener('pointerup', endDrag);
  viewer.addEventListener('pointercancel', endDrag);
  viewer.addEventListener('lostpointercapture', endDrag);
  viewer.addEventListener('pointerleave', () => { if (!dragging) resetPose(); });
  viewer.addEventListener('dragstart', event => event.preventDefault());
  viewer.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') select(index - 1);
    if (event.key === 'ArrowRight') select(index + 1);
    if (event.key === 'ArrowUp') object.style.setProperty('--tilt-x', '12deg');
    if (event.key === 'ArrowDown') object.style.setProperty('--tilt-x', '-12deg');
    if (event.key === 'Home') resetPose();
  });

  // Pointer clicks may focus the viewer; only keyboard focus suspends autoplay.
  root.addEventListener('focusin', () => {
    focused = [...root.querySelectorAll(':focus-visible')].length > 0;
    syncPlayback();
  });
  root.addEventListener('focusout', event => {
    if (!root.contains(event.relatedTarget)) {
      focused = false;
      resetPose();
      syncPlayback();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) endDrag();
    syncPlayback();
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      onScreen = entries[0].isIntersecting;
      if (!onScreen) endDrag();
      syncPlayback();
    }, { threshold: 0.15 });
    observer.observe(root);
  }
  motion.addEventListener('change', () => {
    if (motion.matches) {
      userPaused = true;
      resetPose();
    }
    syncPlayback();
  });
  slides.forEach(slide => slide.querySelector('img').addEventListener('error', () => {
    if (slide === slides[index]) {
      const fallback = slides.findIndex(s => s !== slide && s.querySelector('img').complete && s.querySelector('img').naturalWidth);
      if (fallback >= 0) select(fallback, false);
    }
  }));
  syncPlayback();
})();
