# CredCheck 🎓

> **HackCanada 2026** — AI-powered 3D credit transfer visualizer for Canadian students.

Upload your transcript PDF → select FROM and TO university → Gemini analyzes all courses → 3D orbital graph shows which credits transfer (🟢), partially transfer (🟡), or are lost (🔴) — with dollar values and AI voice explanations.

## Quick Start

### 1. Clone & Install
```bash
git clone <repo>
cd HackCanada2026
npm install
```

### 2. Set Up API Keys
```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:
```
VITE_GEMINI_API_KEY=your_key_from_aistudio.google.com
VITE_ELEVENLABS_API_KEY=your_key_from_elevenlabs.io
```

### 3. Run
```bash
npm run dev
```

App runs at `http://localhost:5173`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| 3D Engine | React Three Fiber + @react-three/drei |
| AI Analysis | Google Gemini 3 Flash |
| AI Voice | ElevenLabs (Daniel voice) |
| PDF Parsing | PDF.js (client-side) |
| State | Zustand |
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Build | Vite |

## How It Works

1. **Upload** — Drag your transcript PDF onto the drop zone. PDF.js parses it entirely in your browser — your data never leaves your computer.
2. **Select** — Choose your source and destination university from 45+ Ontario institutions (ONTransfer database).
3. **Analyze** — Gemini AI processes all your courses in one request, referencing official ONTransfer agreements and reasoning about content equivalency.
4. **Explore** — 3D orbital graph spawns with color-coded orbs. Click any orb to see why it does/doesn't transfer, what it costs, and what you can do about it.
5. **Listen** — ElevenLabs reads the AI summary aloud for each course.

## Deployment (Vercel)

```bash
npx vercel
```

Set `VITE_GEMINI_API_KEY` and `VITE_ELEVENLABS_API_KEY` in Vercel environment variables.

> ⚠️ For production: move API calls to a server-side function to protect your API keys.

## Data Sources

- **ONTransfer.ca** — Official Ontario government credit transfer database (45 institutions)
- **$800/credit** — Ontario average cost per undergraduate credit hour (2025)

---

Built with ❤️ at HackCanada 2026
