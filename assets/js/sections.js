// Draws the page from the three JSON files. Nothing is written here as site copy: every string, link, list and number comes from
// data/content.json (words and images), data/config.json (brand, navigation, layout, theme) or data/interactions.json (behaviour).

import { h, icon, get, viewport } from "./dom.js";

const ghostById = (ctx, id) => ctx.content.ghosts.find((g) => g.id === id);

// ---- shared pieces ----

function sectionHead(title, intro, id) {
  return h("div", { class: "section-head", "data-reveal": "fade-up" },
    h("h2", { id: `${id}-title` }, title),
    intro ? h("p", { class: "lead" }, intro) : null);
}

export function actionButton(ctx, label, actionName, className = "button") {
  return h("button", { type: "button", class: className, dataset: { action: actionName } }, label);
}

// ---- header and footer ----

export function renderHeader(ctx) {
  const { config, t, lang, page } = ctx;
  const home = ctx.langHome;
  const brand = config.brand;
  const onHome = page === "home";
  const here = config.languages.available.find((l) => l.code === lang);
  const other = config.languages.available.find((l) => l.code !== lang);

  const nav = h("nav", { id: "site-nav", class: "nav", "aria-label": t.ui.menu },
    config.navigation.filter((item) => ctx.visible.has(item.id) || !onHome).map((item) =>
      h("a", { href: onHome ? item.target : `${home}${item.target}`, dataset: { nav: item.id } }, item.label[lang])),
    h("a", { class: "lang", href: ctx.join(ctx.root, other.home), hreflang: other.code, lang: other.code, "aria-label": `${t.ui.language}: ${other.label}` }, other.label));

  const toggle = h("button", { type: "button", class: "nav-toggle", "aria-expanded": "false", "aria-controls": "site-nav", "aria-label": t.ui.menu },
    icon(config, "menu", "icon icon-open"), icon(config, "close", "icon icon-close"));

  return h("header", { class: "site-header" },
    h("a", { class: "skip", href: onHome ? "#main" : "#content" }, t.ui.skipToContent),
    h("div", { class: "wrap bar" },
      h("a", { class: "brand", href: home, "aria-label": brand.name }, brand.logo.text, h("span", {}, brand.logo.accent)),
      toggle, nav));
}

export function renderFooter(ctx) {
  const { config, t, lang, page } = ctx;
  const f = t.footer;
  const docsHref = ctx.join(ctx.root, config.languages.available.find((l) => l.code === lang).docs);
  const email = config.cta.contactEmail;
  const column = (title, items) => h("nav", { class: "foot-col", "aria-label": title },
    h("h2", {}, title), h("ul", {}, items));
  return h("footer", { class: "site-footer" },
    h("div", { class: "wrap foot" },
      h("div", { class: "foot-brand" },
        h("a", { class: "brand", href: ctx.langHome, "aria-label": config.brand.name }, config.brand.logo.text, h("span", {}, config.brand.logo.accent)),
        h("p", {}, f.tagline),
        h("p", { class: "foot-copy" }, f.text)),
      column(f.exploreTitle, config.navigation.map((item) =>
        h("li", {}, h("a", { href: page === "home" ? item.target : `${ctx.langHome}${item.target}` }, item.label[lang])))),
      column(f.moreTitle, [
        ...f.links.map((l) => h("li", {}, h("a", { href: l.href === "docs" ? docsHref : l.href }, l.label))),
        h("li", {}, h("a", { href: `mailto:${email}` }, email)),
      ])));
}

// ---- sections ----

function hero(ctx) {
  const { config, t, content } = ctx;
  const assets = content.assets.hero;
  const switchAt = config.responsive.hero.backgroundSwitchAt;
  const anim = config.animation.hero;
  const vh = config.responsive.hero.minHeightVh;

  const chars = anim.characters.map((c) => {
    const ghost = ghostById(ctx, c.id);
    return h("div", {
      class: "char",
      style: {
        "--l-d": `${c.desktop.left}%`, "--h-d": `${c.desktop.height}%`,
        "--l-m": `${c.mobile.left}%`, "--h-m": `${c.mobile.height}%`,
        "--depth": c.depth, "--ar": ghost.size[0] / ghost.size[1], "--ent-delay": `${c.entranceDelayMs}ms`,
        "--float-delay": `${(Number(c.id) - 1) * config.animation.characters.float.staggerMs}ms`,
      },
    }, h("img", { class: "float", src: ctx.root + ghost.character, alt: "", width: ghost.size[0], height: ghost.size[1], decoding: "async" }));
  });

  const cta = t.hero.cta;
  return h("section", { id: "hero", class: "hero", "aria-labelledby": "hero-title",
    style: { "--hero-vh-d": `${vh.desktop}svh`, "--hero-vh-m": `${vh.mobile}svh`, "--hero-min-d": `${config.responsive.hero.minHeightPx.desktop}px`, "--hero-min-m": `${config.responsive.hero.minHeightPx.mobile}px`, "--bgdepth": anim.parallax.backgroundDepth, "--bgscale": anim.parallax.backgroundScale } },
    h("picture", { class: "hero-bg" },
      h("source", { media: `(max-width: ${switchAt - 1}px)`, srcset: ctx.root + assets.tall }),
      h("img", { src: ctx.root + assets.wide, alt: t.hero.backgroundAlt, fetchpriority: "high", decoding: "async" })),
    h("div", { class: "hero-shade", "aria-hidden": "true" }),
    h("div", { class: "hero-chars", "aria-hidden": "true" }, chars),
    h("div", { class: "wrap hero-copy" },
      h("h1", { id: "hero-title" }, t.hero.headline),
      h("p", { class: "hero-sub" }, t.hero.subtitle),
      h("div", { class: "hero-cta" },
        actionButton(ctx, cta.primary.label, cta.primary.action),
        actionButton(ctx, cta.secondary.label, cta.secondary.action, "button button-ghost"))));
}

function stats(ctx) {
  const items = ctx.interactions.counters.items;
  return h("section", { id: "stats", class: "section stats-band", "aria-label": ctx.t.features.title },
    h("div", { class: "wrap stats" }, items.map((item) =>
      h("div", { class: "stat", "data-reveal": "scale-in" },
        h("b", { dataset: { counter: item.id } }, `${item.prefix || ""}${item.to}${item.suffix || ""}`),
        h("span", {}, ctx.t.stats.items[item.id])))));
}

function features(ctx) {
  const f = ctx.t.features;
  return h("section", { id: "features", class: "section", "aria-labelledby": "features-title" },
    h("div", { class: "wrap" },
      sectionHead(f.title, f.intro, "features"),
      h("div", { class: "grid grid-features" }, f.items.map((item) =>
        h("article", { class: "card feature", "data-reveal": "fade-up" },
          h("span", { class: "feature-icon" }, icon(ctx.config, item.icon)),
          h("h3", {}, item.title),
          h("p", {}, item.text),
          item.action ? actionButton(ctx, item.actionLabel, item.action, "link-button") : null)))));
}

function ghosts(ctx) {
  const g = ctx.t.ghosts;
  return h("section", { id: "ghosts", class: "section", "aria-labelledby": "ghosts-title" },
    h("div", { class: "wrap" },
      sectionHead(g.title, g.intro, "ghosts"),
      h("div", { class: "grid grid-ghosts" }, ctx.content.ghosts.map((ghost, i) => {
        const info = g.items[ghost.id];
        return h("article", { class: "ghost-card", style: { "--c": ghost.accent }, "data-reveal": "fade-up" },
          // the background on its own, with the character above it and her first greeting in a comic speech bubble
          h("div", { class: "stage stage-speaking", dataset: { scene: "" }, style: { "--c": ghost.accent, "--float-delay": `${i * ctx.config.animation.characters.float.staggerMs}ms` } },
            h("img", { class: "stage-bg", src: ctx.root + ctx.content.assets.stage, alt: "", loading: "lazy", decoding: "async", style: { "object-position": ctx.content.assets.stagePositions[i % ctx.content.assets.stagePositions.length] } }),
            h("div", { class: "stage-char", style: { "--ar": ghost.size[0] / ghost.size[1] } },
              h("img", { class: "float", src: ctx.root + ghost.character, alt: info.alt, width: ghost.size[0], height: ghost.size[1], loading: "lazy", decoding: "async" })),
            h("blockquote", { class: "speech" }, h("p", {}, info.quote))),
          h("div", { class: "ghost-body" },
            h("h3", {}, ghost.name),
            h("span", { class: "kind" }, info.kind),
            h("p", { class: "ghost-text" }, info.text),
            h("p", { class: "ghost-game" }, h("b", {}, `${ctx.t.ui.gameLabel}: ${ghost.game}`), ` · ${info.gameText}`)));
      }))));
}

function about(ctx) {
  const a = ctx.t.about;
  return h("section", { id: "about", class: "section", "aria-labelledby": "about-title" },
    h("div", { class: "wrap" },
      sectionHead(a.title, null, "about"),
      a.paragraphs.map((p) => h("p", { class: "prose", "data-reveal": "fade-up" }, p)),
      a.aiLink ? h("p", { "data-reveal": "fade-up" }, actionButton(ctx, a.aiLink, "openAi", "link-button")) : null));
}

function faq(ctx) {
  const f = ctx.t.faq;
  return h("section", { id: "faq", class: "section", "aria-labelledby": "faq-title" },
    h("div", { class: "wrap" },
      sectionHead(f.title, f.intro, "faq"),
      h("div", { class: "faq", dataset: { faq: "" } }, f.items.map((item) =>
        h("div", { class: "faq-item", "data-reveal": "fade-up" },
          h("h3", {}, h("button", { type: "button", class: "faq-q", id: `faq-q-${item.id}`, "aria-expanded": "false", "aria-controls": `faq-a-${item.id}` },
            h("span", {}, item.q), icon(ctx.config, "chevron", "icon chevron"))),
          h("div", { class: "faq-a", id: `faq-a-${item.id}`, role: "region", "aria-labelledby": `faq-q-${item.id}` },
            h("div", { class: "faq-a-in" },
              h("p", {}, item.a),
              item.action ? actionButton(ctx, item.actionLabel, item.action, "link-button") : null)))))));
}

function contact(ctx) {
  const c = ctx.t.contact;
  const email = ctx.config.cta.contactEmail;
  return h("section", { id: "contact", class: "section", "aria-labelledby": "contact-title" },
    h("div", { class: "wrap" },
      h("div", { class: "section-head", "data-reveal": "fade-up" },
        h("h2", { id: "contact-title" }, c.title),
        h("p", { class: "lead" }, `${c.intro} `, h("a", { href: `mailto:${email}` }, email), "."))));
}

const BUILDERS = { hero, stats, features, ghosts, about, faq, contact };

export function renderSections(ctx) {
  return ctx.config.layout.sections
    .filter((s) => s.visible && BUILDERS[s.id])
    .map((s) => BUILDERS[s.id](ctx));
}

export { get, viewport };
