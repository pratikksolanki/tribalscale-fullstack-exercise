/**
 * Library usage example — `analyze()` called directly, not via the CLI.
 *
 * Run:
 *   npx tsx --env-file-if-exists=.env src/analyze-function-use.ts
 *
 * Requires ANTHROPIC_API_KEY in .env or the shell environment.
 */

import { analyze } from "./analyze.ts";
import { type Analysis } from "./core/schema.ts";
import { type AnalyzeResult } from "./core/types.ts";

const input = `
#eng-sync — Wednesday

[10:14] priya: morning — sync in 1, drop updates here if you're not joining live
[10:16] maya: CSV-import fix is out, rolled to 10% mon, dashboards clean, nothing weird
[10:17] maya: starting the empty-state work for dashboards today BUT can't actually wire it up until ravi's /usage endpoint lands. mocks are approved tho
[10:18] ravi: /usage is ~80% done, ready for review today or tmrw. needs load test + someone from maya's side to eyeball the response shape
[10:18] jordan: ok real talk — auth revamp PR has been sitting in review for 6 days. acme demo is TOMORROW at 2pm, legal is on the call. if it doesn't merge today we're showing screenshots which jess has been yelling about
[10:19] jordan: this is not a "might slip" thing, it's a "we miss this, jess thinks the deal wobbles" thing
[10:19] priya: yeah, who has the review
[10:20] jordan: karan. he said he'd get to it yesterday, still no review
[10:20] priya: k, i'll nudge him after this
[10:21] dana: ok random but — i dug into the magic-link thing i mentioned monday, it's real. ios 14.x users click an expired link, they get a blank white screen. no error, no retry, just nothing. amplitude says ~3% of ios sessions
[10:22] dana: not a regression, been broken since we shipped magic links. no ticket yet fwiw
[10:22] maya: that's just a silent drop-off right
[10:23] dana: yeah they just leave. i can file something today with a repro but i don't have cycles this sprint to own it
[10:23] priya: please file it even unassigned, we need it tracked
[10:24] ravi: ok separate thing, i have to bring this up — going through Q1 billing reconciliation and we are DOUBLE BILLING like 40 enterprise tenants on the annual plan. started in march when we changed the price
[10:24] ravi: finance doesn't know yet. we need a refund script AND a comms plan before friday close-of-books or this becomes a much bigger thing
[10:25] priya: ok that jumps to the top. ravi can you own the script, i'll loop finance + CS for comms today
[10:25] ravi: yep on it
[10:26] priya: also — exec team asked me AGAIN about the europe date. last week ravi and jordan both said "probably" on the call, which is not an answer
[10:27] priya: last thing: need one more editor pass on the Q2 roadmap doc before i share it friday, 20 min if anyone has it
[10:28] priya: ok gtg ty all

(reactions: ravi's 10:24 message has 6 😱)
`;

async function main(): Promise<void> {
  // ─── Basic call ─────────────────────────────────────────────────────────
  // `analyze()` returns { data, meta, raw }. `data` is typed as Analysis —
  // shape described in the system prompt and validated by Zod on return.
  const result: AnalyzeResult = await analyze(input);
  printAnalysis(result.data);

  console.log(
    `\n  model=${result.meta.model}` +
      ` · ${result.meta.duration_ms}ms` +
      ` · in=${result.meta.input_tokens} out=${result.meta.output_tokens}`,
  );

  // ─── With options ───────────────────────────────────────────────────────
  // Upgrade the model for harder inputs, or swap in a custom system prompt
  // for a specialized variant (e.g. a translation-focused analyzer).
  //
  // const precise = await analyze(input, { model: "claude-sonnet-4-6" });
  // const custom  = await analyze(input, { systemPrompt: MY_PROMPT });

  // ─── Error handling ─────────────────────────────────────────────────────
  // `analyze()` throws on empty input, API failure, and schema mismatch
  // (with the raw model output included in the error message for debugging).
  try {
    await analyze("   ");
  } catch (err) {
    console.log(`\n[expected] empty-input guard: ${(err as Error).message}`);
  }
}

function printAnalysis(data: Analysis): void {
  console.log(`Summary: ${data.summary}\n`);
  console.log("Action items:");
  for (const item of data.action_items) {
    const owner = item.owner ?? "unassigned";
    console.log(`  [${item.priority.padEnd(6)}] ${item.task}  (${owner})`);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
