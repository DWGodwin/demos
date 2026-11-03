// LaTeX -> MathML for the build. Called by build.py; not pasted into any page.
// Reads a JSON list of {tex, display} on stdin and writes a JSON list of MathML strings.
// `\id{name}{...}` tags a number so the page script can change it later (see setEq in the pages).
const temml = require("temml");
let src = "";
process.stdin.on("data", d => (src += d));
process.stdin.on("end", () => {
  const out = JSON.parse(src).map(({ tex, display }) =>
    temml.renderToString(display ? "\\displaystyle " + tex : tex, { trust: true, throwOnError: true })
  );
  process.stdout.write(JSON.stringify(out));
});
