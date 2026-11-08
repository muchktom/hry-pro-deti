# Hry pro děti

Browser games for children, each in its own folder, published together on GitHub Pages.

- Repo: https://github.com/muchktom/hry-pro-deti (public; GitHub Pages needs that on this plan)
- Live site: https://muchktom.github.io/hry-pro-deti/ (each game lives at `.../<folder>/`)
- Pages publishes the `main` branch root directly, with no build step or workflow. A push is live in about a minute.

## Ground rules

- **Plain static files only**: HTML + CSS + vanilla JS, no build tools, no npm, no bundler. Every game must work when opened from Pages as-is.
- **All paths relative** (`css/style.css`, `../`). Never use absolute paths like `/css/...`, because the site lives under `/hry-pro-deti/`.
- **Czech UI.** All player-facing text is in Czech (`<html lang="cs">`). Code, comments and commit messages may be in either Czech or English; follow the existing file.
- **Audience is small children**: big touch targets (≥ 64px), no text-heavy screens, no reliance on hover or keyboard alone, forgiving controls, no external links other than back to the game list, no ads, tracking or analytics.
- **Mobile first**: every game must be playable by touch on a phone/tablet as well as with a mouse.
- Not every folder here is published. A game folder is pushed only when the user says so. Check `git status` before assuming a game is live, and never `git add -A` / `git add .`.

## Checklist: adding a new game

1. **Folder**: kebab-case, ASCII, no diacritics (`valka-statu`, `gabiny-telefon`). Entry point is `<folder>/index.html`; keep assets inside the folder (`css/`, `js/`, images).

2. **`<head>` essentials** (copy from [valka-statu/index.html](valka-statu/index.html)):
   ```html
   <meta charset="utf-8">
   <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
   <title>Název hry</title>
   <meta name="theme-color" content="#...">
   <meta name="mobile-web-app-capable" content="yes">
   <meta name="apple-mobile-web-app-capable" content="yes">
   <link rel="icon" href="icon.svg" type="image/svg+xml">
   <link rel="apple-touch-icon" href="apple-touch-icon.png">
   <link rel="manifest" href="manifest.webmanifest">
   ```

3. **Icon**: design an original `icon.svg` (512×512 viewBox) that reflects the game. Make it **full-bleed**: a square background filling the whole canvas, no rounded corners, no transparency, because phones apply their own mask. Keep the important shapes inside the central ~80% so the Android maskable crop doesn't clip them. Use bold shapes with dark outlines in the game's own colours; no text, and no emoji (they render differently per platform). Then run:
   ```
   tools/render-icons.sh <folder>
   ```
   That produces `icon-512.png`, `icon-192.png` and `apple-touch-icon.png`. Look at the 512 PNG with the Read tool before committing.

4. **Manifest**: `<folder>/manifest.webmanifest` (copy [valka-statu/manifest.webmanifest](valka-statu/manifest.webmanifest)). Set `name`, `short_name` (≤ 12 chars so it fits under the home-screen icon), `start_url: "./"`, `scope: "./"`, colours, `display` (`fullscreen` for games), and `orientation` if the game needs one. The PNG icons use `"purpose": "any maskable"`.

5. **Back to the game list**: the game must offer a way back to the landing page with a link to `../` labelled **„← Všechny hry“** (or a 🏠 icon with `aria-label="Všechny hry"`). Put it in the game's own menu/start screen and on the end screen (win/lose/game over), styled to match the game. Don't overlay it on the playfield, where children would tap it by accident. Examples:
   - `valka-statu/js/ui.js`: `.allgames` link in the menu and win/lose overlays
   - `gabiny-telefon/index.html`: button on the splash screen plus a faint 🏠 corner button on the home screen

6. **Register on the landing page**: add a card to the list in [index.html](index.html), newest at the bottom unless the user says otherwise:
   ```html
   <li><a class="game <key>" href="<folder>/">
     <img src="<folder>/icon.svg" alt="">
     <div class="text"><b>Název hry</b><span>Krátká věta, o čem hra je</span></div>
   </a></li>
   ```
   Also add a colour rule next to `.valka`, `.gabi` and `.hodiny` in the `<style>`. Use the game's main colour: `--c` for the border and button, `--c-dark` for the 3D shadow, and `--c-soft` for a pale press/hover background. Pick a colour clearly different from the existing cards. Keep the tagline short (about 4–6 words, in Czech).

7. **Service worker (only if the game has one)**: when game files change, bump the cache name in its `sw.js` (e.g. `gabin-telefon-v7` → `v8`), and list any new files in its precache array. Also bump the `?v=` query on the game's `<script>`/`<link>` tags in `index.html` (e.g. `js/app.js?v=11`): Pages sends `max-age=600`, so without it a phone can mix a fresh `index.html` with stale cached JS.

8. **Check it before pushing**: serve the repo root locally (`python3 -m http.server 8765` from the repo root, so `../` resolves to the landing page) and take headless Chrome screenshots at desktop (1280×800) and phone (390×844) sizes. Headless Chrome can't really go narrower than ~500px, so a slight right shift in "phone" shots is a rendering artifact, not a bug. Stop the server afterwards.

9. **Commit and push** (only when the user asks): `git add <folder> index.html`. After pushing, wait ~1 minute, then `curl` the live URLs (`/`, `/<folder>/`, the icon and the manifest) and confirm they return 200 before reporting it's live.

## Changing an existing game

- Keep the back link, icon and manifest working; if the game's look changes a lot, update the icon too.
- Tell the user that existing home-screen shortcuts keep their old icon until they delete the shortcut and add it again.
- Bump the service-worker cache name if the game has one.

## Platform notes

- Pages serves over HTTPS, so microphone, speech recognition, service workers and "Add to Home Screen" all work there. No local server is needed for playing; it's only useful for testing unpushed changes (`localhost` also counts as secure).
- An installed game (home-screen app) whose manifest `scope` is its own folder opens the `../` landing page in an in-app browser sheet. That's expected.
- Google Fonts are OK (already used), but a game must still be playable if the font fails to load.
