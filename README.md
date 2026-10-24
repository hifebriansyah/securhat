# securhat.com (landing page)

An interactive landing page for the apex domain `securhat.com`. It is plain HTML, CSS and JavaScript (no build step, no libraries) and it
draws itself from **exactly three JSON files**. The apps live on subdomains (`omonomon.securhat.com`, ...) and are separate projects.

## The three JSON files (`data/`)

| File | Holds |
|---|---|
| `content.json` | All words, in Indonesian (`id`) and English (`en`): hero, features, the ghosts (with their first greetings), about, FAQ, contact, footer. Also the image references and the picture size of each character (`ghosts[].size`). |
| `config.json` | Brand and logo, theme (colours, type, shape), navigation, which sections show and in what order, animation preferences (parallax, floating ghosts, entrance), responsive settings (breakpoints, columns, hero images), social links, button destinations (`cta`), and the icons. |
| `interactions.json` | Behaviour: button actions, FAQ accordion, tabs, modal content, counters and scroll-triggered animations. |

Nothing the visitor reads, no menu item, list or interaction is written in the code: change the JSON and the page changes. (The `<title>`,
description and share tags in each page's `<head>` repeat the text from `content.json` for search engines and link previews, and there is a
short fallback sentence in each page for when JavaScript is off or a file fails to load.)

## The pages and the code

```
index.html, en/index.html       the home page in Indonesian and English: only a head and an empty #app
privacy/index.html, en/...      the privacy policy (static text); header and footer come from the JSON too
404.html                        not-found page (plain, from the root)
styles.css                      all styling, using the theme variables that config.json sets
assets/js/app.js                loads the three files, applies the theme, builds the page, starts everything
assets/js/sections.js           draws each section from the JSON
assets/js/ui.js                 menu, accordion, tabs, modals, counters, scroll reveals, button actions
assets/js/fx.js                 the scene effects: parallax and the ghosts floating above the background
assets/js/dom.js                small DOM helpers
assets/bg/                      backgrounds only (no characters)
assets/chars/                   characters only (transparent), one per ghost
assets/                         picture for link previews (omonomon.jpg), favicon, app icon
ads.txt, CNAME, .nojekyll, robots.txt, sitemap.xml
```

**Characters above backgrounds.** The hero and the "Meet the ghosts" tabs (each ghost with her first greeting in a comic speech bubble) put a transparent character picture over a background-only
picture. The ghosts materialise (a slow fade from blurry), then float and sway, and move a little with the pointer and the scroll. All of
it is tunable in `config.json > animation`. Each character box takes its shape from the picture's own size in `content.json`, so a wide
ghost is never squeezed. With "reduce motion" set in the visitor's system (or `animation.enabled: false`), everything is shown still.

**Adding or changing things.** A new section: write a builder in `sections.js`, list it in `config.json > layout.sections` and add its
words to both languages in `content.json`. A new FAQ entry or feature: add it to the list in `content.json` (both languages). Colours or
fonts: `config.json > theme`. A new modal: add it to `interactions.json > modals` and point an action at it.

To preview: `python3 -m http.server 8790` in this folder, then open http://localhost:8790/ (the JSON files must be fetched over http, not
opened as files). All paths are relative, so it also works from a subfolder.

## Put it on GitHub Pages as securhat.com

1. Push this folder's contents to the `main` branch of the repository (the files, not the folder itself).
2. Repository > Settings > Pages: Source "Deploy from a branch", branch `main`, folder `/ (root)`. Custom domain `securhat.com` (the
   `CNAME` file already says it). Tick "Enforce HTTPS" once the certificate is ready.
3. DNS (Cloudflare, zone `securhat.com`), with the proxy off (grey cloud) until GitHub has issued the certificate: four `A` records on `@`
   (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`) and a `CNAME` `www` to `hifebriansyah.github.io`. These are already set.

## Google AdSense

`ads.txt` is in this folder (`google.com, pub-5724793194530247, DIRECT, f08c47fec0942fa0`) and must be reachable at
https://securhat.com/ads.txt. For verification AdSense also accepts a meta tag in `<head>`:
`<meta name="google-adsense-account" content="ca-pub-5724793194530247">`. Keep `/privacy/` linked from every page and the contact email working.

Icons in `config.json` are from Lucide (https://lucide.dev, ISC License).
