import type { Block } from '@/content/pages'

/**
 * Renders the typed content blocks from content/pages.ts.
 *
 * Extracted from the [...slug] catch-all so that routes with their own page
 * file — /admission/process/, which carries the application form — can render
 * exactly the same prose without a second copy of this switch drifting out of
 * step with the first.
 */

/**
 * Set to true to surface maintainer TODO notes on the rendered pages — useful
 * when working through the outstanding content, off for anything anyone else
 * will look at.
 */
const SHOW_MAINTAINER_NOTES = process.env.NEXT_PUBLIC_SHOW_MAINTAINER_NOTES === 'true'

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </>
  )
}

export function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'h2':
      return <h2>{block.text}</h2>
    case 'h3':
      return <h3>{block.text}</h3>
    case 'p':
      return <p>{block.text}</p>
    case 'ul':
      return (
        <ul>
          {block.items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol>
          {block.items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ol>
      )
    case 'table':
      return (
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                {block.head.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'note': {
      // Reader-facing notes always render. Maintainer notes are build-time
      // TODOs — they stay in the source so the outstanding work is tracked,
      // but they must not show on a page someone is actually reading.
      if (block.audience === 'maintainer' && !SHOW_MAINTAINER_NOTES) return null

      return (
        <aside className="my-5 rounded border border-hair border-l-[3px] border-l-sand-500 bg-white px-4 py-3">
          <p className="m-0 text-[13px] text-muted">
            <strong className="text-jnu-800">Please note: </strong>
            {block.text}
          </p>
        </aside>
      )
    }
  }
}
