(() => {
  const section = document.getElementById('cereja');
  const button = document.getElementById('swing-bag');
  const object = document.getElementById('swing-object');
  const image = document.getElementById('swing-image');
  const backObject = document.getElementById('swing-back-object');
  const objects = [object, backObject].filter(Boolean);
  const stage = button?.parentElement;
  const backStage = backObject?.parentElement;
  const ribbon = section?.querySelector('.feature-ribbon');
  const composition = section?.querySelector('.feature-composition');
  if (!section || !button || !object || !image) return;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = null;
  let visible = false;
  let armed = true;
  let pending = false;

  function alignSupport() {
    if (!ribbon || !stage || !composition || !image.naturalWidth || !image.naturalHeight) return;
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const imageWidth = image.naturalWidth * scale;
    const imageHeight = image.naturalHeight * scale;
    const offsetX = (width - imageWidth) / 2;
    const offsetY = (height - imageHeight) / 2;
    // Measured at the inner edge of the real strap, not at the PNG canvas edge.
    const anchorX = offsetX + Number(image.dataset.supportX) * scale;
    const anchorY = offsetY + Number(image.dataset.supportY) * scale;
    const top = ribbon.offsetTop - anchorY;
    stage.style.top = `${top.toFixed(3)}px`;
    if (backStage) backStage.style.top = stage.style.top;
    const origin = `${anchorX.toFixed(3)}px ${anchorY.toFixed(3)}px`;
    objects.forEach(layer => { layer.style.transformOrigin = origin; });
    // The left strap crosses in front; the right strap goes behind the band.
    // The complete rear copy preserves the rest of the silhouette below it.
    const split = offsetX + imageWidth * 0.52;
    const join = offsetY + imageHeight * 0.58;
    object.style.clipPath = `polygon(0 0, ${split.toFixed(3)}px 0, ${split.toFixed(3)}px ${join.toFixed(3)}px, ${width}px ${join.toFixed(3)}px, ${width}px ${height}px, 0 ${height}px)`;
    if (backObject) backObject.style.clipPath = 'none';
    composition.style.setProperty('--support-contact-x', `${(stage.offsetLeft + anchorX).toFixed(3)}px`);
    composition.style.setProperty('--support-contact-y', `${ribbon.offsetTop}px`);
  }

  function stop() {
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    objects.forEach(layer => {
      layer.style.transform = 'rotate(0deg)';
      layer.style.willChange = '';
    });
  }

  function swing() {
    stop();
    if (preference.matches || document.hidden) return;
    let started = null;
    objects.forEach(layer => { layer.style.willChange = 'transform'; });
    const tick = timestamp => {
      if (started === null) started = timestamp;
      const seconds = (timestamp - started) / 1000;
      if (seconds >= 8.5) { stop(); return; }
      // An impulse starts from rest; damping reduces each successive swing.
      const angle = 25 * Math.exp(-0.58 * seconds) * Math.sin(4.9 * seconds);
      objects.forEach(layer => { layer.style.transform = `rotate(${angle.toFixed(3)}deg)`; });
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
  }

  function trigger() {
    if (preference.matches) return;
    if (image.complete && image.naturalWidth) { pending = false; swing(); }
    else pending = true;
  }

  window.addEventListener('resize', alignSupport, { passive: true });
  if ('ResizeObserver' in window && stage && ribbon) {
    const observer = new ResizeObserver(alignSupport);
    observer.observe(stage);
    observer.observe(ribbon);
  }
  alignSupport();
  button.addEventListener('click', trigger);
  button.addEventListener('dragstart', event => event.preventDefault());
  image.addEventListener('load', () => {
    alignSupport();
    if (pending && visible) trigger();
    else pending = false;
  });

  function updateVisibility(ratio) {
    visible = ratio >= 0.25;
    if (visible && armed) { armed = false; trigger(); }
    else if (ratio < 0.08) { armed = true; pending = false; stop(); }
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      updateVisibility(entries[0].intersectionRatio);
    }, { threshold: [0, 0.08, 0.25, 0.5] });
    observer.observe(section);
  } else {
    const check = () => {
      const rect = section.getBoundingClientRect();
      const height = window.innerHeight;
      const overlap = Math.max(0, Math.min(rect.bottom, height) - Math.max(rect.top, 0));
      updateVisibility(overlap / Math.max(1, Math.min(rect.height, height)));
    };
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    check();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (visible) trigger();
  });
  preference.addEventListener('change', () => {
    if (preference.matches) { pending = false; stop(); }
  });
})();
