import { useCallback, useRef } from 'react'

const VOICE_ID = 'onwK4e9ZLuTAKqWW03F9' // Daniel — authoritative AI advisor
const MODEL_ID = 'eleven_flash_v2_5'

// Point to the local/deployed Vercel serverless function
const API_URL = '/api/tts'

export function useElevenLabs() {
  // Cache audio URLs per text to avoid duplicate API calls
  const cache = useRef<Map<string, string>>(new Map())
  const currentAudio = useRef<HTMLAudioElement | null>(null)

  const speak = useCallback(async (text: string): Promise<void> => {
    // Stop any currently playing audio
    if (currentAudio.current) {
      currentAudio.current.pause()
      currentAudio.current = null
    }

    // Return cached audio if available
    if (cache.current.has(text)) {
      const cached = cache.current.get(text)!
      const audio = new Audio(cached)
      currentAudio.current = audio
      await audio.play()
      return
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice_id: VOICE_ID,
          model_id: MODEL_ID,
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      })

      if (!response.ok) {
        console.error('ElevenLabs error:', response.status, await response.text())
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      cache.current.set(text, url)

      const audio = new Audio(url)
      currentAudio.current = audio
      await audio.play()
    } catch (err) {
      console.error('ElevenLabs TTS failed:', err)
    }
  }, [])

  const stop = useCallback(() => {
    if (currentAudio.current) {
      currentAudio.current.pause()
      currentAudio.current = null
    }
  }, [])

  return { speak, stop }
}
