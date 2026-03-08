/**
 * Vercel Edge Function
 * Proxies ElevenLabs API requests to bypass browser CORS restrictions and hide the API key.
 */
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
    const { text, voice_id, model_id, voice_settings } = body

    if (!text || !voice_id) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const API_KEY = process.env.VITE_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY
    if (!API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured on server' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const upstreamRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: model_id || 'eleven_flash_v2_5',
        voice_settings,
      }),
    })

    if (!upstreamRes.ok) {
      const errorText = await upstreamRes.text()
      console.error('ElevenLabs upstream error:', upstreamRes.status, errorText)
      return new Response(JSON.stringify({ error: 'ElevenLabs API error' }), {
        status: upstreamRes.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const audioData = await upstreamRes.arrayBuffer()

    return new Response(audioData, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error('Server error calling ElevenLabs:', error)
    return new Response(JSON.stringify({ error: 'Internal server error while fetching audio' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
