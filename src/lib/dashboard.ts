import 'server-only'

import { db } from '@/lib/db'
import { can, type Permission, type Role } from '@/lib/permissions'

/**
 * Everything the dashboard draws, gathered in one place.
 *
 * Each block is fetched only when the signed-in role may act on it, so an
 * Examination Cell user never waits on an applications query they are not
 * allowed to see the result of — and never sees a chart linking to a screen
 * that would refuse them.
 *
 * Timestamps are stored in UTC; months are bucketed in Asia/Kolkata, because
 * "how many applications came in this month" means the month the registrar
 * lived through, not the month in Greenwich.
 */

const ZONE = 'Asia/Kolkata'
const MONTHS = 12

export type MonthPoint = { key: string; label: string; value: number }
export type Share = { label: string; value: number }

export type DashboardData = {
  attention: { n: number; label: string; href: string }[]
  hero: { label: string; value: number; href: string } | null
  tiles: {
    label: string
    value: number
    href: string
    delta: { value: number; period: string } | null
    trend: number[] | null
  }[]
  applicationsByMonth: MonthPoint[] | null
  admissionsByMonth: MonthPoint[] | null
  applicationStatuses: Share[] | null
  topProgrammes: Share[] | null
  resultsProgress: { published: number; total: number } | null
  recent: { at: string; actor: string; action: string; detail: string }[]
}

/** The YYYY-MM a timestamp falls in, as an Indian reader would name it. */
function monthKey(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(d)
  const y = parts.find((p) => p.type === 'year')!.value
  const m = parts.find((p) => p.type === 'month')!.value
  return `${y}-${m}`
}

/** The last twelve month buckets, oldest first, zero-filled. */
function emptyMonths(): MonthPoint[] {
  const out: MonthPoint[] = []
  const now = new Date()
  for (let i = MONTHS - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 15))
    out.push({
      key: monthKey(d),
      label: new Intl.DateTimeFormat('en-IN', { timeZone: ZONE, month: 'short' }).format(d),
      value: 0,
    })
  }
  return out
}

/** Start of the window the twelve buckets cover, with a day of slack for the zone offset. */
function windowStart(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (MONTHS - 1), 1, 0, 0, 0))
}

function bucket(rows: { createdAt: Date }[]): MonthPoint[] {
  const months = emptyMonths()
  const index = new Map(months.map((m, i) => [m.key, i]))
  for (const r of rows) {
    const i = index.get(monthKey(r.createdAt))
    if (i !== undefined) months[i].value += 1
  }
  return months
}

/** Change against the month before, as a percentage. Null when there is no base to compare with. */
function deltaVsPreviousMonth(series: MonthPoint[]): { value: number; period: string } | null {
  if (series.length < 2) return null
  const current = series[series.length - 1].value
  const previous = series[series.length - 2].value
  if (previous === 0) return null
  return { value: Math.round(((current - previous) / previous) * 100), period: 'last month' }
}

export async function getDashboard(role: Role): Promise<DashboardData> {
  const allow = (p: Permission) => can(role, p)
  const since = windowStart()

  const [
    applicationsNew,
    enquiriesOpen,
    photosPending,
    correctionsPending,
    resultsUnpublished,
    resultsTotal,
    studentsActive,
    certificates,
    facultiesEmpty,
    programmes,
    pages,
    notices,
    applicationRows,
    studentRows,
    statusGroups,
    programmeGroups,
    auditRows,
  ] = await Promise.all([
    allow('applications.manage') ? db.application.count({ where: { status: 'SUBMITTED' } }) : 0,
    allow('enquiries.manage') ? db.enquiry.count({ where: { handled: false } }) : 0,
    allow('reviews.photos') ? db.student.count({ where: { pendingPhotoId: { not: null } } }) : 0,
    allow('reviews.corrections') ? db.correctionRequest.count({ where: { status: 'PENDING' } }) : 0,
    allow('results.manage') ? db.result.count({ where: { published: false } }) : 0,
    allow('results.manage') ? db.result.count() : 0,
    allow('students.view') ? db.student.count({ where: { status: 'ACTIVE' } }) : 0,
    allow('certificates.view') ? db.certificate.count({ where: { status: 'VERIFIED' } }) : 0,
    allow('programmes.edit')
      ? db.faculty.count({ where: { published: true, programmes: { none: { published: true } } } })
      : 0,
    allow('programmes.edit') ? db.programme.count({ where: { published: true } }) : 0,
    allow('content.edit') ? db.page.count({ where: { published: true } }) : 0,
    allow('content.edit') ? db.notice.count({ where: { published: true } }) : 0,
    allow('applications.manage')
      ? db.application.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } })
      : null,
    allow('students.view')
      ? db.student.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } })
      : null,
    allow('applications.manage')
      ? db.application.groupBy({ by: ['status'], _count: { _all: true } })
      : null,
    allow('students.view')
      ? db.student.groupBy({ by: ['programme'], _count: { _all: true }, where: { status: 'ACTIVE' } })
      : null,
    db.auditLog.findMany({ orderBy: { at: 'desc' }, take: 8 }),
  ])

  const applicationsByMonth = applicationRows ? bucket(applicationRows) : null
  const admissionsByMonth = studentRows ? bucket(studentRows) : null

  const attention = [
    { n: applicationsNew, label: 'new applications', href: '/admin/applications', show: allow('applications.manage') },
    { n: photosPending, label: 'photographs to approve', href: '/admin/requests', show: allow('reviews.photos') },
    { n: correctionsPending, label: 'correction requests', href: '/admin/requests', show: allow('reviews.corrections') },
    { n: enquiriesOpen, label: 'unanswered enquiries', href: '/admin/enquiries', show: allow('enquiries.manage') },
    { n: resultsUnpublished, label: 'results not published', href: '/admin/results', show: allow('results.manage') },
    {
      n: facultiesEmpty,
      label: 'faculties with no programmes',
      href: '/admin/programmes',
      show: allow('programmes.edit'),
    },
  ]
    .filter((a) => a.show && a.n > 0)
    .map(({ n, label, href }) => ({ n, label, href }))

  // The hero is the one number the dashboard leads with. Whoever is signed in,
  // it is the largest thing they are responsible for.
  const hero = allow('students.view')
    ? { label: 'Active students', value: studentsActive, href: '/admin/students' }
    : allow('content.edit')
      ? { label: 'Published pages', value: pages, href: '/admin/pages' }
      : null

  const tiles: DashboardData['tiles'] = []
  if (applicationsByMonth) {
    tiles.push({
      label: 'Applications this month',
      value: applicationsByMonth[applicationsByMonth.length - 1].value,
      href: '/admin/applications',
      delta: deltaVsPreviousMonth(applicationsByMonth),
      trend: applicationsByMonth.map((m) => m.value),
    })
  }
  if (allow('certificates.view')) {
    tiles.push({ label: 'Degrees issued', value: certificates, href: '/admin/certificates', delta: null, trend: null })
  }
  if (allow('results.manage')) {
    tiles.push({
      label: 'Results published',
      value: resultsTotal - resultsUnpublished,
      href: '/admin/results',
      delta: null,
      trend: null,
    })
  }
  if (allow('programmes.edit')) {
    tiles.push({ label: 'Programmes offered', value: programmes, href: '/admin/programmes', delta: null, trend: null })
  }
  if (allow('content.edit')) {
    tiles.push({ label: 'Published notices', value: notices, href: '/admin/notices', delta: null, trend: null })
  }

  const STATUS_ORDER = ['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'ENROLLED', 'REJECTED', 'WITHDRAWN']
  const applicationStatuses = statusGroups
    ? statusGroups
        .map((g) => ({ label: g.status, value: g._count._all }))
        .sort((a, b) => {
          const ai = STATUS_ORDER.indexOf(a.label)
          const bi = STATUS_ORDER.indexOf(b.label)
          return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
        })
    : null

  // Top six programmes; the rest fold into "Other" rather than growing the chart.
  let topProgrammes: Share[] | null = null
  if (programmeGroups) {
    const sorted = programmeGroups
      .map((g) => ({ label: g.programme, value: g._count._all }))
      .sort((a, b) => b.value - a.value)
    const head = sorted.slice(0, 6)
    const tail = sorted.slice(6).reduce((sum, r) => sum + r.value, 0)
    topProgrammes = tail > 0 ? [...head, { label: 'Other programmes', value: tail }] : head
  }

  return {
    attention,
    hero,
    tiles,
    applicationsByMonth,
    admissionsByMonth,
    applicationStatuses,
    topProgrammes,
    resultsProgress: allow('results.manage')
      ? { published: resultsTotal - resultsUnpublished, total: resultsTotal }
      : null,
    recent: auditRows.map((r) => ({
      at: r.at.toISOString(),
      actor: r.actorEmail,
      action: r.action,
      detail: r.detail,
    })),
  }
}
