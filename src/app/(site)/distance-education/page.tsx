import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BlockView } from '@/components/content/Blocks'
import { PageShell } from '@/components/layout/PageShell'
import { getDistanceEducation, getPage, getSite } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'

/**
 * /distance-education/ — programmes offered in distance mode.
 *
 * Its own route rather than a CMS page because the programme table is a list
 * of structured rows edited at Admin → Distance education. Any prose still
 * comes from the CMS page at this path, if one has been created, so the office
 * can write an introduction in the ordinary page editor.
 *
 * Hidden entirely until someone switches it on, so it can be prepared and
 * reviewed before the university announces anything.
 */

const PATH = '/distance-education/'

export async function generateMetadata(): Promise<Metadata> {
  const [page, site, de] = await Promise.all([getPage(PATH), getSite(), getDistanceEducation()])
  if (!de.enabled) return { robots: { index: false, follow: false } }
  return pageMetadata({
    title: page?.title ?? 'Distance Education',
    description:
      page?.description ??
      `Programmes offered in distance mode by ${site.name}, with duration, eligibility and fees.`,
    path: PATH,
  })
}

export default async function DistanceEducationPage() {
  const [page, de] = await Promise.all([getPage(PATH), getDistanceEducation()])

  // Off means the page does not exist, not an empty page: a bare heading with
  // no programmes under it reads like a university that offers none.
  if (!de.enabled) notFound()

  return (
    <PageShell
      title={page?.title ?? 'Distance Education'}
      intro={page?.intro ?? undefined}
      crumbs={page?.crumbs ?? [{ name: 'Distance Education', path: PATH }]}
    >
      {page?.body.map((b, i) => <BlockView key={i} block={b} />)}

      {de.intro ? <p className="text-[14px] leading-relaxed">{de.intro}</p> : null}

      {/*
        Only rendered when the office has written one. There is deliberately no
        default text here: a recognition or approval statement for distance
        programmes is a claim the university has to be able to evidence.
      */}
      {de.approvalNote ? (
        <p className="mt-4 rounded border border-hair bg-shell px-4 py-3 text-[13px] leading-relaxed">
          {de.approvalNote}
        </p>
      ) : null}

      {de.programmes.length === 0 ? (
        <p className="mt-6 text-[14px] text-muted">
          Programmes offered in distance mode will be listed here.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr>
                <th className="border border-hair bg-shell px-3 py-2 text-left">Programme</th>
                <th className="border border-hair bg-shell px-3 py-2 text-left">Award</th>
                <th className="border border-hair bg-shell px-3 py-2 text-left">Duration</th>
                <th className="border border-hair bg-shell px-3 py-2 text-left">Eligibility</th>
                <th className="border border-hair bg-shell px-3 py-2 text-left">Fee</th>
              </tr>
            </thead>
            <tbody>
              {de.programmes.map((p, i) => (
                <tr key={`${p.name}-${i}`}>
                  <td className="border border-hair px-3 py-2 font-semibold text-jnu-800">{p.name}</td>
                  <td className="border border-hair px-3 py-2">{p.award || '—'}</td>
                  <td className="border border-hair px-3 py-2">{p.duration || '—'}</td>
                  <td className="border border-hair px-3 py-2">{p.eligibility || '—'}</td>
                  <td className="border border-hair px-3 py-2">{p.fee || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {de.note ? (
        <p className="mt-6 text-[13px] leading-relaxed text-muted">{de.note}</p>
      ) : null}
    </PageShell>
  )
}
