// Securhat landing page. Loads exactly three JSON files and builds the whole interface from them:
//   data/content.json       words and images (Indonesian and English)
//   data/config.json        brand, theme, navigation, layout, animation, responsive settings, links
//   data/interactions.json  behaviour: accordion, tabs, modals, counters, actions, scroll animations
// The page it runs on tells it where it is: <html lang> is the language, <body data-root> the way back to the site root and
// <body data-page> either "home" (the landing page) or "doc" (a text page such as the privacy policy: header and footer only).

import { renderHeader, renderFooter, renderSections } from "./sections.js";
import { initParallax, startWhenVisible } from "./fx.js";
import { initActions, initNav, initFaq, initScenes, renderModals, initCounters, initReveal } from "./ui.js";

const root = document.body.dataset.root || "./";
const page = document.body.dataset.page || "home";
const lang = document.documentElement.lang === "en" ? "en" : "id";

async function loadJson(name) {
  const res = await fetch(`${root}data/${name}.json`);
  if (!res.ok) throw new Error(`${name}.json: HTTP ${res.status}`);
  return res.json();
}

// The theme from config.json becomes CSS variables, so a change of colour or type is a change of data.
function applyTheme(config) {
  const style = document.documentElement.style;
  const { colors, typography, shape } = config.theme;
  const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  for (const [k, v] of Object.entries(colors)) style.setProperty(`--${kebab(k)}`, v);
  for (const [k, v] of Object.entries(typography)) style.setProperty(`--${kebab(k)}`, v);
  for (const [k, v] of Object.entries(shape)) style.setProperty(`--${kebab(k)}`, v);
  const a = config.animation.characters;
  style.setProperty("--float-amp", `${a.float.amplitudePx}px`);
  style.setProperty("--float-tilt", `${a.float.tiltDeg}deg`);
  style.setProperty("--float-dur", `${a.float.durationMs}ms`);
  style.setProperty("--ent-dur", `${a.entrance.durationMs}ms`);
  style.setProperty("--ent-blur", `${a.entrance.blurPx}px`);
  style.setProperty("--glow", a.glow);
  document.querySelector("meta[name=theme-color]")?.setAttribute("content", colors.bg);
}

// data-vp (mobile / tablet / desktop) and data-menu (collapsed / open) follow the breakpoints in config.json; CSS uses them, so the
// numbers live in one place. Column counts become variables for the grids.
function watchViewport(config) {
  const { breakpoints } = config.responsive;
  const collapse = config.responsive.menu.collapseBelow;
  const apply = () => {
    const w = innerWidth;
    const vp = w <= breakpoints.mobile ? "mobile" : w <= breakpoints.tablet ? "tablet" : "desktop";
    const el = document.documentElement;
    const changed = el.dataset.vp !== vp;
    el.dataset.vp = vp;
    el.dataset.menu = w < collapse ? "collapsed" : "full";
    for (const [name, cols] of Object.entries(config.responsive.columns)) el.style.setProperty(`--cols-${name}`, cols[vp]);
    if (changed) document.dispatchEvent(new Event("vpchange"));
  };
  addEventListener("resize", apply);
  apply();
}

function applyMeta(t) {
  document.title = t.meta.title;
  document.querySelector("meta[name=description]")?.setAttribute("content", t.meta.description);
}

// root + path without leftovers like ".././": ("../", "./") -> "../", ("./", "en/") -> "./en/", ("../", "en/privacy/") -> "../en/privacy/"
const join = (base, path) => (path === "./" ? base : path.startsWith("./") ? base + path.slice(2) : base + path);

async function main() {
  const [content, config, interactions] = await Promise.all([loadJson("content"), loadJson("config"), loadJson("interactions")]);
  const anim = config.animation;
  const motion = anim.enabled && !(anim.respectReducedMotion && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const langInfo = config.languages.available.find((l) => l.code === lang);
  const ctx = {
    root, page, lang, content, config, interactions, motion,
    t: content[lang],
    join,
    langHome: join(root, langInfo.home),
    visible: new Set(config.layout.sections.filter((s) => s.visible).map((s) => s.id)),
  };

  document.documentElement.dataset.motion = motion ? "on" : "off";
  document.documentElement.dataset.sticky = String(config.layout.headerSticky);
  applyTheme(config);
  watchViewport(config);

  if (page === "home") {
    applyMeta(ctx.t);
    const main = document.createElement("main");
    main.id = "main";
    main.append(...renderSections(ctx));
    document.getElementById("app").replaceChildren(renderHeader(ctx), main, renderFooter(ctx));
  } else {
    document.getElementById("site-header")?.replaceWith(renderHeader(ctx));
    document.getElementById("site-footer")?.replaceWith(renderFooter(ctx));
  }

  initActions(ctx);
  initNav(ctx);
  if (page === "home") {
    renderModals(ctx);
    initFaq(ctx);
    initScenes(ctx);
    initCounters(ctx);
    initReveal(ctx);

    const hero = document.getElementById("hero");
    if (hero) {
      const p = anim.hero.parallax;
      if (motion && p.enabled) initParallax(hero, { pointerStrength: p.pointerStrength, scrollStrength: p.scrollStrength });
      if (motion) startWhenVisible(hero, [...hero.querySelectorAll(".char img")]);
      else hero.classList.add("in");
    }
  }
  document.documentElement.dataset.ready = "true";
}

main().catch((err) => {
  console.error("The page could not start:", err);
  document.documentElement.dataset.failed = "true";
  const note = document.getElementById("boot-error"); // its words are in the page itself: the JSON files are what failed
  if (note) note.hidden = false;
});
