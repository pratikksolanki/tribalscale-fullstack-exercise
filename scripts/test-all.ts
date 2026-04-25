/**
 * Run the analyzer against every fixture in examples/ and save results to
 * a timestamped folder: test-all-{YYYYMMDD-HHmmss}/
 *
 * Usage:
 *   npm run test-all
 *   npx tsx --env-file-if-exists=.env scripts/test-all.ts
 */

import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { analyze } from "../src/analyze.ts";
import { type AnalyzeResult } from "../src/core/types.ts";

const EXAMPLES_DIR = "examples";

function runId(): string {
  const d = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return [
    d.getFullYear(),
    pad(d.getMonth() + 1),
    pad(d.getDate()),
    "-",
    pad(d.getHours()),
    pad(d.getMinutes()),
    pad(d.getSeconds()),
  ].join("");
}

async function main(): Promise<void> {
  const outDir = `test-all-result-${runId()}`;
  await mkdir(outDir, { recursive: true });
  console.log(`\nRun folder: ${outDir}\n`);

  const files = (await readdir(EXAMPLES_DIR))
    .filter((f) => f.endsWith(".md"))
    .sort();

  const summary: Record<string, unknown>[] = [];

  for (const file of files) {
    const label = basename(file, ".md");
    process.stdout.write(`  ${label.padEnd(26)} `);

    const text = await readFile(join(EXAMPLES_DIR, file), "utf8");
    let result: AnalyzeResult;

    try {
      result = await analyze(text);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stdout.write(`ERROR\n    ${msg}\n`);
      await writeFile(
        join(outDir, `${label}.error.txt`),
        msg,
        "utf8",
      );
      summary.push({ fixture: label, status: "error", error: msg });
      continue;
    }

    const { meta } = result;
    process.stdout.write(
      `${meta.duration_ms}ms  in=${meta.input_tokens} out=${meta.output_tokens}\n`,
    );

    await writeFile(
      join(outDir, `${label}.json`),
      JSON.stringify({ fixture: file, meta, data: result.data }, null, 2),
      "utf8",
    );

    summary.push({ fixture: label, status: "ok", meta, data: result.data });
  }

  await writeFile(
    join(outDir, "summary.json"),
    JSON.stringify({ run: outDir, fixtures: summary }, null, 2),
    "utf8",
  );

  console.log(`  results saved to ./${outDir}/\n`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
