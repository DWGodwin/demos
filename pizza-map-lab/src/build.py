"""Build the Pizza Map Lab.

Pastes src/kit.js into every page in PAGES (at the single `/* @@KIT@@ */` marker), turns
<tex>...</tex> into MathML, and writes standalone HTML files to the repo root, which is what
Cloudflare Pages serves.

    npm install                               # once, for the LaTeX converter (Temml)
    python3 src/build.py                      # build the site
    python3 src/build.py --artifact DIR       # also write DIR/index.html for a claude.ai artifact
                                              # (same page without its <!doctype>/<head>/<body> wrapper)

Equations: write `<tex>U_i = p_{ii}/p_{i+}</tex>` for inline maths, or `<tex display>...</tex>`
for full-size fractions and sums. Wrap a number in `\\id{some-id}{0.5}` to change it from the
page script. The built pages contain plain MathML, so they need no script or font to show it.

Add new explainers to PAGES and to the cards in src/index.html.
"""
import html, json, os, re, subprocess, sys

PAGES = [
    "index.html",
    "01-anchovy-problem.html",
    "02-twenty-five-of-each.html",
    "03-sampling-design-lab.html",
    "04-how-many-tastes.html",
]
MARK = "/* @@KIT@@ */"
TEX = re.compile(r"<tex( display)?>(.*?)</tex>", re.S)

here = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(here)
kit = open(os.path.join(here, "kit.js"), encoding="utf-8").read().strip()


def render_tex(s, page):
    found = TEX.findall(s)
    if not found:
        return s
    if not os.path.isdir(os.path.join(root, "node_modules", "temml")):
        sys.exit("The LaTeX converter is missing. Run `npm install` in pizza-map-lab/ first.")
    jobs = [{"tex": html.unescape(t).strip(), "display": bool(d)} for d, t in found]
    r = subprocess.run(["node", os.path.join(here, "tex.js")], input=json.dumps(jobs),
                       capture_output=True, text=True, cwd=root)
    if r.returncode:
        sys.exit(f"{page}: LaTeX failed\n{r.stderr}")
    out = iter(json.loads(r.stdout))
    return TEX.sub(lambda m: next(out), s)


for p in PAGES:
    s = open(os.path.join(here, p), encoding="utf-8").read()
    assert s.count(MARK) == 1, f"{p}: needs exactly one {MARK}"
    s = render_tex(s.replace(MARK, kit), p)
    open(os.path.join(root, p), "w", encoding="utf-8").write(s)
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
