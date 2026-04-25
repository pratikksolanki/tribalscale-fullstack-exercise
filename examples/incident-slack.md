# #incidents-prod — Sat Apr 20, 14:02 UTC (Sev-2: Redis OOM / cascading 500s)

---

**14:02** `@sre-bot`: 🚨 ALERT: api-prod error rate > 5% for 60s. pager fired.

**14:02** `@marco`: on it

**14:03** `@marco`: redis prod cluster pegged at 100% mem, eviction kicking
in, latency through the roof

**14:04** `@ravi`: 👀

**14:04** `@marco`: error rate at 18% now

**14:05** `@priya`: what's the impact?

**14:05** `@marco`: all of /api/feed and /api/search failing intermittently.
checkout i think still ok

**14:06** `@ravi`: checking checkout

**14:06** `@marco`: also seeing a big burst of session validation lookups in
the redis slow log, could be what tipped it

**14:07** `@ravi`: checkout still green, like 99.2% — but degraded

**14:08** `@priya`: ok. rollback candidates?

**14:08** `@marco`: the session cache TTL change from this morning. deploy
#4401. that's the most likely culprit

**14:09** `@priya`: roll it back

**14:09** `@marco`: rolling #4401 back now

**14:11** `@marco`: rollback deployed. watching.

**14:13** `@ravi`: error rate dropping, redis mem coming down. 58% now

**14:14** `@marco`: ✅ error rate back under 1%. feed + search green.

**14:15** `@priya`: nice. status page update?

**14:15** `@marco`: i'll do it

**14:17** `@marco`: status page updated, "resolved" posted.

**14:18** `@priya`: ok, couple things — we need to figure out why the TTL
change caused a ~3x memory jump, that wasn't in the load test. also we had
no alert on redis memory until the error rate tripped the outer one. we
should fix both.

**14:19** `@ravi`: agreed. also we should tell CS proactively, acme and two
other enterprise accounts probably saw the 500s during the window.

**14:20** `@marco`: let me pull the affected accounts from the access log.

**14:22** `@marco`: posted the list in #cs-leads. three enterprise (acme,
initech, globex) plus ~200 hobby accounts saw 3+ failed requests in the
window.

**14:24** `@priya`: 🙏 ok let's write this up monday. marco, can you own the
postmortem?

**14:24** `@marco`: yep

**14:25** `@priya`: also file the redis memory alert as a follow-up, p1

**14:26** `@ravi`: i'll do that today actually, it's 5 lines of yaml.

**14:28** `@priya`: ❤️ thank you both. debrief monday 10am.

**14:30** `@sre-bot`: ℹ️ Sev-2 incident closed. Duration 28m.
