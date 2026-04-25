# How I used AI to build this

## My general approach

- Plan before writing any code. I use plan mode to talk through the task and agree on scope before anything gets generated.
- I own the decisions (what the function returns, how files are laid out, what's out of scope) and let Claude handle the implementation. 
- I always explain why I'm asking for something. "Do this because I saw X happen" gets a much better result than just "do this."
- For the AI prompt (the one that goes to Claude at runtime), I built it one layer at a time. Each layer fixes something I actually saw break, not something I'm guessing might break.
- For test examples/inputs, I used two rounds: first a pass to get the right variety of inputs, then a second pass to make them feel like they all connected.
- Claude is also useful for non-code work: checking whether docs match the code, looking up SDK types, spotting things that don't add up.

---

## Scoping before coding

Before writing anything I pasted the task brief into plan mode and locked in what to build and what to skip. This meant: one `analyze()` function, a CLI wrapper, nothing else. After Claude's first plan came back I added two more hard rules: use the cheapest model by default, and make exactly one API call per invocation.

Initial prompt (plan mode, no code yet):

> I need to build a small TypeScript tool: a function that
> takes a block of text, calls the Anthropic Messages API, and returns
> a structured JSON object with a 1-3 sentence summary and 3
> prioritized action items. Use `@anthropic-ai/sdk` and `zod`, nothing
> else. 2-3 hour budget, so the priority is clean structure and
> decision-making, not a production app.
>
> Before any code, propose:
> - the public function signature and return shape,
> - the Zod schema (be explicit about constraints, e.g. exactly 3
>   items, `owner` is `string | null`),
> - the file layout (keep the system prompt in its own module so
>   variants can be added later),
> - a thin CLI wrapper that calls the same function.
>
> Out of scope at this budget, do NOT build: HTTP server, agentic
> loop, tool use, retry-on-failure, prompt caching, streaming. Flag
> and ask me anything else you'd normally add so I can confirm the scope.

Follow-up after the plan came back:

> Lock in two more constraints before we start coding. Default to
> Haiku (`claude-haiku-4-5-20251001`). Use exactly one
> `client.messages.create()` call per `analyze()` invocation. If the
> plan relies on any of those, revise it.

---

## Scaffolding the implementation

Once the scope was agreed, I gave Claude the exact function signature, return shape, and file layout. It filled in the implementation.

> Plan is approved, implement it now. The function exports one
> function, `analyze(text, opts?)`, that calls the Anthropic Messages
> API once and returns `{ data, meta, raw }`.
>
> Specifics I want you to hold exactly:
> - Zod schema enforces `{ summary: string, action_items:
>   ActionItem[3] }` where `ActionItem = { task: string, owner: string
>   | null, priority: 'high'|'medium'|'low' }`. Exactly 3 items is a
>   schema-level constraint, not a prompt-level one. The prompt can
>   lie, the schema can't.
> - `opts` accepts `model`, `systemPrompt`, `maxTokens`, all optional.
>   Default model `claude-haiku-4-5-20251001`, default `maxTokens`
>   1024 (enough for a summary + 3 items, not more).
> - `meta` includes `model`, `duration_ms`, `input_tokens`,
>   `output_tokens`, `stop_reason`. Nothing else.
> - Keep the system prompt in `src/prompts.ts` as a named export.
> - CLI in `src/cli.ts` is pure I/O: read from `--file` or stdin, call
>   `analyze()`, write JSON to stdout, errors to stderr, non-zero exit
>   on failure. No business logic in the CLI.
>
> Do NOT add: retries, streaming, prompt caching, HTTP surface,
> auth-token flags, config files. If any of those feel load-bearing,
> stop and flag. Don't sneak them in.

---

## Building the system prompt in layers

I didn't ask Claude for "a good system prompt." I started with the minimum and added one thing each time I saw something go wrong:

1. Output shape: exactly 3 items, owner can be null.
2. Prompt injection mitigation: wrap user input in a random tag per call.
3. Ranking rules: added after watching the model pick the most loudly-phrased action instead of the most important one.
4. Input type handling: added after running the tool on different kinds of text and getting the same generic output every time.

Prompt for the ranking rules layer:

> Revise the system prompt in `src/prompts.ts`. Problem I'm seeing:
> when a text contains more than 3 candidate actions, the model picks
> whichever one is phrased most prominently or appears most recently,
> not the most consequential one. Output is also unstable across
> re-runs on the same input.
>
> Add an explicit ranking hierarchy the model must apply when choosing
> which 3 actions to return, in order of precedence:
> 1. Blocks other people or external commitments (unblocking > doing).
> 2. Tied to an explicit deadline in the text.
> 3. Irreversible or customer-visible if skipped (data loss, outages,
>    customer comms).
> 4. Cheap to verify and unblocks later work (repro steps, regression
>    tests, scoping docs).
>
> Tie-breaker: prefer actions whose completion is externally checkable
> (PR merged, message sent) over ones that are purely internal. Be
> concrete, don't let the model restate goals as actions. Keep the
> rest of the prompt intact.

---

## Generating test examples

The tool is meant for workplace text, so I wanted test examples that actually looked like workplace text. Two rounds: first to get the right mix of input types, then to make them feel connected.

Round 1 (variety):

> I need 7 test fixtures saved under `examples/` to stress the
> analyzer's prompt across every genre it should handle. Each fixture
> is a realistic text source, not summarized, not cleaned up.
>
> Genres (one fixture each, named accordingly):
> - `github-issue.md`: GitHub bug report with maintainer and community replies
> - `incident-slack.md`: Slack incident thread with timestamps, reactions, and sev-level
> - `standup-transcript.md`: AI auto-transcribed standup, include speaker labels and filler like "umm", false starts
> - `support-thread.md`: support ticket, customer + support + eng back-and-forth
> - `product-brief.md`: internal PM doc, formal headings, zero assigned owners anywhere
> - `user-interview.md`: PM interview excerpt, Q&A format, single customer
> - `prompt-injection.md`: a thread where a user attempts to add a prompt-injection to influence the output result.
>
> Constraints for every fixture:
> - 30-80 lines.
> - Formatting native to the source (GitHub markdown, Slack timestamps, etc.).
> - MORE than 3 candidate action items so prioritization is actually tested.
> - Include realistic noise: typos, filler, off-topic bits, past-tense events that should NOT become actions ("rolled back yesterday", "already merged").
>
> Don't sanitize the examples - messiness is the point.

Round 2 (making them feel like one company):

> Now rewrite the 7 fixtures so they share the same company, characters, and ongoing problems.
>
> Reuse: 1 PM, 2 engineers, 1 designer, 1 customer.
>
> Cross-link these threads across fixtures:
> - A bug shows up in `support-thread.md`, `user-interview.md`, and motivates `product-brief.md`
> - A different bug is in `github-issue.md` and mentioned in `standup-transcript.md`
> - An incident in `incident-slack.md` resurfaces in `standup-transcript.md`
>
> Hard rules:
> - `product-brief.md` and `user-interview.md` must have zero assigned owners. Every action item should have `owner: null`.
> - `incident-slack.md` is mostly past-tense ("rolled back", "posted", "updated"). Only 2-3 things are actually still open.

---

## Fixing things that broke

Three issues came up when I ran the tool on real examples:

- Haiku wrapped the JSON output in code fences about 20-30% of the time. I wrote a parser that tried three ways to extract the JSON. It worked, but later switched to Claude's tool use feature which prevents the problem entirely. Deleted all the parsing code.
- The model sometimes wrote the word "null" as a string instead of an actual null value. Fixed in the prompt.
- Running tests without an API key set caused them to fail, even though none of the tests make API calls. The API client was being created when the file loaded. Moved it so it only gets created when actually needed.

Prompt I used for the JSON fences fix (before switching to tool use):

> Problem: Haiku is wrapping JSON in ```json fences on roughly
> 20-30% of responses, even though the system prompt explicitly says
> "no code fences, no commentary."
>
> Don't solve this by upgrading the model, solve it in the parser.
>
> Add a `tryParseJson(raw: string)` helper that tries three strategies:
> 1. Parse the raw string directly.
> 2. Strip the code fences and parse what's inside.
> 3. Find the first `{` and last `}` and parse just that chunk.
>
> If all three fail, throw an error that includes the raw model output.
> Debugging without it is painful.

---

## Generating API docs from the code

Once the HTTP server was done, I didn't write the API docs by hand. I pointed Claude at the server file, the schema definitions, and the test file, and told it to produce a spec and runnable test collection based on what the code actually does.

> `src/server.ts` has a `POST /analyze` endpoint. `src/core/schema.ts`
> defines exactly what valid and invalid output looks like. `test/parse.test.ts`
> has the acceptance and rejection cases.
>
> Generate two things in `api-documentation/`:
>
> 1. `openapi.yml` - OpenAPI 3.0.3 spec covering: request schema (text required,
>    model optional), success response with the analysis shape, 400 for bad input,
>    500 for API failure. Add 4 named examples: basic, model override, standup
>    transcript, bug report.
>
> 2. `bruno/` collection - one request file per scenario. Derive the assertions
>    from what the schema and tests actually enforce. Don't invent behavior.
>    Happy paths check for status 200 and that summary and action_items exist.
>    Error paths check for status 400 and that an error field exists.
>    Cover: basic call, model override, standup, bug report, empty text,
>    missing text, malformed JSON.

The result is docs that match the implementation because they came from it. If the schema changes, updating the docs is one prompt away.

