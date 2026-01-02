(() => {
  const root = document.documentElement;
  const toast = (msg) => {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(()=>el.classList.remove('show'), 1600);
  };

  const themeKey = 'linkhub_theme';
  const setTheme = (t) => {
    if (t === 'light') root.setAttribute('data-theme','light');
    else root.removeAttribute('data-theme');
    localStorage.setItem(themeKey, t);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = (t === 'light') ? '☀️' : '🌙';
  };
  const saved = localStorage.getItem(themeKey);
  if (saved) setTheme(saved);

  document.getElementById('themeToggle')?.addEventListener('click', () => {
    const cur = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    setTheme(cur === 'light' ? 'dark' : 'light');
  });

  const q = document.getElementById('q');
  const clearBtn = document.getElementById('clearBtn');
  const chipsEl = document.getElementById('chips');

  const cards = Array.from(document.querySelectorAll('.card'));
  const total = cards.length;
  const statLinks = document.getElementById('statLinks');
  if (statLinks) statLinks.textContent = String(total);

  const cats = Array.from(new Set(cards.map(c => c.dataset.cat))).filter(Boolean);

  let activeCat = 'all';

  const renderChips = () => {
    if (!chipsEl) return;
    chipsEl.innerHTML = '';
    const mk = (id, label) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (activeCat === id ? ' active' : '');
      b.textContent = label;
      b.addEventListener('click', () => { activeCat = id; renderChips(); apply(); });
      return b;
    };
    chipsEl.appendChild(mk('all', 'Semua'));
    cats.forEach(id => {
      const sec = document.querySelector(`[data-cat="${CSS.escape(id)}"] h2`);
      const label = sec ? sec.textContent.trim().replace(/\s+/g,' ') : id;
      chipsEl.appendChild(mk(id, label));
    });
  };

  const apply = () => {
    const term = (q?.value || '').trim().toLowerCase();
    let visibleCount = 0;

    cards.forEach(card => {
      const hay = [
        card.dataset.title || '',
        card.dataset.desc || '',
        card.dataset.tag || '',
        card.dataset.url || '',
      ].join(' ').toLowerCase();

      const matchTerm = term === '' || hay.includes(term);
      const matchCat = activeCat === 'all' || (card.dataset.cat === activeCat);
      const show = matchTerm && matchCat;

      card.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });

    // hide empty sections
    document.querySelectorAll('section.section').forEach(sec => {
      const id = sec.getAttribute('data-cat');
      const any = Array.from(sec.querySelectorAll('.card')).some(c => c.style.display !== 'none');
      sec.style.display = any ? '' : 'none';
    });

    if (statLinks) statLinks.textContent = String(visibleCount);
  };

  q?.addEventListener('input', apply);
  clearBtn?.addEventListener('click', () => { if (q) q.value=''; activeCat='all'; renderChips(); apply(); });

  renderChips();
  apply();

  document.querySelectorAll('.copyBtn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const val = btn.getAttribute('data-copy') || '';
      try{
        await navigator.clipboard.writeText(val);
        toast('Link di-copy ✅');
      }catch{
        toast('Gagal copy (browser tidak support) ❌');
      }
    });
  });
})();
