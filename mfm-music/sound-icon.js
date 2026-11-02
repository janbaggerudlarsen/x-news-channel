// Sound icon (Grok Bot, 2 Nov 2026): hides the Webamp player and shows a retro speaker button
// ONLY when music is not actually audible (autoplay blocked, paused/stopped, muted or volume 0).
// Click it -> music starts with a 5 s fade-in and the icon hides. Load as a classic <script> in <head>,
// BEFORE the Webamp module, so the AudioContext can be watched. Uses window.mfmSetMusic(true) when the
// app provides it (keeps the app's own fade + M-key state), otherwise fades window.webamp itself.
(function () {
  const ctxs = [];
  ['AudioContext', 'webkitAudioContext'].forEach((n) => {
    const C = window[n]; if (!C || C.__mfmWrapped) return;
    const W = function (...a) { const c = new C(...a); ctxs.push(c); try { c.addEventListener('statechange', () => check()); } catch (e) {} return c; };
    W.prototype = C.prototype; W.__mfmWrapped = true; window[n] = W;
  });
  const css = document.createElement('style');
  css.textContent = `#webamp{visibility:hidden!important;pointer-events:none!important}
#soundIcon{position:fixed;left:8px;top:6px;z-index:2000;display:none;align-items:center;gap:6px;padding:3px 8px 3px 5px;
background:linear-gradient(#3b2f8f,#1d1660);border:2px solid #c9d4ff;border-radius:3px;box-shadow:0 0 0 1px #0b0b30,2px 2px 0 #000;
color:#ffd27a;font:14px/1 'Star4000','DejaVu Sans Mono',monospace;letter-spacing:1px;text-shadow:2px 2px 0 #000;cursor:pointer!important}
#soundIcon.show{display:flex}#soundIcon svg{width:22px;height:22px;display:block}
#soundIcon.show{animation:sndblink 1.6s steps(2) infinite}@keyframes sndblink{50%{border-color:#ffd27a}}`;
  (document.head || document.documentElement).appendChild(css);
  const FADE = 5000;
  let btn = null, fadeT = null;
  const wa = () => window.webamp;
  const vol = () => { try { return wa().store.getState().media.volume; } catch (e) { return null; } };
  const status = () => { try { return wa().getMediaStatus(); } catch (e) { return null; } };
  const audible = () => {
    if (!wa()) return false;
    if (status() !== 'PLAYING') return false;
    const v = vol(); if (v !== null && v <= 0 && !fadeT && !(window.mfmFading && window.mfmFading())) return false;
    if (ctxs.some((c) => c.state === 'suspended')) return false;
    return true;
  };
  function check() {
    if (!btn) return;
    const show = !!wa() && !audible();
    btn.classList.toggle('show', show);
    document.documentElement.dataset.sound = show ? 'off' : 'on';
  }
  const target = () => (window.mfmMusic && window.mfmMusic.volume) || 75;
  const turnOn = async () => {
    ctxs.forEach((c) => { if (c.state === 'suspended') c.resume().catch(() => {}); });
    if (typeof window.mfmSetMusic === 'function') { await window.mfmSetMusic(true); }
    else if (wa()) {
      clearInterval(fadeT); wa().setVolume(0); const t0 = Date.now();
      fadeT = setInterval(() => { const k = Math.min(1, (Date.now() - t0) / FADE); wa().setVolume(Math.round(target() * k)); if (k === 1) { clearInterval(fadeT); fadeT = null; } }, 100);
      await wa().play();
    }
    setTimeout(check, 300);
  };
  const init = () => {
    btn = document.createElement('button'); btn.id = 'soundIcon'; btn.type = 'button'; btn.title = 'Turn on sound';
    btn.innerHTML = '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path fill="#ffd27a" d="M1 5h3l4-3v12l-4-3H1z"/><path fill="#ff5a3c" d="M10 5h1v1h1v1h1V6h1V5h1v1h-1v1h-1v2h1v1h1v1h-1v-1h-1V9h-1v1h-1v1h-1v-1h1V9h1V7h-1V6h-1z"/></svg><span>SOUND</span>';
    btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); turnOn(); });
    document.body.appendChild(btn);
    setInterval(check, 500); check();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  // React to media events too (Webamp's <audio> elements are created dynamically).
  ['play', 'playing', 'pause', 'ended', 'volumechange'].forEach((ev) => document.addEventListener(ev, () => setTimeout(check, 50), true));
  window.mfmSoundCheck = () => check();
})();
