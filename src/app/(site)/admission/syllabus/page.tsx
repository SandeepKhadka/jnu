import type { Metadata } from 'next'

import { BlockView } from '@/components/content/Blocks'
import { PageShell } from '@/components/layout/PageShell'
import { DocumentTable } from '@/components/site/DocumentTable'
import { getPage, getSite, getSyllabus } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'

/**
 * /admission/syllabus/ — programme syllabus PDFs.
 *
 * Same arrangement as /affiliations/: the table is built from uploaded
 * documents, and any prose comes from the CMS page at this path. The nav
 * already linked here, so this route fills an entry that previously fell
 * through to the catch-all.
 */

const PATH = '/admission/syllabus/'

export async function generateMetadata(): Promise<Metadata> {
  const [page, site] = await Promise.all([getPage(PATH), getSite()])
  return pageMetadata({
    title: page?.title ?? 'Syllabus',
    description:
      page?.description ?? `Programme syllabus documents for ${site.name}, available to download.`,
    path: PATH,
  })
}

export default async function SyllabusPage() {
  const [page, list] = await Promise.all([getPage(PATH), getSyllabus()])

  return (
    <PageShell
      title={page?.title ?? 'Syllabus'}
      intro={page?.intro ?? undefined}
      crumbs={page?.crumbs ?? [{ name: 'Admission', path: '/admission/' }, { name: 'Syllabus', path: PATH }]}
    >
      {page?.body.map((b, i) => <BlockView key={i} block={b} />)}

      {list.intro ? <p className="text-[14px] leading-relaxed">{list.intro}</p> : null}

      <div className="mt-6">
        <DocumentTable
          list={list}
          emptyText="Syllabus documents will be published here once they have been uploaded."
        />
      </div>
    </PageShell>
  )
}
