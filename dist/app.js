(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const catalog = window.CHERRY_CATALOG || [];
  const products = new Map(catalog.map(product => [product.id, product]));
  const cards = $$('.shop-card');
  let favorites = new Set();
  try {
    const saved = JSON.parse(localStorage.getItem('cherry-favorites') || '[]');
    if (Array.isArray(saved)) favorites = new Set(saved.filter(id => products.has(id)));
  } catch {}
  let filter = 'all';
  let onlyFavorites = false;
  let selectedProduct = null;
  let toastTimer;

  function toast(message) {
    $('#toast').textContent = message;
    $('#toast').classList.add('visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => $('#toast').classList.remove('visible'), 2300);
  }

  function syncDetailFavorite() {
    if (!selectedProduct) return;
    const saved = favorites.has(selectedProduct.id);
    $('#detail-save').textContent = saved ? '♥ Salva' : '♡ Salvar';
    $('#detail-save').setAttribute('aria-pressed', String(saved));
    $('#detail-save').setAttribute('aria-label', `${saved ? 'Remover dos favoritos' : 'Favoritar'} ${selectedProduct.name}`);
  }

  function render() {
    let count = 0;
    cards.forEach(card => {
      const product = products.get(card.dataset.id);
      if (!product) return;
      const saved = favorites.has(product.id);
      const button = card.querySelector('.card-save');
      button.textContent = saved ? '♥' : '♡';
      button.setAttribute('aria-pressed', String(saved));
      button.setAttribute('aria-label', `${saved ? 'Remover dos favoritos' : 'Favoritar'} ${product.name}`);
      card.hidden = (filter !== 'all' && !product.category.includes(filter)) || (onlyFavorites && !saved);
      if (!card.hidden) count++;
    });
    $('#fav-count').textContent = String(favorites.size);
    $('#favorite-toggle').setAttribute('aria-pressed', String(onlyFavorites));
    $('#favorite-toggle').setAttribute('aria-label', onlyFavorites ? 'Mostrar todos os produtos' : 'Ver favoritos');
    $('#result-count').textContent = `${count} ${onlyFavorites ? (count === 1 ? 'favorito' : 'favoritos') : (count === 1 ? 'modelo' : 'modelos')}`;
    $('#empty-state').hidden = count > 0;
    $('#products').classList.toggle('is-filtered', filter !== 'all' || onlyFavorites);
    $$('[data-filter]').forEach(button => {
      const active = button.dataset.filter === filter;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    syncDetailFavorite();
  }

  function toggleFavorite(id) {
    if (!products.has(id)) return;
    const saved = !favorites.has(id);
    saved ? favorites.add(id) : favorites.delete(id);
    try { localStorage.setItem('cherry-favorites', JSON.stringify([...favorites])); } catch {}
    render();
    toast(saved ? 'Bolsa salva nas suas favoritas ♡' : 'Bolsa removida das favoritas');
  }

  function setFilter(value) {
    if (!['all', 'mao', 'ombro', 'noite'].includes(value)) return;
    filter = value;
    onlyFavorites = false;
    render();
  }

  cards.forEach(card => card.querySelector('.card-save').addEventListener('click', () => toggleFavorite(card.dataset.id)));
  $$('[data-filter]').forEach(button => button.addEventListener('click', () => setFilter(button.dataset.filter)));
  $$('[data-explore]').forEach(button => button.addEventListener('click', () => {
    setFilter(button.dataset.explore);
    $('#colecao').scrollIntoView({ behavior: 'smooth' });
  }));
  $('#reset-products').addEventListener('click', () => setFilter('all'));
  $('#favorite-toggle').addEventListener('click', () => {
    onlyFavorites = !onlyFavorites;
    filter = 'all';
    render();
    $('#colecao').scrollIntoView({ behavior: 'smooth' });
  });

  function showDetail(id) {
    const product = products.get(id);
    if (!product) return;
    selectedProduct = product;
    $('#detail-title').textContent = product.name;
    $('#detail-kind').textContent = product.kind;
    $('#detail-copy').textContent = product.description;
    $('#detail-img').src = `assets/${product.image}`;
    $('#detail-img').alt = product.name;
    $('#detail-features').replaceChildren(...product.details.map(text => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
    syncDetailFavorite();
    $('#detail-dialog').showModal();
  }
  $$('[data-product]').forEach(button => button.addEventListener('click', () => showDetail(button.dataset.product)));
  $('#detail-save').addEventListener('click', () => {
    if (selectedProduct) toggleFavorite(selectedProduct.id);
  });

  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  function search() {
    const query = normalize($('#search-input').value);
    const matches = catalog.filter(product => normalize([product.name, product.kind, product.description, ...product.details].join(' ')).includes(query));
    const results = $('#search-results');
    results.replaceChildren();
    if (!matches.length) {
      const empty = document.createElement('p');
      empty.textContent = 'Não encontramos esse modelo. Experimente “cereja”, “fivelas” ou “trama”.';
      results.append(empty);
      return;
    }
    matches.forEach(product => {
      const button = document.createElement('button');
      const name = document.createElement('span');
      const meta = document.createElement('span');
      name.textContent = product.name;
      meta.textContent = product.kind + ' ↗';
      meta.className = 'search-item-meta';
      button.append(name, meta);
      button.addEventListener('click', () => {
        $('#search-dialog').close();
        showDetail(product.id);
      });
      results.append(button);
    });
  }
  $('#search-toggle').addEventListener('click', () => {
    $('#search-dialog').showModal();
    search();
    $('#search-input').focus();
  });
  $('#search-input').addEventListener('input', search);

  $('#menu-toggle').addEventListener('click', () => {
    const open = $('#mobile-menu').hidden;
    $('#mobile-menu').hidden = !open;
    $('#menu-toggle').setAttribute('aria-expanded', String(open));
  });
  $$('#mobile-menu a').forEach(link => link.addEventListener('click', () => {
    $('#mobile-menu').hidden = true;
    $('#menu-toggle').setAttribute('aria-expanded', 'false');
  }));
  $$('dialog').forEach(dialog => dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  }));
  $('#detail-dialog').setAttribute('aria-labelledby', 'detail-title');
  $('#year').textContent = String(new Date().getFullYear());
  render();
})();
