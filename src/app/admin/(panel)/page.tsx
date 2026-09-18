import Link from 'next/link'

import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { can, type Permission } from '@/lib/permissions'

/**
 * Dashboard: what needs attention, then the size of everything else.
 *
 * Rendered on the server so it is correct on first paint, and each figure is
 * shown only to a role that can act on it — a counter linking to a screen you
 * cannot open is worse than no counter.
 */
export default async function AdminDashboard() {
  const user = await getSessionUser()
  if (!user) return null
  const allow = (p: Permission) => can(user.role, p)

  const [
    applicationsNew,
    enquiriesOpen,
    photosPending,
    correctionsPending,
    resultsUnpublished,
    studentsActive,
    certificates,
    pages,
    notices,
    faculties,
    facultiesEmpty,
    programmes,
  ] = await Promise.all([
    allow('applications.manage') ? db.application.count({ where: { status: 'SUBMITTED' } }) : 0,
    allow('enquiries.manage') ? db.enquiry.count({ where: { handled: false } }) : 0,
    allow('reviews.photos') ? db.student.count({ where: { pendingPhotoId: { not: null } } }) : 0,
    allow('reviews.corrections') ? db.correctionRequest.count({ where: { status: 'PENDING' } }) : 0,
    allow('results.manage') ? db.result.count({ where: { published: false } }) : 0,
    allow('students.view') ? db.student.count({ where: { status: 'ACTIVE' } }) : 0,
    allow('certificates.view') ? db.certificate.count({ where: { status: 'VERIFIED' } }) : 0,
    allow('content.edit') ? db.page.count({ where: { published: true } }) : 0,
    allow('content.edit') ? db.notice.count({ where: { published: true } }) : 0,
    allow('programmes.edit') ? db.faculty.count({ where: { published: true } }) : 0,
    allow('programmes.edit')
      ? db.faculty.count({ where: { published: true, programmes: { none: { published: true } } } })
      : 0,
    allow('programmes.edit') ? db.programme.count({ where: { published: true } }) : 0,
  ])

  const attention = [
    { n: applicationsNew, label: 'new applications', href: '/admin/applications', show: allow('applications.manage') },
    { n: photosPending, label: 'photographs to approve', href: '/admin/requests', show: allow('reviews.photos') },
    { n: correctionsPending, label: 'correction requests', href: '/admin/requests', show: allow('reviews.corrections') },
    { n: enquiriesOpen, label: 'unanswered enquiries', href: '/admin/enquiries', show: allow('enquiries.manage') },
    { n: resultsUnpublished, label: 'results not published', href: '/admin/results', show: allow('results.manage') },
    {
      n: facultiesEmpty,
      label: 'faculties with no programmes (hidden from search)',
      href: '/admin/programmes',
      show: allow('programmes.edit'),
    },
  ].filter((a) => a.show && a.n > 0)

  const totals = [
    { n: studentsActive, label: 'Active students', href: '/admin/students', show: allow('students.view') },
    { n: certificates, label: 'Degrees issued', href: '/admin/certificates', show: allow('certificates.view') },
    { n: programmes, label: 'Programmes', href: '/admin/programmes', show: allow('programmes.edit') },
    { n: faculties, label: 'Faculties', href: '/admin/programmes', show: allow('programmes.edit') },
    { n: pages, label: 'Published pages', href: '/admin/pages', show: allow('content.edit') },
    { n: notices, label: 'Published notices', href: '/admin/notices', show: allow('content.edit') },
  ].filter((t) => t.show)

  return (
    <div>
      <div className="mb-6 border-b border-hair pb-4">
        <h1 className="m-0 font-display text-[22px] text-jnu-800">Good day, {user.fullName.split(' ')[0]}</h1>
        <p className="m-0 mt-1 text-[13px] text-muted">
          Changes you save here appear on the website within a few seconds — there is nothing to publish
          or deploy separately.
        </p>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-[14px] uppercase tracking-wide text-jnu-800">Needs attention</h2>
        {attention.length === 0 ? (
          <p className="m-0 rounded border border-[#2c6549]/40 bg-[#2c6549]/5 px-4 py-3 text-[13px] text-[#2c6549]">
            Nothing is waiting.
          </p>
        ) : (
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {attention.map((a) => (
              <li key={a.label}>
                <Link
                  href={a.href}
                  className="flex items-baseline gap-2 rounded border border-sand-500 bg-white px-4 py-3 no-underline hover:shadow-raised"
                >
                  <span className="tnum font-display text-[24px] text-sand-600">{a.n}</span>
                  <span className="text-[13px] text-jnu-800">{a.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {totals.length ? (
        <section>
          <h2 className="mb-3 font-display text-[14px] uppercase tracking-wide text-jnu-800">At a glance</h2>
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {totals.map((t) => (
              <li key={t.label}>
                <Link
                  href={t.href}
                  className="flex items-baseline gap-2 rounded border border-hair bg-white px-4 py-3 no-underline hover:shadow-raised"
                >
                  <span className="tnum font-display text-[22px] text-jnu-800">{t.n}</span>
                  <span className="text-[13px] text-muted">{t.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
