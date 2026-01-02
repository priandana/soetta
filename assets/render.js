(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const toast = (msg) => {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(()=>el.classList.remove('show'), 1600);
  };

  const fmtDate = (iso) => {
    try{
      const d = new Date(iso);
      return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
    }catch{ return '-'; }
  };

  const iconEmoji = (ico) => {
    if (ico === 'warehouse') return '🏭';
    if (ico === 'truck') return '🚚';
    if (ico === 'qc') return '🔎';
    if (ico === 'finance') return '💳';
    if (ico === 'packing') return '📦';
    if (ico === 'return') return '↩️';
    return '📄';
  };

  const escapeAttr = (s) => String(s || '')
    .replaceAll('&','&amp;')
    .replaceAll('"','&quot;')
    .replaceAll('<','&lt;');

  const load = async () => {
    const res = await fetch('data/links.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Gagal load links.json');
    return await res.json();
  };

  const renderEmpty = (msg) => {
    $('#content').innerHTML = `
      <div class="empty">
        <h2>Belum ada link</h2>
        <p class="muted">${msg || 'Isi data/links.json untuk menambahkan link.'}</p>
      </div>
    `;
  };

  const buildCard = (lnk, catId) => {
    const host = (() => { try { return new URL(lnk.url).host; } catch { return 'Google Sheets'; } })();
    const tag = (lnk.tag || '').trim();
    const isPriority = /wajib|prioritas/i.test(tag) || lnk.pinned === true;

    return `
      <article class="card"
        data-title="${escapeAttr(lnk.title)}"
        data-desc="${escapeAttr(lnk.desc)}"
        data-tag="${escapeAttr(tag)}"
        data-url="${escapeAttr(lnk.url)}"
        data-cat="${escapeAttr(catId)}"
        data-priority="${isPriority ? '1' : '0'}"
      >
        <div class="card-top">
          <div class="icon" title="${escapeAttr(lnk.icon || 'sheet')}">${iconEmoji(lnk.icon || 'sheet')}</div>
          ${tag ? `<div class="tag">${escapeAttr(tag)}</div>` : ``}
        </div>
        <h4>${escapeAttr(lnk.title)}</h4>
        <p>${escapeAttr(lnk.desc || '')}</p>
        <div class="card-actions">
          <a class="btn" target="_blank" rel="noopener" href="${escapeAttr(lnk.url)}">Buka</a>
          <button class="btn ghost copyBtn" type="button" data-copy="${escapeAttr(lnk.url)}">Copy</button>
        </div>
        <div class="card-foot">
          <span class="muted">Update: ${fmtDate(lnk.updated_at || Date.now())}</span>
          <span class="dot">•</span>
          <span class="muted">${escapeAttr(host)}</span>
        </div>
      </article>
    `;
  };

  const initInteractions = () => {
    $$('.copyBtn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const val = btn.getAttribute('data-copy') || '';
        try{
          await navigator.clipboard.writeText(val);
          toast('Link di-copy ✅');
        }catch{
          toast('Gagal copy ❌');
        }
      });
    });

    $('#openAllBtn')?.addEventListener('click', () => {
      const visible = $$('.card').filter(c => c.style.display !== 'none');
      if (!visible.length) return toast('Tidak ada link yang tampil');
      visible.slice(0, 12).forEach((c, i) => {
        const url = c.getAttribute('data-url');
        setTimeout(()=> window.open(url, '_blank', 'noopener'), i*120);
      });
      if (visible.length > 12) toast('Dibuka 12 link pertama (biar browser tidak block)');
    });
  };

  const initSearchFilter = () => {
    const q = $('#q');
    const clearBtn = $('#clearBtn');
    const chipsEl = $('#chips');

    const cards = $$('.card');
    const statLinks = $('#statLinks');

    const cats = Array.from(new Set(cards.map(c => c.dataset.cat))).filter(Boolean);
    let activeCat = 'all';

    const renderChips = () => {
      if (!chipsEl) return;
      chipsEl.innerHTML = '';
      const mk = (id, label, orange=false) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip' + (activeCat === id ? (' active' + (orange ? ' orange' : '')) : '');
        b.textContent = label;
        b.addEventListener('click', () => { activeCat = id; renderChips(); apply(); });
        return b;
      };
      chipsEl.appendChild(mk('all', 'Semua', true));
      cats.forEach(id => {
        const h = document.querySelector(`[data-cat="${CSS.escape(id)}"] .section-title h3`);
        chipsEl.appendChild(mk(id, h ? h.textContent.trim() : id));
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

      $$('.section[data-cat]').forEach(sec => {
        const any = Array.from(sec.querySelectorAll('.card')).some(c => c.style.display !== 'none');
        sec.style.display = any ? '' : 'none';
      });

      const feat = $('#featured');
      if (feat) {
        const anyFeat = Array.from($('#featuredGrid')?.querySelectorAll('.card') || []).some(c => c.style.display !== 'none');
        feat.style.display = anyFeat ? '' : 'none';
      }

      if (statLinks) statLinks.textContent = String(visibleCount);
    };

    q?.addEventListener('input', apply);
    clearBtn?.addEventListener('click', () => { if (q) q.value=''; activeCat='all'; renderChips(); apply(); });

    renderChips();
    apply();
  };

  const render = (data) => {
    const cats = data.categories || [];
    const site = data.site || {};
    const updated = data.updated_at || Date.now();

    if (site.title) { document.title = site.title; $('#siteTitle').textContent = site.title; }
    if (site.subtitle) $('#siteSubtitle').textContent = site.subtitle;
    if (site.brand) $('#brandName').textContent = site.brand;

    const repo = site.repo || site.github || '';
    const repoBtn = $('#repoBtn');
    if (repo && repoBtn) { repoBtn.href = repo; repoBtn.style.display=''; }
    else if (repoBtn) { repoBtn.style.display = 'none'; }

    $('#statCats').textContent = String(cats.length);
    $('#statUpdated').textContent = fmtDate(updated);
    $('#footUpdated').textContent = fmtDate(updated);
    $('#year').textContent = String(new Date().getFullYear());

    if (!cats.length) return renderEmpty('Belum ada kategori. Tambahkan di data/links.json');

    const allLinks = [];
    cats.forEach(cat => (cat.links || []).forEach(lnk => allLinks.push({cat, lnk})));
    const featured = allLinks.filter(({lnk}) => /wajib|prioritas/i.test((lnk.tag||'')) || lnk.pinned === true);

    if (featured.length) {
      $('#featured').style.display = '';
      $('#featuredGrid').innerHTML = featured.slice(0, 9).map(({cat, lnk}) => buildCard(lnk, cat.id)).join('');
    }

    const content = $('#content');
    content.innerHTML = cats.map(cat => {
      const links = (cat.links || []);
      const badge = `<span class="badge">${escapeAttr(cat.emoji || '📁')}</span>`;
      const cards = links.map(lnk => buildCard(lnk, cat.id)).join('');
      return `
        <section class="section" data-cat="${escapeAttr(cat.id)}">
          <div class="section-title">
            <div style="display:flex; align-items:center; gap:10px">
              ${badge}
              <h3>${escapeAttr(cat.name || cat.id)}</h3>
            </div>
            <div class="section-meta">${links.length} link</div>
          </div>
          <div class="grid">${cards || `<div class="empty"><p class="muted">Kategori ini masih kosong.</p></div>`}</div>
        </section>
      `;
    }).join('');

    initInteractions();

    const totalCards = $$('.card').length;
    $('#statLinks').textContent = String(totalCards);

    initSearchFilter();
  };

  load().then(render).catch(() => renderEmpty('Gagal load data/links.json. Pastikan file ada & format JSON benar.'));
})();
