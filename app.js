// X News Channel — rotates category pages from news.json (driven by config.json). Static, relative paths only.
(() => {
  const qs = new URLSearchParams(location.search);
  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const W = 854, H = 480;
  let cfg = { title: 'X News Channel', timezone: 'Europe/Warsaw', page_seconds: 16, max_per_page: 6,
              stale_hours: 12, reload_minutes: 10, categories: [] };
  let autoStarted = false;
  let news = null, pages = [], idx = 0, paused = false, timer = null, newsError = null;

  if (qs.get('kiosk') === '1' || qs.get('kiosk') === 'true') document.body.classList.add('kiosk');
  if (qs.get('player') === '0') document.body.classList.add('no-player');

  // ---- scale the 854x480 canvas to the window ----
  const fit = () => {
    const k = Math.min(innerWidth / W, innerHeight / H);
    stage.style.left = '50%'; stage.style.top = '50%';
    stage.style.transform = `translate(${-W * k / 2}px, ${-H * k / 2}px) scale(${k})`;
  };
  addEventListener('resize', fit); fit();

  // ---- clock ----
  const tz = () => undefined; // public site: show the visitor's own local time
  const fmt = (d, o) => new Intl.DateTimeFormat('en-GB', { timeZone: tz(), ...o }).format(d);
  const tick = () => {
    const d = new Date();
    $('time').textContent = fmt(d, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    $('date').textContent = fmt(d, { weekday: 'short', month: 'short', day: 'numeric' })
      .replace(',', '').toUpperCase().replace(/^(\w+) (\d+) (\w+)$/, '$1 $3 $2');
  };
  setInterval(tick, 1000); tick();

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ago = (iso) => {
    const t = Date.parse(iso); if (!t) return '';
    const m = Math.max(0, Math.round((Date.now() - t) / 60000));
    return m < 60 ? `${m}M AGO` : m < 48 * 60 ? `${Math.round(m / 60)}H AGO` : `${Math.round(m / 1440)}D AGO`;
  };

  // ---- data ----
  const getJSON = async (u) => { const r = await fetch(`${u}?t=${Date.now()}`, { cache: 'no-store' }); if (!r.ok) throw new Error(`${u}: HTTP ${r.status}`); return r.json(); };
  const load = async () => {
    try { cfg = { ...cfg, ...(await getJSON('config.json')) }; } catch (e) { /* keep defaults */ }
    if (!autoStarted && autoplayWanted()) { autoStarted = true; startAutoplay(); }
    try { news = await getJSON('news.json'); newsError = null; } catch (e) { newsError = e; if (!news) news = null; }
    build();
  };

  const build = () => {
    const byId = {};
    (news?.categories || []).forEach((c) => { byId[c.id] = c; });
    const order = cfg.categories.length ? cfg.categories : (news?.categories || []);
    pages = order.map((c) => {
      const n = byId[c.id] || {};
      return { id: c.id, title: c.title || n.title, top: c.top || c.title || n.title, bottom: c.bottom || 'Headlines',
               stories: (n.stories || []).slice(0, cfg.max_per_page || 6) };
    }).filter((p) => p.stories.length);
    const start = qs.get('page');
    if (start) { const i = pages.findIndex((p) => p.id === start); if (i >= 0) idx = i; }
    if (idx >= pages.length) idx = 0;
    renderStatus(); renderTicker(); show(idx, true);
  };

  const isOld = () => {
    const t = Date.parse(news?.generated_at || '');
    return !t || (Date.now() - t) / 3600000 > (cfg.stale_hours || 12);
  };
  const renderStatus = () => {
    const t = Date.parse(news?.generated_at || '');
    const el = $('updated');
    if (!t) { el.textContent = 'NO NEWS DATA YET'; el.className = 'old'; return; }
    const d = new Date(t);
    const hhmm = fmt(d, { hour: '2-digit', minute: '2-digit', hour12: false });
    const sameDay = fmt(d, { dateStyle: 'short' }) === fmt(new Date(), { dateStyle: 'short' });
    el.textContent = `UPDATED ${sameDay ? '' : fmt(d, { weekday: 'short' }).toUpperCase() + ' '}${hhmm}` + (isOld() ? ' (OLD)' : '');
    el.className = isOld() ? 'old' : '';
  };

  const renderTicker = () => {
    const tt = $('tickerText');
    let html;
    if (!pages.length) html = '<span class="cat">X NEWS CHANNEL</span> &nbsp; Waiting for news.json &mdash; run the refresh to load headlines.';
    else html = pages.map((p) => p.stories.map((s) =>
      `<span class="cat">${esc(p.title).toUpperCase()}:</span> ${esc(s.title)}`).join('<span class="sep">&#9670;</span>'))
      .join('<span class="sep">&#9670;</span>');
    tt.innerHTML = html + '<span class="sep">&#9670;</span>';
    tt.getAnimations().forEach((a) => a.cancel());
    requestAnimationFrame(() => {
      const w = tt.scrollWidth;
      const pxPerSec = 70; // in canvas pixels
      tt.animate([{ transform: `translateX(${W}px)` }, { transform: `translateX(${-w}px)` }],
        { duration: ((w + W) / pxPerSec) * 1000, iterations: Infinity });
    });
  };

  const show = (i, instant) => {
    clearTimeout(timer);
    const ol = $('stories');
    const paint = () => {
      if (!pages.length) {
        $('tTop').textContent = 'X News'; $('tBottom').textContent = 'Channel';
        const why = newsError ? 'news.json could not be loaded.' : 'news.json has no stories yet.';
        ol.innerHTML = `<li class="empty"><div class="h">NO HEADLINES RIGHT NOW</div><div class="s">${why} The channel will check again every ${cfg.reload_minutes || 10} minutes.</div></li>`;
        $('pageno').textContent = '';
        return;
      }
      idx = (i + pages.length) % pages.length;
      const p = pages[idx];
      $('tTop').textContent = p.top; $('tBottom').textContent = p.bottom;
      ol.innerHTML = p.stories.map((s) =>
        `<li data-url="${esc(s.url)}" title="${esc(s.title)}"><div class="h">${esc(s.title)}</div>` +
        `<div class="s"><span class="ago">${ago(s.time)}</span>${esc(s.summary)}</div></li>`).join('');
      $('pageno').textContent = `${p.title.toUpperCase()} \u00b7 PAGE ${idx + 1} OF ${pages.length}`;
      document.title = `${p.title} — ${cfg.title || 'X News Channel'}`;
    };
    if (instant) paint(); else { ol.classList.add('out'); setTimeout(() => { paint(); ol.classList.remove('out'); }, 450); }
    if (!paused && pages.length > 1) timer = setTimeout(() => show(idx + 1), (cfg.page_seconds || 16) * 1000);
  };

  $('stories').addEventListener('click', (e) => {
    const li = e.target.closest('li[data-url]');
    if (li && !document.body.classList.contains('kiosk')) window.open(li.dataset.url, '_blank', 'noopener');
  });

  // ---- music: Webamp (music.js) with a 5 s fade-in whenever playback starts ----
  const FADE_MS = 5000; // fade to the music volume (0.55, like Multiplex.FM Weather)
  const target = () => (window.mfmMusic && window.mfmMusic.volume) || 55;
  let playing = false, fadeTimer = null;
  const musicBtn = $('ToggleMusic');
  const fadeIn = (wa) => {
    clearInterval(fadeTimer); wa.setVolume(0); const t0 = Date.now();
    fadeTimer = setInterval(() => {
      const k = Math.min(1, (Date.now() - t0) / FADE_MS); const v = Math.round(target() * k);
      wa.setVolume(v); document.documentElement.dataset.volume = v;
      if (k === 1) clearInterval(fadeTimer);
    }, 100);
  };
  const setMusic = async (on) => {
    const wa = window.webamp; if (!wa) return;
    if (on) { fadeIn(wa); await wa.play(); } else { clearInterval(fadeTimer); await wa.pause(); }
    playing = on;
    musicBtn.src = `images/ic_volume_${on ? 'up' : 'off'}_white_24dp_2x.png`;
    musicBtn.title = on ? 'Pause music (M)' : 'Play music (M)';
    document.documentElement.dataset.music = on ? 'playing' : 'off';
  };
  musicBtn.addEventListener('click', () => setMusic(!playing));
  // Autoplay: ?autoplay=1, or "autoplay": true in config.json (?autoplay=0 turns it off).
  // If the browser blocks sound until a user gesture, music starts (with the fade) on the first click or key.
  const isPlaying = () => window.webamp && window.webamp.getMediaStatus && window.webamp.getMediaStatus() === 'PLAYING';
  const startAutoplay = () => {
    const tryStart = (n = 0) => { if (window.webamp && document.querySelector('#main-window')) setMusic(true).catch(() => {}); else if (n < 60) setTimeout(() => tryStart(n + 1), 500); };
    tryStart();
    const onGesture = (e) => {
      if (e.type === 'keydown' && (e.key === 'm' || e.key === 'M')) return;
      if (e.target === musicBtn) return;
      removeEventListener('pointerdown', onGesture, true); removeEventListener('keydown', onGesture, true);
      if (!isPlaying() && window.webamp) setMusic(true).catch(() => {});
    };
    addEventListener('pointerdown', onGesture, true); addEventListener('keydown', onGesture, true);
  };
  const autoplayWanted = () => qs.get('autoplay') === '1' || (cfg.autoplay === true && qs.get('autoplay') !== '0');

  // ---- controls ----
  const togglePause = () => {
    paused = !paused;
    $('btnPause').src = `images/ic_${paused ? 'play_arrow' : 'pause'}_white_24dp_2x.png`;
    show(idx, true);
  };
  $('btnPrev').onclick = () => show(idx - 1);
  $('btnNext').onclick = () => show(idx + 1);
  $('btnPause').onclick = togglePause;
  $('btnFull').onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());
  addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(idx + 1);
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === ' ') { e.preventDefault(); togglePause(); }
    else if (e.key === 'm' || e.key === 'M') setMusic(!playing);
    else if (e.key === 'f' || e.key === 'F') $('btnFull').click();
  });
  let hideT = null;
  addEventListener('mousemove', () => { $('controls').classList.add('show'); clearTimeout(hideT); hideT = setTimeout(() => $('controls').classList.remove('show'), 2500); });

  load();
  setInterval(async () => {
    try { const n = await getJSON('news.json'); if (n.generated_at !== news?.generated_at) { news = n; newsError = null; build(); } else renderStatus(); }
    catch (e) { newsError = e; renderStatus(); }
  }, (cfg.reload_minutes || 10) * 60000);
})();
