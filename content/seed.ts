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

/* ---------------------------------------------------------------- students --- */

export type StudentSeed = {
  roll_no: string
  enrollment_no: string
  full_name: string
  father_name: string
  mother_name: string
  /** `YYYY-MM-DD` — half of the login credential, so never a Date. */
  dob: string
  programme: string
  status: 'ACTIVE' | 'GRADUATED' | 'WITHDRAWN'
  /** Certificate numbers held by this student, for linking the register. */
  certificates?: string[]
}

/**
 * The student register.
 *
 * Covers every roll number in seedResults, plus a row for each holder in
 * seedCertificates so that verification by roll number + date of birth has
 * something to match. Certificates previously carried only an enrollment
 * number, so their roll numbers are assigned here.
 *
 * These are fictional people for development. Replace the whole list with the
 * registrar's export before launch — and note that none of these dates of
 * birth should ever exist in a production database, since they are published
 * in this repository and are half of a login credential.
 */
export const seedStudents: StudentSeed[] = [
  // --- holders of published results ---
  { roll_no: 'JNU2024BT0147', enrollment_no: 'JNU/2024/BT/1147', full_name: 'Rajesh Kumar Meena', father_name: 'Shyam Lal Meena', mother_name: 'Kamla Devi Meena', dob: '2005-04-12', programme: 'B.Tech Computer Science & Engineering', status: 'ACTIVE' },
  { roll_no: 'JNU2024BT0152', enrollment_no: 'JNU/2024/BT/1152', full_name: 'Priya Sharma', father_name: 'Mahesh Sharma', mother_name: 'Sunita Sharma', dob: '2005-08-30', programme: 'B.Tech Computer Science & Engineering', status: 'ACTIVE' },
  { roll_no: 'JNU2024BT0301', enrollment_no: 'JNU/2024/CE/0301', full_name: 'Mohammed Arif Khan', father_name: 'Iqbal Khan', mother_name: 'Nasreen Bano', dob: '2004-11-19', programme: 'B.Tech Civil Engineering', status: 'ACTIVE' },
  { roll_no: 'JNU2025MB0088', enrollment_no: 'JNU/2025/MB/0088', full_name: 'Anjali Rathore', father_name: 'Bhanwar Singh Rathore', mother_name: 'Pushpa Kanwar', dob: '2002-02-07', programme: 'Master of Business Administration', status: 'ACTIVE' },
  { roll_no: 'JNU2024BP0219', enrollment_no: 'JNU/2024/BP/0219', full_name: 'Vikram Singh Bhati', father_name: 'Devi Singh Bhati', mother_name: 'Sushila Kanwar', dob: '2005-01-25', programme: 'Bachelor of Pharmacy', status: 'ACTIVE' },
  { roll_no: 'JNU2025CA0410', enrollment_no: 'JNU/2025/CA/0410', full_name: 'Sneha Vishnoi', father_name: 'Rakesh Vishnoi', mother_name: 'Manju Vishnoi', dob: '2006-06-14', programme: 'Bachelor of Computer Applications', status: 'ACTIVE' },
  { roll_no: 'JNU2024LW0075', enrollment_no: 'JNU/2024/LW/0075', full_name: 'Karan Purohit', father_name: 'Girdhari Lal Purohit', mother_name: 'Lalita Purohit', dob: '2003-09-03', programme: 'Bachelor of Laws', status: 'ACTIVE' },
  { roll_no: 'JNU2024BT0166', enrollment_no: 'JNU/2024/BT/1166', full_name: 'Deepak Choudhary', father_name: 'Ram Niwas Choudhary', mother_name: 'Santosh Devi', dob: '2005-03-21', programme: 'B.Tech Computer Science & Engineering', status: 'ACTIVE' },

  // --- results withheld from publication ---
  { roll_no: 'JNU2024BT0171', enrollment_no: 'JNU/2024/BT/1171', full_name: 'Neha Agarwal', father_name: 'Sunil Agarwal', mother_name: 'Rekha Agarwal', dob: '2005-07-08', programme: 'B.Tech Computer Science & Engineering', status: 'ACTIVE' },
  { roll_no: 'JNU2024BT0180', enrollment_no: 'JNU/2024/ME/0180', full_name: 'Suresh Bishnoi', father_name: 'Hanuman Ram Bishnoi', mother_name: 'Bhanwari Devi', dob: '2004-12-30', programme: 'B.Tech Mechanical Engineering', status: 'ACTIVE' },

  // --- certificate holders (graduated) ---
  { roll_no: 'JNU2020BT1187', enrollment_no: 'JNU/2020/BT/1187', full_name: 'Rohit Suthar', father_name: 'Prakash Suthar', mother_name: 'Geeta Suthar', dob: '2002-05-16', programme: 'B.Tech Computer Science & Engineering', status: 'GRADUATED', certificates: ['JNU/DEG/2024/004512'] },
  { roll_no: 'JNU2022MB0341', enrollment_no: 'JNU/2022/MB/0341', full_name: 'Kavita Parihar', father_name: 'Narendra Parihar', mother_name: 'Shobha Parihar', dob: '2000-10-09', programme: 'Master of Business Administration', status: 'GRADUATED', certificates: ['JNU/DEG/2024/004518'] },
  { roll_no: 'JNU2019BP0812', enrollment_no: 'JNU/2019/BP/0812', full_name: 'Imran Sheikh', father_name: 'Abdul Rashid Sheikh', mother_name: 'Shabana Sheikh', dob: '2001-03-27', programme: 'Bachelor of Pharmacy', status: 'GRADUATED', certificates: ['JNU/DEG/2023/003994'] },
  { roll_no: 'JNU2020LW0233', enrollment_no: 'JNU/2020/LW/0233', full_name: 'Pooja Chouhan', father_name: 'Mangi Lal Chouhan', mother_name: 'Kailash Devi', dob: '2001-12-02', programme: 'Bachelor of Laws', status: 'GRADUATED', certificates: ['JNU/DEG/2023/004021'] },
  { roll_no: 'JNU2022CA0604', enrollment_no: 'JNU/2022/CA/0604', full_name: 'Aditya Vyas', father_name: 'Dinesh Vyas', mother_name: 'Anita Vyas', dob: '2003-07-11', programme: 'Bachelor of Computer Applications', status: 'GRADUATED', certificates: ['JNU/DEG/2025/005107'] },
  { roll_no: 'JNU2023MS0119', enrollment_no: 'JNU/2023/MS/0119', full_name: 'Meenakshi Joshi', father_name: 'Ashok Joshi', mother_name: 'Nirmala Joshi', dob: '2001-09-23', programme: 'Master of Science', status: 'GRADUATED', certificates: ['JNU/DEG/2025/005142'] },

  // Revoked — verification must report this plainly rather than stay silent.
  { roll_no: 'JNU2018CE0455', enrollment_no: 'JNU/2018/CE/0455', full_name: 'Sanjay Tak', father_name: 'Bheru Lal Tak', mother_name: 'Sita Devi Tak', dob: '2000-01-18', programme: 'B.Tech Civil Engineering', status: 'GRADUATED', certificates: ['JNU/DEG/2022/003310'] },
  // Withheld — under review by the examination cell.
  { roll_no: 'JNU2023BE0287', enrollment_no: 'JNU/2023/BE/0287', full_name: 'Farhan Qureshi', father_name: 'Mohammed Yusuf Qureshi', mother_name: 'Rukhsana Begum', dob: '2001-06-05', programme: 'Bachelor of Education', status: 'GRADUATED', certificates: ['JNU/DEG/2025/005190'] },
]
