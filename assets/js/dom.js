// Small helpers to build the page with the DOM API (text is always set as text, never as HTML).

const SVG = "http://www.w3.org/2000/svg";

// h("a", { class: "x", href: "#", dataset: { id: 1 }, style: { "--c": "red" }, onclick: fn }, "text", childElement)
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === false || value == null) continue;
    if (key === "class") el.className = value;
    else if (key === "dataset") Object.assign(el.dataset, value);
    else if (key === "style" && typeof value === "object") for (const [prop, v] of Object.entries(value)) el.style.setProperty(prop, v);
    else if (key.startsWith("on") && typeof value === "function") el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? "" : String(value));
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    el.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return el;
}

// An inline icon from config.json > icons (the markup there is ours, written for the <svg> element).
export function icon(config, name, className = "icon") {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", className);
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.innerHTML = config.icons[name] || "";
  return svg;
}

// get(config, "cta.primary") -> config.cta.primary
export const get = (object, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), object);

export const viewport = () => document.documentElement.dataset.vp || "desktop";
