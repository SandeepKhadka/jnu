import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { faculties, facultyBySlug } from '@/content/programmes'
import { PageShell } from '@/components/layout/PageShell'
import { JsonLd } from '@/components/seo/JsonLd'
import { pageMetadata, courseSchema } from '@/lib/seo'

/** Static export needs every dynamic route enumerated at build time. */
export function generateStaticParams() {
  return faculties.map((f) => ({ slug: f.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const faculty = facultyBySlug(slug)
  if (!faculty) return {}

  const awards = [...new Set(faculty.programmes.map((p) => p.award))].join(', ')

  return pageMetadata({
    title: `${faculty.name} — Programmes`,
    // Description carries the award names, which is what admissions queries use.
    description: `${faculty.name} at Jodhpur National University. Programmes: ${awards}. ${faculty.summary}`,
    path: `/faculty/${faculty.slug}/`,
  })
}

export default async function FacultyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const faculty = facultyBySlug(slug)
  if (!faculty) notFound()

  return (
    <>
      {/* One Course node per programme — the highest-value schema here. */}
      <JsonLd data={faculty.programmes.map(courseSchema)} />

      <PageShell
        title={faculty.name}
        intro={faculty.summary}
        crumbs={[
          { name: 'Faculty', path: '/faculty/' },
          { name: faculty.name, path: `/faculty/${faculty.slug}/` },
        ]}
        sidebar={
          <div className="panel">
            <h2 className="panel-head m-0">Other Faculties</h2>
            <div className="panel-body p-0">
              <ul className="m-0 list-none p-0">
                {faculties
                  .filter((f) => f.slug !== faculty.slug)
                  .map((f) => (
                    <li key={f.slug} className="border-b border-hair last:border-b-0">
                      <a href={`/faculty/${f.slug}/`} className="block px-4 py-2.5 text-[13px] no-underline hover:bg-shell">
                        {f.name}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        }
      >
        <h2>Programmes offered</h2>
        <table>
          <thead>
            <tr>
              <th>Programme</th>
              <th>Award</th>
              <th>Duration</th>
              <th>Mode</th>
              <th>Eligibility</th>
            </tr>
          </thead>
          <tbody>
            {faculty.programmes.map((p) => (
              <tr key={p.slug}>
                <td>{p.name}</td>
                <td>{p.award}</td>
                <td className="tnum whitespace-nowrap">
                  {p.durationMonths % 12 === 0
                    ? `${p.durationMonths / 12} year${p.durationMonths === 12 ? '' : 's'}`
                    : `${p.durationMonths} months`}
                </td>
                <td className="whitespace-nowrap">{p.mode}</td>
                <td>{p.eligibility}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-6">
          <a href="/admission/process/" className="btn btn-primary">
            Admission process
          </a>{' '}
          <a href="/admission/fee-structure/" className="btn btn-secondary">
            Fee structure
          </a>
        </p>
      </PageShell>
    </>
  )
}
