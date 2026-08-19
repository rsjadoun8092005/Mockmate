# Software Requirements Specification (SRS)
## Project: MockMate AI (AI Mock Interviewer)

**Version:** 2.0 (Deep Context Edition)  
**Date:** August 2026  

---

## 1. Introduction

### 1.1 Purpose
This document provides a highly detailed architectural, functional, and technical blueprint for **MockMate AI**. It is designed to be fed into LLMs or provided to development teams to instantly transfer full context about the project's goals, constraints, state machines, and data structures.


### 1.2 Scope
MockMate AI is an audio-first, real-time AI mock interviewer designed to simulate company-specific technical and behavioral interviews. It features resume parsing, dynamic question generation based on real historical company data, a real-time collaborative code editor, and a comprehensive post-interview analytical engine. 

---

## 2. System Architecture & Tech Stack (Free-Tier Optimized)

To ensure $0 operational cost for a student developer, the architecture strictly adheres to free-tier SaaS limits.

### 2.1 Core Infrastructure
- **Frontend:** Next.js 14 (App Router), React, TailwindCSS, deployed on **Vercel** (Free Tier).
- **Backend Voice Agent:** Python 3.10+, `livekit-agents`, FastAPI, deployed on **Render** (Free Tier Web Service) or **Railway**.
- **Real-time Engine:** **LiveKit Cloud** (Free Tier: 50GB bandwidth/month, 50 concurrent connections).
- **Database & Auth:** **Supabase** (PostgreSQL, Row Level Security, GitHub/Google OAuth).
- **LLM Engine:** **Google Gemini (AI Pro Plan)**. The architecture leverages **Gemini Flash** for sub-second, real-time conversational responses during the interview, and the heavyweight **Gemini Pro** model for deep-dive post-interview evaluation and coding analysis.
- **STT/TTS Engine:** **Deepgram** (Nova-3 STT, Aura TTS - Free Tier) or Murf/ElevenLabs if credits permit.

### 2.2 Data Flow & Component Interaction
1. **Pre-Interview:** User logs into Next.js via Supabase Auth. User submits Company Name, Job Description (JD), and uploads a Resume (PDF).
2. **Context Assembly:** Next.js parses the PDF (using `pdf-parse` or similar) and saves the raw text, JD, and Company to the Supabase `interviews` table.
3. **Signaling:** Next.js requests a LiveKit token from its own `/api/token` route, passing the `interview_id`.
4. **Agent Dispatch:** LiveKit dispatches the Python Agent worker. The worker reads the `interview_id` from the room metadata, fetches the context from Supabase, and constructs the **System Prompt**.
5. **The Interview:** Audio is streamed bi-directionally via WebRTC. Code editor keystrokes are sent via WebRTC Data Channels.
6. **Evaluation:** Upon room disconnection, the Python worker triggers an async evaluation LLM call using the full conversation transcript and code history. The resulting JSON is pushed to Supabase.

---

## 3. Detailed Functional Requirements

### 3.1 AI Agent State Machine
The AI Agent MUST manage the interview flow using a state machine to ensure a realistic experience:
- **STATE_INTRO:** Greets the candidate, confirms the role and company, and sets expectations.
- **STATE_RESUME_DEEPDIVE:** Asks 1-2 questions specifically targeted at projects or skills listed in the user's resume.
- **STATE_TECHNICAL_Q&A:** Asks theoretical technical questions based on the JD (e.g., system design, language specifics).
- **STATE_LIVE_CODING:** Instructs the user to look at the code editor. Presents a DSA problem. Observes data channel updates. Provides hints if the user is stuck for > 2 minutes.
- **STATE_BEHAVIORAL:** Asks STAR method questions (Situation, Task, Action, Result).
- **STATE_OUTRO:** Concludes the interview, asks if the candidate has any questions for the "company", and terminates the call.

### 3.2 Real-Time Code Editor Integration
The system MUST support collaborative coding.
- **Frontend:** Uses `@monaco-editor/react`.
- **JD-Driven Language Restriction:** The code editor MUST dynamically restrict the available programming languages based on the parsed Job Description (JD) (e.g., if the JD specifies a Frontend React Developer, the editor should enforce JavaScript/TypeScript. For a general SWE role, it may allow multiple languages).
- **Data Channel Protocol:** The frontend MUST send JSON payloads to the LiveKit room on the `code_sync` topic.
  ```json
  {
    "type": "code_update",
    "timestamp": "2026-08-19T10:00:00Z",
    "language": "python",
    "content": "def two_sum(nums, target):\n    pass"
  }
  ```
- **Agent Awareness:** The Python agent MUST maintain a buffer of the latest code state. When the LLM is prompted to speak, the current code state MUST be injected into its context window so it can comment on the user's progress.

### 3.3 Dynamic Question Generation (RAG / Web Search)
- Before the interview starts, the system SHOULD utilize a search tool (e.g., DuckDuckGo API or Tavily Free Tier) to search: `"{Company Name} {Job Title} interview questions 2026"`.
- The retrieved context is injected into the Agent's system prompt to ensure high realism.

### 3.4 Protected User Interfaces
- **Interview Room Layout:** Split-screen format. The left side handles audio visualization, and the right side hosts the Monaco code editor.
- **Protected Transcript Window:** A center/floating panel that displays the *current question only* to aid user comprehension (especially for complex DSA problems). 
- **Anti-Cheating Mechanisms:** This transcript window MUST implement strict anti-copy CSS (`user-select: none`), disable right-click context menus, and listen for screenshot shortcuts to blur the screen, enforcing interview integrity.

---

## 4. Database Schema (Supabase / PostgreSQL)

### Table: `users`
- `id` (UUID, Primary Key, maps to auth.users)
- `email` (String)
- `full_name` (String)
- `created_at` (Timestamp)

### Table: `interviews`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> users.id)
- `company_name` (String)
- `job_description` (Text)
- `resume_text` (Text)
- `status` (Enum: 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED')
- `created_at` (Timestamp)

### Table: `evaluations`
- `id` (UUID, Primary Key)
- `interview_id` (UUID, Foreign Key -> interviews.id)
- `transcript` (JSONB - Array of speaker/text objects)
- `code_history` (Text - Final code submitted)
- `overall_score` (Integer 0-100)
- `strengths` (Array of Strings)
- `weaknesses` (Array of Strings)
- `technical_feedback` (Text)
- `communication_feedback` (Text)
- `created_at` (Timestamp)

---

## 5. Evaluation Engine & Prompting Strategy

### 5.1 The Evaluation Prompt
Once the interview concludes, the backend sends the following to the **Gemini Pro** model for high-accuracy reasoning:
**Input:** 
- Full Transcript
- Final Code State
- Original Job Description & Resume
**Prompt Directive:** 
"You are a strict but fair Principal Engineering Manager. Review the following mock interview transcript and code. Output a JSON object matching the exact schema below. Grade the candidate out of 100 based on technical accuracy, communication clarity, and behavioral fit."

### 5.2 JSON Output Schema
```json
{
  "overall_score": 85,
  "metrics": {
    "technical": 80,
    "communication": 90,
    "problem_solving": 85
  },
  "strengths": ["Clear communication of trade-offs", "Strong Python syntax"],
  "weaknesses": ["Missed edge case in array bounds", "Took too long to answer behavioral question"],
  "detailed_feedback": "...",
  "recommended_study_topics": ["Dynamic Programming", "System Design: Load Balancers"]
}
```

---

## 6. Non-Functional & Security Requirements
1. **Row Level Security (RLS):** Supabase MUST be configured so users can only `SELECT`, `INSERT`, `UPDATE` rows where `user_id == auth.uid()`.
2. **Voice Activity Detection (VAD) & Turn Taking:** 
   - The VAD MUST be tuned for technical interviews where candidates stutter or pause to think. The `silence_duration` threshold SHOULD be increased (e.g., > 2.5 seconds) to prevent the AI from cutting the user off prematurely.
   - **Explicit Turn Yielding:** The agent MUST instruct the user at the start of the interview to say **"Completed"** when they finish their answer.
   - **Silence & Stuck Detection:** If prolonged silence is detected during a technical question, the AI SHOULD gently interject and advise the user to say **"Pass"** if they are stuck, effectively differentiating between deep thinking and being unable to answer.
3. **Turn Interruption:** The agent MUST support barge-in. If the user speaks while the agent is talking, the agent must immediately halt audio playback and listen.

*End of Deep Context SRS.*
