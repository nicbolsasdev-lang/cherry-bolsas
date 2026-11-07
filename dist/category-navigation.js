(() => {
  const grid = document.querySelector('.category-grid');
  const previous = document.getElementById('category-prev');
  const next = document.getElementById('category-next');
  if (!grid || !previous || !next) return;
  previous.addEventListener('click', () => {
    if (grid.lastElementChild) grid.prepend(grid.lastElementChild);
  });
  next.addEventListener('click', () => {
    if (grid.firstElementChild) grid.append(grid.firstElementChild);
  });
})();
