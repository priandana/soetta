
(() => {
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
    return '📄';
  };

  const colorClass = (c) => {
    const map = {
      indigo:'bg-indigo', emerald:'bg-emerald', amber:'bg-amber', rose:'bg-rose',
      sky:'bg-sky', violet:'bg-violet', slate:'bg-slate'
    };
    return map[c] || 'bg-indigo';
  };

  const content = document.getElementById('content');
  const siteTitle = document.getElementById('siteTitle');
  const siteSubtitle = document.getElementById('siteSubtitle');

  const statCats = document.getElementById('statCats');
  const statUpdated = document.getElementById('statUpdated');

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const load = async () => {
    const res = await fetch('data/links.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Gagal load links.json');
    return await res.json();
  };

  const renderEmpty = (msg) => {
    content.innerHTML = `
      <div class="empty">
        <h2>Belum ada link</h2>
        <p>${msg || 'Isi data/links.json untuk menambahkan link.'}</p>
      </div>
    `;
  };

  const render = (data) => {
    const cats = data.categories || [];
    if (statCats) statCats.textContent = String(cats.length);
    if (statUpdated) statUpdated.textContent = fmtDate(data.updated_at || Date.now());

    if (data.site?.title) document.title = data.site.title;
    if (data.site?.title && siteTitle) siteTitle.textContent = data.site.title;
    if (data.site?.subtitle && siteSubtitle) siteSubtitle.textContent = data.site.subtitle;
    if (data.site?.brand) {
      const logo = document.querySelector('.logo');
      if (logo) logo.textContent = (data.site.brand || 'P').slice(0,1).toUpperCase();
      const footerBrand = document.querySelector('.footer .muted');
      if (footerBrand) footerBrand.innerHTML = `© <span id="year"></span> ${data.site.brand} • LinkHub`;
      const y = document.getElementById('year'); if (y) y.textContent = String(new Date().getFullYear());
    }

    if (!cats.length) return renderEmpty('Belum ada kategori. Tambahkan di data/links.json');

    const sections = cats.map(cat => {
      const links = cat.links || [];
      const cards = links.map(lnk => {
        const host = (() => { try { return new URL(lnk.url).host; } catch { return 'Google Sheets'; } })();
        return `
          <article class="card"
            data-title="${(lnk.title||'').replaceAll('"','&quot;')}"
            data-desc="${(lnk.desc||'').replaceAll('"','&quot;')}"
            data-tag="${(lnk.tag||'').replaceAll('"','&quot;')}"
            data-url="${(lnk.url||'').replaceAll('"','&quot;')}"
            data-cat="${(cat.id||'')}"
          >
            <div class="card-top">
              <div class="icon">${iconEmoji(lnk.icon || 'sheet')}</div>
              ${lnk.tag ? `<div class="tag">${lnk.tag}</div>` : ``}
            </div>
            <h3>${lnk.title || ''}</h3>
            <p>${lnk.desc || ''}</p>
            <div class="card-actions">
              <a class="btn" target="_blank" rel="noopener" href="${lnk.url}">Buka</a>
              <button class="btn ghost copyBtn" type="button" data-copy="${lnk.url}">Copy</button>
            </div>
            <div class="card-foot">
              <span class="muted">Update: ${fmtDate(lnk.updated_at || data.updated_at || Date.now())}</span>
              <span class="dot">•</span>
              <span class="muted">${host}</span>
            </div>
          </article>
        `;
      }).join('');

      return `
        <section class="section" data-cat="${cat.id}">
          <div class="section-head">
            <h2><span class="pill ${colorClass(cat.color)}">${cat.emoji || '📁'}</span> ${cat.name || ''}</h2>
            <div class="muted">${links.length} link</div>
          </div>
          <div class="grid">${cards}</div>
        </section>
      `;
    }).join('');

    content.innerHTML = sections;

    // Provide data to search/filter script
    window.__LINKHUB__ = data;

    // re-run app.js logic for copy buttons (app.js attaches by querySelectorAll at load)
    // We'll trigger a custom event app.js listens? none. So we do minimal attach here too.
    const toast = (msg) => {
      const el = document.getElementById('toast');
      if (!el) return;
      el.textContent = msg;
      el.classList.add('show');
      setTimeout(()=>el.classList.remove('show'), 1600);
    };
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

    // Now call app.js filter setup by dispatching a reload-like init if available
    // app.js is an IIFE; it already ran before render. We'll implement light-weight filter here:
    const q = document.getElementById('q');
    const clearBtn = document.getElementById('clearBtn');
    const chipsEl = document.getElementById('chips');

    const cardsEls = Array.from(document.querySelectorAll('.card'));
    const statLinks = document.getElementById('statLinks');
    if (statLinks) statLinks.textContent = String(cardsEls.length);

    const catIds = Array.from(new Set(cardsEls.map(c => c.dataset.cat))).filter(Boolean);
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
      catIds.forEach(id => {
        const sec = document.querySelector(`[data-cat="${CSS.escape(id)}"] h2`);
        const label = sec ? sec.textContent.trim().replace(/\s+/g,' ') : id;
        chipsEl.appendChild(mk(id, label));
      });
    };

    const apply = () => {
      const term = (q?.value || '').trim().toLowerCase();
      let visibleCount = 0;

      cardsEls.forEach(card => {
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

      document.querySelectorAll('section.section').forEach(sec => {
        const any = Array.from(sec.querySelectorAll('.card')).some(c => c.style.display !== 'none');
        sec.style.display = any ? '' : 'none';
      });

      if (statLinks) statLinks.textContent = String(visibleCount);
    };

    q?.addEventListener('input', apply);
    clearBtn?.addEventListener('click', () => { if (q) q.value=''; activeCat='all'; renderChips(); apply(); });

    renderChips();
    apply();
  };

  load()
    .then(render)
    .catch(() => renderEmpty('Gagal load data/links.json. Pastikan file ada dan format JSON benar.'));
})();
