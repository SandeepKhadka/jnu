/**
 * Programme catalogue.
 *
 * Each faculty becomes a static page at /programmes/<slug>/ carrying Course
 * schema per programme, which is the highest-value structured data for
 * admissions-intent queries.
 *
 * URL note: these pages lived at /faculty/<slug>/ until the catalogue was
 * widened to sixteen faculties. The nav label, the heading and the URL now all
 * say "Programmes". Old paths are 301'd in public/_redirects and in
 * next.config.mjs — see the redirect map there before renaming any slug.
 *
 * ---------------------------------------------------------------------------
 * PROGRAMME DATA IS NOT INVENTED.
 *
 * A faculty with `programmes: []` renders an honest "list being published"
 * state and is served `noindex` until the registrar supplies real data. That
 * is deliberate on two counts: publishing invented durations, eligibility or
 * intake for a university would be a material misrepresentation to applicants,
 * and eight near-empty pages in the index is worse for ranking than eight
 * pages Google has not seen yet. Fill these in from registrar-supplied
 * documents, then they enter the sitemap automatically.
 * ---------------------------------------------------------------------------
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
    slug: 'commerce-management',
    name: 'Commerce and Management',
    summary:
      'Business, commerce and administration programmes covering finance, marketing, ' +
      'human resources and operations, taught with a case-based approach.',
    programmes: [
      { slug: 'bba', name: 'Bachelor of Business Administration', award: 'BBA', faculty: 'Commerce and Management', durationMonths: 36, mode: 'Full-time', eligibility: '10+2 in any stream' },
      { slug: 'mba', name: 'Master of Business Administration', award: 'MBA', faculty: 'Commerce and Management', durationMonths: 24, mode: 'Full-time', eligibility: "Bachelor's degree in any discipline" },
      { slug: 'bcom', name: 'Bachelor of Commerce', award: 'B.Com', faculty: 'Commerce and Management', durationMonths: 36, mode: 'Full-time', eligibility: '10+2, commerce preferred' },
    ],
  },
  {
    slug: 'arts-social-science',
    name: 'Arts and Social Science',
    summary: 'Humanities and social science programmes at undergraduate and postgraduate level.',
    programmes: [
      { slug: 'ba', name: 'Bachelor of Arts', award: 'B.A', faculty: 'Arts and Social Science', durationMonths: 36, mode: 'Full-time', eligibility: '10+2 in any stream' },
      { slug: 'ma', name: 'Master of Arts', award: 'M.A', faculty: 'Arts and Social Science', durationMonths: 24, mode: 'Full-time', eligibility: "Bachelor's degree in a relevant subject" },
    ],
  },
  {
    slug: 'agriculture-science',
    name: 'Agriculture Science',
    summary: 'Agricultural science programmes with field and laboratory practical work.',
    programmes: [],
  },
  {
    slug: 'animation',
    name: 'Animation',
    summary: 'Animation, design and digital media programmes with studio-based teaching.',
    programmes: [],
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
    slug: 'engineering-technology',
    name: 'Engineering and Technology',
    summary:
      'Undergraduate and postgraduate engineering programmes with departmental ' +
      'laboratories, workshops and a central computing facility.',
    programmes: [
      { slug: 'btech-computer-science', name: 'B.Tech Computer Science & Engineering', award: 'B.Tech', faculty: 'Engineering and Technology', durationMonths: 48, mode: 'Full-time', eligibility: '10+2 with Physics, Chemistry and Mathematics' },
      { slug: 'btech-civil', name: 'B.Tech Civil Engineering', award: 'B.Tech', faculty: 'Engineering and Technology', durationMonths: 48, mode: 'Full-time', eligibility: '10+2 with Physics, Chemistry and Mathematics' },
      { slug: 'btech-mechanical', name: 'B.Tech Mechanical Engineering', award: 'B.Tech', faculty: 'Engineering and Technology', durationMonths: 48, mode: 'Full-time', eligibility: '10+2 with Physics, Chemistry and Mathematics' },
      { slug: 'btech-electrical', name: 'B.Tech Electrical Engineering', award: 'B.Tech', faculty: 'Engineering and Technology', durationMonths: 48, mode: 'Full-time', eligibility: '10+2 with Physics, Chemistry and Mathematics' },
      { slug: 'mtech-computer-science', name: 'M.Tech Computer Science & Engineering', award: 'M.Tech', faculty: 'Engineering and Technology', durationMonths: 24, mode: 'Full-time', eligibility: 'B.Tech or equivalent in a relevant discipline' },
    ],
  },
  {
    slug: 'hotel-management',
    name: 'Hotel Management',
    summary: 'Hospitality and hotel administration programmes with training kitchens and industry placement.',
    programmes: [],
  },
  {
    slug: 'journalism-mass-communication',
    name: 'Journalism and Mass Communication',
    summary: 'Journalism, media and communication programmes with studio and editing facilities.',
    programmes: [],
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
    slug: 'library-information-science',
    name: 'Library and Information Science',
    summary: 'Library science and information management programmes with practical cataloguing work.',
    programmes: [],
  },
  {
    slug: 'allied-healthcare-sciences',
    name: 'Allied and Healthcare Sciences',
    summary: 'Allied health and paramedical programmes with laboratory and clinical training.',
    programmes: [],
  },
  {
    slug: 'pharmacy',
    name: 'Pharmacy',
    summary: 'Pharmacy education with formulation, pharmacology and analysis laboratories.',
    programmes: [
      { slug: 'bpharma', name: 'Bachelor of Pharmacy', award: 'B.Pharm', faculty: 'Pharmacy', durationMonths: 48, mode: 'Full-time', eligibility: '10+2 with Physics, Chemistry and Biology or Mathematics' },
      { slug: 'mpharma', name: 'Master of Pharmacy', award: 'M.Pharm', faculty: 'Pharmacy', durationMonths: 24, mode: 'Full-time', eligibility: 'B.Pharm from a recognised institution' },
    ],
  },
  {
    slug: 'physiotherapy',
    name: 'Physiotherapy',
    summary: 'Physiotherapy programmes with supervised clinical practice.',
    programmes: [],
  },
  {
    slug: 'science',
    name: 'Science',
    summary: 'Basic and applied science programmes with departmental laboratories.',
    programmes: [
      { slug: 'bsc', name: 'Bachelor of Science', award: 'B.Sc', faculty: 'Science', durationMonths: 36, mode: 'Full-time', eligibility: '10+2 in the science stream' },
      { slug: 'msc', name: 'Master of Science', award: 'M.Sc', faculty: 'Science', durationMonths: 24, mode: 'Full-time', eligibility: 'B.Sc in a relevant subject' },
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
    slug: 'nursing',
    name: 'Nursing',
    summary: 'Nursing education with a skills laboratory and supervised hospital placement.',
    programmes: [],
  },
]

export const allProgrammes: Programme[] = faculties.flatMap((f) => f.programmes)

export function facultyBySlug(slug: string): Faculty | undefined {
  return faculties.find((f) => f.slug === slug)
}

/**
 * A faculty whose programme list has not been supplied yet.
 *
 * Drives both the placeholder UI and the `noindex` on that page, so the two
 * can never disagree: if a page has nothing to say, it does not enter the
 * index, and the moment programmes are added it does.
 */
export function isAwaitingProgrammes(f: Faculty): boolean {
  return f.programmes.length === 0
}

/** Faculties with real programme data — the only ones that belong in the sitemap. */
export const publishedFaculties: Faculty[] = faculties.filter((f) => !isAwaitingProgrammes(f))
