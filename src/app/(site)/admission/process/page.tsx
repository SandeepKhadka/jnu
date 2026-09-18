import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Blocks } from '@/components/content/Blocks'
import { PageShell } from '@/components/layout/PageShell'
import { AdmissionForm } from '@/components/student/AdmissionForm'
import { getFaculties, getPage } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'

/**
 * /admission/process/ has its own route because it carries the online
 * application form. Its prose is the CMS page at this path (Admin → Pages),
 * rendered with the same <Blocks> as every other page; the catch-all
 * excludes this path so the two never both claim the URL. The programme
 * list in the form comes from Admin → Programmes.
 */

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('/admission/process/')
  return pageMetadata({
    title: page?.title ?? 'Admission Process',
    description:
      page?.description ??
      'Apply online to Jodhpur National University. Step-by-step admission process, documents required and the application form.',
    path: '/admission/process/',
  })
}

export default async function AdmissionProcessPage() {
  const [page, faculties] = await Promise.all([getPage('/admission/process/'), getFaculties()])
  if (!page) notFound()

  // Only faculties with programmes can be applied to.
  const options = faculties
    .filter((f) => f.programmes.length > 0)
    .map((f) => ({
      faculty: f.name,
      programmes: f.programmes.map((p) => ({ name: p.name, award: p.award })),
    }))

  return (
    <PageShell title={page.title} intro={page.intro ?? undefined} crumbs={page.crumbs}>
      {/* The form goes first: someone arriving from a search for "JNU
          admission" is here to apply, not to read seven steps before finding
          out where the form is. The procedure follows it for reference. */}
      <section aria-labelledby="apply-heading" className="not-prose mb-10">
        <h2 id="apply-heading" className="rule-heading">
          Apply online
        </h2>
        <AdmissionForm programmes={options} />
      </section>

      <Blocks blocks={page.body} />
    </PageShell>
  )
}
