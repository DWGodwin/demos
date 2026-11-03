"""Save a Claude Code session as a readable transcript in transcripts/ at the repo root.

The pre-commit hook runs this for every commit made from Claude Code. By hand:

    python3 .githooks/transcript.py              # the current session (from inside Claude Code)
    python3 .githooks/transcript.py <session-id>  # any session still on this machine

Keeps only what was said: the user's messages and Claude's replies. Tool calls and their
output are left out, because they can hold large amounts of file contents (such as
copyrighted papers). Claude Code's transcript format is internal and may change, so if this
breaks, check the output against the session itself.
"""
import json, os, re, sys, glob

repo = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sid = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("CLAUDE_CODE_SESSION_ID")
if not sid:
    sys.exit("No session id: pass one, or run this from inside a Claude Code session.")
hits = glob.glob(os.path.expanduser(f"~/.claude/projects/*/{sid}.jsonl"))
if not hits:
    sys.exit(f"No transcript for session {sid} on this machine.")

def clean(s):
    s = re.sub(r"<system-reminder>.*?</system-reminder>", "", s, flags=re.S)
    s = re.sub(r"</?pasted_content[^>]*>", "", s)
    return s.strip()

turns, start = [], None
for line in open(hits[0], encoding="utf-8"):
    o = json.loads(line)
    if o.get("isSidechain") or o.get("isMeta") or o.get("type") not in ("user", "assistant"):
        continue
    start = start or o.get("timestamp")
    c = o["message"].get("content")
    if o["type"] == "user":
        text = clean(c) if isinstance(c, str) else ""
        if text and not text.startswith("<"):  # skip slash-command and system entries
            turns.append(["User", text])
    else:
        text = "\n\n".join(b["text"] for b in c if b.get("type") == "text").strip()
        if text:
            if turns and turns[-1][0] == "Claude":
                turns[-1][1] += "\n\n" + text
            else:
                turns.append(["Claude", text])

date = (start or "")[:10]
os.makedirs(os.path.join(repo, "transcripts"), exist_ok=True)
out = os.path.join(repo, "transcripts", f"{date}-{sid[:8]}.md")
with open(out, "w", encoding="utf-8") as f:
    f.write(f"# Claude Code session {sid}\n\nStarted {start}. Only the conversation is kept; "
            "tool calls and their output are left out.\n")
    for who, text in turns:
        f.write(f"\n---\n\n**{who}:**\n\n{text}\n")
print(os.path.relpath(out, repo))
