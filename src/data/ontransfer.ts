/**
 * ONTransfer snapshot — Top 10 Ontario transfer paths
 * Used to prime the Gemini prompt for accuracy.
 * Source: ontransfer.ca (Ontario Government)
 */
export interface TransferPath {
  from: string
  to: string
  notes: string
}

export const TOP_TRANSFER_PATHS: TransferPath[] = [
  {
    from: 'Toronto Metropolitan University',
    to: 'University of Toronto',
    notes: 'Many CS, Engineering, and Business courses have direct equivalencies. STEM courses often require grade ≥ 65%.',
  },
  {
    from: 'Humber College',
    to: 'York University',
    notes: 'Block transfer agreements exist for most diploma programs. Students typically receive 30-60 credit equivalencies.',
  },
  {
    from: 'Seneca College',
    to: 'York University',
    notes: 'Advanced standing agreements for Business, IT, and Liberal Arts diplomas. Up to 2 years credit.',
  },
  {
    from: 'Centennial College',
    to: 'Toronto Metropolitan University',
    notes: 'Pathway agreements in Engineering Technology and Business. Diploma holders may receive up to 54 credits.',
  },
  {
    from: 'Sheridan College',
    to: 'University of Toronto Mississauga',
    notes: 'Articulation agreements exist for Computer Science and Animation programs.',
  },
  {
    from: 'Brock University',
    to: 'McMaster University',
    notes: 'Course-by-course transfer. Sciences, Kinesiology, and Business have strong equivalencies. Some courses lost.',
  },
  {
    from: 'Brock University',
    to: 'University of Waterloo',
    notes: 'Engineering and CS transfers evaluated individually. Many Brock courses may not have direct Waterloo equivalents.',
  },
  {
    from: 'Algonquin College',
    to: 'Carleton University',
    notes: 'Pathway programs exist for IT, Business, and Engineering Technology. Common pathway awards 30-60 transfer credits.',
  },
  {
    from: 'George Brown College',
    to: 'Toronto Metropolitan University',
    notes: 'Block transfer agreements for Culinary, Business, and Health Sciences programs.',
  },
  {
    from: 'Durham College',
    to: 'Ontario Tech University',
    notes: 'Joint programs and pathways. Many diploma courses map directly to Ontario Tech degree credits.',
  },
]

export function getTransferContext(from: string, to: string): string {
  const match = TOP_TRANSFER_PATHS.find(
    (p) =>
      p.from.toLowerCase().includes(from.toLowerCase().split(' ')[0]) &&
      p.to.toLowerCase().includes(to.toLowerCase().split(' ')[0])
  )
  if (match) {
    return `Known transfer context for ${match.from} → ${match.to}: ${match.notes}`
  }
  return `No specific ONTransfer agreement on record for ${from} → ${to}. Use general Ontario credit transfer principles and course content equivalency.`
}
