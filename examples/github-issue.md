# [Bug] App freezes / tab dies when uploading PDFs > ~10MB on Safari

**Opened by:** @jamiechen_dev
**Labels:** bug, needs-repro, browser-safari

---

## What's happening

I've been trying to upload an invoice PDF (about 14MB) and the app just...
freezes. Safari shows the beachball for ~30s and then the tab goes completely
white. Happens every time I try. I've recieved zero error messages on screen,
no toast, nothing. Today I lost probably 2 hours of form data in a different
tab because Safari ran out of memory and killed everything.

### Expected

Upload finishes, I see the file in my dashboard. Or at worst, a clean error.

### Actual

Tab dies. Sometimes the whole Safari process gets killed if I had other tabs
open. Chrome and Firefox handle the same PDF fine.

### Env

| | |
|---|---|
| Browser | Safari 17.4 |
| OS | macOS 14.4 (Sonoma) |
| App version | 2.18.1 |
| PDF size | 14.2 MB |
| Other browsers | Chrome works, Firefox works, **Brave also crashes** |

### Partial stack trace

I caught this in the console before the tab died. Sorry it's cut off — dev
tools closed with the page.

```
TypeError: undefined is not an object (evaluating 't.buffer.slice')
    at <anonymous> (chunked-upload.js:214:48)
    at processChunk (chunked-upload.js:187:12)
    at <anonymous> (uploader.js:88:
```

---

### Reply from @marco-eng (maintainer) · 2 days ago

Thanks for the report. A few things to help us repro:

- Can you try with a smaller PDF (~5MB) and a bigger one (~25MB) so we can
  narrow the threshold?
- "Safari 17.4" — do you know if it's 17.4.0 or 17.4.1? The upload path was
  touched in 2.18 and the WebKit behavior between those two patch versions
  is slightly different.
- Is the PDF scanned / image-heavy, or mostly vector text? Memory profile
  differs a lot.

Not reproducing yet on a 20MB scanned PDF on Safari 17.5 / macOS 14.5 but
we're on newer patch versions. Will try to get closer to your setup.

### Reply from @jamiechen_dev · 1 day ago

will try tonight when i'm back at my laptop, in meetings all day sorry

### Reply from @devfan42 · 1 day ago

+1, seeing the same thing on Safari 17.5. PDFs over ~8MB crash the tab for me
too. Not a Safari-only bug maybe — I also saw it once on iPad Safari.

### Reply from @uiwatcher · 6h ago

off-topic but any update on the dark mode issue (#2041)? been a while 🙏
