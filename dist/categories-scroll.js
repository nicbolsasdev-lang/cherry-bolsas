(() => {
  const section = document.getElementById('categorias');
  if (!section || !section.classList.contains('category-showcase')) return;
  const grid = section.querySelector('.category-grid') || section;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const items = [...section.querySelectorAll('.category-tile')].map(tile => ({
    track: tile.querySelector('.category-track'),
    motion: tile.querySelector('.category-motion'),
    image: tile.querySelector('img'),
    startX: 0,
    arc: 0,
    current: -1
  }));
  let frame = null;
  let visible = false;
  let dirty = true;
  const clamp = value => Math.max(0, Math.min(1, value));

  function measure() {
    items.forEach(item => {
      // The resting left/bottom/size remain defined by the reference CSS.
      // Start inside the translucent card and emerge through its right side.
      item.startX = item.track.clientWidth * 0.4 - item.motion.offsetLeft;
      item.arc = item.track.clientHeight * 0.08;
      item.current = -1;
    });
    dirty = false;
  }

  function update() {
    frame = null;
    if (document.hidden) return;
    if (dirty) measure();
    const bounds = section.getBoundingClientRect();
    const viewport = window.innerHeight;
    const gridBounds = grid.getBoundingClientRect();
    const distance = bounds.height - (gridBounds.top - bounds.top) + viewport * 0.08;
    const progress = preference.matches ? 1 : clamp((viewport * 0.92 - gridBounds.top) / Math.max(1, distance));
    items.forEach((item, index) => {
      const delay = index * 0.035;
      const p = preference.matches ? 1 : clamp((progress - delay) / (1 - delay));
      if (Math.abs(item.current - p) < 0.0001) return;
      item.current = p;
      if (p === 1) {
        // Exactly the reference pose: no residual offset, scale, blur or tint.
        item.motion.style.transform = 'translateX(-50%) rotateY(0deg)';
        item.motion.style.opacity = '1';
        item.motion.style.filter = 'none';
        item.track.style.setProperty('--category-veil', '0');
        return;
      }
      const ease = p * p * (3 - 2 * p);
      const x = item.startX * (1 - ease);
      const y = -Math.sin(Math.PI * ease) * item.arc;
      const z = -90 * (1 - ease);
      const angle = -360 * (1 - ease);
      const scale = 0.55 + 0.45 * ease;
      item.motion.style.transform = `translateX(-50%) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(${angle.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
      item.motion.style.opacity = (0.25 + 0.75 * ease).toFixed(4);
      item.motion.style.filter = `blur(${(1.6 * (1 - ease)).toFixed(2)}px)`;
      item.track.style.setProperty('--category-veil', (0.7 * (1 - ease)).toFixed(4));
    });
  }

  function schedule() {
    if (frame === null && !document.hidden) frame = window.requestAnimationFrame(update);
  }
  function remeasure() {
    dirty = true;
    if (visible || preference.matches) schedule();
  }
  window.addEventListener('scroll', () => {
    if (visible && !preference.matches) schedule();
  }, { passive: true });
  window.addEventListener('resize', remeasure, { passive: true });
  items.forEach(item => item.image.addEventListener('load', remeasure));
  preference.addEventListener('change', () => { remeasure(); schedule(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frame !== null) {
      window.cancelAnimationFrame(frame);
      frame = null;
    } else if (visible) schedule();
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) schedule();
    }, { rootMargin: '8% 0px', threshold: 0 });
    observer.observe(section);
  } else visible = true;
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(remeasure);
    items.forEach(item => observer.observe(item.track));
  }
  schedule();
})();
