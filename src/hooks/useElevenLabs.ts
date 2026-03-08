import { useCallback, useRef } from 'react'

const VOICE_ID = 'onwK4e9ZLuTAKqWW03F9' // Daniel — authoritative AI advisor
const MODEL_ID = 'eleven_flash_v2_5'

// Dev: call ElevenLabs directly with VITE key.
// Prod (Vercel): proxy through /api/tts to keep key server-side.
const IS_DEV = import.meta.env.DEV

async function callElevenLabs(text: string): Promise<Blob | null> {
  try {
    let response: Response

    if (IS_DEV) {
      const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY
      if (!apiKey) {
        console.warn('Missing VITE_ELEVENLABS_API_KEY — falling back to Web Speech')
        return null
      }
      response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: 'POST',
          headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            model_id: MODEL_ID,
            voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
          }),
        }
      )
    } else {
      response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice_id: VOICE_ID, model_id: MODEL_ID,
          voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true } }),
      })
    }

    if (!response.ok) {
      console.warn(`ElevenLabs ${response.status} — falling back to Web Speech`)
      return null
    }

    return await response.blob()
  } catch (err) {
    console.warn('ElevenLabs unreachable — falling back to Web Speech', err)
    return null
  }
}

function webSpeechFallback(text: string) {
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  const preferredVoice = window.speechSynthesis.getVoices().find(
    v => v.lang.startsWith('en') &&
      (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Natural'))
  )
  if (preferredVoice) utterance.voice = preferredVoice
  utterance.rate = 0.95
  utterance.pitch = 0.9
  window.speechSynthesis.speak(utterance)
}

export function useElevenLabs() {
  const cache = useRef<Map<string, string>>(new Map())
  const currentAudio = useRef<HTMLAudioElement | null>(null)

  const speak = useCallback(async (text: string): Promise<void> => {
    // Stop any playing audio
    if (currentAudio.current) { currentAudio.current.pause(); currentAudio.current = null }
    window.speechSynthesis.cancel()

    // Serve from cache if available
    if (cache.current.has(text)) {
      const audio = new Audio(cache.current.get(text)!)
      currentAudio.current = audio
      await audio.play()
      return
    }

    // Try ElevenLabs first — fall back to Web Speech if it fails
    const blob = await callElevenLabs(text)
    if (blob) {
      const url = URL.createObjectURL(blob)
      cache.current.set(text, url)
      const audio = new Audio(url)
      currentAudio.current = audio
      await audio.play()
    } else {
      webSpeechFallback(text)
    }
  }, [])

  const stop = useCallback(() => {
    if (currentAudio.current) { currentAudio.current.pause(); currentAudio.current = null }
    window.speechSynthesis.cancel()
  }, [])

  return { speak, stop }
}
