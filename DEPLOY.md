# Hosting and SEO — step by step

Written for the college project submission. Follow it in order; each SEO step
produces a screenshot worth putting in your report.

---

## Part 1 — Host it

### 1.1 Push to GitHub

```bash
git remote add origin https://github.com/<you>/jnu-website.git
git branch -M main
git push -u origin main
```

### 1.2 Deploy on Cloudflare Pages (free, no card needed)

1. Sign in at <https://dash.cloudflare.com> → **Workers & Pages** → **Create** →
   **Pages** → **Connect to Git**
2. Pick the repository
3. Build settings:

   | Field | Value |
   | --- | --- |
   | Framework preset | None |
   | Build command | `npm run build` |
   | Build output directory | `out` |

4. **Environment variables** — add this one before the first build:

   ```
   NEXT_PUBLIC_SITE_URL = https://<your-project>.pages.dev
   ```

5. **Save and Deploy.** First build takes 2–3 minutes.

Netlify is identical: build `npm run build`, publish directory `out`.

### 1.3 The one setting that breaks SEO if you skip it

`NEXT_PUBLIC_SITE_URL` must be your real deployed URL.

Every `<link rel="canonical">`, every entry in `sitemap.xml` and every Open
Graph tag is built from it. Leave it unset and it falls back to
`https://jodhpurnationaluniversity.co.in` — meaning your site would tell Google
*"the real version of this page is on someone else's domain, index that
instead."* Your pages would never rank.

After deploying, confirm it took:

```bash
curl -s https://<your-project>.pages.dev/ | grep -o 'rel="canonical" href="[^"]*"'
# must print YOUR domain, not jodhpurnationaluniversity.co.in
```

### 1.4 About the domain

`jodhpurnationaluniversity.co.in` belongs to the real institution — you cannot
host there. You will be on a free subdomain like `jnu-project.pages.dev`, which
is fine for a college project.

Do **not** try to outrank the real university for its own name. That is
impersonation, and it competes with a live institution using its identity. The
footer already carries *"Academic demonstration project — not the official
university website"* on every page; leave it there.

---

## Part 2 — SEO after hosting

Your teacher cannot grade rankings — those take months. They grade **evidence
that the SEO is correctly implemented.** Each step below gives you a
screenshot.

### 2.1 Google Search Console — the main one

1. Go to <https://search.google.com/search-console>
2. **Add property** → **URL prefix** → paste your full URL
3. Verify by **HTML tag**. Copy the `content="..."` value, then add it to
   `src/app/layout.tsx` inside the `metadata` export:

   ```ts
   verification: { google: 'PASTE_THE_CONTENT_VALUE_HERE' },
   ```

   Commit and push; Cloudflare rebuilds; click **Verify**.
4. Left menu → **Sitemaps** → enter `sitemap.xml` → **Submit**
5. Wait a day, then screenshot the page showing **36 discovered URLs**

> 📸 **Screenshot 1:** Sitemaps page, status Success, 36 URLs

### 2.2 Rich Results Test — your strongest evidence

<https://search.google.com/test/rich-results>

Test these three URLs:

| URL | What it should detect |
| --- | --- |
| `/faculty/engineering-technology/` | **Course** ×5 + Breadcrumbs |
| `/` | **FAQ** ×4 + Organization |
| `/verify/` | **FAQ** ×4 + Breadcrumbs |

Most student projects have zero structured data. This is the screenshot that
separates yours.

> 📸 **Screenshot 2:** Rich Results showing 5 valid Course items

### 2.3 PageSpeed Insights

<https://pagespeed.web.dev> — run it on your deployed home page.

A static export with one CSS bundle should score well. Screenshot both the
mobile and desktop scores, and the Core Web Vitals panel.

> 📸 **Screenshot 3:** Performance / Accessibility / Best Practices / SEO scores

If Performance is lower than you want, the cause is almost certainly the hero
image — see Part 3.

### 2.4 Bing Webmaster Tools

<https://www.bing.com/webmasters> — sign in, **Import from Google Search
Console** (one click), or add the site and submit the same `sitemap.xml`.

> 📸 **Screenshot 4:** Bing sitemap submitted

### 2.5 Verify robots and sitemap by hand

```bash
curl https://<your-site>/robots.txt
curl -s https://<your-site>/sitemap.xml | grep -c "<loc>"    # expect 36
curl -s https://<your-site>/sitemap.xml | grep -cE "results|admin"   # expect 0
```

That last one matters: it proves student results are excluded from the index.

### 2.6 Confirm the private pages really are noindex

```bash
curl -s https://<your-site>/results/    | grep -o 'name="robots" content="[^"]*"'
# expect: noindex, nofollow, nocache
curl -s https://<your-site>/verify/     | grep -o 'name="robots" content="[^"]*"'
# expect: index, follow
```

---

## Part 3 — Still outstanding

| Item | Why it matters | Who |
| --- | --- | --- |
| **Real campus photo** | Hero is a grey SVG placeholder. Export at 1600px wide, under ~150 KB, save as `public/images/campus-hero.jpg` and restore the `<source>` lines in `Hero.tsx` | You |
| **Certificate sample** | To restyle `CertificateTemplate.tsx` to match the real design | You → me |
| **Gallery photos** | `/photo-tour/` describes the campus but has no images; drop them in `public/images/gallery/` | You |
| Google verification tag | Section 2.1 above | You |

Everything else is done.

---

## Part 4 — For the viva

The most interesting decision in the project, and the one to lead with:

> **Public content is built into static HTML so search engines index it.
> Private data is fetched in the browser and marked `noindex`.**

Concretely:

- **Notices** are in `content/notices.ts` and compiled into the HTML at build
  time. Google can read them. That is why the admin panel's Notices tab
  generates a code snippet instead of writing to a database — a database fetch
  in the browser would be invisible to crawlers, throwing away the SEO.
- **Results** are fetched client-side and the page carries `noindex`, is absent
  from `sitemap.xml`, and is disallowed in `robots.txt`. Student marks must
  never reach a search index — that is a DPDP Act 2023 issue, not a preference.

Second point worth making: **an unknown roll number and an unpublished one
return the identical "Invalid roll number" message.** If they differed, anyone
could enumerate which roll numbers are enrolled by trying values.

Third: the certificate generator **writes the register record before opening
the print view**, so every document produced can be verified at `/verify/`. A
certificate that cannot be checked is the problem the feature exists to avoid.

### Showing it live

Reset to a clean state first: **Admin → Audit Log → Reset to seed data**.

Then the 60-second demo:

1. `/results/` → `JNU2024BT0147` → full marksheet
2. `/results/` → `JNU2024BT0171` → **Invalid roll number** (it exists, but is unpublished)
3. `/verify/` → `JNU/DEG/2022/003310` → **Revoked**, with the registrar's reason
4. `/admin/` → sign in → Certificates → generate one → Print
5. Copy the new number → `/verify/` → it verifies

Step 5 is the one that lands: the thing you just made is immediately checkable
by a third party.

---

## Local commands

```bash
npm run dev      # development, http://localhost:3000
npm run build    # static export to ./out
npm start        # serve ./out to check the real output
```

Stop any running server before `npm run build`, or it fails with `EPERM` /
`ENOTEMPTY` — the dev server holds the `.next` and `out` folders on Windows.

To see the outstanding maintainer TODO notes on the rendered pages while you
work through them:

```bash
NEXT_PUBLIC_SHOW_MAINTAINER_NOTES=true npm run dev
```

They are hidden by default so nobody reading the site sees them.
