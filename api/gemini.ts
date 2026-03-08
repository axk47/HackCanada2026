import { GoogleGenAI } from '@google/genai'

export const maxDuration = 60 // Max allowed on Vercel Hobby tier for Serverless Functions

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { prompt, schema } = req.body

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt parameter' })
  }

  const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY

  if (!API_KEY) {
    console.error('Missing Gemini API key on server')
    return res.status(500).json({ error: 'API key not configured on server' })
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY })

    const config: any = { responseMimeType: 'application/json' }
    if (schema) {
      config.responseSchema = schema
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config,
    })

    const raw = response.text ?? ''

    // Attempt to strip markdown fences if they exist
    const jsonMatch = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.warn('Could not parse clean JSON output from Gemini', raw)
      return res.status(200).json({ rawText: raw }) // Let the client handle the error if it's strict
    }

    const parsed = JSON.parse(jsonMatch[0])

    return res.status(200).json(parsed)
  } catch (error) {
    console.error('Server error calling Gemini:', error)
    return res.status(502).json({ error: 'Upstream Gemini API error', details: error instanceof Error ? error.message : String(error) })
  }
}
