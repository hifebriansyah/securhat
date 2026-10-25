#!/usr/bin/env python3
"""Write the page's words into the HTML itself, from data/content.json, so a crawler (and anyone without JavaScript) sees them.

    python3 tools/prerender.py        fills the block between <!-- prerender:start --> and <!-- prerender:end --> in
                                      index.html and en/index.html

The block sits inside <div id="app">. assets/js/app.js replaces the whole of #app when it runs, so visitors with JavaScript see the
interactive page and everyone else sees this plain, readable version of the same content. Run it after every change to content.json.
Safe to run again: it only rewrites that block.
"""
import json
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
START, END = "<!-- prerender:start -->", "<!-- prerender:end -->"
PAGES = {"id": ROOT / "index.html", "en": ROOT / "en" / "index.html"}


def block(content, config, lang):
    t = content[lang]
    root = "./" if lang == "id" else "../"
    other = ("en/", "English") if lang == "id" else ("../", "Indonesia")
    privacy = "privacy/" if lang == "id" else "privacy/"
    names = {g["id"]: g for g in content["ghosts"]}
    email = config["cta"]["contactEmail"]
    out = ['<div class="prerender">']
    out.append(f'<header><p><strong>{escape(config["brand"]["logo"]["text"])}{escape(config["brand"]["logo"]["accent"])}</strong></p>'
               f'<nav><a href="#features">{escape(t["features"]["title"])}</a> <a href="#ghosts">{escape(t["ghosts"]["title"])}</a> '
               f'<a href="#faq">{escape(t["faq"]["title"])}</a> <a href="feeds/">Feeds</a> <a href="{privacy}">{escape(t["footer"]["links"][0]["label"])}</a> '
               f'<a href="{other[0]}">{other[1]}</a></nav></header>'.replace('href="feeds/"', 'href="/feeds/"'))
    h = t["hero"]
    out.append(f'<main><section><h1>{escape(h["headline"])}</h1><p>{escape(h["subtitle"])}</p>'
               f'<p><a href="https://omonomon.securhat.com/">{escape(h["cta"]["primary"]["label"])}</a></p></section>')
    f = t["features"]
    out.append(f'<section id="features"><h2>{escape(f["title"])}</h2><p>{escape(f["intro"])}</p>')
    for item in f["items"]:
        out.append(f'<h3>{escape(item["title"])}</h3><p>{escape(item["text"])}</p>')
    out.append("</section>")
    g = t["ghosts"]
    out.append(f'<section id="ghosts"><h2>{escape(g["title"])}</h2><p>{escape(g["intro"])}</p>')
    for gid, item in g["items"].items():
        meta = names.get(gid, {})
        out.append(f'<h3>{escape(meta.get("name", ""))} ({escape(item["kind"])})</h3><p>{escape(item["text"])}</p>'
                   f'<p><em>&ldquo;{escape(item["quote"])}&rdquo;</em></p><p>{escape(meta.get("game", ""))}: {escape(item["gameText"])}</p>')
    out.append("</section>")
    a = t["about"]
    out.append(f'<section id="about"><h2>{escape(a["title"])}</h2>' + "".join(f"<p>{escape(p)}</p>" for p in a["paragraphs"]) + "</section>")
    q = t["faq"]
    out.append(f'<section id="faq"><h2>{escape(q["title"])}</h2><p>{escape(q["intro"])}</p>')
    for item in q["items"]:
        out.append(f'<h3>{escape(item["q"])}</h3><p>{escape(item["a"])}</p>')
    out.append("</section>")
    c = t["contact"]
    out.append(f'<section id="contact"><h2>{escape(c["title"])}</h2><p>{escape(c["intro"])} <a href="mailto:{escape(email)}">{escape(email)}</a></p></section></main>')
    out.append(f'<footer><p>{escape(t["footer"]["text"])} {escape(t["footer"]["tagline"])}</p></footer></div>')
    return "\n".join(out)


def main():
    content = json.loads((ROOT / "data" / "content.json").read_text(encoding="utf-8"))
    config = json.loads((ROOT / "data" / "config.json").read_text(encoding="utf-8"))
    for lang, path in PAGES.items():
        html = path.read_text(encoding="utf-8")
        new = f'<div id="app">\n{START}\n{block(content, config, lang)}\n{END}\n  </div>'
        if START in html:
            html = re.sub(re.escape('<div id="app">') + r"\s*" + re.escape(START) + r".*?" + re.escape(END) + r"\s*</div>", lambda m: new, html, count=1, flags=re.S)
        else:
            html = html.replace('<div id="app"></div>', new, 1)
        path.write_text(html, encoding="utf-8")
        text = re.sub(r"<[^>]+>", " ", block(content, config, lang))
        print(f"{path.relative_to(ROOT)}: {len(text.split())} words of static text")


if __name__ == "__main__":
    main()
