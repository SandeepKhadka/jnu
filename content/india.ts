/**
 * States and union territories, for the admission form's address block.
 *
 * The list is validated server-side as well as rendered client-side, so a
 * crafted POST cannot store an arbitrary string in the state column.
 *
 * District is deliberately a free-text field rather than a second select.
 * India has over 780 districts and the list changes as states reorganise —
 * Rajasthan alone redrew its districts in 2023. A stale dropdown would block
 * a real applicant from entering their real address, which is a worse failure
 * than accepting free text the admissions office can read. Rajasthan's
 * districts are offered as suggestions below, since that is the catchment.
 */

export const INDIAN_STATES: string[] = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  // Union territories
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
]

/** Suggestions only — the field accepts any district the applicant types. */
export const RAJASTHAN_DISTRICTS: string[] = [
  'Ajmer',
  'Alwar',
  'Banswara',
  'Baran',
  'Barmer',
  'Bharatpur',
  'Bhilwara',
  'Bikaner',
  'Bundi',
  'Chittorgarh',
  'Churu',
  'Dausa',
  'Dholpur',
  'Dungarpur',
  'Ganganagar',
  'Hanumangarh',
  'Jaipur',
  'Jaisalmer',
  'Jalore',
  'Jhalawar',
  'Jhunjhunu',
  'Jodhpur',
  'Karauli',
  'Kota',
  'Nagaur',
  'Pali',
  'Pratapgarh',
  'Rajsamand',
  'Sawai Madhopur',
  'Sikar',
  'Sirohi',
  'Tonk',
  'Udaipur',
]
