import { z } from "zod";

export const PrioritySchema = z.enum(["high", "medium", "low"]);

export const ActionItemSchema = z.object({
  task: z.string().min(1, "task is empty"),
  owner: z.string().min(1).nullable(),
  priority: PrioritySchema,
});

export const AnalysisSchema = z.object({
  summary: z.string().min(1, "summary is empty"),
  action_items: z
    .array(ActionItemSchema)
    .length(3, "expected exactly 3 action items"),
});

export type Priority = z.infer<typeof PrioritySchema>;
export type ActionItem = z.infer<typeof ActionItemSchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;
