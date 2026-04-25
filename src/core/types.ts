import type { Analysis } from "./schema.ts";

export interface AnalyzeOptions {
  /** Claude model id. Defaults to claude-haiku-4-5-20251001. */
  model?: string;
  /** Override the system prompt. Advanced use only. */
  systemPrompt?: string;
  /** Max output tokens. Defaults to 1024 — enough for a summary + 3 items. */
  maxTokens?: number;
}

export interface AnalyzeMeta {
  model: string;
  duration_ms: number;
  input_tokens: number;
  output_tokens: number;
  stop_reason: string | null;
}

export interface AnalyzeResult {
  data: Analysis;
  meta: AnalyzeMeta;
  raw: string;
}
