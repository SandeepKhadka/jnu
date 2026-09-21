import type { DocumentListDTO } from '@/lib/content'

/**
 * The affiliations / syllabus listing: a row per document, with View opening
 * the PDF.
 *
 * Rows without a document still render. An entry whose PDF has not been
 * uploaded yet is information in its own right — it says the university
 * claims the affiliation and the paperwork is coming — and hiding it would
 * quietly shorten the list without anyone noticing.
 */
export function DocumentTable({ list, emptyText }: { list: DocumentListDTO; emptyText: string }) {
  if (list.rows.length === 0) {
    return <p className="m-0 text-[14px] text-muted">{emptyText}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[14px]">
        <thead>
          <tr>
            <th scope="col" className="border border-hair bg-shell px-3 py-2 text-left font-semibold text-jnu-800">
              Particulars
            </th>
            <th
              scope="col"
              className="w-[120px] border border-hair bg-shell px-3 py-2 text-left font-semibold text-jnu-800"
            >
              Document
            </th>
          </tr>
        </thead>
        <tbody>
          {list.rows.map((r, i) => (
            <tr key={`${r.title}-${i}`}>
              <td className="border border-hair px-3 py-2 align-top">
                <span className="font-semibold text-jnu-900">{r.title}</span>
                {r.note ? <span className="mt-0.5 block text-[13px] text-muted">{r.note}</span> : null}
              </td>
              <td className="border border-hair px-3 py-2 align-top">
                {r.href ? (
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener"
                    className="font-semibold text-jnu-700 underline hover:text-jnu-800"
                  >
                    View
                    <span className="sr-only"> {r.title} (PDF, opens in a new tab)</span>
                  </a>
                ) : (
                  <span className="text-[13px] text-muted">Not yet available</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
