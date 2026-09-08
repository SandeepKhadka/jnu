/**
 * Seed data shipped with the repo.
 *
 * This is what makes the project run with zero configuration: clone, install,
 * `npm run dev`, and the results lookup, certificate verification and admin
 * panel all have real data to work with. No account, no API keys, no database.
 *
 * Admin edits are layered on top of this in localStorage — see src/lib/store.ts.
 * "Reset demo data" in the admin panel clears that overlay and returns here.
 *
 * All names, roll numbers and certificate numbers are fictional.
 */

export type Subject = {
  code: string
  name: string
  max: number
  obtained: number
  grade: string
}

export type ResultRecord = {
  id: string
  roll_no: string
  student_name: string
  programme: string
  semester: string
  exam_session: string
  subjects: Subject[]
  marks_obtained: number
  marks_max: number
  sgpa: number
  status: 'PASS' | 'FAIL' | 'ATKT' | 'WITHHELD'
  published: boolean
  published_at?: string
}

export type CertificateRecord = {
  id: string
  certificate_no: string
  student_name: string
  programme: string
  award_year: number
  enrollment_no: string
  /** Class/division as printed on the degree. */
  division: string
  status: 'VERIFIED' | 'REVOKED' | 'WITHHELD'
  registrar_remarks?: string
  issued_on: string
}

/** Grade from a percentage, on the 10-point scale used across the site. */
function gradeFor(pct: number): string {
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B+'
  if (pct >= 60) return 'B'
  if (pct >= 50) return 'C'
  if (pct >= 40) return 'D'
  return 'F'
}

function subject(code: string, name: string, obtained: number, max = 100): Subject {
  return { code, name, max, obtained, grade: gradeFor((obtained / max) * 100) }
}

function totals(subjects: Subject[]) {
  const marks_obtained = subjects.reduce((s, x) => s + x.obtained, 0)
  const marks_max = subjects.reduce((s, x) => s + x.max, 0)
  const pct = (marks_obtained / marks_max) * 100
  // Common Indian convention: SGPA ≈ percentage / 9.5, capped at 10.
  const sgpa = Math.min(10, Math.round((pct / 9.5) * 100) / 100)
  return { marks_obtained, marks_max, sgpa }
}

const CS_SEM4 = [
  subject('CS401', 'Design & Analysis of Algorithms', 78),
  subject('CS402', 'Operating Systems', 71),
  subject('CS403', 'Database Management Systems', 84),
  subject('CS404', 'Computer Networks', 66),
  subject('CS405', 'Software Engineering', 74),
  subject('CS406', 'DBMS Laboratory', 88, 50),
]

const CS_SEM4_B = [
  subject('CS401', 'Design & Analysis of Algorithms', 61),
  subject('CS402', 'Operating Systems', 58),
  subject('CS403', 'Database Management Systems', 67),
  subject('CS404', 'Computer Networks', 54),
  subject('CS405', 'Software Engineering', 63),
  subject('CS406', 'DBMS Laboratory', 41, 50),
]

const CIVIL_SEM4 = [
  subject('CE401', 'Structural Analysis', 69),
  subject('CE402', 'Geotechnical Engineering', 72),
  subject('CE403', 'Fluid Mechanics', 64),
  subject('CE404', 'Transportation Engineering', 77),
  subject('CE405', 'Concrete Technology', 70),
  subject('CE406', 'Survey Laboratory', 43, 50),
]

const MBA_SEM2 = [
  subject('MB201', 'Marketing Management', 76),
  subject('MB202', 'Financial Management', 68),
  subject('MB203', 'Human Resource Management', 81),
  subject('MB204', 'Operations Research', 59),
  subject('MB205', 'Business Analytics', 73),
]

const BPHARM_SEM4 = [
  subject('PH401', 'Pharmaceutical Chemistry III', 74),
  subject('PH402', 'Pharmacology I', 68),
  subject('PH403', 'Pharmaceutics III', 79),
  subject('PH404', 'Pharmacognosy II', 71),
  subject('PH405', 'Pharmaceutics Laboratory', 44, 50),
]

const BCA_SEM2 = [
  subject('CA201', 'Data Structures', 82),
  subject('CA202', 'Object Oriented Programming', 77),
  subject('CA203', 'Discrete Mathematics', 65),
  subject('CA204', 'Web Technologies', 88),
  subject('CA205', 'Programming Laboratory', 46, 50),
]

const LLB_SEM4 = [
  subject('LW401', 'Constitutional Law II', 70),
  subject('LW402', 'Law of Contract II', 66),
  subject('LW403', 'Family Law I', 73),
  subject('LW404', 'Law of Torts', 61),
  subject('LW405', 'Moot Court Exercise', 42, 50),
]

const ATKT_SEM4 = [
  subject('CS401', 'Design & Analysis of Algorithms', 44),
  subject('CS402', 'Operating Systems', 22),
  subject('CS403', 'Database Management Systems', 51),
  subject('CS404', 'Computer Networks', 18),
  subject('CS405', 'Software Engineering', 47),
  subject('CS406', 'DBMS Laboratory', 31, 50),
]

function makeResult(
  id: string,
  roll_no: string,
  student_name: string,
  programme: string,
  semester: string,
  exam_session: string,
  subjects: Subject[],
  status: ResultRecord['status'],
  published: boolean
): ResultRecord {
  return {
    id,
    roll_no,
    student_name,
    programme,
    semester,
    exam_session,
    subjects,
    ...totals(subjects),
    status,
    published,
    ...(published ? { published_at: '2026-07-28T00:00:00.000Z' } : {}),
  }
}

export const seedResults: ResultRecord[] = [
  makeResult('r1', 'JNU2024BT0147', 'Rajesh Kumar Meena', 'B.Tech Computer Science & Engineering', 'Semester IV', 'Even 2025-26', CS_SEM4, 'PASS', true),
  makeResult('r2', 'JNU2024BT0152', 'Priya Sharma', 'B.Tech Computer Science & Engineering', 'Semester IV', 'Even 2025-26', CS_SEM4_B, 'PASS', true),
  makeResult('r3', 'JNU2024BT0301', 'Mohammed Arif Khan', 'B.Tech Civil Engineering', 'Semester IV', 'Even 2025-26', CIVIL_SEM4, 'PASS', true),
  makeResult('r4', 'JNU2025MB0088', 'Anjali Rathore', 'Master of Business Administration', 'Semester II', 'Even 2025-26', MBA_SEM2, 'PASS', true),
  makeResult('r5', 'JNU2024BP0219', 'Vikram Singh Bhati', 'Bachelor of Pharmacy', 'Semester IV', 'Even 2025-26', BPHARM_SEM4, 'PASS', true),
  makeResult('r6', 'JNU2025CA0410', 'Sneha Vishnoi', 'Bachelor of Computer Applications', 'Semester II', 'Even 2025-26', BCA_SEM2, 'PASS', true),
  makeResult('r7', 'JNU2024LW0075', 'Karan Purohit', 'Bachelor of Laws', 'Semester IV', 'Even 2025-26', LLB_SEM4, 'PASS', true),
  makeResult('r8', 'JNU2024BT0166', 'Deepak Choudhary', 'B.Tech Computer Science & Engineering', 'Semester IV', 'Even 2025-26', ATKT_SEM4, 'ATKT', true),
  // Unpublished on purpose: shows that the exam cell controls visibility, and
  // that an unpublished roll number is reported exactly like an unknown one.
  makeResult('r9', 'JNU2024BT0171', 'Neha Agarwal', 'B.Tech Computer Science & Engineering', 'Semester V', 'Odd 2026-27', CS_SEM4, 'PASS', false),
  makeResult('r10', 'JNU2024BT0180', 'Suresh Bishnoi', 'B.Tech Mechanical Engineering', 'Semester V', 'Odd 2026-27', CIVIL_SEM4, 'PASS', false),
]

export const seedCertificates: CertificateRecord[] = [
  { id: 'c1', certificate_no: 'JNU/DEG/2024/004512', student_name: 'Rohit Suthar', programme: 'B.Tech Computer Science & Engineering', award_year: 2024, enrollment_no: 'JNU/2020/BT/1187', division: 'First Division with Distinction', status: 'VERIFIED', issued_on: '2024-09-14' },
  { id: 'c2', certificate_no: 'JNU/DEG/2024/004518', student_name: 'Kavita Parihar', programme: 'Master of Business Administration', award_year: 2024, enrollment_no: 'JNU/2022/MB/0341', division: 'First Division', status: 'VERIFIED', issued_on: '2024-09-14' },
  { id: 'c3', certificate_no: 'JNU/DEG/2023/003994', student_name: 'Imran Sheikh', programme: 'Bachelor of Pharmacy', award_year: 2023, enrollment_no: 'JNU/2019/BP/0812', division: 'First Division', status: 'VERIFIED', issued_on: '2023-10-02' },
  { id: 'c4', certificate_no: 'JNU/DEG/2023/004021', student_name: 'Pooja Chouhan', programme: 'Bachelor of Laws', award_year: 2023, enrollment_no: 'JNU/2020/LW/0233', division: 'Second Division', status: 'VERIFIED', issued_on: '2023-10-02' },
  { id: 'c5', certificate_no: 'JNU/DEG/2025/005107', student_name: 'Aditya Vyas', programme: 'Bachelor of Computer Applications', award_year: 2025, enrollment_no: 'JNU/2022/CA/0604', division: 'First Division', status: 'VERIFIED', issued_on: '2025-08-21' },
  { id: 'c6', certificate_no: 'JNU/DEG/2025/005142', student_name: 'Meenakshi Joshi', programme: 'Master of Science', award_year: 2025, enrollment_no: 'JNU/2023/MS/0119', division: 'First Division with Distinction', status: 'VERIFIED', issued_on: '2025-08-21' },
  // A revoked record: the verification page must report this loudly rather
  // than silently, which is the whole point of having a register.
  { id: 'c7', certificate_no: 'JNU/DEG/2022/003310', student_name: 'Sanjay Tak', programme: 'B.Tech Civil Engineering', award_year: 2022, enrollment_no: 'JNU/2018/CE/0455', division: 'Second Division', status: 'REVOKED', registrar_remarks: 'Withdrawn following a discrepancy identified in the qualifying examination record submitted at admission.', issued_on: '2022-11-11' },
  // Under review.
  { id: 'c8', certificate_no: 'JNU/DEG/2025/005190', student_name: 'Farhan Qureshi', programme: 'Bachelor of Education', award_year: 2025, enrollment_no: 'JNU/2023/BE/0287', division: 'First Division', status: 'WITHHELD', registrar_remarks: 'Record under verification by the examination cell.', issued_on: '2025-08-21' },
]

/**
 * Demo staff accounts for the local (zero-config) mode.
 *
 * These are DEMO CREDENTIALS for an academic project. They are checked in the
 * browser, so they are not security — anyone can read them in the bundle. That
 * is acceptable here and nowhere else. For a real deployment, configure
 * Supabase (see README) and these are bypassed entirely.
 */
export const demoStaff = [
  { email: 'admin@jnu.local', password: 'jnu@2026', full_name: 'Dr. S. K. Sharma', role: 'registrar' as const },
  { email: 'exam@jnu.local', password: 'exam@2026', full_name: 'Smt. R. Deora', role: 'exam_cell' as const },
]
