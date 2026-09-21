import Link from 'next/link'

import { getSessionUser } from '@/lib/auth'
import { getDashboard } from '@/lib/dashboard'
import { roleLabel } from '@/lib/permissions'
import { AreaChart, BarRows, HeroFigure, Meter, StatTile } from '@/components/admin/charts'

/**
 * The dashboard.
 *
 * Read top to bottom it answers three questions in order: what needs me now,
 * how big is the institution, and which way are the numbers moving. Every
 * figure is fetched only for a role allowed to act on it — a counter linking
 * to a screen you cannot open is worse than no counter.
 *
 * Rendered on the server, so it is correct on first paint with no loading
 * flash. Only the charts ship JavaScript, and only for their hover layer.
 */
export default async function AdminDashboard() {
  const user = await getSessionUser()
  if (!user) return null

  const d = await getDashboard(user.role)
  const today = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------ greeting + hero */}
      <section className="rounded-lg border border-hair bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-[260px] flex-1">
            <h1 className="m-0 font-display text-[22px] text-jnu-800">
              Good day, {user.fullName.split(' ')[0]}
            </h1>
            <p className="m-0 mt-1 text-[12px] text-muted">
              {roleLabel(user.role)} · {today}
            </p>
            <p className="m-0 mt-3 max-w-[52ch] text-[13px] text-muted">
              Anything you save here appears on the website within a few seconds. There is nothing to
              publish or deploy separately.
            </p>
          </div>
          {d.hero ? (
            <div className="shrink-0 border-l border-hair pl-6">
              <HeroFigure label={d.hero.label} value={d.hero.value} href={d.hero.href} />
            </div>
          ) : null}
        </div>
      </section>

      {/* ------------------------------------------------- needs attention */}
      <section>
        <h2 className="mb-3 font-display text-[13px] uppercase tracking-wide text-jnu-800">Needs attention</h2>
        {d.attention.length === 0 ? (
          <p className="m-0 flex items-center gap-2 rounded-lg border border-[#0ca30c]/40 bg-[#0ca30c]/[0.06] px-4 py-3 text-[13px] text-[#006300]">
            <span aria-hidden="true">✓</span> Nothing is waiting for you.
          </p>
        ) : (
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {d.attention.map((a) => (
              <li key={a.label}>
                <Link
                  href={a.href}
                  className="flex items-center gap-3 rounded-lg border border-sand-500 bg-[#c8863a]/[0.06] px-4 py-3 no-underline transition-shadow hover:shadow-raised"
                >
                  {/* Icon + label, never colour alone. */}
                  <span aria-hidden="true" className="text-[15px] text-sand-600">
                    ●
                  </span>
                  <span className="tnum font-display text-[24px] leading-none text-sand-600">{a.n}</span>
                  <span className="text-[13px] leading-snug text-jnu-800">{a.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------------- stat tiles */}
      {d.tiles.length ? (
        <section>
          <h2 className="mb-3 font-display text-[13px] uppercase tracking-wide text-jnu-800">At a glance</h2>
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {d.tiles.map((t) => (
              <li key={t.label}>
                <StatTile label={t.label} value={t.value} delta={t.delta} trend={t.trend} href={t.href} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ----------------------------------------------------------- charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {d.applicationsByMonth ? (
          <Panel
            title="Applications received"
            note="Last 12 months. Hover a month for its figure."
            href="/admin/applications"
          >
            <AreaChart points={d.applicationsByMonth} title="Applications received" unit="applications" />
          </Panel>
        ) : null}

        {d.admissionsByMonth ? (
          <Panel
            title="Students enrolled"
            note="Records added to the register, last 12 months."
            href="/admin/students"
          >
            <AreaChart points={d.admissionsByMonth} title="Students enrolled" unit="students" />
          </Panel>
        ) : null}

        {d.topProgrammes && d.topProgrammes.length ? (
          <Panel title="Active students by programme" note="Largest six; the rest are grouped." href="/admin/programmes">
            <BarRows rows={d.topProgrammes} unit="students" labelHead="Programme" />
          </Panel>
        ) : null}

        {d.applicationStatuses && d.applicationStatuses.length ? (
          <Panel title="Applications by stage" note="Every application on file, by where it has reached." href="/admin/applications">
            <BarRows
              rows={d.applicationStatuses.map((s) => ({ label: humanStatus(s.label), value: s.value }))}
              unit="applications"
              labelHead="Stage"
            />
            {d.resultsProgress && d.resultsProgress.total > 0 ? (
              <div className="mt-4 border-t border-hair pt-4">
                <Meter
                  label="Results published"
                  value={d.resultsProgress.published}
                  total={d.resultsProgress.total}
                />
              </div>
            ) : null}
          </Panel>
        ) : null}
      </div>

      {/* --------------------------------------------------- recent changes */}
      <section className="rounded-lg border border-hair bg-white">
        <div className="flex items-center justify-between border-b border-hair px-4 py-3">
          <h2 className="m-0 font-display text-[13px] uppercase tracking-wide text-jnu-800">Latest changes</h2>
          <Link href="/admin/audit" className="text-[12px] text-jnu-700">
            Full audit trail →
          </Link>
        </div>
        {d.recent.length === 0 ? (
          <p className="m-0 px-4 py-6 text-[13px] text-muted">
            Nothing recorded yet. Save a change anywhere and it appears here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <Th>When</Th>
                  <Th>Who</Th>
                  <Th>Action</Th>
                  <Th>Detail</Th>
                </tr>
              </thead>
              <tbody>
                {d.recent.map((r, i) => (
                  <tr key={`${r.at}-${i}`}>
                    <td className="tnum whitespace-nowrap border-b border-hair px-4 py-2 text-muted">
                      {new Date(r.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="whitespace-nowrap border-b border-hair px-4 py-2">{r.actor}</td>
                    <td className="border-b border-hair px-4 py-2">
                      <code className="text-[12px]">{r.action}</code>
                    </td>
                    <td className="border-b border-hair px-4 py-2 text-muted">{r.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Panel({
  title,
  note,
  href,
  children,
}: {
  title: string
  note: string
  href?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-hair bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          {/* The title names the single series, so no legend box is needed. */}
          <h2 className="m-0 font-display text-[14px] text-jnu-800">{title}</h2>
          <p className="m-0 mt-0.5 text-[11px] text-muted">{note}</p>
        </div>
        {href ? (
          <Link href={href} className="shrink-0 whitespace-nowrap text-[12px] text-jnu-700">
            Open →
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="border-b border-hair bg-shell px-4 py-2 text-left text-[12px] font-semibold text-muted">{children}</th>
}

/** SUBMITTED → Submitted, UNDER_REVIEW → Under review. */
function humanStatus(s: string): string {
  const t = s.replace(/_/g, ' ').toLowerCase()
  return t.charAt(0).toUpperCase() + t.slice(1)
}
