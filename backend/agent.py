import logging
import json
import asyncio
from livekit import rtc
from livekit.agents import llm
from livekit.plugins import deepgram, google, silero
from livekit.agents.pipeline import VoicePipelineAgent
from db_client import fetch_interview_context, update_interview_status

logger = logging.getLogger("MockMateAgent")

class MockMateAgent:
    def __init__(self, room: rtc.Room, interview_id: str):
        self.room = room
        self.interview_id = interview_id
        self.context = None
        self.agent = None
        self.current_code_state = ""

    async def start(self):
        # 1. Fetch context
        self.context = fetch_interview_context(self.interview_id)
        if not self.context:
            logger.error(f"Could not find interview context for {self.interview_id}")
            return
            
        update_interview_status(self.interview_id, "IN_PROGRESS")
        
        company = self.context.get("company_name", "the company")
        jd = self.context.get("job_description", "")
        resume = self.context.get("resume_text", "")

        # 2. Build System Prompt (State Machine & Rules)
        system_prompt = f"""You are a strict but fair Principal Engineering Manager at {company}.
You are conducting a technical phone screen / mock interview.
The candidate's resume is:
{resume}

The Job Description is:
{jd}

CRITICAL RULES:
1. State Machine Flow: Start with an Introduction -> Ask 1-2 Resume Questions -> Ask 1-2 Technical Questions -> Live Coding -> Behavioral -> Outro.
2. Turn Taking: The candidate has been instructed to say 'Completed' when they are done answering. 
3. If they say 'Pass', move on to the next question.
4. Keep your responses concise, conversational, and natural. Do not act like an AI, act like a human interviewer.
5. If the candidate is coding, you will receive their current code state. Review it logically and provide hints if they are stuck for too long.
"""
        
        # 3. Setup STT, TTS, and LLM
        stt = deepgram.STT()
        tts = google.TTS()
        llm_engine = google.LLM(model="gemini-1.5-flash")
        
        initial_ctx = llm.ChatContext().append(
            role="system",
            text=system_prompt,
        )
        
        # Custom VAD to allow longer silences for deep thinking (> 2.5s)
        vad = silero.VAD.load(min_silence_duration=2.5)

        self.agent = VoicePipelineAgent(
            vad=vad,
            stt=stt,
            llm=llm_engine,
            tts=tts,
            chat_ctx=initial_ctx,
        )

        # 4. Handle Data Channel Messages (Phase 7 overlap)
        @self.room.on("data_received")
        def on_data_received(data: bytes, participant: rtc.RemoteParticipant, kind, topic: str):
            if topic == "editor_state":
                try:
                    payload = json.loads(data.decode("utf-8"))
                    if payload.get("event") == "code_update":
                        self.current_code_state = payload.get("content", "")
                        logger.info(f"Code state updated. Length: {len(self.current_code_state)}")
                except Exception as e:
                    logger.error(f"Failed to parse data channel message: {e}")

        # Inject code state before LLM thinks
        @self.agent.on("user_speech_committed")
        def on_user_speech_committed(msg: llm.ChatMessage):
            if self.current_code_state and len(self.current_code_state.strip()) > 0:
                msg.content += f"\n\n[Current Code Editor State]:\n{self.current_code_state}"

        self.agent.start(self.room)
        
        # Initial greeting
        await asyncio.sleep(1)
        await self.agent.say(f"Hi there, thanks for taking the time to interview with {company} today. Before we begin, remember to say 'Completed' when you finish an answer. Can you hear me okay?", allow_interruptions=True)

        self.room.on("disconnected", self.on_disconnected)
        
    def on_disconnected(self):
        logger.info(f"Room disconnected for {self.interview_id}. Moving to evaluation phase.")
        update_interview_status(self.interview_id, "COMPLETED")
        # Trigger async evaluation logic here (Phase 8)
