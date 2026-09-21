import type { Metadata } from 'next'

import { BlockView } from '@/components/content/Blocks'
import { PageShell } from '@/components/layout/PageShell'
import { DocumentTable } from '@/components/site/DocumentTable'
import { getAffiliations, getPage, getSite } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'

/**
 * /affiliations/ — the approval letters, as the original site published them.
 *
 * This has its own route rather than being a CMS page because the table is
 * generated from uploaded PDFs (Admin → Affiliations & syllabus). Any prose
 * for the page still comes from the CMS page at this path, if one exists.
 */

const PATH = '/affiliations/'

export async function generateMetadata(): Promise<Metadata> {
  const [page, site] = await Promise.all([getPage(PATH), getSite()])
  return pageMetadata({
    title: page?.title ?? 'Affiliations & Approvals',
    description:
      page?.description ??
      `Regulatory approvals and affiliations held by ${site.name}, with the letters available to view.`,
    path: PATH,
  })
}

export default async function AffiliationsPage() {
  const [page, list] = await Promise.all([getPage(PATH), getAffiliations()])

  return (
    <PageShell
      title={page?.title ?? 'Affiliations & Approvals'}
      intro={page?.intro ?? undefined}
      crumbs={page?.crumbs ?? [{ name: 'Affiliations', path: PATH }]}
    >
      {page?.body.map((b, i) => <BlockView key={i} block={b} />)}

      {list.intro ? <p className="text-[14px] leading-relaxed">{list.intro}</p> : null}

      <div className="mt-6">
        <DocumentTable
          list={list}
          emptyText="Approval letters will be published here once they have been uploaded."
        />
      </div>
    </PageShell>
  )
}
