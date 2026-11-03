# Notes for Claude

This folder (`pizza-map-lab/`) is one project inside the demos repo. Read `GUIDE.md` here first. It holds the decisions, look and voice, kit API, the recipe for a new explainer, and plans for each remaining page.

- Edit `src/`, never the built HTML in this folder. Rebuild with `python3 src/build.py`, then run `node tests/check.js`.
- Ask the user to attach the paper PDF if it isn't in the conversation. Check every figure you put on a page against it.
- Work on the explainer's branch (`lab-NN`), never directly on `main`, which deploys to the live site.
- Build one explainer per session. Before finishing, update the Status and Changelog sections of `GUIDE.md`.
- The paper is the pdf in `reference/`
- Commits get the session's transcript and a `Transcript:` trailer automatically, through the demos repo's hooks in `.githooks/` (see "Session transcripts" in `GUIDE.md`). Don't add `Claude-Session:` trailers. If `git config core.hooksPath` doesn't print `.githooks`, ask the user to turn the hooks on.
