/**
 * Campus photographs: the homepage carousel and the Photo Tour gallery.
 *
 * Single source of truth for BOTH the pages and the image pipeline:
 * scripts/optimise-images.ts reads this file to know which source file
 * becomes which optimised output. To add or replace a photograph, edit the
 * entry here, drop the original in the source folder, and run
 *   npm run images -- "C:/path/to/source/folder"
 *
 * Alt text describes what is actually in the picture, for screen-reader users
 * and for image search. It does not name individuals — the university has not
 * confirmed who appears in these photographs, and a wrong name in alt text is
 * a published claim about a real person.
 */

export type GalleryCategory = 'campus' | 'academics' | 'student-life' | 'events' | 'outreach'

export type GalleryPhoto = {
  /** Output filename stem; descriptive, because filenames are an image-search signal. */
  slug: string
  /** Original file, relative to the source folder given to the image script. */
  source: string
  alt: string
  caption: string
  category: GalleryCategory
}

export const galleryCategories: { id: GalleryCategory; title: string; blurb: string }[] = [
  {
    id: 'campus',
    title: 'Campus',
    blurb: 'The Boranada campus on Jhanwar Road — academic blocks, lawns and the main entrance.',
  },
  {
    id: 'academics',
    title: 'Laboratories & Workshops',
    blurb: 'Computing, electronics, pharmacy and engineering laboratories in use.',
  },
  {
    id: 'student-life',
    title: 'Student Life',
    blurb: 'Students on campus, in class and between classes.',
  },
  {
    id: 'events',
    title: 'Convocation & Events',
    blurb: 'Convocations, guest lectures, cultural programmes and visitors.',
  },
  {
    id: 'outreach',
    title: 'Community Outreach',
    blurb: 'Health camps and outreach work in the surrounding villages.',
  },
]

export const galleryPhotos: GalleryPhoto[] = [
  // ---- campus
  { slug: 'campus-aerial-view-lawns', source: 'photo_tour/jnu_photo_tour_1.jpg', category: 'campus', alt: 'Aerial view of the Jodhpur National University campus with lawns and tree plantations', caption: 'The campus from above, with its lawns and plantations' },
  { slug: 'campus-buildings-central-lawn', source: 'photo_tour/jnu_photo_tour_2.jpg', category: 'campus', alt: 'Academic buildings around the central lawn at Jodhpur National University', caption: 'Academic blocks around the central lawn' },
  { slug: 'main-entrance-gate', source: 'photo_tour/jnu_photo_tour_3.jpg', category: 'campus', alt: 'Main entrance gate of Jodhpur National University with the university name in Hindi and English', caption: 'The main entrance' },
  { slug: 'academic-block-college-bus', source: 'photo_tour/jnu_photo_tour_4.jpg', category: 'campus', alt: 'Academic block with a university bus parked in front', caption: 'Academic block and campus transport' },
  { slug: 'academic-building-lawn', source: 'photo_tour/jnu_photo_tour_5.jpg', category: 'campus', alt: 'Academic building beside a lawn and a tree under a clear sky', caption: 'An academic building across the lawn' },
  { slug: 'campus-building-flag-lawn', source: 'photo_tour/jnu_photo_tour_17.jpg', category: 'campus', alt: 'Campus building with the national flag, and a cultural programme on the lawn', caption: 'The lawn during a cultural programme' },

  // ---- academics
  { slug: 'computer-laboratory', source: 'photo_tour/jnu_photo_tour_6.jpg', category: 'academics', alt: 'Students working at computers in a computing laboratory', caption: 'Computing laboratory' },
  { slug: 'electronics-lab-oscilloscope', source: 'photo_tour/jnu_photo_tour_9.jpg', category: 'academics', alt: 'Students using an oscilloscope in an electronics laboratory', caption: 'Electronics laboratory' },
  { slug: 'student-built-all-terrain-vehicle', source: 'photo_tour/jnu_photo_tour_10.jpg', category: 'academics', alt: 'Student-built all-terrain vehicle in the engineering workshop', caption: 'A student-built all-terrain vehicle in the workshop' },
  { slug: 'engineering-workshop-vehicle-chassis', source: 'photo_tour/jnu_photo_tour_11.jpg', category: 'academics', alt: 'Students and faculty inspecting a vehicle chassis in the engineering workshop', caption: 'Engineering workshop' },
  { slug: 'pharmacy-lab-instrument-analysis', source: 'photo_tour/jnu_photo_tour_22.jpg', category: 'academics', alt: 'Student operating an analytical instrument in a pharmacy laboratory', caption: 'Pharmaceutical analysis laboratory' },
  { slug: 'pharmaceutics-lab-tablet-machine', source: 'photo_tour/jnu_photo_tour_23.jpg', category: 'academics', alt: 'Student operating a tablet compression machine in the pharmaceutics laboratory', caption: 'Pharmaceutics laboratory' },

  // ---- student life
  { slug: 'student-with-laptop-on-lawn', source: 'photo_tour/jnu_photo_tour_7.jpg', category: 'student-life', alt: 'Student working on a laptop on the campus lawn', caption: 'Between classes' },
  { slug: 'engineering-students-welcome-event', source: 'photo_tour/jnu_photo_tour_8.jpg', category: 'student-life', alt: 'Engineering students together at a faculty welcome event', caption: 'Engineering students at a welcome event' },
  { slug: 'students-studying-together', source: 'photo_tour/jnu_photo_tour_18.jpg', category: 'student-life', alt: 'Two students studying together at a laptop', caption: 'Studying together' },
  { slug: 'students-in-discussion', source: 'photo_tour/jnu_photo_tour_19.jpg', category: 'student-life', alt: 'Students in formal dress in discussion', caption: 'Students in discussion' },
  { slug: 'students-in-blazers', source: 'photo_tour/jnu_photo_tour_20.jpg', category: 'student-life', alt: 'Group of students in university blazers holding books', caption: 'Students in university blazers' },
  { slug: 'students-with-textbooks', source: 'photo_tour/jnu_photo_tour_21.jpg', category: 'student-life', alt: 'Group of students holding textbooks', caption: 'A class group with their textbooks' },
  { slug: 'student-gathering-campus-event', source: 'photo_tour/jnu_photo_tour_25.jpg', category: 'student-life', alt: 'Large gathering of students at a campus event', caption: 'Students at a campus event' },

  // ---- events
  { slug: 'first-convocation-2012', source: 'photo_tour/jnu_photo_tour_12.jpg', category: 'events', alt: 'Dignitaries in academic robes on stage at the first convocation in 2012', caption: 'The first convocation, 2012' },
  { slug: 'award-presentation-on-stage', source: 'photo_tour/jnu_photo_tour_13.jpg', category: 'events', alt: 'Award presentation on stage at a university event', caption: 'An award presentation' },
  { slug: 'memento-presentation-conference', source: 'photo_tour/jnu_photo_tour_14.jpg', category: 'events', alt: 'Presentation of a memento at a conference', caption: 'At a conference' },
  { slug: 'visitors-with-faculty-on-campus', source: 'photo_tour/jnu_photo_tour_15.jpg', category: 'events', alt: 'Visitors meeting faculty on the campus lawn', caption: 'Visitors on campus' },
  { slug: 'audience-along-campus-walkway', source: 'photo_tour/jnu_photo_tour_16.jpg', category: 'events', alt: 'Audience seated along a campus walkway during an event', caption: 'An open-air programme' },
  { slug: 'industry-guest-lecture', source: 'photo_tour/jnu_photo_tour_24.jpg', category: 'events', alt: 'Industry guest speaker at a panel session in the university', caption: 'An industry interaction session' },

  // ---- outreach
  { slug: 'rural-health-camp', source: 'photo_tour/jnu_photo_tour_26.jpg', category: 'outreach', alt: 'Health camp for village residents run as community outreach', caption: 'A rural health camp' },
  { slug: 'mobile-dental-van', source: 'photo_tour/jnu_photo_tour_27.jpg', category: 'outreach', alt: 'Mobile dental van with staff, used for dental outreach camps', caption: 'The mobile dental van' },
]

/* ---------------------------------------------------------------- carousel --- */

export type Slide = {
  slug: string
  source: string
  alt: string
  /** Homepage slides only — a slide carrying a claim can be held back. */
  enabled: boolean
  /** Why a slide is disabled, for whoever reads this file next. */
  heldBack?: string
  /**
   * Keep only the top N pixel rows of the original. Used to remove a part of
   * the artwork the site cannot publish (see distance-education below).
   */
  keepTopRows?: number
  /**
   * Artwork with text in it rather than a photograph. Shown whole (contain,
   * never cropped) on this background colour, and the hero caption steps
   * aside while it is on screen so it does not cover the banner's own words.
   */
  banner?: { background: string }
}

/** Widths every slide is encoded at. The browser picks via srcset. */
export const SLIDE_WIDTHS = [640, 1024, 1600] as const

export const slides: Slide[] = [
  { slug: 'campus-aerial', source: 'header_carousel_1.jpg', enabled: true, alt: 'Aerial view of the Jodhpur National University campus at Boranada, Jodhpur' },
  { slug: 'engineering-students', source: 'header_carousel_4.jpg', enabled: true, alt: 'Students outside the Faculty of Engineering and Technology building' },
  { slug: 'second-convocation', source: 'header_carousel_3.jpg', enabled: true, alt: 'An honorary degree being conferred at the university’s second convocation' },
  {
    slug: 'distance-education',
    source: 'header_carousel_2.jpg',
    enabled: true,
    alt: 'Jodhpur National University Distance Education Program — B.Com, BBA, BCA and MBA',
    // The original banner ends in an orange strip reading "Courses Recognised
    // by UGC-DEB". The site publishes no recognition claim without current,
    // dated evidence from the registrar (see site.recognition), and at the
    // time of writing only third-party listing sites asserted it. The strip
    // starts at row 603 of the 1600x658 original (measured: rows 0-602 are the
    // yellow ground, 603 onward the orange band), so the top 603 rows are
    // kept. Once the UGC-DEB approval letter for the current session is on
    // file, delete keepTopRows to restore the full banner.
    keepTopRows: 603,
    banner: { background: '#fbca2d' },
  },
]

export const enabledSlides = slides.filter((s) => s.enabled)
