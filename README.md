# Jodhpur National University — static site

A statically exported Next.js site with a staff admin panel, examination-results
lookup and public certificate verification. Built SEO-first: every public page is
prerendered to plain HTML at build time and served from a CDN, with no server
runtime and no database query on page load.

---

## Quick start

```bash
npm install
cp .env.local.example .env.local     # fill in, or leave blank to run without Supabase
npm run dev                          # http://localhost:3000
```

```bash
npm run build                        # static export to ./out
npm start                            # serve ./out locally to check the real output
```

The site builds and every public page works **without** Supabase configured. The
admin panel, results lookup and enquiry form show a clear "not configured" state
rather than failing silently.

---

## Architecture

The one decision everything else follows from: **content is split by whether a
search engine should see it.**

```
BUILD TIME  ──>  static HTML on the CDN        ──>  indexed
  content/*.ts        ~45 pages, sitemap, schema

RUNTIME     ──>  browser ──> Supabase          ──>  noindex
  /results            published results only, RLS-enforced
  /admin              staff session, RLS-enforced
  /verify             public certificate lookup (page itself IS indexed)
```

### Why notices are build-time, not database-backed

Notices are public content we want to rank. If the admin panel wrote them to
Supabase and the page fetched them in the browser, crawlers would frequently
miss them — losing exactly the SEO this project exists to deliver. So notices
live in `content/notices.ts` and a publish triggers a rebuild (~90 seconds).

Only genuinely private data — results — is fetched client-side.

### Layout

```
content/          Editable content, no JSX. Start here.
  site.ts         Branding, addresses, SEO defaults, recognition claims
  nav.ts          Menu tree + which routes are noindex
  pages.ts        ~25 static content pages as structured blocks
  programmes.ts   Faculty and programme catalogue (drives Course schema)
  notices.ts      Notice board (build-time, indexable)
src/app/          Routes. [...slug] renders everything in pages.ts
src/components/   layout/ home/ student/ admin/ seo/
src/lib/seo.ts    Canonicals, metadata, all JSON-LD builders
supabase/schema.sql   Tables, RLS policies, audit triggers
```

---

## Supabase setup

1. Create a project at supabase.com (free tier is sufficient).
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy the project URL and anon key into `.env.local`.
4. **Authentication → Providers → Email → turn OFF "Allow new users to sign
   up".** Staff accounts are invite-only.
5. Invite a staff user under Authentication → Users, then add their row:

```sql
insert into public.staff (user_id, full_name, role)
values ('<uuid-from-auth-users>', 'Registrar Name', 'registrar');
```

Roles: `registrar`, `exam_cell`, `editor`.

### Security model — read this before changing anything

The anon key ships in the browser **by design**. It is not a secret. What keeps
student data private is **Row Level Security**, not the key and not the login
screen.

- `results`: anonymous callers can read rows only where `published = true`.
  An unpublished result is indistinguishable from a non-existent one.
- `certificates`: publicly readable — verification is the point.
- All writes require membership of the `staff` table.
- Every write to `results` and `certificates` is recorded in `audit_log`.

`AdminGate` decides what the UI renders. It is **not** the security boundary.
Someone who bypasses it entirely still cannot read or write a protected row.

Corollary: a login implemented in client-side JavaScript alone would be
decorative — whatever it checked would be readable in DevTools. This one posts
to Supabase Auth, which hashes passwords server-side and returns a signed JWT.
No credential exists in the bundle.

---

## Results

Two-step by design: saving a result and publishing it are separate actions.
Imported and hand-entered rows both arrive `published = false`, so a bad import
can be corrected before anyone sees it.

CSV bulk import expects this header:

```
roll_no,student_name,programme,semester,exam_session,marks_obtained,marks_max,sgpa,status
```

An unknown or unpublished roll number returns **"Invalid roll number"**. The
message deliberately does not distinguish "no such student" from "not published"
— otherwise anyone could enumerate enrolled roll numbers.

### Optional: add a second factor

The default policy lets an anon caller read any published row if they guess a
roll number — the same exposure as a printed result gazette. If per-student
privacy is required, uncomment the date-of-birth policy in `schema.sql` and add
a DOB field to the lookup form.

---

## Certificates — verification only

`/verify/` lets employers and institutions confirm a certificate number against
the registrar's record. Outcomes: `VERIFIED`, `REVOKED`, `WITHHELD`, or not
found. A revoked certificate says so explicitly rather than staying silent.

**There is deliberately no certificate generation, rendering or issuance path,
and none should be added.** This institution's degrees were invalidated at scale
following a fake-degree investigation in which certificates were sold. A tool
that mints degree documents would be the instrument of that fraud, whatever the
intent behind it. The register records certificates *already issued on paper*,
transcribed from the registrar's authoritative issuance register.

---

## Publishing notices

1. Sign in to `/admin/` → Notices tab.
2. Fill the form, copy the generated snippet.
3. Paste into the `notices` array in `content/notices.ts`.
4. Commit and push. The deploy hook rebuilds; the notice is live and indexable.

To let staff do this without a developer, add a git-backed CMS (Sveltia CMS or
Decap CMS) pointed at `content/notices.ts`. Budget roughly a day.

---

## SEO

What this build does, against the audited defects of the previous site:

| Previous site | This build |
|---|---|
| No sitemap (404) | `sitemap.xml` generated, 36 URLs, results/admin excluded |
| Relative canonical `"index.html"` | Absolute canonical per route via `absoluteUrl()` |
| 2.48 MB hero, 4 unoptimised JPEGs | One image, AVIF/WebP, eager + `fetchPriority="high"` |
| 59 stylesheets, 39 scripts | One Tailwind bundle, ~103 kB shared JS |
| Only bare `WebSite` schema, `http://` URL | `EducationalOrganization`, `Course` (×24), `FAQPage`, `BreadcrumbList`, `ItemList`, `ContactPage` |
| Relative `og:url` | Per-page OG + Twitter cards |
| No security headers | Set at the CDN edge — see below |
| Google Fonts render-blocking | Open Sans + Allerta self-hosted by `next/font` |
| Empty `alt` throughout | Authored alt text |
| 403 to non-browser User-Agents | Static CDN serves all clients equally |

### Redirect map — do not skip this

Every old URL ended in `/index.html`. Without redirects that link equity is
lost. Add to `public/_redirects` (Cloudflare Pages / Netlify):

```
/index.html                               /                                    301
/admission-2/index.html                   /admission/process/                  301
/fee-structure-2/index.html               /admission/fee-structure/            301
/notice-and-circular/index.html           /notices/                            301
/jnuresults/index.html                    /results/                            301
/engineering-and-technology/index.html    /faculty/engineering-technology/      301
/management/index.html                    /faculty/management/                  301
/Pharmaceutical-Sciences/index.html       /faculty/pharmaceutical-sciences/     301
/computer-application/index.html          /faculty/computer-application/        301
/applied-sciences/index.html              /faculty/applied-sciences-nursing/    301
/law/index.html                           /faculty/law/                         301
/education/index.html                     /faculty/education/                   301
/arts-and-commerce/index.html             /faculty/arts-commerce/               301
/contact-us/index.html                    /contact/                            301
/infrastructure/index.html                /about/infrastructure/               301
/academic-council/index.html              /about/academic-council/             301
/foundation/index.html                    /about/foundation/                   301
/download-forms/index.html                /admission/download-forms/           301
/syllabus-2/index.html                    /admission/syllabus/                 301
/time-table/index.html                    /student-zone/time-table/            301
/placement/index.html                     /placement/                          301
/research/index.html                      /research/                           301
/career/index.html                        /career/                             301
/photo-gallery/index.html                 /photo-tour/                         301
```

The full crawled list is in the audit; extend as needed.

### Security headers

Static hosts do not read `next.config.mjs` headers. Add `public/_headers`:

```
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### Launch checklist

- [ ] Set `NEXT_PUBLIC_SITE_URL` to the real origin — canonicals depend on it
- [ ] Replace `/public/images/campus-hero.svg` with a real photo (AVIF/WebP/JPG)
- [ ] Replace `src/app/icon.svg` with the institution's crest
- [ ] Add `/public/og/default.png` at 1200×630
- [ ] Add `_redirects` and `_headers`
- [ ] Fill every `placeholder: true` page in `content/pages.ts`
- [ ] Populate `site.recognition` **only** from dated documentary evidence
- [ ] Submit `sitemap.xml` in Google Search Console
- [ ] Confirm `/results/` and `/admin/` return `noindex` in production
- [ ] Have the privacy notice reviewed and add the DPDP grievance officer

---

## Content still required from the client

Pages marked `placeholder: true` in `content/pages.ts` render a visible
"Content pending" note rather than inventing prose. Nothing in this build states
a fee, a date, an approval or a placement statistic that has not been supplied —
those are the claims that create consumer-protection exposure for an
institution, and they must come from the registrar with evidence.

Highest priority: fee structure, accreditation status, admission dates.

---

## Deploy

Cloudflare Pages: build `npm run build`, output `out`. Add the two
`NEXT_PUBLIC_*` variables. Netlify is identical. Both free at this traffic.

Running cost is about ₹1,200/year — the domain — with hosting, Supabase, TLS and
transactional email all on free tiers.
