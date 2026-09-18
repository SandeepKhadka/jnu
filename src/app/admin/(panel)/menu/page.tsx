'use client'

import { move } from '@/lib/admin-client'
import { useSetting } from '@/components/admin/useSetting'
import { Button, Card, Field, IconButton, Input, Loading, PageHeader, StatusLine } from '@/components/admin/ui'
import type { MenuItem } from '@/lib/content-types'

/**
 * The main menu and the footer's quick links.
 *
 * One item can be marked "list the faculties automatically", which is how the
 * Programmes dropdown stays in step with Faculties & programmes without
 * anyone maintaining it twice.
 */
export default function MenuPage() {
  const menu = useSetting('menu')
  const footer = useSetting('footerLinks')
  if (menu.loading || footer.loading) return <Loading />

  const items = menu.value
  const setItems = (next: MenuItem[]) => menu.setValue(next)
  const setItem = (i: number, item: MenuItem) => setItems(items.map((x, j) => (j === i ? item : x)))

  return (
    <div>
      <PageHeader
        title="Menus"
        description="Links are either a path on this site (starting with /) or a full https:// address. Anything else is rejected."
      />
      <StatusLine status={menu.status} />
      <StatusLine status={footer.status} />

      <Card
        title="Main menu"
        description="Shown across the top of every page. Two levels: a menu item and its dropdown."
        actions={
          <Button onClick={menu.save} disabled={menu.busy}>
            {menu.busy ? 'Saving…' : 'Save menu'}
          </Button>
        }
      >
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="rounded border border-hair p-3">
              <div className="flex flex-wrap items-end gap-2">
                <Field label="Label">
                  <Input value={item.label} onChange={(e) => setItem(i, { ...item, label: e.target.value })} />
                </Field>
                <Field label="Link">
                  <Input value={item.href} onChange={(e) => setItem(i, { ...item, href: e.target.value })} />
                </Field>
                <div className="flex gap-1 pb-1">
                  <IconButton label="Move up" onClick={() => setItems(move(items, i, i - 1))}>
                    ↑
                  </IconButton>
                  <IconButton label="Move down" onClick={() => setItems(move(items, i, i + 1))}>
                    ↓
                  </IconButton>
                  <IconButton label="Remove" danger onClick={() => setItems(items.filter((_, j) => j !== i))}>
                    ×
                  </IconButton>
                </div>
              </div>

              {item.auto === 'faculties' ? (
                <p className="m-0 mt-2 rounded bg-shell px-2 py-1.5 text-[12px] text-muted">
                  Its dropdown lists every published faculty automatically.{' '}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => setItem(i, { label: item.label, href: item.href, children: [] })}
                  >
                    Use a manual list instead
                  </button>
                </p>
              ) : (
                <div className="mt-2 border-t border-hair pt-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Dropdown</span>
                    <button
                      type="button"
                      className="text-[12px] underline"
                      onClick={() => setItem(i, { label: item.label, href: item.href, auto: 'faculties' })}
                    >
                      List faculties automatically
                    </button>
                  </div>
                  {(item.children ?? []).map((child, c) => (
                    <div key={c} className="mb-1 flex flex-wrap items-center gap-2">
                      <Input
                        className="max-w-[220px]"
                        value={child.label}
                        onChange={(e) =>
                          setItem(i, {
                            ...item,
                            children: (item.children ?? []).map((x, j) => (j === c ? { ...x, label: e.target.value } : x)),
                          })
                        }
                      />
                      <Input
                        className="max-w-[260px]"
                        value={child.href}
                        onChange={(e) =>
                          setItem(i, {
                            ...item,
                            children: (item.children ?? []).map((x, j) => (j === c ? { ...x, href: e.target.value } : x)),
                          })
                        }
                      />
                      <IconButton
                        label="Move up"
                        onClick={() => setItem(i, { ...item, children: move(item.children ?? [], c, c - 1) })}
                      >
                        ↑
                      </IconButton>
                      <IconButton
                        label="Move down"
                        onClick={() => setItem(i, { ...item, children: move(item.children ?? [], c, c + 1) })}
                      >
                        ↓
                      </IconButton>
                      <IconButton
                        label="Remove"
                        danger
                        onClick={() => setItem(i, { ...item, children: (item.children ?? []).filter((_, j) => j !== c) })}
                      >
                        ×
                      </IconButton>
                    </div>
                  ))}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setItem(i, { ...item, children: [...(item.children ?? []), { label: '', href: '/' }] })}
                  >
                    Add dropdown link
                  </Button>
                </div>
              )}
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => setItems([...items, { label: '', href: '/' }])}>
            Add menu item
          </Button>
        </div>
      </Card>

      <Card
        title="Footer quick links"
        description="The list in the footer, and the suggestions shown on the page-not-found screen."
        actions={
          <Button onClick={footer.save} disabled={footer.busy}>
            {footer.busy ? 'Saving…' : 'Save links'}
          </Button>
        }
      >
        <div className="space-y-2">
          {footer.value.map((l, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <Input
                className="max-w-[240px]"
                value={l.label}
                onChange={(e) => footer.setValue(footer.value.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              />
              <Input
                className="max-w-[280px]"
                value={l.href}
                onChange={(e) => footer.setValue(footer.value.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)))}
              />
              <IconButton label="Move up" onClick={() => footer.setValue(move(footer.value, i, i - 1))}>
                ↑
              </IconButton>
              <IconButton label="Move down" onClick={() => footer.setValue(move(footer.value, i, i + 1))}>
                ↓
              </IconButton>
              <IconButton label="Remove" danger onClick={() => footer.setValue(footer.value.filter((_, j) => j !== i))}>
                ×
              </IconButton>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => footer.setValue([...footer.value, { label: '', href: '/' }])}>
            Add link
          </Button>
        </div>
      </Card>
    </div>
  )
}
