// Shared music player: Webamp + the CC0 / public-domain channels used by Multiplex.FM Weather
// (https://multiplexweather.com by Brian Roemmele). Tracks live next to this file; see CREDITS.txt.
// Usage (ES module):  import { startMusic } from './mfm-music/mfm-webamp.js'; await startMusic(document.getElementById('webamp-app'));
// Exposes window.webamp (Webamp instance) and window.mfmMusic = { channels, current, volume, setChannel(id) }.
import Webamp from "https://unpkg.com/webamp@next";

const base = new URL('./', import.meta.url);
const KEY = 'mfm-music-channel';

export async function startMusic(container, opts = {}) {
  const cfg = await (await fetch(new URL('channels.json', base), { cache: 'no-cache' })).json();
  const byId = Object.fromEntries(cfg.channels.map((c) => [c.id, c]));
  let current = opts.channel || localStorage.getItem(KEY) || cfg.default;
  if (!byId[current]) current = cfg.default;
  const shuffled = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const toTracks = (c) => shuffled(c.tracks).map((t) => ({
    metaData: { artist: t.artist, title: t.title },
    url: new URL(t.file, base).href,
    duration: t.duration_s || undefined,
  }));
  const volume = Math.round((cfg.volume ?? 0.55) * 100);
  const webamp = new Webamp({
    windowLayout: {
      main: { position: { top: 20, left: 0 }, shadeMode: true },
      playlist: { position: { top: 30, left: 0 }, shadeMode: true, closed: false },
    },
    availableSkins: [
      { url: "https://archive.org/cors/winampskin_Green-Dimension-V2/Green-Dimension-V2.wsz", name: "Green Dimension V2" },
      { url: "https://archive.org/cors/winampskin_mac_os_x_1_5-aqua/mac_os_x_1_5-aqua.wsz", name: "Mac OSX v1.5 (Aqua)" },
    ],
    initialTracks: toTracks(byId[current]),
  });
  window.webamp = webamp;
  webamp.setVolume(volume);
  webamp.toggleRepeat();
  webamp.toggleShuffle();
  window.mfmMusic = {
    channels: cfg.channels.map(({ id, name }) => ({ id, name })),
    get current() { return current; },
    volume,
    async setChannel(id) {
      if (!byId[id]) return;
      current = id; localStorage.setItem(KEY, id);
      const wasPlaying = webamp.getMediaStatus && webamp.getMediaStatus() === 'PLAYING';
      webamp.setTracksToPlay(toTracks(byId[id]));
      if (!wasPlaying) webamp.pause();
      window.dispatchEvent(new CustomEvent('mfm-channel', { detail: id }));
    },
  };
  // Optional <select> channel picker
  if (opts.picker) {
    const sel = opts.picker;
    sel.innerHTML = cfg.channels.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
    sel.value = current;
    sel.addEventListener('change', () => window.mfmMusic.setChannel(sel.value));
  }
  await webamp.renderWhenReady(container);
  return webamp;
}
