import express, { type Request, type Response, type NextFunction } from "express";
import { analyze } from "./analyze.ts";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("error: ANTHROPIC_API_KEY is not set");
  process.exit(1);
}

const app = express();
app.use(express.json());

const PORT = process.env.PORT ?? 3000;

app.post("/analyze", async (req: Request, res: Response) => {
  const body = req.body as { text?: unknown; model?: unknown } | undefined;
  const { text, model } = body ?? {};

  if (typeof text !== "string" || !text.trim()) {
    res.status(400).json({ error: "text is required and must be a non-empty string" });
    return;
  }

  try {
    const result = await analyze(text, {
      model: typeof model === "string" ? model : undefined,
    });
    res.json(result.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isInputError = message.startsWith("analyze():");
    res.status(isInputError ? 400 : 500).json({
      error: isInputError ? message : "analysis failed — check server logs",
    });
    if (!isInputError) console.error(err);
  }
});

// Catches malformed JSON bodies from express.json()
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(400).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}`);
});
