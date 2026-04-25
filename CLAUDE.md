# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# CLI (requires ANTHROPIC_API_KEY in .env or shell)
npm run analyze -- --file examples/github-issue.md
npm run analyze -- --file examples/standup-transcript.md --meta   # latency/token metadata
cat examples/incident-slack.md | npm run analyze --               # stdin
npm run analyze -- --help

# HTTP server (PORT defaults to 3000)
npm run server

# Offline unit tests (no API key needed)
npm test

# Run a single test file
npx tsx --test test/parse.test.ts

# Type-check
npm run typecheck

# Smoke-test all 7 fixtures against the live API (saves timestamped results)
npm run test-all

# Demo the function directly
npx tsx --env-file-if-exists=.env src/analyze-function-use.ts
```

## Architecture

**Core function — `src/analyze.ts`**
The `analyze(text, opts?)` function is the entire public surface. It wraps input in a UUID-nonce-delimited tag (prompt injection mitigation), then makes a single `getClient().messages.create()` call using Anthropic **tool use** — `ANALYZE_TOOL` is defined inline and passed with `tool_choice: { type: "tool", name: "analyze_text" }`, forcing structured output. The response is extracted from a `ToolUseBlock` and Zod-validated before returning `{ data, meta, raw }`. The Anthropic client is constructed lazily so tests never need `ANTHROPIC_API_KEY` set.

**Schemas and types — `src/core/`**
`schema.ts` owns the Zod schemas (`AnalysisSchema`, `ActionItemSchema`, `PrioritySchema`) and inferred types. `types.ts` owns the function interfaces (`AnalyzeOptions`, `AnalyzeMeta`, `AnalyzeResult`). Keeping these separate from `analyze.ts` lets tests import schemas directly without pulling in the Anthropic SDK.

**Prompt — `src/prompts.ts`**
`SYSTEM_PROMPT` is isolated so future per-genre or per-model variants can live alongside the default without touching call sites. The OUTPUT SHAPE block was deliberately removed — the tool's `input_schema` communicates structure to the model instead.

**HTTP server — `src/server.ts`**
Thin Express wrapper around `analyze()`. `POST /analyze` accepts `{ text: string, model?: string }`. Fails fast at startup if `ANTHROPIC_API_KEY` is missing. The error-handling middleware at the bottom catches `express.json()` parse errors (malformed bodies) and returns JSON 400s instead of HTML.

**CLI — `src/cli.ts`**
Reads from `--file` or stdin (automatically when `--file` is omitted), calls `analyze()`, prints JSON to stdout. `--meta` appends token/latency metadata. No business logic.

## Key design decisions

- **Tool use over text prompting** — `tool_choice: { type: "tool" }` forces structured output; no JSON parsing fallbacks needed.
- **Default model is `claude-haiku-4-5-20251001`** — fast and cheap for single-hop summarization. Override with `--model` or the `model` option.
- **`action_items` must be exactly 3** — enforced by both the Zod schema and the tool's JSON Schema (`minItems: 3, maxItems: 3`).
- **`owner` is `string | null`, never omitted** — avoids ambiguity vs. the field being absent.

## Repo layout notes

- `examples/` — 7 messy real-world text fixtures (`prompt-injection.md` is the adversarial one; the others share characters at "Acme Logistics" for cross-fixture realism).
- `api-documentation/` — `openapi.yml` (importable into Bruno via Open Collection → Import → OpenAPI V3) and `bruno/` (open the folder directly in Bruno to run all 7 requests with assertions).
- `prompt-workflow.md` — narrative of the prompts used to build this with Claude. Useful context for understanding why decisions were made.
