# text-analyzer

Takes in a block of text and returns a short summary and 3 action items as JSON.

Built using @anthropic-ai/sdk to enforce output shape is enforced at the API level. Full prompt breakdown and AI workflow notes are in [`prompt-workflow.md`](./prompt-workflow.md).

---

## Contents

- [What I built](#what-i-built)
- [The prompts I used](#the-prompts-i-used)
- [What didn't work at first and how I adjusted](#what-didnt-work-at-first-and-how-i-adjusted)
- [What I would improve with more time](#what-i-would-improve-with-more-time)
- [Setup and usage](#setup-and-usage)

---

## What I built

A `POST /analyze` API and the `analyze()` function behind it. It accepts text input, and returns structured JSON:

```json
{
  "summary": "1-3 sentence string",
  "action_items": [
    { "task": "Do the thing", "owner": "Alice", "priority": "high" },
    { "task": "Follow up on X", "owner": null,  "priority": "medium" },
    { "task": "Write the doc", "owner": "Bob",  "priority": "low" }
  ]
}
```

What's in the repo:

- `src/analyze.ts` - the main function. Calls Claude once, validates the response shape before returning.
- `src/server.ts` - Express server with a single `POST /analyze` route.
- `src/cli.ts` - run it from the terminal. Reads a file or stdin, prints JSON.
- `api-documentation/openapi.yml` - full API spec.
- `api-documentation/bruno/` - 7 ready-to-run requests in Bruno (an API client like Postman).
- 4 unit tests + a smoke-test runner against 7 real-world example inputs.

---

## The prompts I used

**System prompt** (`src/prompts.ts`):

- Tells the model how to pick the top 3 actions when there are more than 3 options: things blocking other people come first, then deadlines, then anything that can't be undone, then quick wins. Without this it just picks whatever was mentioned most recently.
- Adjusts behavior based on what kind of text it's reading: bug reports should produce reproduction steps, meeting transcripts should skip past-tense events that already happened, documents with no named people should have null owners.
- Doesn't tell the model what format to return - that's handled by the tool definition (see below).

**User prompt** (`src/analyze.ts`):

- Wraps the input in a random tag per call to mitigate prompt injection.

---

## What didn't work at first and how I adjusted

**Asking the model to return JSON didn't work reliably.** Claude Haiku kept wrapping the output in code blocks even when told not to. I wrote a parser with three fallback strategies to strip the fences and extract the JSON. It worked, but it was the wrong fix. Switched to Claude's tool use feature instead, which forces the model to return a specific structure rather than just asking it nicely. Deleted all the parsing code.

**Priorities were all over the place.** Just saying "give me the 3 most important actions" meant the model picked whatever sounded most urgent in the text, not what was actually most important. Added explicit ranking rules and it became consistent.

**The `owner` field sometimes came back as the text `"null"` instead of an actual null value.** Small but annoying. Added a line to the prompt and the tool schema to clarify the difference. Fixed immediately.


---

## What I would improve with more time

- **Prompt caching** - the system prompt never changes, so paying to send it on every request is wasteful. Caching it would cut costs.
- **Streaming** - right now nothing prints until the full response comes back. Streaming would make responses feel much faster.
- **One prompt per input type** - the current prompt handles bug reports, transcripts, and documents all in one. Splitting them out would make each easier to tune.
- **Auto-retry** - if Claude returns something that doesn't match the expected shape (rare but possible), sending a follow-up to fix it would handle it gracefully instead of throwing errors.

---

## Setup and usage

**Requirements:** Node 20+, an Anthropic API key ([get one here](https://console.anthropic.com/)).

```bash
npm install

# Save your API key to .env - all npm scripts load it automatically
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
```

---

**CLI** - analyze a file or piped text from the terminal

```bash
# Analyze a file
npm run analyze -- --file examples/github-issue.md

# Add --meta to see model, latency, and token usage alongside the result
npm run analyze -- --file examples/incident-slack.md --meta

# Pipe text in directly
cat examples/standup-transcript.md | npm run analyze --

npm run analyze -- --help
```

---

**HTTP API** - run the server and call it like any REST API

```bash
npm run server
# Server starts at http://localhost:3000
```

```bash
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "your text here"}'

# Optional: pass a model override
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "your text here", "model": "claude-sonnet-4-6"}'
```

---

**Run the function directly** - useful for seeing exactly what the function returns

```bash
npx tsx --env-file-if-exists=.env src/analyze-function-use.ts
```

Runs `analyze()` against a hardcoded Slack transcript and prints the full result including summary, action items, and metadata. Also deliberately passes empty input at the end so you can see what the error looks like.

---

**Tests**

```bash
npm test           # 4 schema validation tests - no API key needed, runs instantly
npm run typecheck  # TypeScript type check across the whole project
npm run test-all   # runs all 7 example inputs against the live API and saves results
```

`npm run test-all` is useful for checking that a prompt change didn't break anything. It saves a JSON file per input plus a summary to a timestamped folder:

```
test-all-result-20240424-143022/
  github-issue.json        - full result for each input
  standup-transcript.json
  incident-slack.json
  user-interview.json
  support-thread.json
  product-brief.json
  prompt-injection.json
  summary.json             - all results in one place
```

---

**API testing with Bruno**

Bruno is an API client (like Postman). `api-documentation/` has everything you need:

- `openapi.yml` - the full API spec. Import via Open Collection > Import > OpenAPI V3.
- `bruno/` - 7 ready-to-run requests with pass/fail assertions. Open this folder directly in Bruno.

Start the server first (`npm run server`), then run requests via curl or an API client.
