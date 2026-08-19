# MockMate AI: Advanced AI Interview Simulation Platform

<p align="center">
  <em>An enterprise-grade, audio-first AI Mock Interviewer designed to simulate real-world company interviews with live coding rounds, personalized feedback, and dynamic question generation.</em>
</p>

---

## 📖 Deep Context Architecture Document
*This README serves as the primary context file for LLM-assisted development. It details the exact technical implementation strategy, API routes, and deployment constraints required to build MockMate AI entirely on free-tier services.*

---

## 1. Project Mechanics & Execution Flow

MockMate AI is not a simple chatbot. It is a dual-interface real-time system:
1. **The Voice Channel:** Ultra-low latency speech-to-speech interaction.
2. **The Data Channel:** Real-time synchronization of code editor state.

### The Lifecycle of an Interview
1. **Onboarding:** User lands on the Next.js app, authenticates via Supabase, and fills out the Pre-Interview Form (Target Company: *e.g., Meta*, Role: *e.g., Frontend Engineer*, Resume: *PDF upload*).
2. **Context Hydration:** Next.js extracts text from the PDF, bundles it with the JD, and saves an `Interview` record in Supabase with `status='PENDING'`.
3. **Connection:** User clicks "Start Interview". The frontend requests a LiveKit token and connects to the WebRTC room.
4. **Agent Dispatch:** LiveKit Cloud wakes up the Python worker. The worker reads the `interview_id`, fetches the context from Supabase, builds a massive, dynamic System Prompt, and connects to the room.
5. **Simulation:** The interview executes through the predefined state machine (Intro -> Resume Deep Dive -> Tech Q&A -> Live Coding -> Behavioral -> Outro).
6. **Code Sync:** As the user types in the Monaco editor, diffs/snapshots are sent to the Python agent. The agent uses this code state as context when responding to user audio.
7. **Post-Mortem:** Upon hangup, the backend Python script aggregates the transcript and code, hits the Gemini Pro API with an evaluation prompt, and pushes a structured JSON report back to Supabase.
8. **Feedback Review:** The Next.js frontend detects `status='COMPLETED'` and renders a beautiful dashboard showing scores, strengths, weaknesses, and a replayable transcript.

---

## 2. Key Technical Features

### 🎧 Audio-First Conversational Interface
- Experience a realistic phone-screen/video-call style interview.
- Low-latency voice interaction simulating natural human pauses, interruptions, and follow-ups.
- **Secure Question Display:** The current question being asked is displayed on-screen as a locked transcript. It features strict anti-copy (CSS `user-select: none`), disabled right-click, and screenshot-blurring mechanisms to maintain interview integrity.

### 💻 Integrated Live Code Editor
- A web-based IDE (Monaco Editor) that the AI can view in real-time.
- **JD-Driven Language Restriction:** Candidates can code in their language of choice, but the available options are dynamically restricted by the AI based on the Job Description (e.g., a Frontend JD will restrict options to JavaScript/TypeScript, while a general SWE JD may allow Python, Java, or C++).
- The AI "compiles" and reviews the code logically, providing hints if the candidate gets stuck.

### 🧠 Dynamic Prompt Assembly & Interview Psychology
- The system dynamically builds the context by feeding the Gemini API the specific company, role requirements, and user resume to ensure hyper-realistic questions.
- **Smart Silence Detection:** The Voice Activity Detection (VAD) is tuned to accommodate stuttering and deep thinking pauses. If the candidate remains silent for too long, the AI gently prompts them to say *"Pass"* if they are stuck.
- **Explicit Turn-Taking:** Candidates are instructed to say *"Completed"* when they finish an answer, ensuring the AI never cuts them off prematurely while they are formulating complex technical thoughts.

---

## 3. Comprehensive Tech Stack

### Frontend (Next.js 14 App Router)
- **Framework:** Next.js (React) deployed on Vercel.
- **Styling:** Tailwind CSS + Shadcn UI (for beautiful, accessible components).
- **Editor:** `@monaco-editor/react` for the live coding environment.
- **WebRTC Client:** `@livekit/components-react` for audio and data channel management.
- **State Management:** Zustand (for managing editor state and interview timers).

### Backend (Python LiveKit Agent)
- **Framework:** Python 3.10+, `livekit-agents` SDK, `livekit-plugins-google`, `livekit-plugins-deepgram`.
- **Hosting:** Render (Free Web Service) or Railway.
- **Database Client:** `supabase-py` for reading/writing interview context and reports.
- **PDF Parsing:** `PyMuPDF` or `pdfminer.six` (handled either on frontend API route or backend worker).

### External APIs
- **Database & Auth:** Supabase (Free tier: 500MB db, 50,000 MAU).
- **WebRTC SFU:** LiveKit Cloud (Free tier: 50GB bandwidth, 50 concurrent connections).
- **LLM:** Google Gemini Advanced / AI Pro Plan (Utilizes **Gemini Pro** for deep post-interview evaluation/rubrics, and **Gemini Flash** for ultra-low latency real-time voice interaction).
- **STT/TTS:** Deepgram Nova-3 (Free tier: $200 credit) or Google Cloud TTS.

---

## 4. Directory & Codebase Architecture

When scaffolding this project, adhere strictly to this monorepo structure to separate concerns between the React client and the Python worker.

```text
mockmate/
├── backend/                        # Python Agent Worker
│   ├── requirements.txt            # Python dependencies
│   ├── main.py                     # Entrypoint (AgentServer)
│   ├── agent.py                    # Core interview logic & state machine
│   ├── db_client.py                # Supabase interaction wrappers
│   ├── prompts/
│   │   ├── system_prompt.jinja2    # Dynamic prompt template
│   │   └── evaluation_rubric.txt   # Post-interview grading prompt
│   └── services/
│       ├── scraper.py              # Fetches historical company questions
│       └── evaluator.py            # Async LLM call for report generation
│
├── frontend/                       # Next.js Web App
│   ├── package.json
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Landing page
│   │   ├── setup/                  # Form: Company, JD, Resume upload
│   │   ├── interview/[id]/         # The Room: Audio Visualizer + Monaco Editor
│   │   └── report/[id]/            # Dashboard: Scores and feedback
│   ├── app/api/
│   │   ├── token/route.ts          # Generates LiveKit access tokens
│   │   └── parse-resume/route.ts   # Edge function to extract PDF text
│   ├── components/
│   │   ├── CodeEditor.tsx          # Monaco wrapper with LiveKit data channel sync
│   │   ├── AudioVisualizer.tsx     # LiveKit track visualizer
│   │   └── ReportCard.tsx          # Renders evaluation JSON
│   └── lib/
│       ├── supabase.ts             # Supabase client initialization
│       └── utils.ts
│
├── database/                       # SQL Migrations
│   └── schema.sql                  # Supabase table definitions and RLS policies
│
├── SRS.md                          # Software Requirements Specification
└── README.md                       # This file
```

---

## 5. WebRTC Data Channel Spec (Code Sync)

To ensure the AI Agent knows what the user is typing, the frontend `CodeEditor.tsx` must broadcast its state to the LiveKit room.

**Topic:** `editor_state`
**Frequency:** Debounced to every 2 seconds of typing, or explicitly when the user clicks "Run/Submit".
**Payload (Frontend -> Backend):**
```json
{
  "event": "code_update",
  "language": "python",
  "content": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)"
}
```

**Agent Handling:**
The Python agent intercepts this data channel message and updates an internal string variable `current_code_state`. When the user speaks (e.g., "Does this look right?"), the agent appends `\n\n[Current Code Editor State]:\n{current_code_state}` to the end of the user's transcript message before sending it to Gemini. This allows Gemini to "see" the code instantly.

---

*This document is written to provide maximum context for future AI-assisted development sessions. Proceed to `SRS.md` for exact state machine definitions and database schemas.*
