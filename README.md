# Jodhpur National University — university website

Final year project. A Next.js application with a static, SEO-first public site
and a database-backed staff area: examination results, certificate generation
and public certificate verification.

**Runs locally with no external service.** SQLite is created on first
migration, so it is clone, install, migrate, seed, run.

---

## Quick start

```bash
npm install
cp .env.local.example .env.local     # then fill in AUTH_SECRET (see below)
npx prisma migrate dev               # creates prisma/dev.db and its tables
npm run db:seed                      # loads the demo data
npm run dev                          # http://localhost:3000
```

Generate the auth secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### Staff logins

Sign in at **`/admin/login/`** (also linked as "Staff Login" in the footer):

| Email | Password | Role |
| --- | --- | --- |
| `admin@jnu.local` | `jnu@2026` | Registrar |
| `exam@jnu.local` | `exam@2026` | Exam cell |

Both are click-to-fill on the login page. They are created by `npm run db:seed`,
which stores only a bcrypt hash. Change them before any live deployment.

### Try it in 60 seconds

1. `/results/` → `JNU2024BT0147` → full marksheet with subject-wise marks
2. `/results/` → `JNU2024BT0171` → **Invalid roll number** — that row exists,
   but the exam cell has not published it
3. `/admin/` → sign in → publish that row → search it again → it appears
4. `/verify/` → `JNU/DEG/2024/004512` → **Verified**
5. `/verify/` → `JNU/DEG/2022/003310` → **Revoked**, with the registrar's reason
6. `/admin/` → Certificates → generate one → copy the number → `/verify/` → it verifies

Step 3 shows the admin panel and the public site are one system. Step 6 shows a
generated document is immediately checkable by a third party — the record is
written before anything printable is rendered.

---

## Architecture

The organising decision: **content is split by whether a search engine should
see it.**

```
BUILD TIME ──> prerendered HTML ──> indexed
  content/*.ts      ~36 pages, sitemap, JSON-LD schema

RUNTIME    ──> API routes ──> Prisma ──> database ──> noindex
  /results/         public lookup, published rows only
  /admin/           session required, every route re-checks
  /verify/          public (the page itself IS indexed — see below)
```

`/verify/` is deliberately indexable: "JNU certificate verification" is a real
query employers make. Student marks are not, and never were something to want
in a search index.

### Notices are build-time on purpose

Notices are public content we want ranked, so they must land in static HTML. If
the admin panel wrote them to the database and the page fetched them in the
browser, crawlers would frequently miss them — losing exactly the SEO this
build exists for.

So **Admin → Notices** generates a snippet for `content/notices.ts`; committing
it triggers a rebuild and the notice is live and indexable. Results, by
contrast, are private and go through the API. That split is the most
interesting thing in the project.

### Layout

```
content/              Editable content, no JSX. Start here.
  site.ts             Branding, addresses, SEO defaults, recognition claims
  nav.ts              Menu tree + which routes are noindex
  pages.ts            25 static content pages as typed blocks
  programmes.ts       8 faculties, 24 programmes (drives Course schema)
  notices.ts          Notice board — build-time, indexable
  seed.ts             Demo data, loaded into the database by prisma/seed.ts
prisma/
  schema.prisma       5 models, constraints and indexes
  migrations/         Version-controlled schema history
  seed.ts             Idempotent seeding script
src/app/
  api/                11 endpoints — see the table below
  [...slug]/          Renders everything in content/pages.ts
src/lib/
  db.ts               Prisma client singleton
  auth.ts             bcrypt, JWT sessions, requireStaff(), audit()
  api.ts              Shared response helpers
  store.ts            Client-side fetch wrapper over the API
  seo.ts              Canonicals, metadata, all JSON-LD builders
src/components/       layout/ home/ student/ admin/ seo/
```

---

## Backend

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/auth/login` | public |
| POST | `/api/auth/logout` | public |
| GET | `/api/auth/me` | public (returns null when signed out) |
| GET | `/api/results/lookup?roll=` | **public** — published rows only |
| GET | `/api/results` | staff |
| POST | `/api/results` | staff — one row, or many for CSV import |
| PATCH | `/api/results/:id` | staff — publish / unpublish |
| DELETE | `/api/results/:id` | staff |
| GET | `/api/certificates/verify?no=` | **public** |
| GET | `/api/certificates` | staff |
| POST | `/api/certificates` | staff |
| PATCH | `/api/certificates/:id` | staff — revoke / reinstate |
| GET | `/api/audit` | staff |
| POST | `/api/enquiries` | public (contact form) |
| GET | `/api/enquiries` | staff |

### Data model

`Staff`, `Result`, `Certificate`, `AuditLog`, `Enquiry`.

A unique constraint on `(rollNo, semester, examSession)` means a student sits a
given semester once; `certificateNo` is unique. Both public lookups have a
covering index.

### Security

Three properties, in the order they matter:

1. **Filtering happens in the database query.** `/api/results/lookup` applies
   `published: true` server-side and selects only display fields. An
   unpublished result cannot reach the browser at all.
2. **Passwords are bcrypt hashes at cost 12.** Comparison happens on the
   server; the hash never leaves it. The login response contains no credential.
3. **The session is a signed JWT in an httpOnly cookie.** Open DevTools on
   `/admin/` and run `document.cookie` — the session is not there, so an XSS
   bug cannot steal it. `getSessionUser()` also re-reads the role from the
   database, so revoking an account takes effect before the token expires.

`AdminGate` decides what the UI renders. It is **not** the boundary — every
protected route calls `requireStaff()`. Bypassing the component gets you an
empty page.

Two deliberate details:

- An unknown roll number and an unpublished one return the **identical**
  response. If they differed, anyone could enumerate enrolled roll numbers.
- Wrong password and unknown account return the **identical** 401, so neither
  confirms whether an account exists.

Every write to results and certificates is recorded in `AuditLog` with the
actor and timestamp, server-side, so it cannot be edited from the browser.

---

## Results

Adding a result and publishing it are two separate actions. Everything arrives
as a **draft**, invisible to students, so a bad CSV import can be corrected
before anyone sees it. "Publish all N drafts" handles a whole semester.

CSV bulk import expects:

```
roll_no,student_name,programme,semester,exam_session,marks_obtained,marks_max,sgpa,status
```

`roll_no`, `student_name`, `semester` and `exam_session` are required; the rest
are optional. **Download template** in the admin panel gives you a valid file.
Rows are inserted one at a time and duplicates are skipped, so a partial import
stays usable.

---

## Certificates

**Admin → Certificates** takes a name, programme, year, enrollment number and
division, auto-sequences the next number from the register
(`JNU/DEG/<year>/<seq>`), **writes the database row**, and only then opens a
printable A4 landscape certificate. Print output hides the site chrome.

The register also supports **Revoke** — which requires a reason, stored and
shown publicly on the verification page — and **Reinstate**. A credential
withdrawn silently would still read as valid to anyone checking it, which
defeats the point of keeping a register.

### The SPECIMEN watermark stays

Every generated certificate carries a diagonal
**SPECIMEN — ACADEMIC PROJECT · NOT A VALID DEGREE** watermark, rendered in the
document flow rather than as a CSS background and carrying
`print-color-adjust: exact`, so it survives printing and PDF export.

This is deliberate. An unmarked replica of a real university's degree is a
forgery whatever the intent behind producing it — and this institution had
roughly 25,000 degrees invalidated after an investigation in which certificates
were sold. The watermark keeps this a demonstration of the feature rather than
a working forgery tool. Everything being demonstrated — templating, data
binding, sequencing, print output, verification linkage — works with it there.

### When the certificate sample arrives

Restyle **`src/components/admin/CertificateTemplate.tsx`** only. The border,
seal, typography and layout are isolated in that one file's `<style jsx>`
block. Keep the watermark block.

---

## SEO

Against the measured defects of the site this replaces:

| Previous site | This build |
| --- | --- |
| No sitemap (404) | `sitemap.xml`, 36 URLs, results/admin excluded |
| Relative canonical `"index.html"` | Absolute canonical per route |
| 2.48 MB hero, 4 unoptimised JPEGs | One image, AVIF/WebP, `fetchPriority="high"` |
| 59 stylesheets, 39 scripts | One Tailwind bundle, ~103 kB shared JS |
| Bare `WebSite` schema on an `http://` URL | `EducationalOrganization`, `Course` ×24, `FAQPage`, `BreadcrumbList`, `ItemList`, `ContactPage` |
| Relative `og:url` | Per-page OG + Twitter cards |
| No security headers | HSTS, nosniff, frame-deny via `public/_headers` |
| Render-blocking Google Fonts | Open Sans + Allerta self-hosted by `next/font` |
| Empty `alt` throughout | Authored alt text |
| 403 to non-browser User-Agents | Served to all clients equally |

`public/_redirects` maps every old `/index.html` URL to its new path, so the
previous site's rankings and inbound links carry over.

Adding API routes did not cost any of this: content pages are still prerendered
at build time. Only `/api/*` and the admin screens are dynamic.

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

- **Statutory approval numbers and accreditation grades.**
  `/about/accreditation/` explains how to verify recognition with the UGC and
  the professional councils instead. Populate `site.recognition` in
  `content/site.ts` only from dated documentary evidence.
- **Placement percentages and salary figures.** `/placement/` describes how the
  cell works instead. Unverifiable placement claims are a common source of
  consumer-protection complaints against private universities.

Fee figures **are** present, clearly labelled indicative, so the page
demonstrates a real fee table. Replace with the approved schedule before any
live use.

Nine maintainer TODO notes are tagged `audience: 'maintainer'` in
`content/pages.ts` and hidden from rendered pages. To see what remains:

```bash
NEXT_PUBLIC_SHOW_MAINTAINER_NOTES=true npm run dev
```

---

## Commands

```bash
npm run dev         # development, http://localhost:3000
npm run build       # generates client, applies migrations, builds
npm start           # run the production build
npm run typecheck   # tsc --noEmit

npm run db:migrate  # create and apply a migration after a schema change
npm run db:seed     # load demo data (idempotent)
npm run db:reset    # drop, migrate, re-seed — run before demonstrating
npm run db:studio   # visual database browser
```

Stop any running server before `npm run build`, or it fails with `EPERM` on
Windows — the dev server holds `.next`.

---

## Deploy

> Step-by-step hosting and the post-hosting SEO checklist, including Search
> Console and Rich Results verification: **[DEPLOY.md](DEPLOY.md)**

Short version: the app needs a Node runtime, so it goes to **Vercel** rather
than a static host, with **Postgres** (Neon free tier) instead of SQLite —
a one-line change to the `provider` in `prisma/schema.prisma`.
