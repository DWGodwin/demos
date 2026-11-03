"""Build the Pizza Map Lab.

Pastes src/kit.js into every page in PAGES (at the single `/* @@KIT@@ */` marker) and writes
standalone HTML files to the repo root, which is what GitHub Pages serves.

    python3 src/build.py                      # build the site
    python3 src/build.py --artifact DIR       # also write DIR/index.html for a claude.ai artifact
                                              # (same page without its <!doctype>/<head>/<body> wrapper)

Add new explainers to PAGES and to the cards in src/index.html.
"""
import os, re, sys

PAGES = [
    "index.html",
    "01-anchovy-problem.html",
    "02-twenty-five-of-each.html",
]
MARK = "/* @@KIT@@ */"

here = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(here)
kit = open(os.path.join(here, "kit.js"), encoding="utf-8").read().strip()

for p in PAGES:
    s = open(os.path.join(here, p), encoding="utf-8").read()
    assert s.count(MARK) == 1, f"{p}: needs exactly one {MARK}"
    open(os.path.join(root, p), "w", encoding="utf-8").write(s.replace(MARK, kit))
print("built", ", ".join(PAGES))

if "--artifact" in sys.argv:
    out = sys.argv[sys.argv.index("--artifact") + 1]
    os.makedirs(out, exist_ok=True)
    s = open(os.path.join(root, "index.html"), encoding="utf-8").read()
    for pat in [r'<!doctype html>\n', r'<html lang="en">\n', r'<head>\n', r'<meta charset="utf-8">\n',
                r'<meta name="viewport"[^>]*>\n', r'</head>\n', r'<body>\n', r'</body>\n', r'</html>\n']:
        s, n = re.subn(pat, "", s, count=1)
        assert n == 1, pat
    open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(s)
    print("artifact index written to", out)
