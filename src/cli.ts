import { readFile } from "node:fs/promises";
import { analyze } from "./analyze.ts";

const HELP = `analyze - summarize text + extract 3 action items via the Anthropic Messages API

USAGE
  analyze --file <path>                 # read input from a file
  echo "text..." | analyze              # read input from stdin (when --file is omitted)
  analyze -f notes.md --meta            # include latency + token metadata

OPTIONS
  -f, --file <path>    Read input text from a file
  -m, --model <id>     Claude model to use (default: claude-haiku-4-5-20251001)
  --meta               Include { model, duration_ms, input_tokens, output_tokens, stop_reason }
  -h, --help           Show this help

ENV
  ANTHROPIC_API_KEY    Required.

OUTPUT
  A single JSON object on stdout.
`;

interface Args {
  file: string | null;
  model: string | undefined;
  includeMeta: boolean;
  help: boolean;
}

function parseArgs(argv: readonly string[]): Args {
  const args: Args = {
    file: null,
    model: undefined,
    includeMeta: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "-f":
      case "--file": {
        const v = argv[i + 1];
        if (!v) throw new Error(`${a} requires a path`);
        args.file = v;
        i++;
        break;
      }
      case "-m":
      case "--model": {
        const v = argv[i + 1];
        if (!v) throw new Error(`${a} requires a model id`);
        args.model = v;
        i++;
        break;
      }
      case "--meta":
        args.includeMeta = true;
        break;
      case "-h":
      case "--help":
        args.help = true;
        break;
      default:
        throw new Error(`unknown argument: ${a}`);
    }
  }
  return args;
}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return "";
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function main(): Promise<void> {
  let args: Args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`error: ${(err as Error).message}\n\n${HELP}`);
    process.exit(2);
  }

  if (args.help) {
    process.stdout.write(HELP);
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    process.stderr.write(
      "error: ANTHROPIC_API_KEY is not set.\n" +
        "  - Put it in ./.env (auto-loaded by `npm run analyze`), or\n" +
        "  - Export it in your shell: export ANTHROPIC_API_KEY=sk-ant-...\n",
    );
    process.exit(2);
  }

  const text = args.file
    ? await readFile(args.file, "utf8")
    : await readStdin();
  if (!text.trim()) {
    process.stderr.write(
      "error: no input. Pass --file <path> or pipe text via stdin. Use --help for usage.\n",
    );
    process.exit(2);
  }

  try {
    const result = await analyze(text, { model: args.model });
    const payload = args.includeMeta
      ? { data: result.data, meta: result.meta }
      : result.data;
    process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
  } catch (err) {
    process.stderr.write(
      `error: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    process.exit(1);
  }
}

void main();
