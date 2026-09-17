/**
 * Registry for the static content pages.
 *
 * One entry per route; the catch-all at src/app/[...slug]/page.tsx renders
 * them all. Keeping ~25 pages in one reviewable file beats 25 nearly identical
 * page.tsx files, and makes the SEO fields impossible to forget.
 *
 * `body` is an array of typed blocks rather than raw HTML, so nothing can
 * inject markup and heading order stays sane for screen readers.
 *
 * Content note: this is an academic project. Programme structures, facilities
 * and procedures below are written to be realistic and internally consistent.
 * Two things are deliberately NOT invented, because publishing them unverified
 * would be a real problem for an institution rather than a cosmetic one:
 *   - specific statutory approval numbers or accreditation grades
 *   - placement percentages and salary figures
 * Where those belong, the page explains how to verify them independently.
 * Fee figures are present but labelled indicative.
 */

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; head: string[]; rows: string[][] }
  // A note addressed to the reader (how to verify a recognition claim, how to
  // pay safely) renders on the page. One marked `maintainer` is an instruction
  // to whoever maintains the site and is hidden unless SHOW_MAINTAINER_NOTES is
  // on — it stays in source so the outstanding work is still tracked.
  | { type: 'note'; text: string; audience?: 'reader' | 'maintainer' }

export type ContentPage = {
  path: string
  title: string
  description: string
  intro?: string
  crumbs: { name: string; path: string }[]
  body: Block[]
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
      'About Jodhpur National University — eight faculties, campus facilities and academic organisation in Jodhpur, Rajasthan.',
    intro: 'Professional and technical education across eight faculties in Jodhpur, Rajasthan.',
    crumbs: [about],
    body: [
      { type: 'p', text: 'Jodhpur National University offers professional and technical education from its campus on Jhanwar Road, Boranada, Jodhpur. Teaching is organised across eight faculties, each with its own departments, laboratories and academic staff.' },
      { type: 'h2', text: 'Academic organisation' },
      { type: 'p', text: 'Programmes run at undergraduate, postgraduate and doctoral level. The academic year is divided into two semesters. Assessment combines continuous internal evaluation — assignments, sessional tests and practical work — with end-semester examinations conducted by the examination cell.' },
      { type: 'p', text: 'Each faculty is headed by a Dean and is responsible for its own curriculum, subject to approval by the Academic Council. Departments hold periodic reviews of syllabus content so that programmes stay current with professional practice.' },
      { type: 'h2', text: 'Campus' },
      { type: 'p', text: 'The campus is arranged around a central academic block with departmental laboratories and workshops, a library, a computing facility and separate hostel accommodation for men and women. Teaching, examination and administrative functions are all conducted on campus.' },
      { type: 'ul', items: ['Departmental laboratories and engineering workshops', 'Central library with reading rooms and reference section', 'Networked computing laboratories', 'Lecture theatres and seminar rooms', 'Sports ground and indoor games facilities', 'Hostel accommodation, canteen and campus transport'] },
      { type: 'h2', text: 'Governance' },
      { type: 'p', text: 'Academic policy is set by the Academic Council. Examination policy, result declaration and the issue of marksheets and degree certificates are the responsibility of the examination cell, working under the registrar.' },
    ],
  },
  {
    path: '/about/foundation/',
    title: 'Foundation',
    description:
      'The founding purpose and objectives of Jodhpur National University, Jodhpur, Rajasthan.',
    intro: 'Why the university was established, and what it set out to do.',
    crumbs: [about, { name: 'Foundation', path: '/about/foundation/' }],
    body: [
      { type: 'p', text: 'The university was founded to widen access to professional and technical education in western Rajasthan. Students from Jodhpur and the surrounding districts had historically travelled to Jaipur or outside the state for engineering, management and pharmacy education. The founding intent was to make those programmes available locally, at a cost families in the region could meet.' },
      { type: 'h2', text: 'Objectives' },
      { type: 'ol', items: ['Provide undergraduate and postgraduate education in engineering, management, pharmacy, computer applications, law, education, and the arts, commerce and sciences.', 'Maintain teaching laboratories and workshops sufficient for the practical component of each programme.', 'Support research supervision at doctoral level within the faculties.', 'Extend the university’s resources to the surrounding community through outreach and extension activity.', 'Keep curricula aligned with the requirements of the professions students enter.'] },
      { type: 'h2', text: 'Character of the institution' },
      { type: 'p', text: 'The university is a private institution, funded by student fees rather than a state grant. That places a particular obligation on transparency: fee schedules, examination procedures and the status of every certificate the university issues should all be verifiable by the student and, where relevant, by an employer. The certificate verification service on this site exists for that reason.' },
    ],
  },
  {
    path: '/about/chairperson-message/',
    title: "Chairperson's Message",
    description:
      "Message from the Chairperson of Jodhpur National University on the university's academic priorities.",
    crumbs: [about, { name: "Chairperson's Message", path: '/about/chairperson-message/' }],
    body: [
      { type: 'p', text: 'A university is judged by what its graduates can do, and by whether what it certifies can be trusted. Those two things are not separate. A degree has value only where the institution behind it keeps an accurate record and stands behind it when asked.' },
      { type: 'p', text: 'Our priorities follow from that. First, teaching that gives students genuine practical competence — laboratory and workshop time that is actually used, project work that is actually supervised, and internal assessment that reflects what a student can do rather than what they can recall the week before an examination.' },
      { type: 'p', text: 'Second, an examination system whose results are declared on a published schedule and whose records are complete. A student is entitled to know when a result will appear and to obtain an accurate statement of marks without having to ask twice.' },
      { type: 'p', text: 'Third, verifiability. Every degree this university awards is entered in a register, and any employer or institution can check a certificate number against that register without needing an account or an introduction. Where a certificate has been withdrawn, the register says so plainly. We would rather report an uncomfortable fact than allow a document to pass as valid when it is not.' },
      { type: 'p', text: 'To students joining us: use the laboratories, ask your teachers difficult questions, and keep every receipt and document the university gives you. To parents: the fee schedule and the admission process are published on this site, and no payment should ever be made outside them.' },
      { type: 'note', audience: 'maintainer', text: 'Attribution: this message is published on behalf of the office of the Chairperson. Replace with the current signed message and the Chairperson’s name and photograph before launch — a message must not appear under a named individual without their approval.' },
    ],
  },
  {
    path: '/about/infrastructure/',
    title: 'Infrastructure',
    description:
      'Campus infrastructure at Jodhpur National University — laboratories, workshops, library, computing facilities and hostels.',
    intro: 'Teaching facilities, library, computing and student amenities.',
    crumbs: [about, { name: 'Infrastructure', path: '/about/infrastructure/' }],
    body: [
      { type: 'h2', text: 'Laboratories and workshops' },
      { type: 'p', text: 'Each faculty maintains the laboratories its curriculum requires. Practical sessions are timetabled alongside theory teaching, and laboratory records form part of the internal assessment for the relevant paper.' },
      { type: 'table', head: ['Faculty', 'Principal facilities'], rows: [['Engineering & Technology', 'Strength of materials, surveying, fluid mechanics, electrical machines, electronics, thermal engineering, workshop practice'], ['Computer Science & Applications', 'Programming laboratories, networking laboratory, database laboratory, project laboratory'], ['Pharmaceutical Sciences', 'Pharmaceutics, pharmaceutical chemistry, pharmacology, pharmacognosy, instrumentation'], ['Applied Sciences & Nursing', 'Physics, chemistry, biology laboratories; nursing skills and demonstration room'], ['Management', 'Computer laboratory with statistical and business analysis software'], ['Law', 'Moot court hall and legal reference collection'], ['Education', 'Psychology laboratory, teaching-aids and method rooms']] },
      { type: 'h2', text: 'Library' },
      { type: 'p', text: 'The central library holds textbook and reference collections for every programme, journals in the principal subject areas, and a reading room. A reference section holds previous years’ question papers, project reports and syllabus documents. Borrowing is by student identity card; reference material is for use within the library.' },
      { type: 'h2', text: 'Computing' },
      { type: 'p', text: 'Networked computing laboratories serve the computer science and computer application programmes and are also available to other faculties for timetabled sessions. Facilities include internet access, printing, and the software required for programming, design and statistical coursework.' },
      { type: 'h2', text: 'Student amenities' },
      { type: 'ul', items: ['Separate hostel accommodation for men and women, with mess facilities', 'Canteen serving the academic block', 'Sports ground for cricket, football and athletics, plus indoor games', 'Campus transport on designated routes within Jodhpur', 'First-aid room with access to a nearby hospital for emergencies'] },
      { type: 'h2', text: 'Accessibility' },
      { type: 'p', text: 'Ground-floor access is available to the administrative block, library and principal lecture theatres. Students who need specific arrangements for teaching or examinations should write to the registrar at the start of the session so that provision can be timetabled.' },
    ],
  },
  {
    path: '/about/academic-council/',
    title: 'Academic Council',
    description:
      'Composition and responsibilities of the Academic Council of Jodhpur National University.',
    intro: 'The body responsible for academic standards, curriculum and examination policy.',
    crumbs: [about, { name: 'Academic Council', path: '/about/academic-council/' }],
    body: [
      { type: 'p', text: 'The Academic Council is the university’s principal academic authority. It approves curricula, sets examination policy, and reviews academic performance across the faculties.' },
      { type: 'h2', text: 'Responsibilities' },
      { type: 'ul', items: ['Approve the syllabus and scheme of examination for every programme', 'Approve the academic calendar, including examination and result-declaration dates', 'Set policy on internal assessment, attendance requirements and re-evaluation', 'Consider proposals for new programmes and for changes to existing ones', 'Review examination results and the reports of moderation committees', 'Recommend the award of degrees to candidates who have qualified'] },
      { type: 'h2', text: 'Composition' },
      { type: 'table', head: ['Position', 'Role on the Council'], rows: [['Vice-Chancellor', 'Chairperson'], ['Deans of the eight faculties', 'Members'], ['Heads of teaching departments', 'Members'], ['Controller of Examinations', 'Member'], ['External academic experts', 'Nominated members'], ['Registrar', 'Member Secretary']] },
      { type: 'h2', text: 'Meetings' },
      { type: 'p', text: 'The Council ordinarily meets twice in each academic year, before the start of the odd semester and after the declaration of even-semester results. Decisions affecting students — curriculum changes, examination policy, calendar revisions — are notified through the notices page.' },
      { type: 'note', audience: 'maintainer', text: 'The current membership list, with names and designations, is to be supplied by the registrar. Do not publish individual names without confirmation.' },
    ],
  },
  {
    path: '/about/accreditation/',
    title: 'Accreditation & Approvals',
    description:
      'Recognition and statutory approval status of Jodhpur National University, and how to verify it independently.',
    intro: 'Our recognition position, and where to check it for yourself.',
    crumbs: [about, { name: 'Accreditation & Approvals', path: '/about/accreditation/' }],
    body: [
      { type: 'p', text: 'This page exists so that applicants and employers can establish the university’s statutory position from primary sources rather than take it on trust from a website. We think that is the right way round: no institution should be the only evidence for its own recognition.' },
      { type: 'h2', text: 'Verify independently — always' },
      { type: 'p', text: 'Before accepting an offer or paying any fee, confirm directly with the relevant statutory body that the institution is recognised and that your specific programme is approved for the session you are joining. Recognition can be institution-wide while a particular programme is not approved, and approvals change between sessions.' },
      { type: 'ul', items: ['University Grants Commission (ugc.gov.in) — lists recognised universities and publishes public notices about institutions', 'The professional council for your programme — AICTE for engineering, PCI for pharmacy, BCI for law, NCTE for teacher education, INC for nursing', 'The Government of Rajasthan department responsible for private universities', 'The Association of Indian Universities, for questions about degree equivalence'] },
      { type: 'h2', text: 'What to ask for, in writing' },
      { type: 'ol', items: ['The current recognition status of the university, with the date it was granted or last renewed.', 'The approval status of your specific programme for your intake year, from the relevant professional council.', 'The sanctioned intake for that programme, and confirmation you are admitted within it.', 'Confirmation of the fee payable for the full duration of the programme, on university letterhead.'] },
      { type: 'p', text: 'Keep every document you are given, with dates. If any of the above cannot be evidenced on request, treat that as a material fact and seek advice before proceeding.' },
      { type: 'h2', text: 'Certificate verification' },
      { type: 'p', text: 'Every degree the university records is checkable by number on the certificate verification page, without an account. Employers are encouraged to use it. Where a certificate has been withdrawn, the service reports it as revoked rather than staying silent.' },
      { type: 'note', text: 'No recognition claim, approval number or accreditation grade is displayed on this site until the registrar supplies current, dated documentary evidence. Populate site.recognition in content/site.ts from that evidence only, and record the date it was verified. Publishing an unevidenced approval claim is the single most damaging thing this site could do.' },
    ],
  },
  {
    path: '/about/achievers/',
    title: 'Achievers',
    description:
      'Student and alumni achievements at Jodhpur National University — academic, research, sporting and professional.',
    intro: 'Academic, research, sporting and professional achievement.',
    crumbs: [about, { name: 'Achievers', path: '/about/achievers/' }],
    body: [
      { type: 'p', text: 'The university records student achievement in four categories. Entries are added once the achievement is documented and the student has consented to publication.' },
      { type: 'h2', text: 'Categories recognised' },
      { type: 'table', head: ['Category', 'Basis of recognition'], rows: [['Academic distinction', 'Highest aggregate in a programme, or first division with distinction'], ['Research', 'Published paper, patent filing, or funded project participation'], ['Sport', 'Representation at inter-university, state or national level'], ['Professional', 'Selection in campus recruitment, competitive examination, or higher study admission']] },
      { type: 'h2', text: 'Merit awards' },
      { type: 'p', text: 'Students placed first in each programme at the end of an academic year are recognised at the annual function. The examination cell certifies the ranking from the declared results; rankings are not published before results are final.' },
      { type: 'h2', text: 'Adding an achievement' },
      { type: 'p', text: 'Students and alumni may submit an achievement for inclusion through the contact page, attaching documentary evidence. Submissions are verified by the department concerned before publication, and nothing is published without the individual’s written consent.' },
      { type: 'note', audience: 'maintainer', text: 'Individual names, photographs and specific achievements are to be supplied by the departments with written consent on file. Named individuals must not be published without it.' },
    ],
  },
  {
    path: '/about/community-programme/',
    title: 'Community Programme',
    description:
      'Community outreach and extension activities of Jodhpur National University in Jodhpur and surrounding districts.',
    intro: 'Extension and outreach work by departments and student bodies.',
    crumbs: [about, { name: 'Community Programme', path: '/about/community-programme/' }],
    body: [
      { type: 'p', text: 'Departments and student bodies undertake extension work in Jodhpur and the surrounding rural areas. Activity is planned at the start of each session so that it fits around teaching and examinations rather than displacing them.' },
      { type: 'h2', text: 'Regular activities' },
      { type: 'table', head: ['Activity', 'Led by', 'Frequency'], rows: [['Health and hygiene awareness camps', 'Pharmaceutical Sciences and Nursing', 'Each semester'], ['Free legal aid and awareness clinic', 'Faculty of Law', 'Monthly'], ['Computer literacy sessions for school students', 'Computer Application', 'Each semester'], ['Water conservation and sanitation surveys', 'Civil Engineering', 'Annual'], ['Adult and remedial teaching support', 'Faculty of Education', 'Weekly during term'], ['Blood donation and health check-up drive', 'Student bodies', 'Twice yearly'], ['Tree plantation and campus environment drive', 'All faculties', 'Annual']] },
      { type: 'h2', text: 'Student participation' },
      { type: 'p', text: 'Participation is voluntary and recorded on the student’s activity record. Departments issue a certificate of participation at the end of the session. For programmes with a mandated field or internship component, extension work may be counted where the syllabus permits it.' },
      { type: 'h2', text: 'Working with the university' },
      { type: 'p', text: 'Schools, panchayats and voluntary organisations that would like to host or co-run an activity may write to the registrar through the contact page.' },
    ],
  },

  /* --------------------------------------------------------- admission --- */
  {
    path: '/admission/',
    title: 'Admission',
    description:
      'Admission to Jodhpur National University — process, eligibility, fee structure, syllabus and downloadable forms.',
    intro: 'Everything needed to apply, in one place.',
    crumbs: [admission],
    body: [
      { type: 'p', text: 'Admission information is grouped into the pages below. Read the eligibility conditions for your programme before applying.' },
      { type: 'ul', items: ['Admission process — steps, documents required and where to submit', 'Eligibility — programme-wise minimum qualifications', 'Fee structure — indicative fees and the payment schedule', 'Syllabus — curriculum and scheme of examination by programme', 'Download forms — application and related forms'] },
      { type: 'h2', text: 'Session dates' },
      { type: 'table', head: ['Stage', 'Indicative period'], rows: [['Applications open', 'May'], ['Last date for applications', 'July'], ['Document verification and admission', 'July to August'], ['Commencement of teaching', 'August'], ['Last date for admission with late fee', 'August']] },
      { type: 'p', text: 'Exact dates for each session are published on the notices page. Where a programme is filled before the closing date, admission to that programme closes early.' },
      { type: 'h2', text: 'Before you pay anything' },
      { type: 'p', text: 'Confirm the recognition status of the university and the approval status of your programme with the relevant statutory body first — the accreditation page explains how and what to ask for. Pay only into an account confirmed in writing by the administrative office, and obtain a dated official receipt for every payment.' },
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
      { type: 'ol', items: ['Check the eligibility conditions for your programme on the eligibility page or the relevant faculty page.', 'Obtain the application form from the downloads page or the administrative office.', 'Complete the form and attach self-attested copies of the documents listed below.', 'Submit the form at the administrative office and obtain a dated, stamped receipt.', 'Attend document verification with your original certificates.', 'On confirmation of admission, pay the first instalment of fees and collect the official receipt.', 'Collect your enrollment number and identity card from the office.'] },
      { type: 'h2', text: 'Documents required' },
      { type: 'ul', items: ['Class 10 marksheet and certificate', 'Class 12 marksheet and certificate', 'Degree marksheets and provisional or degree certificate, for postgraduate applicants', 'Transfer certificate from the institution last attended', 'Migration certificate, where applicable', 'Character certificate from the institution last attended', 'Category certificate, where applicable', 'Gap certificate or affidavit, where there is a break in study', 'Photograph identity proof (Aadhaar, passport or driving licence)', 'Six recent passport-size photographs'] },
      { type: 'h2', text: 'Document verification' },
      { type: 'p', text: 'Originals must be produced for verification. They are examined and returned the same day; the university does not retain original certificates. Admission is provisional until verification is complete, and is cancelled if a document is found to be incorrect or if an eligibility condition is not met.' },
      { type: 'h2', text: 'Withdrawal and refund' },
      { type: 'p', text: 'A student who withdraws must apply in writing to the registrar. Refunds are calculated by reference to the date the written application is received, not the date attendance stopped. Retain your receipts — a refund cannot be processed without them.' },
      { type: 'note', text: 'A note on payments: the university does not collect fees through individuals or through any account not confirmed in writing by the administrative office. Always obtain a dated, stamped official receipt. Report anyone offering admission, results or certificates in exchange for a payment outside this process to the registrar immediately.' },
    ],
  },
  {
    path: '/admission/eligibility/',
    title: 'Eligibility',
    description:
      'Programme-wise eligibility conditions for admission to Jodhpur National University — engineering, management, pharmacy, law, education and more.',
    intro: 'Minimum qualifications by programme.',
    crumbs: [admission, { name: 'Eligibility', path: '/admission/eligibility/' }],
    body: [
      { type: 'p', text: 'The conditions below are the minimum required to be considered. Meeting them does not by itself guarantee admission, since intake for each programme is limited.' },
      { type: 'h2', text: 'Undergraduate programmes' },
      { type: 'table', head: ['Programme', 'Qualification', 'Minimum'], rows: [['B.Tech (all branches)', '10+2 with Physics, Chemistry and Mathematics', '45% aggregate'], ['B.Pharm', '10+2 with Physics, Chemistry and Biology or Mathematics', '45% aggregate'], ['BBA', '10+2 in any stream', '45% aggregate'], ['BCA', '10+2 with Mathematics', '45% aggregate'], ['B.Sc', '10+2 in the science stream', '45% aggregate'], ['B.A / B.Com', '10+2 in any stream', 'Pass'], ['LL.B (three year)', 'Bachelor’s degree in any discipline', '45% aggregate'], ['B.Ed', 'Bachelor’s degree', '50% aggregate']] },
      { type: 'h2', text: 'Postgraduate programmes' },
      { type: 'table', head: ['Programme', 'Qualification', 'Minimum'], rows: [['M.Tech', 'B.Tech or equivalent in a relevant discipline', '50% aggregate'], ['MBA', 'Bachelor’s degree in any discipline', '50% aggregate'], ['MCA', 'Bachelor’s degree with Mathematics at 10+2 or degree level', '50% aggregate'], ['M.Pharm', 'B.Pharm from a recognised institution', '55% aggregate'], ['M.Sc', 'B.Sc in a relevant subject', '50% aggregate'], ['M.A', 'Bachelor’s degree in a relevant subject', '45% aggregate'], ['LL.M', 'LL.B or equivalent', '50% aggregate'], ['M.Ed', 'B.Ed from a recognised institution', '50% aggregate']] },
      { type: 'h2', text: 'Relaxation' },
      { type: 'p', text: 'Relaxation in the minimum percentage is available to candidates of reserved categories in accordance with Government of Rajasthan norms. A valid category certificate must be produced at document verification.' },
      { type: 'h2', text: 'Doctoral programmes' },
      { type: 'p', text: 'Admission to Ph.D. requires a master’s degree in a relevant subject with at least 55% aggregate, and is subject to an entrance test and interview, to the availability of a supervisor in the subject area, and to the university being permitted to enrol research scholars for that session.' },
    ],
  },
  {
    path: '/admission/fee-structure/',
    title: 'Fee Structure',
    description:
      'Indicative programme-wise fee structure and payment schedule for Jodhpur National University.',
    intro: 'Fees by programme, and how they are paid.',
    crumbs: [admission, { name: 'Fee Structure', path: '/admission/fee-structure/' }],
    body: [
      { type: 'p', text: 'Fees are published here as an HTML table rather than only as a PDF, so they are readable on a phone, usable by a screen reader, and findable in a search. The PDF on the downloads page carries the same figures.' },
      { type: 'note', text: 'Figures below are INDICATIVE, for an academic project build. Before launch, replace this table with the schedule approved by the university for the current session, and add the approval date. Publishing a stale or invented fee is a consumer-protection problem, not a cosmetic one.' },
      { type: 'h2', text: 'Annual tuition fee — undergraduate' },
      { type: 'table', head: ['Programme', 'Duration', 'Tuition per year (₹)', 'One-time admission fee (₹)'], rows: [['B.Tech', '4 years', '68,000', '10,000'], ['B.Pharm', '4 years', '72,000', '10,000'], ['BBA', '3 years', '38,000', '7,500'], ['BCA', '3 years', '36,000', '7,500'], ['B.Sc', '3 years', '32,000', '7,500'], ['B.Com', '3 years', '24,000', '6,000'], ['B.A', '3 years', '22,000', '6,000'], ['LL.B', '3 years', '42,000', '7,500'], ['B.Ed', '2 years', '46,000', '7,500']] },
      { type: 'h2', text: 'Annual tuition fee — postgraduate' },
      { type: 'table', head: ['Programme', 'Duration', 'Tuition per year (₹)', 'One-time admission fee (₹)'], rows: [['M.Tech', '2 years', '74,000', '10,000'], ['MBA', '2 years', '82,000', '10,000'], ['MCA', '2 years', '62,000', '10,000'], ['M.Pharm', '2 years', '88,000', '10,000'], ['M.Sc', '2 years', '44,000', '7,500'], ['M.A', '2 years', '26,000', '6,000'], ['LL.M', '2 years', '48,000', '7,500'], ['M.Ed', '2 years', '52,000', '7,500']] },
      { type: 'h2', text: 'Other charges' },
      { type: 'table', head: ['Item', 'Amount (₹)', 'When payable'], rows: [['Examination fee, per semester', '2,500', 'Each semester'], ['Library and laboratory caution money (refundable)', '5,000', 'At admission'], ['Student activity and identity card', '1,500', 'Annual'], ['Hostel accommodation, per year', '48,000', 'Annual, in two instalments'], ['Mess charges, per year', '36,000', 'Annual, in two instalments'], ['Campus transport, per year', '14,000', 'Annual, optional'], ['Duplicate marksheet', '500', 'On request'], ['Migration certificate', '1,000', 'On request'], ['Re-evaluation, per paper', '1,200', 'On application']] },
      { type: 'h2', text: 'Payment schedule' },
      { type: 'ol', items: ['First instalment — 50% of annual tuition plus all one-time charges, payable at admission.', 'Second instalment — remaining 50% of annual tuition, payable before the start of the even semester.', 'Examination fees are payable with the examination form each semester.'] },
      { type: 'h2', text: 'How to pay' },
      { type: 'ul', items: ['Pay only into a bank account confirmed in writing by the administrative office.', 'Obtain an official, dated, stamped receipt for every payment.', 'Retain all receipts until the programme is completed — refunds and duplicate documents cannot be processed without them.', 'Caution money is refundable on completion, less any outstanding dues, on written application to the registrar.'] },
      { type: 'p', text: 'Fees once paid are not transferable to another student. Refund on withdrawal is calculated from the date the written application reaches the registrar.' },
    ],
  },
  {
    path: '/admission/syllabus/',
    title: 'Syllabus',
    description:
      'Syllabus, curriculum and scheme of examination by programme at Jodhpur National University.',
    intro: 'Curriculum and scheme of examination, by programme.',
    crumbs: [admission, { name: 'Syllabus', path: '/admission/syllabus/' }],
    body: [
      { type: 'p', text: 'Each programme has a syllabus approved by the Academic Council, published per session. A student is examined against the syllabus in force at their year of admission.' },
      { type: 'h2', text: 'Scheme of examination' },
      { type: 'p', text: 'Every theory paper carries 100 marks, divided between continuous internal assessment and the end-semester examination. Practical papers carry 50 marks, assessed on laboratory work, a record book and a viva voce.' },
      { type: 'table', head: ['Component', 'Theory paper', 'Practical paper'], rows: [['Continuous internal assessment', '30 marks', '20 marks'], ['End-semester examination', '70 marks', '30 marks'], ['Total', '100 marks', '50 marks'], ['Minimum to pass, per paper', '40%', '40%'], ['Minimum aggregate to pass a semester', '45%', '45%']] },
      { type: 'h2', text: 'Internal assessment' },
      { type: 'p', text: 'Internal assessment for a theory paper is made up of two sessional tests, assignment work and attendance. Marks are displayed by the department before submission to the examination cell so that a student can query an error before results are compiled.' },
      { type: 'h2', text: 'Grading' },
      { type: 'table', head: ['Marks (%)', 'Grade', 'Grade point'], rows: [['90 and above', 'A+', '10'], ['80 – 89', 'A', '9'], ['70 – 79', 'B+', '8'], ['60 – 69', 'B', '7'], ['50 – 59', 'C', '6'], ['40 – 49', 'D', '5'], ['Below 40', 'F', '0']] },
      { type: 'p', text: 'SGPA is the credit-weighted average of grade points for a semester; CGPA is the credit-weighted average across all semesters completed. A student carrying a failed paper is shown as ATKT and may carry it forward, subject to the limit set in the programme regulations.' },
      { type: 'note', audience: 'maintainer', text: 'Upload the current syllabus PDFs per programme to /public/documents/ and list them here with their session and revision date. Where practical, publish the scheme of examination as an HTML table too — PDF-only content is largely invisible to search.' },
    ],
  },
  {
    path: '/admission/download-forms/',
    title: 'Download Forms',
    description:
      'Downloadable application, examination and administrative forms for Jodhpur National University.',
    intro: 'Application, examination and administrative forms.',
    crumbs: [admission, { name: 'Download Forms', path: '/admission/download-forms/' }],
    body: [
      { type: 'p', text: 'Forms are provided as PDF documents, each carrying a revision date so that a superseded form is not submitted by mistake. Only the current version of each form is listed.' },
      { type: 'h2', text: 'Admission' },
      { type: 'table', head: ['Form', 'Who submits it', 'Where'], rows: [['Application for admission', 'New applicants', 'Administrative office'], ['Category certificate declaration', 'Reserved-category applicants', 'With the application'], ['Gap declaration', 'Applicants with a break in study', 'With the application'], ['Hostel accommodation application', 'Students requiring hostel', 'Administrative office']] },
      { type: 'h2', text: 'Examination' },
      { type: 'table', head: ['Form', 'Who submits it', 'Where'], rows: [['Examination form, per semester', 'All enrolled students', 'Examination cell'], ['Back-paper / ATKT examination form', 'Students carrying a failed paper', 'Examination cell'], ['Application for re-evaluation', 'Students disputing a result', 'Examination cell, within the notified period'], ['Application for a duplicate marksheet', 'Students and alumni', 'Examination cell']] },
      { type: 'h2', text: 'Administrative' },
      { type: 'table', head: ['Form', 'Who submits it', 'Where'], rows: [['Application for a migration certificate', 'Students leaving or completing', 'Registrar'], ['Application for a bonafide certificate', 'Enrolled students', 'Registrar'], ['Application for withdrawal and fee refund', 'Students withdrawing', 'Registrar'], ['Change of address or contact details', 'Enrolled students', 'Registrar']] },
      { type: 'h2', text: 'Submitting a form' },
      { type: 'ol', items: ['Print the form single-sided and complete it in block letters in black ink.', 'Attach self-attested copies of the documents the form lists.', 'Submit at the office named above and obtain a dated, stamped receipt.', 'Keep the receipt — it is your only proof of submission.'] },
      { type: 'note', audience: 'maintainer', text: 'Place the current PDFs in /public/documents/ and link them from the tables above, each with a revision date. Remove superseded versions rather than leaving them alongside current ones.' },
    ],
  },

  /* -------------------------------------------------------- academics --- */
  {
    path: '/faculty/',
    title: 'Faculties & Programmes',
    description:
      'Eight faculties at Jodhpur National University — engineering and technology, management, pharmaceutical sciences, computer application, applied sciences and nursing, law, education, and arts and commerce.',
    intro: 'Programmes by faculty, with duration, award and eligibility.',
    crumbs: [{ name: 'Faculty', path: '/faculty/' }],
    body: [
      { type: 'p', text: 'Select a faculty to see its programmes with duration, award and eligibility conditions. Each faculty page also lists the laboratories and facilities supporting its teaching.' },
    ],
  },
  {
    path: '/research/',
    title: 'Research',
    description:
      'Research activity, doctoral supervision and publications at Jodhpur National University.',
    intro: 'Doctoral programmes, research areas and publication.',
    crumbs: [{ name: 'Research', path: '/research/' }],
    body: [
      { type: 'p', text: 'Research at the university is conducted within the faculties, principally through doctoral supervision and departmental project work. Areas of active interest reflect the region the university serves — arid-zone water management, solar energy, and pharmaceutical formulation among them.' },
      { type: 'h2', text: 'Areas of interest by faculty' },
      { type: 'table', head: ['Faculty', 'Areas of interest'], rows: [['Engineering & Technology', 'Water resource and arid-zone civil engineering, solar thermal systems, structural materials, machine learning applications'], ['Pharmaceutical Sciences', 'Formulation development, phytochemistry of desert flora, pharmacological screening'], ['Computer Application', 'Data mining, network security, software engineering practice'], ['Management', 'Rural marketing, small enterprise finance, organisational behaviour'], ['Applied Sciences', 'Materials chemistry, applied mathematics, environmental biology'], ['Law', 'Constitutional law, environmental law, legal aid and access to justice'], ['Education', 'Teacher preparation, educational measurement, inclusive education'], ['Arts & Commerce', 'Regional history, Rajasthani literature, accounting practice']] },
      { type: 'h2', text: 'Doctoral programme' },
      { type: 'p', text: 'Admission to Ph.D. requires a master’s degree in a relevant subject with at least 55% aggregate, and is subject to an entrance test, an interview, and the availability of a recognised supervisor in the subject area.' },
      { type: 'ol', items: ['Entrance test and interview before the Departmental Research Committee.', 'Allocation of a supervisor and registration of the research topic.', 'Coursework in research methodology, completed in the first two semesters.', 'Presentation of a research proposal for approval.', 'Progress presentations at six-monthly intervals.', 'Submission of the thesis, followed by evaluation and a viva voce.'] },
      { type: 'h2', text: 'Publication' },
      { type: 'p', text: 'Doctoral candidates are expected to publish in peer-reviewed journals before thesis submission. Departments maintain a record of staff and scholar publications, available on request from the faculty office.' },
      { type: 'note', text: 'Doctoral admission is subject to the university being permitted to enrol research scholars for the session concerned. Confirm the current position with the registrar and with the UGC before applying. The list of recognised supervisors and the current publication record are to be supplied by the faculty offices.' },
    ],
  },
  {
    path: '/placement/',
    title: 'Placement',
    description:
      'Placement support, training and recruiter engagement at Jodhpur National University.',
    intro: 'How the placement cell prepares and supports students.',
    crumbs: [{ name: 'Placement', path: '/placement/' }],
    body: [
      { type: 'p', text: 'The placement cell coordinates campus recruitment, pre-placement training and employer engagement. It works with departments from the penultimate year of each programme rather than only in the final semester.' },
      { type: 'h2', text: 'Pre-placement training' },
      { type: 'ul', items: ['Aptitude and quantitative reasoning practice', 'Technical interview preparation, run by the departments', 'Group discussion and personal interview practice with feedback', 'Written and spoken communication workshops', 'Curriculum vitae preparation and review', 'Mock interviews with external panellists where available'] },
      { type: 'h2', text: 'How campus recruitment runs' },
      { type: 'ol', items: ['The cell invites employers and publishes each drive on the placement notices page.', 'Eligible students register for the drive by the stated deadline.', 'The employer conducts its own selection process, on campus or online.', 'Offers are communicated to students through the cell.', 'Students accept or decline in writing; the cell maintains the record.'] },
      { type: 'h2', text: 'Eligibility to participate' },
      { type: 'p', text: 'Students must be in the final year of their programme, have no outstanding dues, and meet the academic criteria the employer sets for its drive. A student who accepts an offer is ordinarily withdrawn from subsequent drives so that opportunities are shared.' },
      { type: 'h2', text: 'For employers' },
      { type: 'p', text: 'Employers wishing to recruit may write to the placement cell through the contact page with the roles, eligibility criteria, selection process and preferred dates. The cell will confirm available slots and coordinate arrangements on campus.' },
      { type: 'note', text: 'Publish only placement statistics that can be substantiated from the cell’s own records — number of students registered, number of offers, and the employers concerned, with the session stated. Unverifiable placement percentages and salary claims are a frequent source of consumer-protection complaints against private universities, and should not appear on this site at all.' },
    ],
  },

  /* ------------------------------------------------------ student zone --- */
  {
    path: '/student-zone/',
    title: 'Student Zone',
    description:
      'Student services at Jodhpur National University — notices, examination results, certificate verification, time tables, enrollment status and downloads.',
    intro: 'Notices, results, verification and downloads.',
    crumbs: [zone],
    body: [
      { type: 'p', text: 'Services for enrolled students and alumni are grouped here.' },
      { type: 'ul', items: ['Notices & circulars — examination, admission and general notices', 'Examination results — check a published result by roll number', 'Certificate verification — confirm a certificate against the university register', 'Time table — examination and class schedules', 'Enrollment status — enrollment confirmation and bonafide certificates', 'Placement notices — recruitment announcements', 'Downloads — forms, syllabi and documents'] },
      { type: 'h2', text: 'Who to contact' },
      { type: 'table', head: ['Matter', 'Office'], rows: [['Results, marksheets, re-evaluation, examination forms', 'Examination cell'], ['Enrollment, migration, bonafide and character certificates', 'Registrar'], ['Fees, receipts and refunds', 'Accounts, administrative office'], ['Admission enquiries', 'Administrative office'], ['Hostel and campus facilities', 'Hostel warden'], ['Placement and recruitment', 'Placement cell']] },
    ],
  },
  {
    path: '/student-zone/time-table/',
    title: 'Time Table',
    description:
      'Examination and class time tables for Jodhpur National University, published by the examination cell.',
    intro: 'Examination and class schedules.',
    crumbs: [zone, { name: 'Time Table', path: '/student-zone/time-table/' }],
    body: [
      { type: 'p', text: 'Time tables are published as HTML tables so that they are readable on a phone and usable by a screen reader. The examination cell also issues a signed PDF; where the two differ, the signed notice prevails.' },
      { type: 'h2', text: 'Examination schedule — odd semester' },
      { type: 'table', head: ['Date', 'Session', 'Programme / Semester', 'Paper'], rows: [['02 Dec', '10:00 – 13:00', 'B.Tech CSE, Sem V', 'Theory of Computation'], ['04 Dec', '10:00 – 13:00', 'B.Tech CSE, Sem V', 'Compiler Design'], ['06 Dec', '10:00 – 13:00', 'B.Tech CSE, Sem V', 'Computer Graphics'], ['08 Dec', '10:00 – 13:00', 'B.Tech CSE, Sem V', 'Web Technologies'], ['02 Dec', '14:00 – 17:00', 'MBA, Sem III', 'Strategic Management'], ['04 Dec', '14:00 – 17:00', 'MBA, Sem III', 'International Business'], ['06 Dec', '14:00 – 17:00', 'BCA, Sem III', 'Data Structures'], ['08 Dec', '14:00 – 17:00', 'BCA, Sem III', 'Operating Systems']] },
      { type: 'h2', text: 'Examination instructions' },
      { type: 'ol', items: ['Be seated fifteen minutes before the start of the paper.', 'Carry your admit card and student identity card to every paper. Entry is refused without them.', 'Only permitted materials may be taken into the hall. Mobile phones and smart watches are not permitted.', 'A candidate arriving more than thirty minutes late is not admitted.', 'No candidate may leave the hall within the first hour.', 'Write your roll number on the answer book only where indicated; do not write it elsewhere.'] },
      { type: 'h2', text: 'Class time table' },
      { type: 'p', text: 'Class time tables are issued by each department at the start of the semester and displayed on the departmental notice board. Any revision during the semester is notified by the department and on the notices page.' },
      { type: 'note', audience: 'maintainer', text: 'The table above is an example structure for the project build. Replace it with the schedule issued by the examination cell for the current session, and link the signed PDF beside it.' },
    ],
  },
  {
    path: '/student-zone/enrollment-status/',
    title: 'Enrollment Status',
    description:
      'Enrollment confirmation, bonafide certificates and migration certificates for students of Jodhpur National University.',
    intro: 'Confirming your enrollment, and the certificates issued from it.',
    crumbs: [zone, { name: 'Enrollment Status', path: '/student-zone/enrollment-status/' }],
    body: [
      { type: 'p', text: 'On admission, every student is allotted an enrollment number by the registrar. It appears on your identity card and on every marksheet and certificate the university issues, and it is the reference for all correspondence about your record.' },
      { type: 'h2', text: 'Understanding your enrollment number' },
      { type: 'p', text: 'Enrollment numbers take the form JNU/YYYY/PP/NNNN — the year of admission, a programme code, and a serial number. For example JNU/2022/BT/1187 identifies a B.Tech student admitted in 2022.' },
      { type: 'h2', text: 'Certificates issued against your enrollment' },
      { type: 'table', head: ['Certificate', 'Purpose', 'Ordinary processing time'], rows: [['Bonafide certificate', 'Confirms current enrollment, for banks, visas and scholarships', '3 working days'], ['Enrollment confirmation letter', 'Confirms enrollment number and programme', '3 working days'], ['Character certificate', 'Issued on completion or withdrawal', '5 working days'], ['Migration certificate', 'Required to join another university', '7 working days'], ['Transcript', 'Consolidated marks across all semesters', '10 working days']] },
      { type: 'h2', text: 'How to apply' },
      { type: 'ol', items: ['Download the relevant form from the downloads page, or collect it from the registrar’s office.', 'Complete it and attach a copy of your identity card and latest marksheet.', 'Submit it at the registrar’s office and obtain a dated receipt.', 'Collect the certificate against that receipt on the date given.'] },
      { type: 'h2', text: 'If your record is wrong' },
      { type: 'p', text: 'Errors in the spelling of a name, a date of birth or a parent’s name should be reported to the registrar in writing as early as possible, with documentary evidence. Correcting a record after a degree certificate has been issued requires a fresh certificate and takes considerably longer, so check your details on your first marksheet.' },
      { type: 'note', text: 'Enrollment data is personal data. If this page becomes a lookup tool, it must follow the results pattern — noindex, and access controlled server-side rather than by an unlisted URL.' },
    ],
  },
  {
    path: '/student-zone/placement-notices/',
    title: 'Placement Notices',
    description:
      'Campus recruitment drives, pre-placement training schedules and placement notices at Jodhpur National University.',
    intro: 'Recruitment drives and training schedules.',
    crumbs: [zone, { name: 'Placement Notices', path: '/student-zone/placement-notices/' }],
    body: [
      { type: 'p', text: 'Recruitment drives, pre-placement training schedules and registration deadlines are posted here and on the placement cell notice board. Check both — a drive is sometimes announced at short notice.' },
      { type: 'h2', text: 'Registering for a drive' },
      { type: 'ol', items: ['Read the eligibility criteria on the notice, which are set by the employer and not by the university.', 'Register with the placement cell before the stated deadline. Late registrations are not accepted, because the shortlist goes to the employer.', 'Submit your curriculum vitae in the format the notice specifies.', 'Attend the pre-placement briefing.', 'Report for the selection process with your identity card and the documents listed.'] },
      { type: 'h2', text: 'What students should know' },
      { type: 'ul', items: ['You must have no outstanding dues to participate in a drive.', 'Accepting an offer ordinarily withdraws you from later drives, so that opportunities are shared across the cohort.', 'Withdrawing after accepting an offer affects the university’s relationship with that employer and future students’ access to it.', 'Offer terms are between you and the employer; read them before signing.', 'The university does not charge any fee for participation in placement activity.'] },
      { type: 'h2', text: 'A caution' },
      { type: 'p', text: 'The placement cell never asks for a payment in return for an interview, a shortlist or an offer. Any approach of that kind, whether it claims to come from the university or from an employer, should be reported to the registrar. Genuine drives are always announced through this page or the cell’s notice board.' },
    ],
  },
  {
    path: '/student-zone/downloads/',
    title: 'Downloads',
    description:
      'Forms, syllabi, time tables and documents available for download from Jodhpur National University.',
    intro: 'Forms, syllabi and documents.',
    crumbs: [zone, { name: 'Downloads', path: '/student-zone/downloads/' }],
    body: [
      { type: 'p', text: 'Documents are listed with a revision date so that the current version is unambiguous. Only current versions are published; superseded documents are removed rather than left alongside them.' },
      { type: 'h2', text: 'Categories' },
      { type: 'table', head: ['Category', 'Contents', 'Issued by'], rows: [['Admission forms', 'Application form, category and gap declarations, hostel application', 'Administrative office'], ['Examination forms', 'Semester examination form, back-paper form, re-evaluation application, duplicate marksheet application', 'Examination cell'], ['Administrative forms', 'Bonafide, migration, withdrawal and refund, change of details', 'Registrar'], ['Syllabus', 'Programme-wise syllabus and scheme of examination, by session', 'Academic Council'], ['Time tables', 'Examination schedules and class time tables', 'Examination cell'], ['Fee schedule', 'Approved fee structure for the current session', 'Accounts']] },
      { type: 'h2', text: 'Before you submit anything' },
      { type: 'ul', items: ['Check the revision date on the form against the one listed here — an out-of-date form will be returned.', 'Print single-sided and complete in block letters in black ink.', 'Attach only self-attested copies; do not attach original certificates.', 'Obtain a dated, stamped receipt for every submission.'] },
      { type: 'note', audience: 'maintainer', text: 'Place the current PDFs in /public/documents/ and link them from the table above with a revision date each. Where a document is a scanned image, also publish its content as HTML — a scanned PDF is unreadable to a screen reader and close to invisible to search.' },
    ],
  },

  /* ------------------------------------------------------------ other --- */
  {
    path: '/photo-tour/',
    title: 'Photo Tour',
    description:
      'Photographs of the Jodhpur National University campus — academic blocks, laboratories, library, hostels and sports facilities.',
    intro: 'The campus, building by building.',
    crumbs: [{ name: 'Photo Tour', path: '/photo-tour/' }],
    body: [
      { type: 'p', text: 'The campus is on Jhanwar Road at Boranada, on the outskirts of Jodhpur. The tour below follows the route a visitor takes from the main gate.' },
      { type: 'h2', text: 'What the tour covers' },
      { type: 'table', head: ['Location', 'What to see'], rows: [['Main gate and approach', 'Entrance, security post and visitor parking'], ['Administrative block', 'Registrar’s office, accounts, admission counter'], ['Academic block', 'Lecture theatres, departmental offices, seminar rooms'], ['Engineering laboratories', 'Surveying, strength of materials, electrical machines, workshop'], ['Pharmacy laboratories', 'Pharmaceutics, chemistry and pharmacology laboratories'], ['Computing centre', 'Networked laboratories and project room'], ['Central library', 'Reading room, stacks and reference section'], ['Hostels', 'Separate blocks for men and women, and the mess'], ['Sports ground', 'Cricket and football ground, indoor games room'], ['Canteen and open areas', 'Student common spaces']] },
      { type: 'h2', text: 'Visiting in person' },
      { type: 'p', text: 'Prospective students and parents are welcome to visit the campus on working days between 10:00 and 16:00. A visit is worth making before you accept an offer anywhere: ask to see the laboratories for your programme, ask how many students share each workstation, and ask to meet a current student in the department. Arrange a visit through the contact page.' },
      { type: 'note', audience: 'maintainer', text: 'Add campus photographs to /public/images/gallery/ as AVIF or WebP, each under about 150 KB, with descriptive alt text naming what is shown. The previous site served 2013-era JPEGs of up to 1.09 MB each, which was its single worst performance problem.' },
    ],
  },
  {
    path: '/career/',
    title: 'Careers',
    description:
      'Teaching and non-teaching vacancies at Jodhpur National University, with the application procedure.',
    intro: 'Working at the university.',
    crumbs: [{ name: 'Career', path: '/career/' }],
    body: [
      { type: 'p', text: 'Vacancies for teaching and non-teaching positions are advertised here with the qualifications required, the application procedure and the closing date. Closed vacancies are removed rather than left to accumulate.' },
      { type: 'h2', text: 'Teaching positions' },
      { type: 'table', head: ['Position', 'Minimum qualification'], rows: [['Assistant Professor', 'Master’s degree with at least 55% in the relevant subject, and NET/SET or Ph.D. as applicable'], ['Associate Professor', 'Ph.D. in the relevant subject with the required years of teaching or research experience'], ['Professor', 'Ph.D. with a substantial record of teaching, research and publication'], ['Laboratory Instructor', 'Bachelor’s degree in the relevant discipline, or diploma with experience']] },
      { type: 'h2', text: 'Non-teaching positions' },
      { type: 'p', text: 'Administrative, library, laboratory, accounts and technical support posts are advertised as they arise, with the qualifications and experience stated in the advertisement.' },
      { type: 'h2', text: 'How to apply' },
      { type: 'ol', items: ['Read the advertisement for the specific post, including the qualifications and closing date.', 'Send a curriculum vitae with copies of degree certificates, experience certificates and a list of publications where relevant.', 'Address the application to the Registrar, marking the post applied for on the envelope or in the subject line.', 'Shortlisted candidates are called for an interview; travel is at the candidate’s own expense unless the advertisement states otherwise.'] },
      { type: 'h2', text: 'A note on recruitment practice' },
      { type: 'p', text: 'The university does not charge any fee at any stage of recruitment, and no payment should be made to any individual in connection with an application or appointment. All appointments are made in writing by the registrar. Any approach asking for money in exchange for a position should be reported to the registrar.' },
    ],
  },
  {
    path: '/privacy/',
    title: 'Privacy Notice',
    description:
      'How Jodhpur National University handles personal data on this website, including examination results, certificate records and enquiries.',
    intro: 'What data this site handles, and on what basis.',
    crumbs: [{ name: 'Privacy', path: '/privacy/' }],
    body: [
      { type: 'p', text: 'This notice describes the personal data handled through this website. Under the Digital Personal Data Protection Act 2023, the university is the data fiduciary for that data.' },
      { type: 'h2', text: 'Examination results' },
      { type: 'p', text: 'Results are stored in a database with access rules that restrict what an unauthenticated visitor can read. A result becomes visible only after the examination cell publishes it, and is returned only in response to an exact roll-number query — the service does not list students or allow browsing. Result pages carry a noindex directive and are excluded from the sitemap, so they do not appear in search engines.' },
      { type: 'h2', text: 'Certificate register' },
      { type: 'p', text: 'The register records the certificate number, student name, programme, year of award, enrollment number, division and status. A verification query returns only those fields. Verification is deliberately open to third parties, because confirming a credential on request is the purpose of the register and is in the interest of the graduate.' },
      { type: 'h2', text: 'Enquiries' },
      { type: 'p', text: 'Contact form submissions are stored and forwarded to the relevant office. They are retained only as long as needed to answer the enquiry and are not used for any other purpose.' },
      { type: 'h2', text: 'What this site does not do' },
      { type: 'ul', items: ['No advertising or third-party tracking scripts are loaded.', 'No cookies are set for analytics or profiling.', 'Fonts are served from this site rather than a third party, so no font request discloses your visit elsewhere.', 'No personal data is sold or shared with third parties for their own purposes.'] },
      { type: 'h2', text: 'Your rights' },
      { type: 'p', text: 'You may ask what personal data the university holds about you, ask for an inaccuracy to be corrected, and ask for data to be erased where the university is not required to retain it. Academic records are retained permanently, since the university must be able to verify a degree it has awarded for the lifetime of the holder.' },
      { type: 'h2', text: 'Contact' },
      { type: 'p', text: 'Write to the registrar at the administrative office address on the contact page, marking your letter "Data protection". Requests are ordinarily answered within thirty days.' },
      { type: 'note', audience: 'maintainer', text: 'Have this notice reviewed by the university’s legal adviser before launch, and add the named grievance officer and their contact details, which the DPDP Act requires.' },
    ],
  },
]

export function pageByPath(path: string): ContentPage | undefined {
  return contentPages.find((p) => p.path === path)
}
