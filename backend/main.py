import asyncio
import logging
from dotenv import load_dotenv
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli
from agent import MockMateAgent

load_dotenv()
logging.basicConfig(level=logging.INFO)

async def entrypoint(ctx: JobContext):
    # Retrieve the interview_id from the room name
    interview_id = ctx.room.name
    logging.info(f"Starting agent for interview: {interview_id}")
    
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    
    agent = MockMateAgent(ctx.room, interview_id)
    await agent.start()

if __name__ == "__main__":
    # The LiveKit CLI handles starting the worker and connecting to the server.
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
