import os
import json
import logging
import google.generativeai as genai
from db_client import get_supabase_client

logger = logging.getLogger("Evaluator")

def generate_report(interview_id: str, context: dict, code_state: str, transcript: list):
    """
    Calls Gemini Pro to evaluate the interview and saves the result to Supabase.
    """
    logger.info(f"Starting evaluation for {interview_id}")
    
    # 1. Setup Gemini
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.error("GEMINI_API_KEY not found in environment.")
        return
        
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-pro')

    # 2. Build the Rubric Prompt
    company = context.get("company_name", "the company")
    jd = context.get("job_description", "")
    resume = context.get("resume_text", "")
    
    prompt = f"""You are a strict but fair Principal Engineering Manager at {company}.
Review the following mock interview transcript and code.

Candidate Resume:
{resume}

Job Description:
{jd}

Final Code State:
```
{code_state}
```

Transcript:
{json.dumps(transcript, indent=2)}

Output a JSON object matching the exact schema below. Grade the candidate out of 100 based on technical accuracy, communication clarity, and behavioral fit.
Do NOT include markdown block markers (like ```json), just output the raw JSON object.

SCHEMA:
{{
  "overall_score": 85,
  "metrics": {{
    "technical": 80,
    "communication": 90,
    "problem_solving": 85
  }},
  "strengths": ["string", "string"],
  "weaknesses": ["string", "string"],
  "detailed_feedback": "string",
  "recommended_study_topics": ["string", "string"]
}}
"""

    try:
        response = model.generate_content(prompt)
        # Parse the JSON
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
            
        evaluation_data = json.loads(response_text)
        
        # 3. Save to Supabase
        supabase = get_supabase_client()
        supabase.table("evaluations").insert({
            "interview_id": interview_id,
            "transcript": transcript,
            "code_history": code_state,
            "overall_score": evaluation_data.get("overall_score", 0),
            "strengths": evaluation_data.get("strengths", []),
            "weaknesses": evaluation_data.get("weaknesses", []),
            "technical_feedback": evaluation_data.get("detailed_feedback", ""),
            "communication_feedback": json.dumps(evaluation_data.get("metrics", {})),
        }).execute()
        
        logger.info(f"Evaluation completed and saved for {interview_id}")
        
    except Exception as e:
        logger.error(f"Failed to generate or save evaluation: {e}")
