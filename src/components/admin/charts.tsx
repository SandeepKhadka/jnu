'use client'

import { useId, useMemo, useState } from 'react'

/**
 * The dashboard's chart primitives, drawn as plain SVG.
 *
 * Deliberately not a charting library: these are four small, fixed forms, and
 * a library would cost more bundle than the admin panel's entire JavaScript
 * budget for something we can draw in a few hundred lines.
 *
 * Colour rules the whole file obeys:
 *  · One hue. Magnitude is length here, never colour — shading bars by their
 *    own value double-encodes and misleads.
 *  · Marks carry the colour; text never does. Labels and values wear the
 *    normal text tokens so they stay legible.
 *  · Every chart has a table view, so no value is reachable only by hovering.
 */

const INK = '#1f6aa8' // the single series hue — validated against white
const CONTEXT = '#6fa8d8' // de-emphasised marks (sparkline history)
const GRID = '#e1e1e1'

const nf = new Intl.NumberFormat('en-IN')

/** 1,284 · 12.9K · 1.2M — for tiles, where width is tight. */
export function compact(n: number): string {
  if (n < 10_000) return nf.format(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 100_000 ? 1 : 0)}K`
  return `${(n / 1_000_000).toFixed(1)}M`
}

/* ============================================================ table view */

function TableView({
  head,
  rows,
  open,
  onToggle,
}: {
  head: [string, string]
  rows: { label: string; value: number }[]
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={onToggle}
        className="rounded border-0 bg-transparent p-0 text-[11px] text-muted underline hover:text-jnu-700"
      >
        {open ? 'Hide table' : 'View as table'}
      </button>
      {open ? (
        <table className="mt-2 w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="border-b border-hair px-2 py-1 text-left font-semibold text-muted">{head[0]}</th>
              <th className="border-b border-hair px-2 py-1 text-right font-semibold text-muted">{head[1]}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="border-b border-hair px-2 py-1">{r.label}</td>
                <td className="tnum border-b border-hair px-2 py-1 text-right">{nf.format(r.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  )
}

/* ============================================================= sparkline */

/** Twelve points of context inside a stat tile. No axes, no labels — the tile's value is the point. */
export function Sparkline({ points, className = '' }: { points: number[]; className?: string }) {
  if (points.length < 2) return null
  const w = 104
  const h = 26
  const INSET = 6 // room for the end dot and its ring, so neither is clipped
  const max = Math.max(...points, 1)
  const step = (w - INSET * 2) / (points.length - 1)
  const x = (i: number) => INSET + i * step
  const y = (v: number) => h - INSET / 2 - (v / max) * (h - INSET)
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const last = points[points.length - 1]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className={className} aria-hidden="true" focusable="false">
      <path d={d} fill="none" stroke={CONTEXT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Current period in the accent, ringed in the surface so it stays legible over the line. */}
      <circle cx={x(points.length - 1)} cy={y(last)} r="4" fill={INK} stroke="#ffffff" strokeWidth="2" />
    </svg>
  )
}

/* ============================================================= stat tile */

export function StatTile({
  label,
  value,
  delta,
  trend,
  href,
}: {
  label: string
  value: number
  delta?: { value: number; period: string } | null
  trend?: number[] | null
  href?: string
}) {
  const up = (delta?.value ?? 0) > 0
  const flat = (delta?.value ?? 0) === 0
  const Wrapper = href ? 'a' : 'div'

  return (
    <Wrapper
      {...(href ? { href } : {})}
      className="flex h-full flex-col justify-between rounded-lg border border-hair bg-white p-4 no-underline transition-shadow hover:shadow-raised"
    >
      <p className="m-0 text-[12px] leading-snug text-muted">{label}</p>
      <div className="mt-2">
        {/* Proportional figures: tabular digits look loose at display size. */}
        <span className="block font-display text-[30px] leading-none text-jnu-800">{compact(value)}</span>
        {delta ? (
          <span className={`mt-1.5 block text-[11px] leading-tight ${flat ? 'text-muted' : up ? 'text-[#006300]' : 'text-[#a8322b]'}`}>
            <span aria-hidden="true">{flat ? '→' : up ? '▲' : '▼'}</span>{' '}
            {flat ? 'No change' : `${up ? '+' : ''}${delta.value}%`} vs {delta.period}
          </span>
        ) : null}
      </div>
      {trend && trend.length > 1 ? (
        <div className="mt-3">
          <Sparkline points={trend} className="w-full max-w-[120px]" />
        </div>
      ) : null}
    </Wrapper>
  )
}

/* ============================================================ hero figure */

export function HeroFigure({ label, value, href }: { label: string; value: number; href?: string }) {
  const body = (
    <>
      <span className="block text-[12px] uppercase tracking-wide text-muted">{label}</span>
      <span className="mt-1 block font-display text-[52px] leading-none text-jnu-800">{nf.format(value)}</span>
    </>
  )
  return href ? (
    <a href={href} className="block no-underline">
      {body}
    </a>
  ) : (
    <div>{body}</div>
  )
}

/* ============================================================= area chart */

export type MonthPoint = { key: string; label: string; value: number }

/**
 * A single series over twelve months: area for the shape, line for the path,
 * a crosshair and tooltip for the values, and one direct label on the end.
 *
 * Laid out in a fixed viewBox and scaled by CSS, so it is responsive without
 * measuring the container — and the x-axis band is inside the box, so labels
 * are never cut off by the container's height.
 */
export function AreaChart({
  points,
  title,
  unit,
}: {
  points: MonthPoint[]
  title: string
  unit: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const [table, setTable] = useState(false)
  const gradId = useId()

  const W = 560
  const H = 200
  const PAD = { top: 16, right: 40, bottom: 26, left: 36 }
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const { max, ticks } = useMemo(() => {
    const peak = Math.max(...points.map((p) => p.value), 1)
    // Round the top up to something a reader can do arithmetic with.
    const mag = Math.pow(10, Math.floor(Math.log10(peak)))
    const top = Math.ceil(peak / mag) * mag || 1
    // These are whole counts, so a midpoint of 0.5 is meaningless — and once
    // rounded it would print the same label twice. Drop duplicates.
    const candidates = [0, Math.round(top / 2), top]
    return { max: top, ticks: [...new Set(candidates)] }
  }, [points])

  const x = (i: number) => PAD.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW)
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const area = `${line} L${x(points.length - 1).toFixed(1)},${(PAD.top + plotH).toFixed(1)} L${x(0).toFixed(1)},${(PAD.top + plotH).toFixed(1)} Z`

  const lastIndex = points.length - 1
  const active = hover ?? lastIndex
  const empty = points.every((p) => p.value === 0)

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        role="img"
        aria-label={`${title}: ${points.map((p) => `${p.label} ${p.value}`).join(', ')}`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={INK} stopOpacity="0.14" />
            <stop offset="100%" stopColor={INK} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Gridlines: hairline, solid, recessive. */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
            <text x={PAD.left - 6} y={y(t) + 3} textAnchor="end" className="fill-[#767676] text-[9px] tnum">
              {nf.format(Math.round(t))}
            </text>
          </g>
        ))}

        {!empty ? (
          <>
            <path d={area} fill={`url(#${gradId})`} />
            <path d={line} fill="none" stroke={INK} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          </>
        ) : (
          <text x={W / 2} y={PAD.top + plotH / 2} textAnchor="middle" className="fill-[#767676] text-[11px]">
            Nothing recorded in the last 12 months yet
          </text>
        )}

        {/* Month labels, thinned so they never collide at narrow widths. */}
        {points.map((p, i) =>
          i % 2 === 0 || i === lastIndex ? (
            <text key={p.key} x={x(i)} y={H - 8} textAnchor="middle" className="fill-[#767676] text-[9px]">
              {p.label}
            </text>
          ) : null
        )}

        {/* Crosshair for whichever month is under the pointer. */}
        {!empty ? (
          <>
            <line
              x1={x(active)}
              x2={x(active)}
              y1={PAD.top}
              y2={PAD.top + plotH}
              stroke={GRID}
              strokeWidth="1"
            />
            <circle cx={x(active)} cy={y(points[active].value)} r="4.5" fill={INK} stroke="#ffffff" strokeWidth="2" />
            {/* Direct label on the active point — one number, not twelve. */}
            <text
              x={Math.min(x(active) + 8, W - 4)}
              y={Math.max(y(points[active].value) - 9, PAD.top + 8)}
              textAnchor={x(active) > W - 90 ? 'end' : 'start'}
              className="fill-[#0b0b0b] text-[11px] font-semibold tnum"
            >
              {nf.format(points[active].value)}
            </text>
          </>
        ) : null}

        {/* Hit targets: one full-height band per month, far bigger than the dot. */}
        {points.map((p, i) => (
          <rect
            key={`hit-${p.key}`}
            x={x(i) - plotW / points.length / 2}
            y={PAD.top}
            width={plotW / points.length}
            height={plotH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          >
            <title>{`${p.label}: ${nf.format(p.value)} ${unit}`}</title>
          </rect>
        ))}
      </svg>

      <p className="m-0 text-[11px] text-muted">
        {points[active].label} — <span className="tnum font-semibold text-jnu-800">{nf.format(points[active].value)}</span>{' '}
        {unit}
      </p>

      <TableView
        head={['Month', unit]}
        rows={points.map((p) => ({ label: p.label, value: p.value }))}
        open={table}
        onToggle={() => setTable((v) => !v)}
      />
    </div>
  )
}

/* ============================================================== bar rows */

/**
 * Horizontal bars for "compare magnitude, low → high" with long category
 * names. One hue for every bar; the length is the whole encoding.
 */
export function BarRows({
  rows,
  unit,
  labelHead = 'Category',
  maxBar = 24,
}: {
  rows: { label: string; value: number }[]
  unit: string
  labelHead?: string
  maxBar?: number
}) {
  const [table, setTable] = useState(false)
  const max = Math.max(...rows.map((r) => r.value), 1)

  if (rows.length === 0) return <p className="m-0 text-[13px] text-muted">Nothing to show yet.</p>

  return (
    <div>
      <ul className="m-0 list-none space-y-2.5 p-0">
        {rows.map((r) => (
          <li key={r.label} title={`${r.label}: ${nf.format(r.value)} ${unit}`}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-[12px] text-jnu-800">{r.label}</span>
              <span className="tnum shrink-0 text-[12px] font-semibold text-jnu-800">{nf.format(r.value)}</span>
            </div>
            <div className="mt-1 h-[8px] w-full rounded-sm bg-shell">
              <div
                className="h-full rounded-r-[4px] bg-[#1f6aa8]"
                style={{ width: `${Math.max((r.value / max) * 100, r.value > 0 ? 2 : 0)}%`, maxHeight: maxBar }}
              />
            </div>
          </li>
        ))}
      </ul>
      <TableView head={[labelHead, unit]} rows={rows} open={table} onToggle={() => setTable((v) => !v)} />
    </div>
  )
}

/* ================================================================= meter */

/** One ratio against a limit. The track is a lighter step of the fill's own ramp. */
export function Meter({ value, total, label }: { value: number; total: number; label: string }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100)
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12px] text-muted">{label}</span>
        <span className="tnum text-[12px] font-semibold text-jnu-800">
          {nf.format(value)} of {nf.format(total)} ({pct}%)
        </span>
      </div>
      <div className="mt-1.5 h-[10px] w-full overflow-hidden rounded-sm bg-[#d6e7f5]">
        <div className="h-full rounded-r-[4px] bg-[#1f6aa8]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
