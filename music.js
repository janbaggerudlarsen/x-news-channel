// Music: CC0 / public-domain channels as used by Multiplex.FM Weather (see mfm-music/CREDITS.txt).
import { startMusic } from './mfm-music/mfm-webamp.js';
startMusic(document.getElementById('webamp-app'), { picker: document.getElementById('channelPick') })
  .catch((e) => console.warn('music unavailable', e));
