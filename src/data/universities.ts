export type ProgramKey = 'cs' | 'business' | 'lifesciences' | 'engineering'

export interface Program {
  name: string
  degreeType: string
  totalCredits: number
  domesticTuition: number
  intlTuition: number
  costPerBrockCredit: {
    domestic: number
    international: number
  }
  hasCoop: boolean
  admissionAvg: string
  url: string
}

export interface University {
  id: string
  name: string
  city: string
  creditSystem: {
    unitName: string
    valuePerCourse: number
    degreeTotal: number
  }
  brockConversionFactor: number
  yearThresholds: {
    year1Max: number
    year2Max: number
    year3Max: number
  }
  maxTransferCredits: number
  minGradeForTransfer: number
  gpaScale: {
    type: string
    conversions: Record<number, number>
  }
  programs: Record<ProgramKey, Program>
  scholarships: Array<{
    name: string
    amount: string
    eligibility: string
    url: string
  }>
  transferCreditUrl: string
  onTransferUrl: string
}

export const ONTARIO_UNIVERSITIES: Record<string, University> = {

  brock: {
    id: 'brock',
    name: 'Brock University',
    city: 'St. Catharines',
    creditSystem: { unitName: 'credits', valuePerCourse: 0.5, degreeTotal: 20.0 },
    brockConversionFactor: 1,
    yearThresholds: { year1Max: 5.0, year2Max: 10.0, year3Max: 15.0 },
    maxTransferCredits: 15.0,
    minGradeForTransfer: 60,
    gpaScale: {
      type: '4.33',
      conversions: { 90: 4.33, 85: 4.0, 80: 3.7, 77: 3.3, 73: 3.0, 70: 2.7, 67: 2.3, 63: 2.0, 60: 1.7 },
    },
    programs: {
      cs: { name: 'Computer Science (BSc)', degreeType: 'Bachelor of Science', totalCredits: 20.0, domesticTuition: 7800, intlTuition: 28000, costPerBrockCredit: { domestic: 780, international: 2800 }, hasCoop: false, admissionAvg: '~70%', url: 'https://brocku.ca/mathematics-science/computer-science/' },
      business: { name: 'Business Administration (BAcc)', degreeType: 'Bachelor', totalCredits: 20.0, domesticTuition: 7800, intlTuition: 28000, costPerBrockCredit: { domestic: 780, international: 2800 }, hasCoop: false, admissionAvg: '~70%', url: 'https://brocku.ca/business/' },
      lifesciences: { name: 'Biology (BSc)', degreeType: 'Bachelor of Science', totalCredits: 20.0, domesticTuition: 7800, intlTuition: 28000, costPerBrockCredit: { domestic: 780, international: 2800 }, hasCoop: false, admissionAvg: '~70%', url: 'https://brocku.ca/mathematics-science/biological-sciences/' },
      engineering: { name: 'Computer Science with Co-op', degreeType: 'Bachelor of Science', totalCredits: 20.0, domesticTuition: 7800, intlTuition: 28000, costPerBrockCredit: { domestic: 780, international: 2800 }, hasCoop: true, admissionAvg: '~70%', url: 'https://brocku.ca/mathematics-science/computer-science/' },
    },
    scholarships: [],
    transferCreditUrl: 'https://brocku.ca/registrar/transfer-credit/',
    onTransferUrl: 'https://www.ontransfer.ca',
  },

  carleton: {
    id: 'carleton',
    name: 'Carleton University',
    city: 'Ottawa',
    creditSystem: { unitName: 'credits', valuePerCourse: 0.5, degreeTotal: 20.0 },
    brockConversionFactor: 1,
    yearThresholds: { year1Max: 3.5, year2Max: 8.5, year3Max: 13.5 },
    maxTransferCredits: 15.0,
    minGradeForTransfer: 60,
    gpaScale: {
      type: '12-point',
      conversions: { 90: 12, 85: 11, 80: 10, 77: 9, 73: 8, 70: 7, 67: 6, 63: 5, 60: 4, 57: 3, 53: 2, 50: 1 },
    },
    programs: {
      cs: { name: 'Bachelor of Computer Science (BCS)', degreeType: 'Honours Bachelor', totalCredits: 20.0, domesticTuition: 10500, intlTuition: 52187, costPerBrockCredit: { domestic: 1050, international: 5218 }, hasCoop: true, admissionAvg: '80–85%', url: 'https://calendar.carleton.ca/undergrad/undergradprograms/computerscience/' },
      business: { name: 'Bachelor of Commerce (BCom) – Sprott', degreeType: 'Honours Bachelor', totalCredits: 20.0, domesticTuition: 10455, intlTuition: 40673, costPerBrockCredit: { domestic: 1045, international: 4067 }, hasCoop: true, admissionAvg: '~80%', url: 'https://admissions.carleton.ca/programs/commerce/' },
      lifesciences: { name: 'BSc Biotechnology', degreeType: 'Bachelor of Science', totalCredits: 20.0, domesticTuition: 7431, intlTuition: 34334, costPerBrockCredit: { domestic: 743, international: 3433 }, hasCoop: true, admissionAvg: 'mid-70s to low-80s', url: 'https://admissions.carleton.ca/programs/biotechnology/' },
      engineering: { name: 'BEng Software Engineering', degreeType: 'Bachelor of Engineering', totalCredits: 20.0, domesticTuition: 11963, intlTuition: 53612, costPerBrockCredit: { domestic: 1196, international: 5361 }, hasCoop: true, admissionAvg: 'low-mid 80s', url: 'https://admissions.carleton.ca/programs/software-engineering/' },
    },
    scholarships: [{ name: 'Transfer Entrance Scholarship', amount: 'Up to $16,000 over 4 years', eligibility: 'Based on admission average', url: 'https://carleton.ca/awards/awards/scholarships/' }],
    transferCreditUrl: 'https://admissions.carleton.ca/ontario-colleges/',
    onTransferUrl: 'https://www.ontransfer.ca',
  },

  uottawa: {
    id: 'uottawa',
    name: 'University of Ottawa',
    city: 'Ottawa',
    creditSystem: { unitName: 'units', valuePerCourse: 3, degreeTotal: 120 },
    brockConversionFactor: 6,
    yearThresholds: { year1Max: 24, year2Max: 54, year3Max: 84 },
    maxTransferCredits: 60,
    minGradeForTransfer: 60,
    gpaScale: {
      type: '10-point',
      conversions: { 90: 10, 85: 9, 80: 8, 75: 7, 70: 6, 65: 5, 60: 4, 55: 3, 50: 2 },
    },
    programs: {
      cs: { name: 'Major in Computer Science (BSc)', degreeType: 'Bachelor of Science', totalCredits: 120, domesticTuition: 7048, intlTuition: 43335, costPerBrockCredit: { domestic: 704, international: 4333 }, hasCoop: true, admissionAvg: 'low-mid 80s', url: 'https://catalogue.uottawa.ca/en/undergrad/major-computer-science/' },
      business: { name: 'Bachelor of Commerce – Telfer', degreeType: 'Bachelor of Commerce', totalCredits: 120, domesticTuition: 7048, intlTuition: 43335, costPerBrockCredit: { domestic: 704, international: 4333 }, hasCoop: true, admissionAvg: 'low-80s', url: 'https://telfer.uottawa.ca/en/bcom/' },
      lifesciences: { name: 'BSc Biomedical Science', degreeType: 'Bachelor of Science', totalCredits: 120, domesticTuition: 7048, intlTuition: 43335, costPerBrockCredit: { domestic: 704, international: 4333 }, hasCoop: true, admissionAvg: '~78%', url: 'https://www.ouinfo.ca/programs/ottawa/ozp' },
      engineering: { name: 'BASc Software Engineering', degreeType: 'Bachelor of Applied Science', totalCredits: 120, domesticTuition: 7048, intlTuition: 43335, costPerBrockCredit: { domestic: 704, international: 4333 }, hasCoop: true, admissionAvg: '~85%', url: 'https://www.ouinfo.ca/programs/ottawa/oja' },
    },
    scholarships: [{ name: 'uOttawa Merit Scholarship', amount: 'Varies by average', eligibility: 'Strong academic performance', url: 'https://www.uottawa.ca/study/fees-financial-support/scholarships-bursaries-awards' }],
    transferCreditUrl: 'https://www.uottawa.ca/study/undergraduate-studies/transfer-credits',
    onTransferUrl: 'https://www.ontransfer.ca',
  },

  mcmaster: {
    id: 'mcmaster',
    name: 'McMaster University',
    city: 'Hamilton',
    creditSystem: { unitName: 'units', valuePerCourse: 3, degreeTotal: 120 },
    brockConversionFactor: 6,
    yearThresholds: { year1Max: 24, year2Max: 54, year3Max: 84 },
    maxTransferCredits: 60,
    minGradeForTransfer: 60,
    gpaScale: {
      type: '12-point',
      conversions: { 90: 12, 85: 11, 80: 10, 77: 9, 73: 8, 70: 7, 67: 6, 63: 5, 60: 4 },
    },
    programs: {
      cs: { name: 'Honours BSc Computer Science', degreeType: 'Honours Bachelor of Science', totalCredits: 120, domesticTuition: 10091, intlTuition: 49500, costPerBrockCredit: { domestic: 1009, international: 4950 }, hasCoop: false, admissionAvg: 'high 80s–90s', url: 'https://www.ouinfo.ca/programs/mcmaster/mcs' },
      business: { name: 'Bachelor of Commerce – DeGroote', degreeType: 'Bachelor of Commerce', totalCredits: 120, domesticTuition: 10091, intlTuition: 45000, costPerBrockCredit: { domestic: 1009, international: 4500 }, hasCoop: true, admissionAvg: 'mid-80s', url: 'https://www.ouinfo.ca/programs/mcmaster/mbc' },
      lifesciences: { name: 'Life Sciences Gateway (BSc)', degreeType: 'Bachelor of Science', totalCredits: 120, domesticTuition: 8500, intlTuition: 40000, costPerBrockCredit: { domestic: 850, international: 4000 }, hasCoop: false, admissionAvg: 'low-90s', url: 'https://www.ouinfo.ca/programs/mcmaster/mls' },
      engineering: { name: 'BEng Software Engineering', degreeType: 'Bachelor of Engineering', totalCredits: 120, domesticTuition: 10091, intlTuition: 56232, costPerBrockCredit: { domestic: 1009, international: 5623 }, hasCoop: true, admissionAvg: 'mid-80s to 90s', url: 'https://www.ouinfo.ca/programs/mcmaster/mse' },
    },
    scholarships: [{ name: 'McMaster Access Award', amount: 'Up to $20,000/year', eligibility: 'Academic merit + financial need', url: 'https://registrar.mcmaster.ca/financial-support/scholarships-and-bursaries/' }],
    transferCreditUrl: 'https://registrar.mcmaster.ca/build-degree/university-transfer-students/',
    onTransferUrl: 'https://www.ontransfer.ca',
  },

  tmu: {
    id: 'tmu',
    name: 'Toronto Metropolitan University',
    city: 'Toronto',
    creditSystem: { unitName: 'course credits', valuePerCourse: 1, degreeTotal: 40 },
    brockConversionFactor: 2,
    yearThresholds: { year1Max: 8, year2Max: 18, year3Max: 28 },
    maxTransferCredits: 20,
    minGradeForTransfer: 60,
    gpaScale: {
      type: '4.33',
      conversions: { 90: 4.33, 85: 4.0, 80: 3.7, 77: 3.3, 73: 3.0, 70: 2.7, 67: 2.3, 63: 2.0, 60: 1.7 },
    },
    programs: {
      cs: { name: 'BSc Computer Science', degreeType: 'Bachelor of Science', totalCredits: 40, domesticTuition: 9500, intlTuition: 38000, costPerBrockCredit: { domestic: 950, international: 3800 }, hasCoop: true, admissionAvg: 'mid-70s', url: 'https://www.torontomu.ca/cs/' },
      business: { name: 'BComm Business Management – Ted Rogers', degreeType: 'Bachelor of Commerce', totalCredits: 40, domesticTuition: 11738, intlTuition: 40485, costPerBrockCredit: { domestic: 1173, international: 4048 }, hasCoop: true, admissionAvg: 'mid-70s', url: 'https://www.torontomu.ca/tedrogersschool/' },
      lifesciences: { name: 'BSc Biomedical Sciences', degreeType: 'Bachelor of Science', totalCredits: 40, domesticTuition: 7284, intlTuition: 35063, costPerBrockCredit: { domestic: 728, international: 3506 }, hasCoop: false, admissionAvg: 'mid-70s', url: 'https://www.torontomu.ca/science/programs/' },
      engineering: { name: 'BEng Computer Engineering', degreeType: 'Bachelor of Engineering', totalCredits: 40, domesticTuition: 11738, intlTuition: 40485, costPerBrockCredit: { domestic: 1173, international: 4048 }, hasCoop: true, admissionAvg: 'low-80s', url: 'https://www.torontomu.ca/engineering-architectural-science/' },
    },
    scholarships: [
      { name: "President's Entrance Scholarship", amount: '~$10,000/year + residence', eligibility: 'Top admission averages', url: 'https://www.ouinfo.ca/universities/toronto-metropolitan/scholarships' },
      { name: 'TMU Entrance Scholarship', amount: 'Up to $3,000/year', eligibility: 'Strong admission average, renewable', url: 'https://www.ouinfo.ca/universities/toronto-metropolitan/scholarships' },
    ],
    transferCreditUrl: 'https://www.torontomu.ca/transfer-credits/',
    onTransferUrl: 'https://www.ontransfer.ca',
  },

  york: {
    id: 'york',
    name: 'York University',
    city: 'Toronto',
    creditSystem: { unitName: 'credits', valuePerCourse: 3, degreeTotal: 120 },
    brockConversionFactor: 6,
    yearThresholds: { year1Max: 24, year2Max: 54, year3Max: 84 },
    maxTransferCredits: 90,
    minGradeForTransfer: 60,
    gpaScale: {
      type: '9-point',
      conversions: { 90: 9, 80: 8, 75: 7, 70: 6, 65: 5, 60: 4, 55: 3, 50: 2 },
    },
    programs: {
      cs: { name: 'BSc Computer Science – Lassonde', degreeType: 'Bachelor of Science', totalCredits: 120, domesticTuition: 9682, intlTuition: 31146, costPerBrockCredit: { domestic: 968, international: 3114 }, hasCoop: false, admissionAvg: 'mid-70s', url: 'https://lassonde.yorku.ca/eecs/academics/undergraduate/' },
      business: { name: 'BBA/BCom – Schulich School', degreeType: 'Bachelor of Business Administration', totalCredits: 120, domesticTuition: 9735, intlTuition: 35306, costPerBrockCredit: { domestic: 973, international: 3530 }, hasCoop: false, admissionAvg: 'high-80s', url: 'https://www.schulich.yorku.ca/' },
      lifesciences: { name: 'BSc Biomedical Science', degreeType: 'Bachelor of Science', totalCredits: 120, domesticTuition: 7153, intlTuition: 33791, costPerBrockCredit: { domestic: 715, international: 3379 }, hasCoop: false, admissionAvg: 'mid-70s', url: 'https://www.yorku.ca/programs/' },
      engineering: { name: 'BEng Software Engineering – Lassonde', degreeType: 'Bachelor of Engineering', totalCredits: 120, domesticTuition: 12766, intlTuition: 38826, costPerBrockCredit: { domestic: 1276, international: 3882 }, hasCoop: false, admissionAvg: 'mid-80s', url: 'https://lassonde.yorku.ca/academics/software-engineering' },
    },
    scholarships: [
      { name: 'York International Transfer Award', amount: '$5,000', eligibility: 'International, 24+ transfer credits, 75%+ avg', url: 'https://futurestudents.yorku.ca/scholarships-incoming-students' },
      { name: "Provost's College Transfer Scholarship", amount: 'Up to $1,000', eligibility: 'Ontario college transfer students', url: 'https://futurestudents.yorku.ca/transfer/scholarship/international' },
    ],
    transferCreditUrl: 'https://calendars.students.yorku.ca/2025-2026/eligibility-for-transfer-credit',
    onTransferUrl: 'https://www.ontransfer.ca',
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Destination dropdown options (5 universities only) */
export const DESTINATION_UNIVERSITIES = [
  'Carleton University',
  'University of Ottawa',
  'McMaster University',
  'Toronto Metropolitan University',
  'York University',
]

/** All Ontario institutions for the FROM dropdown (kept broad) */
export const ALL_ONTARIO_UNIVERSITIES: string[] = [
  'Brock University',
  'Algonquin College',
  'Carleton University',
  'Durham College',
  'Fanshawe College',
  'George Brown College',
  'Georgian College',
  'Humber College',
  'Lakehead University',
  'Laurentian University',
  'McMaster University',
  'Mohawk College',
  'Niagara College',
  'Nipissing University',
  'OCAD University',
  'Ontario Tech University',
  "Queen's University",
  'Seneca College',
  'Sheridan College',
  'Toronto Metropolitan University',
  'Trent University',
  'University of Guelph',
  'University of Ottawa',
  'University of Toronto',
  'University of Waterloo',
  'University of Windsor',
  'Western University',
  'Wilfrid Laurier University',
  'York University',
]

export const PROGRAM_OPTIONS: { key: ProgramKey; label: string }[] = [
  { key: 'cs',            label: 'Computer Science' },
  { key: 'business',      label: 'Business / Commerce' },
  { key: 'lifesciences',  label: 'Life Sciences / Biotech' },
  { key: 'engineering',   label: 'Engineering' },
]

export function getUniversityByName(name: string): University | null {
  return Object.values(ONTARIO_UNIVERSITIES).find(
    u => u.name.toLowerCase() === name.toLowerCase()
  ) ?? null
}

export function convertBrockCredits(brockCredits: number, dest: University): number {
  return brockCredits * dest.brockConversionFactor
}

export function calculateValueAtRiskRange(
  atRiskBrockCredits: number,
  destination: University,
  program: ProgramKey,
  isInternational: boolean
): { min: number; max: number; display: string } {
  const prog = destination.programs[program]
  if (!prog) return { min: 0, max: 0, display: '$0' }
  const rate = isInternational
    ? prog.costPerBrockCredit.international
    : prog.costPerBrockCredit.domestic

  // The `costPerBrockCredit` is actually defined as the cost per 0.5-credit *course*
  // So we divide the total at-risk credits by 0.5 to get the number of equivalent courses
  const base = (atRiskBrockCredits / 0.5) * rate

  // ±15% range to reflect uncertainty in credit assessment
  const min = Math.round(base * 0.85)
  const max = Math.round(base * 1.15)

  const fmt = (n: number) =>
    '$' + n.toLocaleString('en-CA', { maximumFractionDigits: 0 })

  if (min === 0 && max === 0) {
    return { min, max, display: '$0' }
  }

  return {
    min,
    max,
    display: `${fmt(min)} – ${fmt(max)}`
  }
}

export function convertGPA(brockPercentage: number, dest: University): number {
  const entries = Object.entries(dest.gpaScale.conversions)
    .map(([pct, gpa]) => ({ pct: Number(pct), gpa }))
    .sort((a, b) => b.pct - a.pct)
  for (const entry of entries) {
    if (brockPercentage >= entry.pct) return entry.gpa
  }
  return 0
}
