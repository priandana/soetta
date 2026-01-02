(() => {
  const root = document.documentElement;
  const themeKey = 'linkhub_theme_v3';
  const btn = document.getElementById('themeToggle');

  const setTheme = (t) => {
    if (t === 'light') root.setAttribute('data-theme','light');
    else root.removeAttribute('data-theme');
    localStorage.setItem(themeKey, t);
    if (btn) btn.querySelector('.i').textContent = (t === 'light') ? '☀️' : '🌙';
  };

  const saved = localStorage.getItem(themeKey);
  if (saved) setTheme(saved);

  btn?.addEventListener('click', () => {
    const cur = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    setTheme(cur === 'light' ? 'dark' : 'light');
  });

  // back to top
  const toTop = document.getElementById('toTop');
  const onScroll = () => {
    if (!toTop) return;
    toTop.classList.toggle('show', window.scrollY > 520);
  };
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
  toTop?.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));
})();
