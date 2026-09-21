# Project handoff — Jodhpur National University website

> **How to use this file.** Paste it whole as the opening message of a new AI
> coding session, or give it to a developer as their first day of onboarding.
> It is written to be read cold, with no other context.

---

## 1. Who you are and what you are working on

You are taking over development of the **official website and administration
system for Jodhpur National University** (Jodhpur, Rajasthan, India). It is
client work, delivered as production software — not a demo and not a college
assignment. Treat every decision as something a real university's staff and
applicants will depend on.

The system is two products sharing one codebase:

1. **A public website** — the university's marketing and information site.
   Programmes, notices, photo tour, admission form, results lookup, certificate
   verification. This is the part that must rank in Google.
2. **An administration panel** — a full CMS plus a student records system.
   University staff edit every word and image on the public site, manage the
   student register, publish examination results, and issue degree
   certificates. No developer involvement is required to run the site day to
   day.

**SEO is the single most important non-functional requirement.** The client
engaged this project specifically to rank. Architectural decisions were made to
protect that, and they are documented in section 4. Do not undo them.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript 5.6 (strict) |
| Styling | Tailwind CSS 3 — no component library |
| ORM | Prisma 6 |
| Database | SQLite in development (`prisma/dev.db`); **must become Postgres in production** |
| Auth | JWT in httpOnly cookies via `jose`; password hashing via `bcryptjs` |
| Images | `sharp` — AVIF/WebP/JPEG at multiple widths, generated at upload |
| QR codes | `qrcode` — on marksheets and degree certificates |
| Charts | Hand-written inline SVG. **No charting library. Do not add one.** |
| Icons | Hand-written inline SVG (`src/components/admin/icons.tsx`). **No icon package.** |

Full dependency list is in `package.json`. The runtime dependency list is
deliberately nine packages long. Adding a dependency is a decision that needs
justifying, not a reflex.

---

## 3. Running it

```bash
npm install
cp .env.local.example .env.local     # then edit — see section 3.2
npx prisma migrate deploy            # creates prisma/dev.db
npm run db:seed                      # site content only, no fake people
npm run admin:create -- --email you@example.com --name "Your Name"
npm run dev                          # http://localhost:3000
```

### 3.1 The script list

| Command | What it does |
|---|---|
| `npm run dev` | Development server, hot reload |
| `npm run preview` | `next build && next start` — **the fast one**, use this to show the client |
| `npm run build` | `prisma generate && prisma migrate deploy && tsx prisma/seed.ts && next build` |
| `npm run typecheck` | `tsc --noEmit` — the real gate; run before every commit |
| `npm run db:seed` | Site content (pages, faculties, settings). Fills empty tables only |
| `npm run db:seed:demo` | Demo students/results/certificates. Refuses under `NODE_ENV=production` |
| `npm run db:studio` | Prisma Studio, browse the database |
| `npm run admin:create` | Creates a staff administrator, prompts for a password without echoing |
| `npm run images -- <folder>` | Runs the sharp pipeline over a folder of source photographs |

**Performance note you will otherwise waste a day on.** `npm run dev` serves
pages in 200 ms–1.4 s because Next.js compiles each route the first time it is
visited. The same pages in a production build serve in **5–30 ms**. This was
measured, repeatedly, and mistaken for a bug more than once. If the site feels
slow, check whether you are in dev mode before investigating anything else. On
Windows, adding the project folder and `node.exe` to Defender's exclusions
helps dev mode noticeably.

### 3.2 Environment variables

These are the variables the code actually reads:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Prisma connection string. `file:./dev.db` locally |
| `AUTH_SECRET` | Signs session JWTs. **≥32 chars, different in production** |
| `NEXT_PUBLIC_SITE_URL` | Absolute origin. Wrong value ⇒ wrong canonicals ⇒ SEO damage |
| `UPLOAD_DIR` | Where applicant documents are written. Default `./var/uploads` |
| `MEDIA_DIR` | Where admin-uploaded media is written. Default `./var/media` |
| `NEXT_PUBLIC_SHOW_MAINTAINER_NOTES` | Shows TODO notes on rendered pages while drafting content |
| `ADMIN_PASSWORD` | Only read by `scripts/create-admin.ts`, for non-interactive setup |

⚠️ **`.env.local.example` is out of date.** It still lists
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from an
abandoned early direction — nothing in the codebase reads them — and it does
not mention `MEDIA_DIR`. Fixing that file is a good first task.

---

## 4. Architecture — read this before changing anything

### 4.1 The core decision: the site is a CMS but the pages are still static

Every public page is **prerendered to static HTML at build time** and stays
static. Search engines receive complete HTML. Visitors never wait on a database
query. That is the SEO position, and it is the thing most likely to be
destroyed by accident.

The database is still the source of truth for all content. The two are
reconciled like this:

```
Admin saves  →  API route writes to the database
             →  calls revalidateContent()  (src/lib/revalidate.ts)
             →  revalidateTag(CONTENT_TAG) + revalidatePath('/', 'layout')
             →  affected pages regenerate on the next request (~1s)
```

All public content reads go through `src/lib/content.ts`, where each reader is
wrapped in `unstable_cache(..., { tags: [CONTENT_TAG] })`. Admin screens call
the `*Admin` variants, which bypass the cache and include unpublished rows.

**The rule:** never call `db.*` directly from a public page or component. Add a
cached reader to `src/lib/content.ts` instead. A direct query makes the page
dynamic, and a dynamic page is a page Google renders more slowly and a visitor
waits for.

**How to verify you have not broken it:** run `npx next build` and read the
route table. Public routes must be marked `○` (static) or `●` (SSG). Only
`/api/*` and `/admin/*` may be `ƒ` (dynamic). If a public page flips to `ƒ`,
you have introduced a per-request data read — find it and move it behind
`content.ts`.

### 4.2 Directory layout

```
src/app/(site)/          Public pages — header + footer, prerendered
src/app/admin/(panel)/   Admin screens — auth-gated shell, dynamic
src/app/admin/login/     Sign-in, outside the gated shell
src/app/api/             Route handlers
src/components/          admin/, layout/, student/, site components
src/lib/                 All business logic. Start reading here
prisma/                  schema.prisma, migrations, seed.ts, seed-demo.ts
content/                 Seed content authored as TypeScript
config/redirects.mjs     Legacy-URL redirects + security headers
scripts/                 optimise-images.ts, create-admin.ts
var/media, var/uploads   Written at runtime. NOT under public/. Not in git
```

### 4.3 The `src/lib` map

| File | Responsibility |
|---|---|
| `content.ts` | Every public read of editable content. Cached, tagged |
| `content-types.ts` | Normalisers, defaults, `safeHref`. All content passes through here |
| `revalidate.ts` | The single cache-invalidation entry point |
| `permissions.ts` | Role/permission matrix — the security model, in one table |
| `auth.ts` | Staff sessions, `getSessionUser`, `requireStaff` |
| `student-auth.ts` | Student sessions (separate cookie, separate secret salt) |
| `admin-route.ts` | `requirePermission`, `body`, `s()`, `InputError`, `audit()` |
| `admin-client.ts` | The browser-side fetch wrapper every admin screen uses |
| `dashboard.ts` | Dashboard aggregation queries |
| `media.ts` / `media-shared.ts` | sharp pipeline, variant storage, srcset helpers |
| `marksheet.ts` / `marksheet-token.ts` | Marksheet generation and signed verify tokens |
| `ratelimit.ts` | Database-backed rate limiting |
| `seo.ts` | Metadata, JSON-LD, sitemap |

---

## 5. Data model

Nineteen Prisma models in `prisma/schema.prisma`:

**People & access** — `Staff`, `Student`, `RateLimit`, `AuditLog`
**Academic records** — `Result`, `Certificate`, `CorrectionRequest`
**Admissions** — `Application`, `Enquiry`, `Upload`
**Content** — `Setting`, `Page`, `Faculty`, `Programme`, `Notice`, `Slide`,
`GalleryCategory`, `GalleryPhoto`, `Media`

### Invariants you must not break

1. **`dob` is a `String` in `YYYY-MM-DD` form, never a `DateTime`.** It is half
   of the student's login credential and half of certificate verification. A
   timezone shift would lock students out of their own results. Do not
   "improve" this to a date type.
2. **Roll numbers are upper-cased on write** (`src/lib/student-input.ts`). A
   record differing only in case is a record the student cannot sign in to.
3. **Only the last four digits of Aadhaar are ever stored.** UIDAI requires
   masking for non-authorised agencies, and the DPDP Act 2023 makes storing
   more than necessary a liability. Never widen this field.
4. **`AuditLog` is append-only.** There is deliberately no delete path and no
   UI control to clear it. Results and certificates are the records most worth
   tampering with; the trail is the defence.
5. **Content is stored as typed blocks, never as HTML.** `normaliseBlocks` in
   `content-types.ts` is what stops stored XSS. Do not add a rich-text field
   that stores markup.
6. **`safeHref` rejects `javascript:` URLs.** All admin-supplied links go
   through it.

### Migrations

Six migrations exist under `prisma/migrations/`. Use `npx prisma migrate dev`
to create new ones. **Never run `prisma migrate reset` against a database with
real data** — prefer targeted `deleteMany` on verified rows.

---

## 6. Authentication and authorisation

Two completely separate session systems:

- **Staff** — `jnu_session` cookie, JWT signed with `AUTH_SECRET`, `bcryptjs`
  password hashes, 12-character minimum enforced for every account created
  through the panel.
- **Students** — separate cookie and a salted variant of the secret. Students
  sign in with **roll number + date of birth**. Failed attempts are rate
  limited and the account locks temporarily (`lockedUntil`).

### The permission matrix

`src/lib/permissions.ts` holds one table mapping each permission to the roles
that have it. It is read by **both** the API (`requirePermission`) and the
sidebar (`AdminShell`), so the menu and the enforcement cannot drift apart.

Four roles: **admin** (everything), **registrar** (students, degrees,
corrections, admissions, recognition, exams), **exam_cell** (students, results,
photo approvals), **editor** (website content only — no student data).

**Hiding a link is a convenience, never the control.** Every route re-checks.
When you add an admin screen you must add its permission to the matrix *and*
call `requirePermission` in its API route.

There are **no default, demo or seeded credentials anywhere.** The first
administrator is created with `npm run admin:create`. Do not reintroduce a
fallback login "for convenience".

---

## 7. What the admin panel covers

Roughly twenty screens under `src/app/admin/(panel)/`:

**Website** — Homepage, Carousel, Pages, Faculties & programmes, Notices, Photo
gallery, Menus, Media library
**Students & records** — Students (search, CSV import, per-student detail),
Results, Degrees, Student requests (photo + correction approvals)
**Admissions** — Applications, Enquiries
**Settings** — Site details, Logo & branding, Recognition, Examinations, Staff
accounts, Audit log

The **dashboard** (`/admin`) shows what needs attention, a hero figure, stat
tiles with month-on-month deltas and sparklines, four charts, and the latest
audit entries.

### Shell and UI conventions

- `src/components/admin/AdminShell.tsx` — navy sidebar, collapses to a 68 px
  icon rail, preference stored in `localStorage` under `jnu.admin.railed`,
  slide-over drawer on phones.
- `src/components/admin/ui.tsx` — the shared kit: `PageHeader`, `Card`, `Field`,
  `Input`, `Select`, `Table`, `Td`, `Pill`, `Modal`, `Button`, `Pagination`,
  `useStatus`. **Use these; do not hand-roll a new input or table.**
- `src/components/admin/charts.tsx` — `AreaChart`, `BarRows`, `StatTile`,
  `Sparkline`, `HeroFigure`, `Meter`.
- All list screens paginate **in the query, not in the browser**, so the page
  count matches what is shown. Page size 25 (media: 24).

### Chart rules (follow them, they were validated not guessed)

- **One hue** (`#1f6aa8`), validated for contrast against the white card
  surface. Magnitude is carried by **length**, never by shading — colouring
  bars darker-where-bigger double-encodes and misleads.
- **Marks wear colour; text never does.** Labels and values use text tokens.
- **Every chart has a "View as table" toggle.** No value may be reachable only
  by hovering.
- A four-colour status palette was tried for the application pipeline and
  **rejected** — the colours failed colour-blind and even normal-vision
  separation checks. That panel uses labelled single-hue bars instead. Do not
  reintroduce multi-colour status charts without re-validating.

---

## 8. Student portal, results and certificates

- **Student login** — roll number + date of birth (`/student/login/`).
- **Results** — a student sees their own results once published. Marks are
  validated server-side (`results-validate.ts`); obtained marks cannot exceed
  maximum marks.
- **Certificate verification** — public, by roll number + date of birth, plus a
  published contact address for verification queries.
- **Marksheets and degrees** — generated with QR codes and Crockford base32
  serials (`JNU-SOM-…`, `JNU-DEG-…`), signed verify tokens.
- **Printing** — the print view renders through `createPortal` to
  `document.body`, and `body.<x>-printing > *:not(#overlay) { display: none }`
  hides the site chrome so only the document prints. CSS **named pages**
  (`@page cert`, `@page marksheet`, `@page stationery`) set per-document paper.
  ⚠️ A global `@page { size: A4 landscape }` was tried once and made *every*
  page in the site print sideways. Never set `@page` globally.
- Students may request **corrections** and upload a **replacement photograph**;
  both go to a staff approval queue rather than changing the record directly.

---

## 9. SEO — the part that pays for the project

What is already in place:

- Every public page prerendered to static HTML (section 4.1)
- `generateMetadata` with a title template, canonicals, Open Graph, Twitter cards
- Organisation + WebSite JSON-LD in the site layout
- `sitemap.xml` and `robots.txt` generated from published content
- `trailingSlash: true` throughout — canonical URLs end in `/`
- Exactly **one `<h1>` per page** (a duplicate-h1 bug was fixed once; do not
  reintroduce it by rendering a caption twice for desktop and mobile)
- 5 legacy-URL redirects and 5 security headers in `config/redirects.mjs`, wired
  through `next.config.mjs`'s `redirects()` / `headers()`
- Admin and student pages carry `robots: noindex, nofollow, nocache`
- Carousel slides past the first are genuinely deferred — an `armed` set plus a
  `settled` gate, because opacity-0 siblings still count as "in viewport" and
  were being fetched on load
- OG image kept small (85 KB JPEG) so WhatsApp and similar actually render the
  preview

⚠️ **`config/redirects.mjs` replaced Netlify `_redirects`/`_headers` files**,
which were silently inert on a Node host. If you migrate hosts, verify
redirects still fire — do not assume a platform file works.

Remaining SEO work is described in `DEPLOY.md` Part 2 (Search Console, Rich
Results, PageSpeed, Bing).

---

## 10. Media pipeline

Uploads go through `sharp`:

- Re-encoded to **AVIF, WebP and JPEG** at several widths, with `srcset`
- **EXIF and GPS data stripped** — location data in photographs is a privacy leak
- **Magic-byte sniffing**, not extension trust
- **SVG rejected outright** (it is a script vector)
- Written to `MEDIA_DIR` / `UPLOAD_DIR`, **never under `public/`** — anything
  under `public/` is served to the world, and applicant documents must not be.
  They are served instead through `/api/uploads/[id]` behind an auth check.

`images: { unoptimized: true }` is set in `next.config.mjs` because the pipeline
already produced the variants; Next's optimiser would re-do the work.

---

## 11. Design system

The **public site** deliberately reproduces a mid-2010s Indian university
aesthetic: 3 px border radius, 13–14 px base font, hairline borders, Open Sans
+ Allerta. Tokens live in `tailwind.config.ts` (`jnu` blue scale, `sand`
accent, `muted`, `hair`, `shell`). **Do not modernise the public site's visual
language** — it is an intentional match to the client's existing brand.

The **admin panel** is exempt and is styled modern: rounded-xl cards, soft
shadows, focus rings, a navy gradient sidebar. Keep that split.

---

## 12. Git and delivery conventions

- Branch: `master`. Remote: `github.com/SandeepKhadka/jnu` (private).
- **The client, Sandeep Khadka, is the sole author of record on every commit.**
  **Never add `Co-Authored-By:` trailers, "Generated with…" footers, or any
  other AI/tool attribution to commit messages or pull request descriptions.**
  History was rewritten once already to strip them; do not reintroduce them.
- Commit messages: a short imperative subject, then prose explaining **why**,
  not what. Look at `git log` for the established voice.
- Run `npm run typecheck` and `npx next build` before committing.
- `next lint` is not configured in this project (it prompts for setup); the
  typecheck and the build are the gates.

---

## 13. Traps that have already cost time

1. **`route.ts` may only export route handlers.** Exporting a constant or
   helper from one breaks the build. This happened four separate times. Put
   shared values in `src/lib/`.
2. **A `server-only` module imported by a client component breaks the build.**
   Shared constants live in their own neutral file (e.g.
   `student-constants.ts`).
3. **Use `api()` from `admin-client.ts`, not raw `fetch`.** It appends the
   trailing slash that `trailingSlash: true` requires and handles the session
   cookie and error shape once.
4. **Never set a global `@page` rule** (section 8).
5. **`unstable_cache` keys must be unique per reader.** Two readers sharing a
   key will serve each other's data.
6. **The dev server holds `.next`.** Running a build while `npm run dev` is
   running fails with `EPERM` on `.next/trace`. Stop dev first.
7. **Prisma's agent guard blocks `migrate reset`.** Do not try to work around
   it; use targeted deletes.

---

## 14. Known issues and outstanding work

Honest list of what is not finished:

- [ ] **`.env.local.example` is stale** — lists two Supabase variables nothing
      reads, omits `MEDIA_DIR` (section 3.2)
- [ ] **`README.md` has a broken section** — "### Staff logins" ends in a colon
      with nothing after it, left over from removing the demo-credentials table
- [ ] **`DEPLOY.md` is written for an academic viva**, not a client handover.
      Rewrite Parts 3–4 for the client's context
- [ ] **Still on SQLite.** Production needs Postgres: change the provider in
      `prisma/schema.prisma`, set `DATABASE_URL`, re-run migrations
- [ ] **Local-filesystem media will not survive a serverless host.** On Vercel
      the filesystem is ephemeral — move `MEDIA_DIR`/`UPLOAD_DIR` to object
      storage, or host somewhere with a persistent volume (Render, a VPS)
- [ ] **Admin password policy is inconsistent.** The panel enforces 12
      characters for every account, but the first administrator was created
      from the command line with a 10-character password. Rotate it
- [ ] **The database has no real student, application or enquiry data yet**, so
      dashboard charts read zero. That is correct behaviour, not a bug
- [ ] **No automated test suite.** Verification to date has been typecheck +
      build + manual API calls + headless-browser screenshots

---

## 15. How to verify your work

There is no test runner, so verification is explicit and mandatory:

1. `npm run typecheck` — must be clean.
2. `npx next build` — must compile, **and** public routes must still be `○`/`●`
   (section 4.1).
3. For API changes, exercise the endpoint with real requests — sign in, call
   the route, check status codes, pagination boundaries, and that a role
   without permission receives **403**.
4. For UI changes, **look at the result**. Run `npm run preview` and open it, or
   drive headless Chrome via `puppeteer-core`. Check a wide viewport and a
   phone viewport. Check the empty state, not only the populated one.
5. If you seed demo data to check something, **delete it afterwards** and say
   so. The client's database must not accumulate fake people.

**Report outcomes honestly.** If something is half-done, say which half. If you
could not verify a claim, say so rather than implying you checked.

---

## 16. Deployment

`DEPLOY.md` has the step-by-step. Summary:

1. Provision Postgres; switch the Prisma provider; set `DATABASE_URL`.
2. Set `AUTH_SECRET` to a fresh 48-byte random string.
3. Set `NEXT_PUBLIC_SITE_URL` to the real origin — **this one silently ruins
   SEO if wrong**, because every canonical URL is built from it.
4. Point `MEDIA_DIR` and `UPLOAD_DIR` at persistent storage.
5. Deploy, run migrations, seed content, create the first administrator.
6. Register the site in Google Search Console and submit the sitemap.

---

## 17. How to work on this project

- **Read before you write.** `src/lib/` explains most of the system, and the
  comments record *why* decisions were made. Several of them look
  over-cautious until you know the reason.
- **Preserve the SEO architecture** above any other refactor.
- **Ask before widening scope.** The client asks for concrete things; deliver
  those fully rather than partially delivering something larger.
- **This is a real institution's data.** Student records, applicant identity
  documents and degree certificates are the three most sensitive things here.
  When a change touches them, be conservative and leave the audit trail intact.
