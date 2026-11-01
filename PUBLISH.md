# Publishing / updating the public X News Channel

Live site: https://janbaggerudlarsen.github.io/x-news-channel/  (GitHub Pages, branch `main`, folder `/`)
Repo: https://github.com/janbaggerudlarsen/x-news-channel  (local working copy: /workspace/x-news-channel-public on the Grok Bot box)

This public copy is for sharing only. Jan's Mac and T570 keep using their local copies on 127.0.0.1 (8077/8078/8079).

## Update the headlines (news.json)
1. Rebuild the raw X News searches as in `/workspace/x-news-channel/REFRESH.md` steps 1-4 (the Poland queries can be skipped).
2. If category rules changed in `/workspace/x-news-channel/site/config.json`, copy them into this folder's `config.json`
   WITHOUT the `poland` entry (keep `"autoplay": true` here).
3. Build the public news.json (no Poland page):
   `python3 /workspace/x-news-channel/build_news.py --config /workspace/x-news-channel-public/config.json --out /workspace/x-news-channel-public/news.json --exclude poland`
4. Check: `grep -ci '"id": "poland"' news.json` must print 0.
5. Commit and push:
   `cd /workspace/x-news-channel-public && git add news.json config.json && git commit -m "Update headlines" && git push`
   GitHub Pages redeploys within about a minute. The page re-reads news.json every 10 minutes.

## Notes
- Keep every file under GitHub's 100 MB per-file limit (largest music file is far below). No git LFS: Pages does not serve LFS files.
- `app.js` here differs from the local app in one line: the clock shows the visitor's own local time.
- Music: CC0 / public-domain tracks from Multiplex.FM Weather, credits in mfm-music/CREDITS.txt. Credit to Brian Roemmele /
  multiplexweather.com stays on the page together with the "Unofficial fan project, not affiliated with X Corp" line.
