# Zendesk #48213 — "Exports silently truncated at 10k rows"

**Customer:** Acme Logistics (Enterprise, renewal in 6 weeks)
**Reporter:** Jamie Chen, Head of Analytics at Acme

---

**Jamie (Mon 9:14 AM):**
> Our weekly ops report CSV has been coming out short for at least 3 weeks.
> We're missing roughly 40% of our rows. No error, no banner, just a
> truncated file. We caught it because the finance reconciliation numbers
> didn't match. This has probably caused decisions to be made on bad data.

**Sam (Support, Mon 10:02 AM):**
> Jamie, really sorry — looking into this now. Can you share the export ID
> from the last report? I'll pull the job logs.

**Jamie (Mon 10:11 AM):**
> Export ID `exp_9f3a2c1`. Also two others from the last three weeks:
> `exp_8d11ea0`, `exp_7b0942f`. All three are missing rows.

**Sam (Mon 11:40 AM):**
> Confirmed on our side — all three jobs hit a 10,000-row ceiling that was
> added as a safety rail in March. There's no surface-level notification
> when the cap is hit, which is the bigger problem. I'm escalating to eng.

**Ravi (Eng, Mon 2:22 PM):**
> Looked at the code path. The 10k cap was added in PR #4411 as a
> memory-pressure safeguard, but the truncation happens silently —
> `rows.slice(0, 10000)` with no warning emitted. Two things to fix:
> (1) remove the silent truncation and either stream or fail loudly, and
> (2) notify any customers whose exports may have been affected. I can
> pull a list from the job logs.

**Jamie (Tue 8:45 AM):**
> Thanks for the fast triage. Two asks from our side: we need a corrected
> export for the last 3 weekly reports ASAP (finance needs to restate),
> and some kind of written assurance this won't happen again. Renewal
> conversation is coming up and leadership will ask.

**Sam (Tue 9:30 AM):**
> Absolutely, both in flight. Ravi is generating the corrected exports
> today. I'll follow up with a post-mortem once the fix is out.
