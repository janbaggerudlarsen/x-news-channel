X News Channel — a Weatherscan / WeatherStar 4000-style news channel (static site).

Files: index.html, app.css, app.js, music.js, config.json (categories, order, timing), news.json (data).
Data: news.json is built from X News stories (search_news) by build_news.py; it is a summary of posts on X
and may evolve. Look & feel and fonts adapted from ws4kp / ws4kp-international (MIT, see LICENSE-ws4kp.txt).
Inspired by Multiplex Weather by Brian Roemmele (@BrianRoemmele) - https://multiplexweather.com - https://x.com/BrianRoemmele
Music: CC0 tracks as used by Multiplex.FM Weather (music selection from Multiplex.FM Weather: CC0 1.0 and US public-domain
recordings, hosted in mfm-music/; full credits and sources in mfm-music/CREDITS.txt). Player: Webamp (MIT, from unpkg).
Default channel Standard (smooth jazz) at volume 0.55; pick another channel in the controls (top right, move the mouse).
URL options: ?autoplay=1  ?kiosk=1  ?page=<id>  ?player=0
Keys: ←/→ page, space pause, M music (fades in over 5 s), F fullscreen. Click a headline to open it on x.com.
Built with Grok Bot.
Public site: music is set to autoplay (fading in over 5 s to volume 55); browsers block sound until the visitor clicks or
presses a key, so it starts on the first click/key. Clock shows the visitor's local time. ?autoplay=0 keeps it silent.
Unofficial fan project, not affiliated with X Corp. Headlines from public X news.
