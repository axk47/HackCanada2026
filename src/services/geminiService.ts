import { GoogleGenAI } from '@google/genai';
import type { Course, TransferResult } from '@/types';
import { DOLLAR_PER_CREDIT } from '@/constants/universities';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export async function analyzeTransfers(
  courses: Course[],
  fromUniversity: string,
  toUniversity: string
): Promise<TransferResult[]> {
  const courseList = courses
    .map(c => `- ${c.code}: "${c.name}" (${c.creditHours} credit hours)`)
    .join('\n');

  const prompt = `You are an expert Canadian university credit transfer advisor with comprehensive knowledge of ONTransfer (ontransfer.ca) agreements and Ontario university course equivalencies.

A student is transferring from **${fromUniversity}** to **${toUniversity}**.

Analyze each course and determine transfer status:
- **transfer**: Credits transfer cleanly with full recognition
- **partial**: Credits transfer but with conditions or as electives only  
- **lost**: Credits are not recognized at the destination

Return a JSON array. For each course include:
- courseCode: the exact course code from the list
- status: "transfer" | "partial" | "lost"
- equivalentCourse: (optional) what it maps to at destination
- explanation: 2-3 sentences on why (reference ONTransfer where relevant)
- recommendation: specific actionable next step for the student

Courses:
${courseList}

Respond ONLY with a valid JSON array, no markdown or other text.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  let raw: any[] = [];
  try {
    const text = response.text ?? '[]';
    // Strip any markdown code fences if present
    const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    raw = JSON.parse(clean);
  } catch {
    raw = [];
  }

  return courses.map((course) => {
    const match = raw.find((r: any) => r.courseCode === course.code);
    const status: TransferResult['status'] = match?.status ?? 'lost';
    const dollarValue = status === 'transfer' ? 0 : course.creditHours * DOLLAR_PER_CREDIT;

    return {
      course,
      status,
      equivalentCourse: match?.equivalentCourse || undefined,
      dollarValue,
      explanation: match?.explanation ?? 'Transfer status could not be determined automatically.',
      recommendation: match?.recommendation ?? 'Contact the registrar at your destination university for manual assessment.',
    };
  });
}
