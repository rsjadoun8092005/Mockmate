import os
from supabase import create_client, Client

def get_supabase_client() -> Client:
    url: str = os.environ.get("SUPABASE_URL", "")
    key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        raise ValueError("Supabase URL and Service Role Key must be set in environment variables.")
    return create_client(url, key)

def fetch_interview_context(interview_id: str):
    supabase = get_supabase_client()
    response = supabase.table("interviews").select("*").eq("id", interview_id).execute()
    
    if response.data and len(response.data) > 0:
        return response.data[0]
    return None

def update_interview_status(interview_id: str, status: str):
    supabase = get_supabase_client()
    supabase.table("interviews").update({"status": status}).eq("id", interview_id).execute()
