# CredCheck

> Ontario university credit transfer analysis — powered by Gemini AI and visualized in 3D.

![CredCheck orbital visualization](./docs/preview.png)

**Live demo:** https://hackcanada2026-ayaan.nn.r.appspot.com

---

## What it does

Ontario university students upload their unofficial transcript (PDF) and instantly see:

- Which courses are **likely to transfer** to their destination university
- Which courses are **flagged for review** — uncertain transfers pending departmental assessment
- Which credits are **at risk of being lost**
- Their **year standing** at the destination based on transferred credits
- The **real dollar value at risk** — using verified 2024–25 tuition data, shown as a range for domestic and international students
- **GPA converted** to the destination university's native scale (4.33, 12-point, 10-point, or 9-point)

Everything is rendered through a **3D orbital visualization** where each course is a planet — green for transfer, amber for review, red for lost — grouped by academic department.

Currently supports transfers **from Brock University** to 5 Ontario destinations across 4 programs:

| Destination | Programs |
|---|---|
| Carleton University | CS, Business, Life Sciences, Engineering |
| University of Ottawa | CS, Business, Life Sciences, Engineering |
| McMaster University | CS, Business, Life Sciences, Engineering |
| Toronto Metropolitan University (TMU) | CS, Business, Life Sciences, Engineering |
| York University | CS, Business, Life Sciences, Engineering |

---

## Inspiration

Every year, thousands of Ontario university students transfer between institutions and silently lose thousands of dollars worth of academic credit — not because their grades were bad, but because the system is completely opaque. There's no easy way to know which courses will transfer, what year standing you'll enter at your new school, or how much money is actually at stake.

As an international student at Brock University considering a transfer, I experienced this confusion firsthand. The difference between losing 2 credits and 6 credits as an international student can mean **$15,000–$25,000 CAD** in extra tuition. Nobody tells you that. We built CredCheck to change that.

---

## How it works

### Key architectural insight

Rather than having Gemini guess facts (tuition, credit counts, GPA scales), all verified institutional data is hardcoded and Gemini is used only for what AI is actually good at — reading unstructured PDF documents and categorizing course subjects.

### Stack

**Frontend**
- React 19 + TypeScript + Vite
- Three.js (`@react-three/fiber` + `@react-three/drei`) for 3D orbital visualization
- Zustand for global state management
- Tailwind CSS v4 for styling
- Framer Motion for UI transitions

**AI / Document Processing**
- **Google Gemini 3 Flash** (`gemini-3-flash-preview`) — reads uploaded PDF transcripts, extracts course data, and categorizes each course by subject area (`cs_core`, `math`, `business_core`, etc.)
- **PDF.js** (`pdfjs-dist`) — extracts raw text from uploaded transcripts client-side before sending to Gemini

**Backend**
- Express.js server proxying Gemini and ElevenLabs API calls
- Deployed on Google App Engine (Standard, Node.js)

**Data Layer**
- `src/data/universities.ts` — verified 2024–25 tuition, GPA scales, credit systems, and transfer residency rules for all 5 universities sourced via Perplexity DeepSearch
- `src/data/ontransfer.ts` — ONTransfer pathway snapshot data

---

## Running locally

**Prerequisites:** Node.js 20+, a Gemini API key

```bash
# Install dependencies
npm install

# Create .env.local with your keys
echo "VITE_GEMINI_API_KEY=your_key_here" > .env.local
echo "VITE_ELEVENLABS_API_KEY=your_key_here" >> .env.local

# Terminal 1 — start the API server
node server.js

# Terminal 2 — start the Vite dev server
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies all `/api` requests to the Express server on port 8080.

---

## Deploying to Google App Engine

```bash
# Build the frontend
npm run build

# Deploy
gcloud app deploy
```

Set your API keys in `app.yaml` before deploying:

```yaml
env_variables:
  VITE_GEMINI_API_KEY: "your_key_here"
  VITE_ELEVENLABS_API_KEY: "your_key_here"
```

---

## Challenges

- **PDF parsing fragility** — University transcripts have no standard format. Pure regex parsing failed. Switching to Gemini for text extraction fixed accuracy dramatically.
- **Ontario's fragmented credit systems** — Every university counts credits differently. Brock uses 0.5 units, TMU counts individual courses, uOttawa/McMaster/York use 3-unit courses. Converting between these required a completely custom data model with per-university conversion factors.
- **No public equivalency tables exist** — All five universities only confirm equivalencies after admission. This forced a redesign of Gemini's role from "guess equivalencies" to "categorize and estimate likelihood."
- **International vs domestic tuition gap** — The value at risk difference is enormous (e.g. ~$5,700 domestic vs ~$24,000 international for the same lost credits at TMU).

---

## What's next

- Expand to all 20+ Ontario universities
- Add college-to-university pathways (diploma → degree)
- Live ONTransfer API integration for real equivalency lookups
- Side-by-side university comparison: "where do I lose the fewest credits?"
- Downloadable PDF transfer report students can share with academic advisors
- Expand beyond Ontario to other Canadian provinces

---

## Built at HackCanada 2026
