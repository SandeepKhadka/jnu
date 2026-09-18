import type { Metadata } from 'next'

import { pageByPath } from '@/content/pages'
import { Blocks } from '@/components/content/Blocks'
import { PageShell } from '@/components/layout/PageShell'
import { AdmissionForm } from '@/components/student/AdmissionForm'
import { pageMetadata } from '@/lib/seo'

/**
 * /admission/process/ has its own route rather than going through the
 * [...slug] catch-all, because it carries the online application form.
 *
 * The prose still comes from content/pages.ts and is rendered with the same
 * <Blocks> component the catch-all uses, so there is one copy of the content
 * and one renderer. The catch-all excludes this path from its
 * generateStaticParams so the two never both claim the URL.
 */

const page = pageByPath('/admission/process/')

export const metadata: Metadata = pageMetadata({
  title: page?.title ?? 'Admission Process',
  description:
    page?.description ??
    'Apply online to Jodhpur National University. Step-by-step admission process, documents required and the application form.',
  path: '/admission/process/',
})

export default function AdmissionProcessPage() {
  if (!page) return null

  return (
    <PageShell title={page.title} intro={page.intro} crumbs={page.crumbs}>
      {/* The form goes first: someone arriving from a search for "JNU
          admission" is here to apply, not to read seven steps before finding
          out where the form is. The procedure follows it for reference. */}
      <section aria-labelledby="apply-heading" className="not-prose mb-10">
        <h2 id="apply-heading" className="rule-heading">
          Apply online
        </h2>
        <AdmissionForm />
      </section>

      <Blocks blocks={page.body} />
    </PageShell>
  )
}
