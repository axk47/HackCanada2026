import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env.local which is used by the Vite project
const envLocalPath = path.join(__dirname, '.env.local');
const envLocalResult = dotenv.config({ path: envLocalPath });
console.log('Loading .env.local from:', envLocalPath);
if (envLocalResult.error) {
  console.warn('Could not find .env.local file');
} else {
  console.log('.env.local loaded successfully');
}

dotenv.config(); // Also load .env as fallback

console.log('Gemini API Key defined:', !!(process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY));

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// API Routes
app.post('/api/gemini', async (req, res) => {
  const { prompt, schema } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt parameter' });
  }

  const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    console.error('Missing Gemini API key on server');
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const config = {
      responseMimeType: 'application/json',
    };
    if (schema) {
      config.responseSchema = schema;
    }

    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config,
    });

    const text = result.text;

    // Attempt to strip markdown fences if they exist
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(200).json({ rawText: text });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Server error calling Gemini:', error);
    return res.status(502).json({
      error: 'Upstream Gemini API error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

app.post('/api/tts', async (req, res) => {
  const { text, voice_id, model_id, voice_settings } = req.body;

  if (!text || !voice_id) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const API_KEY = process.env.VITE_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured on server' });
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
    });

    if (!upstreamRes.ok) {
      const errorText = await upstreamRes.text();
      console.error('ElevenLabs upstream error:', upstreamRes.status, errorText);
      return res.status(upstreamRes.status).json({ error: 'ElevenLabs API error' });
    }

    const arrayBuffer = await upstreamRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(buffer);
  } catch (error) {
    console.error('Server error calling ElevenLabs:', error);
    res.status(500).json({ error: 'Internal server error while fetching audio' });
  }
});

// Serve static assets from the Vite build
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React routing, return all requests to React app
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
