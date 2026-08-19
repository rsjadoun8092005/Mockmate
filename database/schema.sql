-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: interviews
CREATE TYPE interview_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

CREATE TABLE public.interviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  job_description TEXT NOT NULL,
  resume_text TEXT NOT NULL,
  status interview_status DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: evaluations
CREATE TABLE public.evaluations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE,
  transcript JSONB NOT NULL,
  code_history TEXT NOT NULL,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  strengths TEXT[],
  weaknesses TEXT[],
  technical_feedback TEXT,
  communication_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Setup Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Policies for public.users
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Policies for public.interviews
CREATE POLICY "Users can view their own interviews" ON public.interviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own interviews" ON public.interviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own interviews" ON public.interviews FOR UPDATE USING (auth.uid() = user_id);

-- Policies for public.evaluations
CREATE POLICY "Users can view their own evaluations" ON public.evaluations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.interviews WHERE interviews.id = evaluations.interview_id AND interviews.user_id = auth.uid())
);
-- Note: Python worker uses service_role key which bypasses RLS for inserting evaluations

-- Trigger to auto-create public.user upon auth.user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
