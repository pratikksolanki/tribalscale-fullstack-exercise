# Product brief: Saved views for the reports dashboard

## Problem

Power users (finance, ops, CS leads) pull the same 3–5 dashboard
configurations every week. Today each visit requires re-picking the date
range, filters, and column selection from defaults. In interviews, 7 of 9
weekly users described this as "the most annoying part of my Monday
morning." Two customers have asked whether they can bookmark a URL —
currently they can't, because filter state lives in component state, not
the URL.

## Proposal

Introduce **saved views**: named, shareable configurations of the reports
dashboard that a user can save, revisit, and share with teammates.

### Scope

- A view captures: date range (absolute or relative), active filters,
  column selection and order, sort.
- Users can save a view with a name, edit/rename/delete their own views,
  and pin up to 3 as quick-access tabs.
- Views are scoped per-workspace. Workspace admins can promote a personal
  view to a "team view" visible to everyone in the workspace.
- Saved views are addressable via URL (`/reports?view=abc123`), making
  them shareable in Slack, docs, etc.

### Out of scope

- Scheduled delivery of saved views (separate initiative, Q3).
- View-level permissions beyond "personal" vs. "team".
- Mobile — desktop web only for v1.

## Success metrics

- ≥60% of weekly-active power users create at least one saved view within
  30 days of launch.
- Median time-to-first-chart for returning users drops from 28s to <8s.
- Zero increase in dashboard p95 load time.

## Risks and open questions

1. Filter state today leaks into component-local state in a dozen places.
   A non-trivial refactor is implied before persistence is even possible.
   Eng needs to scope this.
2. "Team views" overlap with the existing workspace-level default filter.
   We should decide whether team views replace that mechanism or coexist.
3. URL length: with enough filters selected, the serialized state won't
   fit in a URL. We'll likely need a short-id backed by storage.

## Timeline

Targeting a beta behind a flag in ~8 weeks, GA within the quarter. Eng
capacity is the limiting factor and depends on the filter-state refactor.
