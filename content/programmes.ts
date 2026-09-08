/**
 * Programme catalogue. Each entry becomes a static page with Course schema,
 * which is the highest-value structured data for admissions-intent queries.
 *
 * Replace the placeholder eligibility/fee text with registrar-supplied copy
 * before launch — do not publish invented fees.
 */

export type Programme = {
  slug: string
  name: string
  award: string
  faculty: string
  durationMonths: number
  mode: 'Full-time' | 'Part-time'
  eligibility: string
  intake?: number
}

export type Faculty = {
  slug: string
  name: string
  summary: string
  programmes: Programme[]
}

export const faculties: Faculty[] = [
  {
    slug: 'engineering-technology',
    name: 'Engineering & Technology',
    summary:
      'Undergraduate and postgraduate engineering programmes with departmental ' +
      'laboratories, workshops and a central computing facility.',
    programmes: [
      { slug: 'btech-computer-science', name: 'B.Tech Computer Science & Engineering', award: 'B.Tech', faculty: 'Engineering & Technology', durationMonths: 48, mode: 'Full-time', eligibility: '10+2 with Physics, Chemistry and Mathematics' },
      { slug: 'btech-civil', name: 'B.Tech Civil Engineering', award: 'B.Tech', faculty: 'Engineering & Technology', durationMonths: 48, mode: 'Full-time', eligibility: '10+2 with Physics, Chemistry and Mathematics' },
      { slug: 'btech-mechanical', name: 'B.Tech Mechanical Engineering', award: 'B.Tech', faculty: 'Engineering & Technology', durationMonths: 48, mode: 'Full-time', eligibility: '10+2 with Physics, Chemistry and Mathematics' },
      { slug: 'btech-electrical', name: 'B.Tech Electrical Engineering', award: 'B.Tech', faculty: 'Engineering & Technology', durationMonths: 48, mode: 'Full-time', eligibility: '10+2 with Physics, Chemistry and Mathematics' },
      { slug: 'mtech-computer-science', name: 'M.Tech Computer Science & Engineering', award: 'M.Tech', faculty: 'Engineering & Technology', durationMonths: 24, mode: 'Full-time', eligibility: 'B.Tech or equivalent in a relevant discipline' },
    ],
  },
  {
    slug: 'management',
    name: 'Management',
    summary:
      'Business administration programmes covering finance, marketing, human ' +
      'resources and operations, with a case-based teaching approach.',
    programmes: [
      { slug: 'bba', name: 'Bachelor of Business Administration', award: 'BBA', faculty: 'Management', durationMonths: 36, mode: 'Full-time', eligibility: '10+2 in any stream' },
      { slug: 'mba', name: 'Master of Business Administration', award: 'MBA', faculty: 'Management', durationMonths: 24, mode: 'Full-time', eligibility: "Bachelor's degree in any discipline" },
    ],
  },
  {
    slug: 'pharmaceutical-sciences',
    name: 'Pharmaceutical Sciences',
    summary:
      'Pharmacy education with formulation, pharmacology and analysis laboratories.',
    programmes: [
      { slug: 'bpharma', name: 'Bachelor of Pharmacy', award: 'B.Pharm', faculty: 'Pharmaceutical Sciences', durationMonths: 48, mode: 'Full-time', eligibility: '10+2 with Physics, Chemistry and Biology or Mathematics' },
      { slug: 'mpharma', name: 'Master of Pharmacy', award: 'M.Pharm', faculty: 'Pharmaceutical Sciences', durationMonths: 24, mode: 'Full-time', eligibility: 'B.Pharm from a recognised institution' },
    ],
  },
  {
    slug: 'computer-application',
    name: 'Computer Application',
    summary:
      'Computer application programmes with an emphasis on software development and applied computing.',
    programmes: [
      { slug: 'bca', name: 'Bachelor of Computer Applications', award: 'BCA', faculty: 'Computer Application', durationMonths: 36, mode: 'Full-time', eligibility: '10+2 in any stream with Mathematics' },
      { slug: 'mca', name: 'Master of Computer Applications', award: 'MCA', faculty: 'Computer Application', durationMonths: 24, mode: 'Full-time', eligibility: "Bachelor's degree with Mathematics at 10+2 or degree level" },
    ],
  },
  {
    slug: 'applied-sciences-nursing',
    name: 'Applied Sciences & Nursing',
    summary: 'Basic and applied science programmes alongside nursing education.',
    programmes: [
      { slug: 'bsc', name: 'Bachelor of Science', award: 'B.Sc', faculty: 'Applied Sciences & Nursing', durationMonths: 36, mode: 'Full-time', eligibility: '10+2 in the science stream' },
      { slug: 'msc', name: 'Master of Science', award: 'M.Sc', faculty: 'Applied Sciences & Nursing', durationMonths: 24, mode: 'Full-time', eligibility: 'B.Sc in a relevant subject' },
    ],
  },
  {
    slug: 'law',
    name: 'Law',
    summary: 'Legal education with moot court facilities and a dedicated law library.',
    programmes: [
      { slug: 'llb', name: 'Bachelor of Laws', award: 'LL.B', faculty: 'Law', durationMonths: 36, mode: 'Full-time', eligibility: "Bachelor's degree in any discipline" },
      { slug: 'llm', name: 'Master of Laws', award: 'LL.M', faculty: 'Law', durationMonths: 24, mode: 'Full-time', eligibility: 'LL.B or equivalent' },
    ],
  },
  {
    slug: 'education',
    name: 'Education',
    summary: 'Teacher education programmes with supervised school internships.',
    programmes: [
      { slug: 'bed', name: 'Bachelor of Education', award: 'B.Ed', faculty: 'Education', durationMonths: 24, mode: 'Full-time', eligibility: "Bachelor's degree with the required minimum marks" },
      { slug: 'med', name: 'Master of Education', award: 'M.Ed', faculty: 'Education', durationMonths: 24, mode: 'Full-time', eligibility: 'B.Ed from a recognised institution' },
    ],
  },
  {
    slug: 'arts-commerce',
    name: 'Arts & Commerce',
    summary: 'Humanities, social science and commerce programmes.',
    programmes: [
      { slug: 'ba', name: 'Bachelor of Arts', award: 'B.A', faculty: 'Arts & Commerce', durationMonths: 36, mode: 'Full-time', eligibility: '10+2 in any stream' },
      { slug: 'bcom', name: 'Bachelor of Commerce', award: 'B.Com', faculty: 'Arts & Commerce', durationMonths: 36, mode: 'Full-time', eligibility: '10+2, commerce preferred' },
      { slug: 'ma', name: 'Master of Arts', award: 'M.A', faculty: 'Arts & Commerce', durationMonths: 24, mode: 'Full-time', eligibility: "Bachelor's degree in a relevant subject" },
    ],
  },
]

export const allProgrammes: Programme[] = faculties.flatMap((f) => f.programmes)

export function facultyBySlug(slug: string): Faculty | undefined {
  return faculties.find((f) => f.slug === slug)
}
