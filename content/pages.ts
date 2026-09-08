/**
 * Registry for the static content pages.
 *
 * One entry per route; the catch-all at src/app/[...slug]/page.tsx renders
 * them all. This keeps ~25 pages in one reviewable file instead of 25 nearly
 * identical page.tsx files, and makes the SEO fields impossible to forget.
 *
 * `body` is an array of blocks rather than raw HTML so nothing can inject
 * markup, and so headings stay in a sane order for accessibility.
 *
 * TODO(client): blocks marked `placeholder: true` need registrar-supplied
 * copy before launch. They are written to be truthful-but-generic in the
 * meantime; none of them invents a fact, a fee or an approval.
 */

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'note'; text: string }

export type ContentPage = {
  path: string
  title: string
  description: string
  intro?: string
  crumbs: { name: string; path: string }[]
  body: Block[]
  placeholder?: boolean
}

const zone = { name: 'Student Zone', path: '/student-zone/' }
const about = { name: 'JNU', path: '/about/' }
const admission = { name: 'Admission', path: '/admission/' }

export const contentPages: ContentPage[] = [
  /* ------------------------------------------------------------- about --- */
  {
    path: '/about/',
    title: 'About the University',
    description:
      'About Jodhpur National University — faculties, campus and academic organisation in Jodhpur, Rajasthan.',
    intro: 'Professional and technical education across eight faculties in Jodhpur, Rajasthan.',
    crumbs: [about],
    body: [
      { type: 'p', text: 'Jodhpur National University offers professional and technical education from its campus on Jhanwar Road, Boranada, Jodhpur. Teaching is organised across eight faculties, each with its own departments, laboratories and academic staff.' },
      { type: 'h2', text: 'Academic organisation' },
      { type: 'p', text: 'Programmes run at undergraduate, postgraduate and doctoral level. The academic year is divided into two semesters, with continuous internal assessment alongside end-semester examinations conducted by the examination cell.' },
      { type: 'h2', text: 'Campus facilities' },
      { type: 'ul', items: ['Departmental laboratories and engineering workshops', 'Central library with reading rooms', 'Computing facility with networked laboratories', 'Sports ground and indoor facilities', 'Separate hostel accommodation for men and women'] },
      { type: 'note', text: 'Detailed facility descriptions and current capacity figures are to be supplied by the university administration.' },
    ],
    placeholder: true,
  },
  {
    path: '/about/foundation/',
    title: 'Foundation',
    description: 'The founding of Jodhpur National University and its objectives.',
    crumbs: [about, { name: 'Foundation', path: '/about/foundation/' }],
    body: [
      { type: 'p', text: 'This page records the founding of the university, its sponsoring body and its stated objectives.' },
      { type: 'note', text: 'Awaiting the authoritative founding history, dates and sponsoring-body details from the university administration. No dates are stated here until they can be evidenced.' },
    ],
    placeholder: true,
  },
  {
    path: '/about/chairperson-message/',
    title: "Chairperson's Message",
    description: "Message from the Chairperson of Jodhpur National University.",
    crumbs: [about, { name: "Chairperson's Message", path: '/about/chairperson-message/' }],
    body: [
      { type: 'note', text: 'Awaiting the current message and attribution. A message must not be published under a named individual without their approval.' },
    ],
    placeholder: true,
  },
  {
    path: '/about/infrastructure/',
    title: 'Infrastructure',
    description: 'Campus infrastructure at Jodhpur National University — laboratories, library, computing and hostels.',
    crumbs: [about, { name: 'Infrastructure', path: '/about/infrastructure/' }],
    body: [
      { type: 'h2', text: 'Academic infrastructure' },
      { type: 'ul', items: ['Faculty-wise laboratories and workshops', 'Central library and reading rooms', 'Networked computing laboratories', 'Lecture theatres and seminar rooms'] },
      { type: 'h2', text: 'Student amenities' },
      { type: 'ul', items: ['Hostel accommodation', 'Canteen', 'Sports facilities', 'Transport'] },
      { type: 'note', text: 'Capacities, floor areas and photographs to be supplied by the administration.' },
    ],
    placeholder: true,
  },
  {
    path: '/about/academic-council/',
    title: 'Academic Council',
    description: 'Composition and role of the Academic Council of Jodhpur National University.',
    crumbs: [about, { name: 'Academic Council', path: '/about/academic-council/' }],
    body: [
      { type: 'p', text: 'The Academic Council is the authority responsible for academic standards, curriculum approval and examination policy.' },
      { type: 'note', text: 'Current membership list to be supplied by the registrar. Do not publish names without confirmation.' },
    ],
    placeholder: true,
  },
  {
    path: '/about/accreditation/',
    title: 'Accreditation & Approvals',
    description:
      'Recognition and statutory approval status of Jodhpur National University, with the evidence on which each claim rests.',
    intro: 'Recognition status, and where to verify it independently.',
    crumbs: [about, { name: 'Accreditation & Approvals', path: '/about/accreditation/' }],
    body: [
      { type: 'p', text: 'This page exists to state the university’s current statutory position plainly, with dates, so that applicants and employers can verify it independently rather than take it on trust.' },
      { type: 'h2', text: 'How to verify independently' },
      { type: 'p', text: 'Prospective students are encouraged to confirm the current status of any institution and programme directly with the relevant statutory body before accepting an offer or paying a fee.' },
      { type: 'ul', items: ['University Grants Commission (UGC) — recognised institutions and public notices', 'The relevant professional council for the programme concerned', 'The Government of Rajasthan department responsible for private universities'] },
      { type: 'note', text: 'No recognition claim is displayed on this site until the registrar supplies current, dated documentary evidence. Populate site.recognition in content/site.ts only from that evidence, and record the date it was verified.' },
    ],
    placeholder: true,
  },
  {
    path: '/about/achievers/',
    title: 'Achievers',
    description: 'Student and alumni achievements at Jodhpur National University.',
    crumbs: [about, { name: 'Achievers', path: '/about/achievers/' }],
    body: [
      { type: 'note', text: 'Awaiting a verified list. Named individuals require consent before publication.' },
    ],
    placeholder: true,
  },
  {
    path: '/about/community-programme/',
    title: 'Community Programme',
    description: 'Community outreach and extension activities of Jodhpur National University.',
    crumbs: [about, { name: 'Community Programme', path: '/about/community-programme/' }],
    body: [
      { type: 'p', text: 'Outreach and extension activities undertaken by departments and student bodies.' },
      { type: 'note', text: 'Awaiting activity descriptions from the administration.' },
    ],
    placeholder: true,
  },

  /* --------------------------------------------------------- admission --- */
  {
    path: '/admission/',
    title: 'Admission',
    description:
      'Admission information for Jodhpur National University — process, eligibility, fee structure, syllabus and downloadable forms.',
    intro: 'Everything needed to apply, in one place.',
    crumbs: [admission],
    body: [
      { type: 'p', text: 'Admission information is grouped into the pages below. Read the eligibility conditions for your programme before applying.' },
      { type: 'ul', items: ['Admission process — steps, documents and dates', 'Eligibility — programme-wise conditions', 'Fee structure — programme-wise fees and schedule', 'Syllabus — current curriculum by programme', 'Download forms — application and related forms'] },
      { type: 'note', text: 'Applications are accepted only when the university is permitted to admit students for the session concerned. Confirm the current position with the administration before paying any fee.' },
    ],
  },
  {
    path: '/admission/process/',
    title: 'Admission Process',
    description:
      'Step-by-step admission process at Jodhpur National University, including documents required and where to submit an application.',
    intro: 'How to apply, what to bring, and where to submit.',
    crumbs: [admission, { name: 'Admission Process', path: '/admission/process/' }],
    body: [
      { type: 'h2', text: 'Steps' },
      { type: 'ol', items: ['Check the eligibility conditions for the programme you intend to apply for.', 'Obtain the application form from the downloads page or the administrative office.', 'Complete the form and attach self-attested copies of the required documents.', 'Submit the completed form at the administrative office and obtain a receipt.', 'Await the admission decision from the office.'] },
      { type: 'h2', text: 'Documents required' },
      { type: 'ul', items: ['Class 10 and Class 12 marksheets and certificates', 'Degree marksheets and provisional certificate, for postgraduate applicants', 'Transfer certificate and migration certificate, where applicable', 'Character certificate from the institution last attended', 'Category certificate, where applicable', 'Recent passport-size photographs', 'Photograph identity proof'] },
      { type: 'note', text: 'Always obtain a dated, stamped receipt for any document or payment handed over. Do not make payments to an individual or to any account not confirmed in writing by the administrative office.' },
    ],
  },
  {
    path: '/admission/eligibility/',
    title: 'Eligibility',
    description: 'Programme-wise eligibility conditions for admission to Jodhpur National University.',
    intro: 'Minimum qualifications by programme.',
    crumbs: [admission, { name: 'Eligibility', path: '/admission/eligibility/' }],
    body: [
      { type: 'p', text: 'Eligibility for each programme is listed on its faculty page. Conditions are the minimum required to be considered; meeting them does not itself guarantee admission.' },
      { type: 'note', text: 'Where a programme requires approval from a professional council, admission is subject to that approval being current for the session.' },
    ],
  },
  {
    path: '/admission/fee-structure/',
    title: 'Fee Structure',
    description:
      'Programme-wise fee structure and payment schedule for Jodhpur National University.',
    intro: 'Fees by programme, and how they are paid.',
    crumbs: [admission, { name: 'Fee Structure', path: '/admission/fee-structure/' }],
    body: [
      { type: 'p', text: 'Fees are set per programme and per academic session. The table below is published as HTML rather than only as a PDF so that it is readable on any device and can be found in search.' },
      { type: 'note', text: 'Fee figures are deliberately not shown until the registrar supplies the approved schedule for the current session. Publishing an out-of-date or invented fee is both an SEO liability and a consumer-protection problem. Replace this block with the approved table.' },
      { type: 'h2', text: 'Payment' },
      { type: 'ul', items: ['Pay only into an account confirmed in writing by the administrative office.', 'Obtain an official receipt for every payment.', 'Retain all receipts until the programme is completed.'] },
    ],
    placeholder: true,
  },
  {
    path: '/admission/syllabus/',
    title: 'Syllabus',
    description: 'Current syllabus and curriculum documents by programme at Jodhpur National University.',
    crumbs: [admission, { name: 'Syllabus', path: '/admission/syllabus/' }],
    body: [
      { type: 'p', text: 'Syllabus documents are published per programme and per session.' },
      { type: 'note', text: 'Upload the current syllabus PDFs to /public/documents/ and list them here. Where practical, publish the scheme of examination as HTML as well — PDF-only content is largely invisible to search.' },
    ],
    placeholder: true,
  },
  {
    path: '/admission/download-forms/',
    title: 'Download Forms',
    description: 'Downloadable application and administrative forms for Jodhpur National University.',
    intro: 'Application and administrative forms.',
    crumbs: [admission, { name: 'Download Forms', path: '/admission/download-forms/' }],
    body: [
      { type: 'p', text: 'Forms are provided as PDF documents. Each is dated so that an out-of-date form is not submitted by mistake.' },
      { type: 'note', text: 'Place current forms in /public/documents/ and list them here with a revision date beside each. Remove superseded forms rather than leaving them alongside current ones — the original site still linked forms dated 2014 and 2015.' },
    ],
    placeholder: true,
  },

  /* -------------------------------------------------------- academics --- */
  {
    path: '/faculty/',
    title: 'Faculties & Programmes',
    description:
      'Eight faculties at Jodhpur National University — engineering, management, pharmacy, computer applications, applied sciences and nursing, law, education, arts and commerce.',
    intro: 'Programmes by faculty, with duration, award and eligibility.',
    crumbs: [{ name: 'Faculty', path: '/faculty/' }],
    body: [
      { type: 'p', text: 'Select a faculty to see its programmes with duration, award and eligibility conditions.' },
    ],
  },
  {
    path: '/research/',
    title: 'Research',
    description: 'Research activity, doctoral programmes and publications at Jodhpur National University.',
    crumbs: [{ name: 'Research', path: '/research/' }],
    body: [
      { type: 'p', text: 'Research is conducted within the faculties, including supervision of doctoral candidates.' },
      { type: 'note', text: 'Awaiting the current research areas, supervisor list and publication record. Doctoral admission is subject to the university being permitted to enrol research scholars for the session.' },
    ],
    placeholder: true,
  },
  {
    path: '/placement/',
    title: 'Placement',
    description: 'Placement support and recruiter engagement at Jodhpur National University.',
    crumbs: [{ name: 'Placement', path: '/placement/' }],
    body: [
      { type: 'p', text: 'The placement cell coordinates campus recruitment, pre-placement training and industry engagement.' },
      { type: 'note', text: 'Publish only placement statistics that can be substantiated from records. Unverifiable placement percentages are a common source of consumer-protection complaints against private universities.' },
    ],
    placeholder: true,
  },

  /* ------------------------------------------------------ student zone --- */
  {
    path: '/student-zone/',
    title: 'Student Zone',
    description:
      'Student services at Jodhpur National University — notices, results, certificate verification, time tables and downloads.',
    intro: 'Notices, results, verification and downloads.',
    crumbs: [zone],
    body: [
      { type: 'ul', items: ['Notices & circulars — examination and general notices', 'Examination results — check a published result by roll number', 'Certificate verification — confirm a certificate against the university record', 'Time table — examination and class schedules', 'Enrollment status — enrollment confirmation', 'Placement notices — recruitment announcements', 'Downloads — forms and documents'] },
    ],
  },
  {
    path: '/student-zone/time-table/',
    title: 'Time Table',
    description: 'Examination and class time tables at Jodhpur National University.',
    crumbs: [zone, { name: 'Time Table', path: '/student-zone/time-table/' }],
    body: [
      { type: 'note', text: 'Publish the current examination time table as an HTML table as well as a PDF. A table in HTML is readable on a phone, indexable, and accessible to screen readers; a scanned PDF is none of those.' },
    ],
    placeholder: true,
  },
  {
    path: '/student-zone/enrollment-status/',
    title: 'Enrollment Status',
    description: 'Enrollment confirmation for students of Jodhpur National University.',
    crumbs: [zone, { name: 'Enrollment Status', path: '/student-zone/enrollment-status/' }],
    body: [
      { type: 'p', text: 'Enrollment confirmation is issued by the registrar’s office.' },
      { type: 'note', text: 'If this becomes a lookup tool, it must follow the results pattern: noindex, and a Supabase table under row-level security. Enrollment data is personal data.' },
    ],
    placeholder: true,
  },
  {
    path: '/student-zone/placement-notices/',
    title: 'Placement Notices',
    description: 'Campus recruitment and placement notices at Jodhpur National University.',
    crumbs: [zone, { name: 'Placement Notices', path: '/student-zone/placement-notices/' }],
    body: [
      { type: 'p', text: 'Recruitment announcements and pre-placement schedules are posted here and on the notice board.' },
    ],
    placeholder: true,
  },
  {
    path: '/student-zone/downloads/',
    title: 'Downloads',
    description: 'Forms, syllabi and documents available for download from Jodhpur National University.',
    crumbs: [zone, { name: 'Downloads', path: '/student-zone/downloads/' }],
    body: [
      { type: 'p', text: 'Documents are listed with a revision date so the current version is unambiguous.' },
      { type: 'note', text: 'Keep one current version of each document and remove superseded copies.' },
    ],
    placeholder: true,
  },

  /* ------------------------------------------------------------ other --- */
  {
    path: '/photo-tour/',
    title: 'Photo Tour',
    description: 'Photographs of the Jodhpur National University campus and facilities.',
    crumbs: [{ name: 'Photo Tour', path: '/photo-tour/' }],
    body: [
      { type: 'note', text: 'Add campus photographs to /public/images/gallery/ as AVIF or WebP, each under about 150 KB, with descriptive alt text. The original site served 2013-era JPEGs of up to 1.09 MB each.' },
    ],
    placeholder: true,
  },
  {
    path: '/career/',
    title: 'Careers',
    description: 'Faculty and staff vacancies at Jodhpur National University.',
    crumbs: [{ name: 'Career', path: '/career/' }],
    body: [
      { type: 'p', text: 'Vacancies for teaching and non-teaching positions are advertised here with the application procedure and closing date.' },
      { type: 'note', text: 'Remove closed vacancies promptly — stale listings are a common trust signal problem.' },
    ],
    placeholder: true,
  },
  {
    path: '/privacy/',
    title: 'Privacy Notice',
    description:
      'How Jodhpur National University handles personal data, including examination results and certificate records.',
    intro: 'What data this site handles, and on what basis.',
    crumbs: [{ name: 'Privacy', path: '/privacy/' }],
    body: [
      { type: 'p', text: 'This notice describes the personal data handled through this website. Under the Digital Personal Data Protection Act 2023, the university is the data fiduciary for this data.' },
      { type: 'h2', text: 'Examination results' },
      { type: 'p', text: 'Results are stored in a database protected by row-level access rules. A result is visible only after the examination cell has published it, and is returned only in response to an exact roll-number query. Result pages are excluded from search-engine indexing.' },
      { type: 'h2', text: 'Certificate verification' },
      { type: 'p', text: 'The certificate register records the certificate number, name, programme, year of award and status. A verification query returns only these fields. Verification is available to third parties because confirming a credential is its purpose.' },
      { type: 'h2', text: 'Enquiries' },
      { type: 'p', text: 'Contact form submissions are stored and forwarded to the relevant office. They are retained only as long as needed to answer the enquiry.' },
      { type: 'h2', text: 'Your rights' },
      { type: 'p', text: 'You may request access to, or correction of, personal data the university holds about you. Write to the registrar at the address on the contact page.' },
      { type: 'note', text: 'Have this notice reviewed by the university’s legal adviser before launch, and add the grievance officer’s name and contact details as the DPDP Act requires.' },
    ],
    placeholder: true,
  },
]

export function pageByPath(path: string): ContentPage | undefined {
  return contentPages.find((p) => p.path === path)
}
