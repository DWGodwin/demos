# Pizza Map Lab

I was having some trouble understanding the very dense Stehman & Foody (2019), *Key issues in rigorous accuracy assessment of land cover products* (Remote Sensing of Environment 231, 111199) but it seemed extremely important to my PhD work. I decided that the easiest way for me to fully understand this paper was to create a toy example for each of the cases that they go through.

Even though this work is fundamentally about land cover classification and map quality assessment, I wanted it to be applicable beyond domain expertise and use something that was familiar to anybody who might want to understand more about why careful study design is important in my field. I chose pizza as the example. Just like types of land cover, certain types of toppings are more or less common and maybe more or less important to know the location of when you take a bite. 

As much as possible, the numbers here reflect the actual numbers from the paper itself. So we can see an intuitive, interactive, and graphical explanation of exactly what the paper is talking about. This has the added benefit of being able to check the math in this website against the figures that the authors published!

Each explainer is a single static HTML file. This folder lives in the demos repo and deploys with it to Cloudflare Pages. Locally, just open `index.html`.

- `01-anchovy-problem.html`: user's vs producer's accuracy, and why overall accuracy can't see a rare topping
- `02-twenty-five-of-each.html`: equal-allocation stratified samples, and why the counts must be weighted by area

## Working on it

The built pages in this folder are generated. Edit the sources in `src/`, then:

```
npm install              # once: the LaTeX-to-MathML converter used by the build
python3 src/build.py     # paste the shared pizza kit into each page, turn LaTeX into MathML
node tests/check.js      # scripts parse, pizza matches Table 5, spreads match the paper's SEs
```

See `GUIDE.md` for the decisions, style, kit API and plans for the remaining explainers.

## Authorship and AI Use

Generative AI is used for creating the website pages and scripts in their entirety apart from the actual text that the websites display, which I author. `GUIDE.md` is also created using generative AI, and represents a running plan and implementation record for the agentic coding process.

I take responsibility for making sure that what I produce here is accurate to the paper and helpful to people that are using it, but I do not check every line of code since this is a toy example that will never be used for serious analysis. I link to the transcripts from exchanges that create certain commits so that you can look through them and see where certain decisions were made and by whom. 

Anything that's meant to be my own voice, I write myself. Here's what I am directly responsible for:
 - This `README.md`
 - Any text on the finished pages
 - Checking the website against the paper itself
 - Talking to colleagues to make sure it makes sense and that I'm getting the right lessons from it
