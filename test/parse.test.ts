import { strict as assert } from "node:assert";
import { test } from "node:test";
import { AnalysisSchema } from "../src/core/schema.ts";

const validPayload = {
  summary: "Team synced on Q2 plans.",
  action_items: [
    { task: "Ship auth revamp", owner: "Marco", priority: "high" },
    { task: "Add expired-link state to mocks", owner: "Dana", priority: "medium" },
    { task: "Send updated roadmap doc", owner: "Priya", priority: "low" },
  ],
};

test("schema accepts a well-formed payload", () => {
  const result = AnalysisSchema.safeParse(validPayload);
  assert.equal(result.success, true);
});

test("schema rejects wrong action_item count", () => {
  const bad = { ...validPayload, action_items: validPayload.action_items.slice(0, 2) };
  const result = AnalysisSchema.safeParse(bad);
  assert.equal(result.success, false);
});

test("schema rejects invalid priority", () => {
  const bad = {
    ...validPayload,
    action_items: [
      { ...validPayload.action_items[0], priority: "urgent" },
      validPayload.action_items[1],
      validPayload.action_items[2],
    ],
  };
  const result = AnalysisSchema.safeParse(bad);
  assert.equal(result.success, false);
});

test("schema allows null owner", () => {
  const payload = {
    ...validPayload,
    action_items: [
      { task: "Figure out on-call rotation", owner: null, priority: "medium" },
      validPayload.action_items[1],
      validPayload.action_items[2],
    ],
  };
  const result = AnalysisSchema.safeParse(payload);
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.action_items[0]?.owner, null);
});
