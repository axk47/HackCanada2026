/**
 * Vercel Serverless Function
 * Proxies ElevenLabs API requests to bypass browser CORS restrictions and hide the API key.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text, voice_id, model_id, voice_settings } = req.body

  if (!text || !voice_id) {
    return res.status(400).json({ error: 'Missing required parameters' })
  }

  const API_KEY = process.env.VITE_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured on server' })
  }

  try {
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
      return res.status(upstreamRes.status).json({ error: 'ElevenLabs API error' })
    }

    // Pass the audio buffer directly to the client
    const arrayBuffer = await upstreamRes.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'public, max-age=31536000') // Instruct browser to cache it heavily
    res.send(buffer)
  } catch (error) {
    console.error('Server error calling ElevenLabs:', error)
    res.status(500).json({ error: 'Internal server error while fetching audio' })
  }
}
