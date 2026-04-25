# Standup transcript — Tuesday Apr 23, 9:00 AM

_Auto-transcribed by Otter.ai. Speaker labels may be imperfect._

---

**[00:00:04] Priya:** alright, let's - ok morning everyone. we've got like
twenty minutes so let's keep it tight. i'll go first. umm. yesterday i was
mostly in the auth planning doc, got through the state machine diagrams,
there's still the session refresh edge case i haven't figured out. today i'm
gonna try to close that out and then start on the onboarding handoff with
dana. blockers — i need marco to confirm whether we're keeping the legacy
`/session` endpoint or deprecating it, because it changes the whole flow.

**[00:00:52] Marco:** yeah so — deprecating. we talked about this in the arch
sync, hard deprecate not soft. i'll write it up in the doc today so it's not
just in my head.

**[00:01:07] Priya:** perfect thank you.

**[00:01:10] Speaker 3:** ok me next? so yesterday i was on the billing modal
safari thing. found the issue — it's the hover state on the primary button,
on webkit it triggers a layout thrash because of a transform that gets
promoted weirdly. fix is small, i have a pr open, just waiting on review.
today, um, if someone can review that i'll merge it and then i'm back on the
onboarding designs for dana. oh and — sorry — i lied, i also have the a/b
test results to look at for the pricing page.

**[00:02:04] Priya:** who's reviewing the billing modal pr?

**[00:02:08] Speaker 3:** either of you really, it's tiny, maybe 20 lines.

**[00:02:14] Marco:** i can pick that up after standup.

**[00:02:17] Dana:** or i can do it, i haven't done a frontend review in a
while and i want to look at the transform thing.

**[00:02:22] Marco:** ok you take it then.

**[00:02:25] Priya:** k moving on. dana?

**[00:02:28] Dana:** yeah so yesterday, finished the onboarding v3 mocks,
uploaded to figma. i need to hand off to ravi on the email-verify flow but
he's OOO till thursday so that'll slip. i'll — actually — question for
marco, do you want me to include the expired-link state in the handoff doc
even though we haven't decided where it sits in the flow?

**[00:03:12] Marco:** yes, include it, i'll make the call about placement
today.

**[00:03:18] Dana:** cool. today i'm finishing the settings redesign scope
doc, that's for monday's planning. no blockers.

**[00:03:30] Priya:** marco?

**[00:03:32] Marco:** ok so, yesterday, spent most of the day triaging the
zendesk backlog that piled up last week. three p1s, assigned all three. the
redis memory issue from saturday night is still kind of open — we rolled
back but haven't done the post-mortem. i — keep saying i'll write it up, i
have to actually do it today or tomorrow. also today, the `/session`
deprecation doc for priya, and i need to look at devfan42's report about
safari pdf uploads because it's the second one this week.

**[00:04:28] Priya:** ok wait, two things — one, can you write the postmortem
today, not tomorrow, because blameless postmortem policy says 72 hours and
we hit that tonight. two, on the pdf upload, is that blocking anyone
external?

**[00:04:52] Marco:** yeah, acme noticed. their head of ops filed it
yesterday actually. okay fine — postmortem today, deprecation doc tomorrow.

**[00:05:10] Priya:** good.

**[00:05:12] Dana:** oh — unrelated but also, anyone going to the saturday
thing at ravi's place? i still don't have the address.

**[00:05:20] Marco:** i'll send it to the group chat after standup.

**[00:05:24] Priya:** ok that's — yeah, not for here. anything else? alright,
same time tomorrow. thanks everyone.

**[00:05:33] [END]**
