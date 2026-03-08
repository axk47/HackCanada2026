import { GoogleGenAI } from '@google/genai'

export const config = {
  runtime: 'edge',
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()
    const { prompt, schema } = body

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Missing prompt parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY

    if (!API_KEY) {
      console.error('Missing Gemini API key on server')
      return new Response(JSON.stringify({ error: 'API key not configured on server' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY })

    const geminiConfig: any = { responseMimeType: 'application/json' }
    if (schema) {
      geminiConfig.responseSchema = schema
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: geminiConfig,
    })

    const raw = response.text ?? ''

    // Attempt to strip markdown fences if they exist
    const jsonMatch = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.warn('Could not parse clean JSON output from Gemini', raw)
      return new Response(JSON.stringify({ rawText: raw }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const parsed = JSON.parse(jsonMatch[0])

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Server error calling Gemini:', error)
    return new Response(JSON.stringify({
      error: 'Upstream Gemini API error',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
