import type { Course } from '@/types';

// Lazy-load pdfjs to avoid module-level crashes in browser
async function getPdfJs() {
  const pdfjsLib = await import('pdfjs-dist');
  // Use CDN worker to bypass Vite bundling issues
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  return pdfjsLib;
}

export async function parsePdfTranscript(file: File): Promise<Course[]> {
  const pdfjsLib = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += (content.items as any[]).map((item) => item.str ?? '').join(' ') + '\n';
  }

  return extractCourses(fullText);
}

function extractCourses(text: string): Course[] {
  const courses: Course[] = [];
  const seen = new Set<string>();

  // Match patterns like: CS 101, MATH2001, ENG-101, followed by text and a number
  const re = /\b([A-Z]{2,5})\s*[-\s]?(\d{3,4}[A-Z]?)\b[^\n]{0,80}?(\d+\.?\d*)\s*(?:cr|hrs?|units?|credit)?/gi;

  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const dept = match[1].toUpperCase();
    const num = match[2];
    const code = `${dept} ${num}`;
    if (seen.has(code)) continue;

    const creditHours = parseFloat(match[3] || '3');
    if (creditHours < 0.5 || creditHours > 12) continue;

    // Extract name — text between code and credit number
    const snippet = text.slice(match.index, match.index + match[0].length);
    const nameMatch = snippet.match(/\d{3,4}[A-Z]?\s+([A-Za-z][^0-9\n]{4,50})/);
    const name = nameMatch ? cleanName(nameMatch[1]) : `${dept} ${num}`;

    seen.add(code);
    courses.push({ code, name, creditHours: Math.round(creditHours) });

    if (courses.length >= 60) break;
  }

  return courses;
}

function cleanName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
}
