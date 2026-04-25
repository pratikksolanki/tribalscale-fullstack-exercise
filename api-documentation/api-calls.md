# Example API Calls

Start the server first:
```bash
npm run server
# listening on http://localhost:3000
```

---

## Basic call

```bash
curl -s -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "We need to fix the login bug before Friday. John will handle the backend patch and Sarah will update the tests. We also need to notify customers about the downtime."
  }' | jq
```

---

## Override the model

```bash
curl -s -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Quarterly review: revenue is down 12%, churn increased. We need to schedule a leadership meeting, revise the pricing strategy, and reach out to churned customers for feedback.",
    "model": "claude-sonnet-4-6"
  }' | jq
```

---

## Pass one of the example fixtures

```bash
curl -s -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d "{\"text\": $(cat examples/github-issue.md | jq -Rs .)}" | jq
```

```bash
curl -s -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d "{\"text\": $(cat examples/incident-slack.md | jq -Rs .)}" | jq
```

```bash
curl -s -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d "{\"text\": $(cat examples/standup-transcript.md | jq -Rs .)}" | jq
```

---

## Error cases

**Empty text — returns 400:**
```bash
curl -s -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": ""}' | jq
```

**Missing text field — returns 400:**
```bash
curl -s -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{}' | jq
```

**Wrong content type (no `Content-Type: application/json`) — returns 400:**
```bash
curl -s -X POST http://localhost:3000/analyze \
  -d "just some plain text" | jq
# { "error": "text is required and must be a non-empty string" }
```

---

## Expected response shape

```json
{
  "summary": "...",
  "action_items": [
    { "task": "...", "owner": "John", "priority": "high" },
    { "task": "...", "owner": null,   "priority": "medium" },
    { "task": "...", "owner": "Sarah","priority": "low" }
  ]
}
```

Error responses:
```json
{ "error": "text is required and must be a non-empty string" }
```
