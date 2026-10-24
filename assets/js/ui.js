// The interactive parts. Each one reads its behaviour from data/interactions.json and its words from data/content.json.

import { h, icon, get } from "./dom.js";
import { initParallax, startWhenVisible } from "./fx.js";

const smooth = (ctx) => (ctx.motion ? "smooth" : "auto");

// ---- actions: every button with data-action runs what interactions.json > actions says ----

export function initActions(ctx) {
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-action]");
    if (!trigger) return;
    const name = trigger.dataset.action;
    if (name === "close") {
      closeModal(trigger.closest("dialog"));
      return;
    }
    const action = ctx.interactions.actions[name];
    if (!action) return;
    e.preventDefault();
    if (action.type === "link") {
      const target = get(ctx.config, action.ref);
      if (target.external) window.open(target.url, "_blank", "noopener");
      else location.href = target.url;
    } else if (action.type === "scroll") {
      closeModal(trigger.closest("dialog"));
      scrollToTarget(ctx, action.target);
    } else if (action.type === "modal") {
      openModal(action.id, trigger);
    }
  });
}

function scrollToTarget(ctx, selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.scrollIntoView({ behavior: smooth(ctx), block: "start" });
  history.replaceState(null, "", selector);
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
}

// ---- header: mobile menu, smooth in-page links, highlight of the section on screen ----

export function initNav(ctx) {
  const header = document.querySelector(".site-header");
  const toggle = header.querySelector(".nav-toggle");
  const nav = header.querySelector(".nav");
  const set = (open) => {
    header.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };
  toggle.addEventListener("click", () => set(!header.classList.contains("menu-open")));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && header.classList.contains("menu-open")) { set(false); toggle.focus(); } });

  nav.addEventListener("click", (e) => {
    const link = e.target.closest("a[href^='#']");
    set(false);
    if (!link || ctx.page !== "home") return;
    e.preventDefault();
    scrollToTarget(ctx, link.getAttribute("href"));
  });

  if (ctx.page !== "home" || !("IntersectionObserver" in window)) return;
  const links = new Map([...nav.querySelectorAll("a[data-nav]")].map((a) => [a.dataset.nav, a]));
  const last = [...links.keys()].pop();
  const seen = new Map();
  const update = () => {
    // at the very bottom of the page the last section can never reach the highlight zone, so it is the one highlighted
    const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 8;
    const best = atBottom ? [last, 1] : [...seen].sort((a, b) => b[1] - a[1])[0];
    for (const [id, link] of links) {
      if (best && best[1] > 0 && best[0] === id) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  };
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) seen.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
    update();
  }, { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.1, 0.5, 1] });
  for (const id of links.keys()) { const section = document.getElementById(id); if (section) io.observe(section); }
  addEventListener("scroll", update, { passive: true });
}

// ---- FAQ accordion ----

export function initFaq(ctx) {
  const root = document.querySelector("[data-faq]");
  if (!root) return;
  const cfg = ctx.interactions.faq;
  root.style.setProperty("--faq-ms", `${cfg.animationMs}ms`);
  const items = [...root.querySelectorAll(".faq-item")];
  const setOpen = (item, open) => {
    item.classList.toggle("open", open);
    item.querySelector(".faq-q").setAttribute("aria-expanded", String(open));
  };
  root.addEventListener("click", (e) => {
    const button = e.target.closest(".faq-q");
    if (!button) return;
    const item = button.closest(".faq-item");
    const open = !item.classList.contains("open");
    if (cfg.mode === "single" && open) items.forEach((other) => other !== item && setOpen(other, false));
    setOpen(item, open);
  });
  if (cfg.keyboard) {
    root.addEventListener("keydown", (e) => {
      const buttons = items.map((i) => i.querySelector(".faq-q"));
      const at = buttons.indexOf(document.activeElement);
      if (at < 0) return;
      const move = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: buttons.length - 1 }[e.key];
      if (move == null) return;
      e.preventDefault();
      buttons[(move + buttons.length) % buttons.length].focus();
    });
  }
  if (cfg.openFirst && items[0]) setOpen(items[0], true);
}

// ---- the ghosts' scenes: each wakes up (she materialises, then floats) when it comes into view ----

export function initScenes(ctx) {
  const stageCfg = ctx.config.animation.stage.parallax;
  document.querySelectorAll("[data-scene]").forEach((stage) => {
    if (ctx.motion) {
      initParallax(stage, { pointerStrength: stageCfg.enabled ? stageCfg.pointerStrength : 0 });
      startWhenVisible(stage, [stage.querySelector(".stage-char img")]);
    } else {
      stage.classList.add("in");
    }
  });
}

// ---- modals (native <dialog>) ----

const modals = new Map();

export function renderModals(ctx) {
  const dialogs = Object.entries(ctx.interactions.modals).map(([id, cfg]) => {
    const c = cfg.content[ctx.lang];
    const dialog = h("dialog", { class: "modal", id: `modal-${id}`, "aria-labelledby": `modal-${id}-title` },
      h("div", { class: "modal-in" },
        h("button", { type: "button", class: "modal-close", "aria-label": ctx.t.ui.close, dataset: { action: "close" } }, icon(ctx.config, "close")),
        h("h2", { id: `modal-${id}-title` }, c.title),
        c.intro ? h("p", { class: "lead" }, c.intro) : null,
        h("ol", { class: "steps" }, c.steps.map((s) => h("li", {}, s))),
        c.cta ? h("button", { type: "button", class: "button", dataset: { action: c.cta.action } }, c.cta.label) : null));
    if (cfg.closeOnBackdrop) dialog.addEventListener("click", (e) => { if (e.target === dialog) closeModal(dialog); });
    if (!cfg.closeOnEscape) dialog.addEventListener("cancel", (e) => e.preventDefault());
    let opener = null;
    // Undo what opening did (the scroll lock, the focus). Done when we close it ourselves, and again by the "close" event for
    // the ways the browser closes it (the Escape key): it is safe to run twice.
    const cleanup = () => { document.documentElement.classList.remove("modal-open"); opener?.focus?.(); opener = null; };
    dialog.addEventListener("close", cleanup);
    modals.set(id, { dialog, cleanup, setOpener: (el) => { opener = el; } });
    return dialog;
  });
  document.body.append(...dialogs);
}

function closeModal(dialog) {
  if (!dialog) return;
  const entry = [...modals.values()].find((m) => m.dialog === dialog);
  if (dialog.open) dialog.close();
  entry?.cleanup();
}

function openModal(id, opener) {
  const modal = modals.get(id);
  if (!modal) return;
  modal.setOpener(opener);
  document.documentElement.classList.add("modal-open");
  modal.dialog.showModal();
}

// ---- counters ----

export function initCounters(ctx) {
  const cfg = ctx.interactions.counters;
  const format = new Intl.NumberFormat(ctx.lang);
  const els = [...document.querySelectorAll("[data-counter]")];
  if (!els.length) return;
  const byId = Object.fromEntries(cfg.items.map((i) => [i.id, i]));
  const show = (el, value) => { const item = byId[el.dataset.counter]; el.textContent = `${item.prefix || ""}${format.format(value)}${item.suffix || ""}`; };
  if (!ctx.motion || !("IntersectionObserver" in window)) { els.forEach((el) => show(el, byId[el.dataset.counter].to)); return; }
  els.forEach((el) => show(el, 0));
  const run = (el) => {
    const { to, durationMs } = byId[el.dataset.counter];
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / durationMs);
      show(el, Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(() => show(el, to), durationMs + 300); // animation frames pause in a background tab: the real number is shown anyway
  };
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      run(entry.target);
      if (cfg.triggerOnce) io.unobserve(entry.target);
    }
  }, { threshold: cfg.threshold });
  els.forEach((el) => io.observe(el));
}

// ---- scroll-triggered reveals ----

export function initReveal(ctx) {
  const cfg = ctx.interactions.scrollAnimations;
  if (!ctx.motion || !cfg.enabled || !("IntersectionObserver" in window)) return;
  for (const rule of cfg.rules) {
    const els = [...document.querySelectorAll(rule.selector)];
    els.forEach((el, i) => {
      const siblings = [...el.parentElement.children].filter((c) => c.matches(rule.selector));
      el.classList.add("reveal", `reveal-${rule.effect}`);
      el.style.setProperty("--rd", `${rule.durationMs}ms`);
      el.style.setProperty("--rdelay", `${siblings.indexOf(el) * rule.staggerMs}ms`);
    });
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) { if (!rule.once) entry.target.classList.remove("revealed"); continue; }
        entry.target.classList.add("revealed");
        if (rule.once) io.unobserve(entry.target);
      }
    }, { threshold: rule.threshold });
    els.forEach((el) => io.observe(el));
  }
}
