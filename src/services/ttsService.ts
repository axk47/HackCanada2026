const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY as string;
const VOICE_ID = 'onwK4e9ZLuTAKqWW03F9'; // Daniel - authoritative, advisory
const MODEL_ID = 'eleven_flash_v2_5'; // Ultra-low latency

let currentAudio: HTMLAudioElement | null = null;

export function stopVoice() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
}

export async function speakText(text: string): Promise<void> {
  // Stop any currently playing audio
  stopVoice();

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  currentAudio = new Audio(url);
  await currentAudio.play();

  return new Promise((resolve) => {
    currentAudio!.onended = () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
      resolve();
    };
    currentAudio!.onerror = () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
      resolve();
    };
  });
}

export function buildVoiceSummary(result: import('@/types').TransferResult): string {
  const { course, status, dollarValue, explanation, recommendation } = result;
  const statusText =
    status === 'transfer' ? 'transfers cleanly'
    : status === 'partial' ? 'only partially transfers'
    : 'does not transfer';

  const dollarText = dollarValue > 0
    ? ` This represents a potential loss of ${dollarValue.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })}.`
    : '';

  return `${course.name}, ${course.code}: This course ${statusText}.${dollarText} ${explanation} Here's what you can do: ${recommendation}`;
}
