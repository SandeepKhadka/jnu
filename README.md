# Jodhpur National University — static website

Final year project. A statically exported Next.js site with a staff admin
panel, examination-results lookup, certificate generation and public
certificate verification.

**It runs with zero configuration.** Clone, install, start — seed data is
bundled, so every feature works immediately with no account, no API keys and
no database.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build        # static export to ./out
npm start            # serve ./out to check the real output
```

> If `npm run build` fails with `EBUSY` or `ENOTEMPTY`, a server is still
> holding the `out` folder. Stop it and rebuild.

### Demo staff logins

Sign in at **`/admin/login/`** (also linked as "Staff Login" in the footer):

| Email | Password | Role |
|---|---|---|
| `admin@jnu.local` | `jnu@2026` | Registrar |
| `exam@jnu.local` | `exam@2026` | Exam cell |

Both are click-to-fill on the login page.

### Try it in 60 seconds

1. `/results/` → enter `JNU2024BT0147` → full marksheet with subject-wise marks
2. `/results/` → enter `JNU2024BT0171` → **Invalid roll number** (that row exists but is unpublished)
3. `/verify/` → enter `JNU/DEG/2024/004512` → **Verified**
4. `/verify/` → enter `JNU/DEG/2022/003310` → **Revoked**, with the registrar's reason
5. `/admin/` → Certificates → fill a name → **Generate certificate** → print preview opens
6. Copy the new certificate number → `/verify/` → it verifies

Step 6 is the point of the design: a generated document is written to the
register first, so anything printed can be checked.

---

## How the data layer works

Default mode is **local**:

```
content/seed.ts          10 results · 8 certificates · 2 staff accounts
      │
      ▼
localStorage overlay     admin edits are saved here
      │
      ▼
src/lib/store.ts         single async API used by every component
```

Because both the admin panel and the public pages read through
`src/lib/store.ts`, a result published in `/admin/` immediately appears at
`/results/` **in the same browser**. That is what makes the demo real rather
than two disconnected screens.

What it does **not** do: sync across devices or browsers. localStorage is
per-browser. For cross-device data you need the Supabase path below.

**Admin → Audit Log → Reset to seed data** clears the overlay and restores the
original data. Run it before demonstrating the project to someone.

### Optional: Supabase for a real deployment

`supabase/schema.sql` contains the tables, Row Level Security policies and
audit triggers for a hosted deployment. Set the two `NEXT_PUBLIC_*` variables
in `.env.local`, run the SQL, and `getMode()` reports `supabase`. The store's
functions are already async so the swap needs no component changes.

---

## Certificates

The generator at **Admin → Certificates** takes a student name, programme,
year, enrollment number and division, auto-sequences the next certificate
number from the register (`JNU/DEG/<year>/<seq>`), writes the record, and opens
a printable A4 landscape certificate. **Print / Save as PDF** prints only the
certificate — site chrome is hidden by the print rules in `globals.css`.

The register also supports **Revoke** (with a recorded reason, shown on the
public verification page) and **Reinstate**.

### The SPECIMEN watermark stays

Every generated certificate carries a diagonal
**SPECIMEN — ACADEMIC PROJECT · NOT A VALID DEGREE** watermark. It is rendered
in the document flow rather than as a CSS background, and carries
`print-color-adjust: exact`, so it survives printing and PDF export.

This is deliberate and it should not be removed. An unmarked replica of a real
university's degree is a forgery whatever the intent behind producing it — and
this institution in particular had roughly 25,000 degrees invalidated after an
investigation in which certificates were sold. The watermark is what keeps this
a demonstration of the feature rather than a working forgery tool. The feature
itself — templating, data binding, sequencing, print output, verification
linkage — is fully demonstrated with it in place.

### When you send the certificate sample image

Restyle **`src/components/admin/CertificateTemplate.tsx`** only. The border,
seal, typography and layout are all isolated in that one file's `<style jsx>`
block, so matching a sample is a contained job. Keep the watermark block.

---

## Results

Adding a result and publishing it are two separate actions. Everything arrives
as a **draft**, invisible to students, so a bad CSV import can be corrected
before anyone sees it. "Publish all N drafts" handles a whole semester at once.

An unknown *or unpublished* roll number returns **"Invalid roll number"**. The
message does not distinguish the two cases on purpose — otherwise anyone could
enumerate enrolled roll numbers by trying values.

CSV bulk import expects:

```
roll_no,student_name,programme,semester,exam_session,marks_obtained,marks_max,sgpa,status
```

`roll_no`, `student_name`, `semester` and `exam_session` are required; the rest
are optional. **Download template** in the admin panel gives you a valid file.

---

## Being straight about the login

In local mode the credentials live in `content/seed.ts`, which ships in the
browser bundle. Anyone can read them in DevTools. **That is not access
control** — it is a demo fixture, and the login page says so on screen.

This is fine for a project demo and fine nowhere else. For real use, configure
Supabase: passwords are then hashed server-side, and Row Level Security — not
the login screen — is what actually stops an unauthorised read or write.

`AdminGate` decides what the UI renders. On a static site it cannot be enforced
at the edge, so it is a convenience in both modes.

---

## Layout

```
content/            Editable content, no JSX. Start here.
  site.ts           Branding, addresses, SEO defaults, recognition claims
  nav.ts            Menu tree + which routes are noindex
  pages.ts          25 static content pages as typed blocks
  programmes.ts     8 faculties, 24 programmes (drives Course schema)
  notices.ts        Notice board — build-time, indexable
  seed.ts           Demo results, certificates and staff accounts
src/app/            Routes. [...slug] renders everything in pages.ts
src/components/     layout/ home/ student/ admin/ seo/
src/lib/seo.ts      Canonicals, metadata, all JSON-LD builders
src/lib/store.ts    The data layer
supabase/schema.sql Tables + RLS + audit triggers, for hosted deployment
```

---

## SEO

Content is split by whether a search engine should see it:

- **Build time → static HTML → indexed**: 36 pages, sitemap, schema
- **Runtime → browser → noindex**: `/results/`, `/admin/`

`/verify/` **is** indexed — "JNU certificate verification" is a real employer
query and worth owning. Student marks are not, and were never something to
want in an index.

### Notices are build-time on purpose

Notices are public content we want ranked, so they must land in static HTML. If
the admin panel wrote them to a database and the page fetched them in the
browser, crawlers would frequently miss them — losing exactly the SEO this
build is for. So **Admin → Notices** generates a snippet for
`content/notices.ts`; committing it triggers a rebuild (~90 seconds) and the
notice is live and indexable.

Results, by contrast, are private and client-side. That split is the core
design decision of the project and the thing worth explaining to an examiner.

### Against the previous site's measured defects

| Previous site | This build |
|---|---|
| No sitemap (404) | `sitemap.xml`, 36 URLs, results/admin excluded |
| Relative canonical `"index.html"` | Absolute canonical per route |
| 2.48 MB hero, 4 unoptimised JPEGs | One image, AVIF/WebP, `fetchPriority="high"` |
| 59 stylesheets, 39 scripts | One Tailwind bundle, ~103 kB shared JS |
| Bare `WebSite` schema on an `http://` URL | `EducationalOrganization`, `Course` ×24, `FAQPage`, `BreadcrumbList`, `ItemList`, `ContactPage` |
| Relative `og:url` | Per-page OG + Twitter cards |
| No security headers | HSTS, nosniff, frame-deny via `public/_headers` |
| Render-blocking Google Fonts | Open Sans + Allerta self-hosted by `next/font` |
| Empty `alt` throughout | Authored alt text |
| 403 to non-browser User-Agents | Static CDN serves all clients equally |

`public/_redirects` maps every old `/index.html` URL to its new path, so the
previous site's rankings and inbound links carry over.

---

## Design

Deliberately mid-2010s institutional, matching the original: boxed 1210px
column on a grey shell, gradient nav chrome, 3px radii, 13–14px body copy,
hover dropdowns, marquee ticker. It uses the same two typefaces the original
loaded — **Open Sans + Allerta** — self-hosted instead of render-blocking.

Added what the original lacked: visible keyboard focus, a skip link,
`prefers-reduced-motion` support, and real mobile layouts.

---

## Content honesty

Two things are deliberately **not** invented anywhere on this site, because
publishing them unverified is a real problem for an institution rather than a
cosmetic one:

- **Statutory approval numbers and accreditation grades.** `/about/accreditation/`
  instead explains how to verify recognition with the UGC and the professional
  councils, and what to ask for in writing. Populate `site.recognition` in
  `content/site.ts` only from dated documentary evidence.
- **Placement percentages and salary figures.** `/placement/` describes how the
  cell works instead. Unverifiable placement claims are a common source of
  consumer-protection complaints against private universities.

Fee figures **are** present, clearly labelled indicative, so the page
demonstrates a real fee table. Replace with the approved schedule before any
live use.

The footer carries "Academic demonstration project — not the official
university website" on every page.

---

## Deploy

> Full step-by-step hosting + SEO checklist, including Search Console
> and Rich Results verification: **[DEPLOY.md](DEPLOY.md)**

Cloudflare Pages or Netlify: build `npm run build`, output directory `out`.
Both free at this traffic level. Set `NEXT_PUBLIC_SITE_URL` to the real origin
or the canonical URLs will be wrong.

Running cost in local mode is the domain alone, about ₹1,200/year.
