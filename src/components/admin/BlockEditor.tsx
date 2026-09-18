'use client'

import { BLOCK_TYPES, type Block, type BlockType } from '@/lib/content-types'
import { move } from '@/lib/admin-client'
import { Button, Check, IconButton, Input, Select, StringList, Textarea } from './ui'

/**
 * Edits a page's body as typed blocks — headings, paragraphs, lists, tables
 * and note boxes.
 *
 * Deliberately not a rich-text box. Blocks are data, so the public page
 * renders them with its own markup: an editor cannot paste in HTML, styling
 * stays consistent across every page, and there is no route by which pasted
 * content could inject script into the site.
 */

function emptyBlock(type: BlockType): Block {
  switch (type) {
    case 'ul':
    case 'ol':
      return { type, items: [''] }
    case 'table':
      return { type: 'table', head: ['', ''], rows: [['', '']] }
    case 'note':
      return { type: 'note', text: '', audience: 'reader' }
    default:
      return { type, text: '' }
  }
}

export function BlockEditor({ blocks, onChange }: { blocks: Block[]; onChange: (next: Block[]) => void }) {
  const set = (i: number, b: Block) => onChange(blocks.map((x, j) => (i === j ? b : x)))

  return (
    <div className="space-y-3">
      {blocks.map((b, i) => (
        <div key={i} className="rounded border border-hair bg-white">
          <div className="flex items-center justify-between gap-2 border-b border-hair bg-shell px-3 py-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-jnu-800">
              {BLOCK_TYPES.find((t) => t.type === b.type)?.label ?? b.type}
            </span>
            <div className="flex gap-1">
              <IconButton label="Move up" onClick={() => onChange(move(blocks, i, i - 1))}>
                ↑
              </IconButton>
              <IconButton label="Move down" onClick={() => onChange(move(blocks, i, i + 1))}>
                ↓
              </IconButton>
              <IconButton label="Delete block" danger onClick={() => onChange(blocks.filter((_, j) => j !== i))}>
                ×
              </IconButton>
            </div>
          </div>

          <div className="p-3">
            {b.type === 'p' || b.type === 'h2' || b.type === 'h3' ? (
              b.type === 'p' ? (
                <Textarea rows={4} value={b.text} onChange={(e) => set(i, { ...b, text: e.target.value })} />
              ) : (
                <Input value={b.text} onChange={(e) => set(i, { ...b, text: e.target.value })} />
              )
            ) : null}

            {b.type === 'ul' || b.type === 'ol' ? (
              <StringList
                values={b.items}
                onChange={(items) => set(i, { ...b, items })}
                addLabel="Add item"
                textarea
              />
            ) : null}

            {b.type === 'note' ? (
              <div className="space-y-2">
                <Textarea rows={3} value={b.text} onChange={(e) => set(i, { ...b, text: e.target.value })} />
                <Check
                  label="Internal note (not shown on the website)"
                  hint="For notes to whoever maintains the site rather than to readers."
                  checked={b.audience === 'maintainer'}
                  onChange={(e) => set(i, { ...b, audience: e.target.checked ? 'maintainer' : 'reader' })}
                />
              </div>
            ) : null}

            {b.type === 'table' ? <TableEditor block={b} onChange={(next) => set(i, next)} /> : null}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2 rounded border border-dashed border-hair p-3">
        <span className="text-[12px] text-muted">Add:</span>
        {BLOCK_TYPES.map((t) => (
          <Button key={t.type} variant="secondary" size="sm" onClick={() => onChange([...blocks, emptyBlock(t.type)])}>
            {t.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

function TableEditor({
  block,
  onChange,
}: {
  block: Extract<Block, { type: 'table' }>
  onChange: (b: Block) => void
}) {
  const cols = Math.max(block.head.length, ...block.rows.map((r) => r.length), 1)
  const pad = (r: string[]) => Array.from({ length: cols }, (_, i) => r[i] ?? '')

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              {pad(block.head).map((h, c) => (
                <th key={c} className="border border-hair bg-shell p-1">
                  <Input
                    value={h}
                    placeholder={`Column ${c + 1}`}
                    onChange={(e) =>
                      onChange({ ...block, head: pad(block.head).map((x, j) => (j === c ? e.target.value : x)) })
                    }
                  />
                </th>
              ))}
              <th className="w-8 border border-hair bg-shell p-1" />
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, r) => (
              <tr key={r}>
                {pad(row).map((cell, c) => (
                  <td key={c} className="border border-hair p-1">
                    <Input
                      value={cell}
                      onChange={(e) =>
                        onChange({
                          ...block,
                          rows: block.rows.map((x, j) => (j === r ? pad(x).map((y, k) => (k === c ? e.target.value : y)) : x)),
                        })
                      }
                    />
                  </td>
                ))}
                <td className="border border-hair p-1 text-center">
                  <IconButton
                    label="Delete row"
                    danger
                    onClick={() => onChange({ ...block, rows: block.rows.filter((_, j) => j !== r) })}
                  >
                    ×
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => onChange({ ...block, rows: [...block.rows, Array(cols).fill('')] })}>
          Add row
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            onChange({ ...block, head: [...pad(block.head), ''], rows: block.rows.map((r) => [...pad(r), '']) })
          }
        >
          Add column
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            cols > 1 &&
            onChange({
              ...block,
              head: pad(block.head).slice(0, -1),
              rows: block.rows.map((r) => pad(r).slice(0, -1)),
            })
          }
        >
          Remove last column
        </Button>
      </div>
    </div>
  )
}
