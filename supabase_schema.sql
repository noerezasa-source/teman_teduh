-- Create tt_user_profiles table
CREATE TABLE IF NOT EXISTS public.tt_user_profiles (
    user_id TEXT PRIMARY KEY,
    nickname TEXT,
    stressors TEXT,
    coping_mechanisms TEXT,
    important_relationships TEXT,
    user_goals TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tt_user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all actions for anonymous users
CREATE POLICY "Allow anonymous full access on tt_user_profiles" 
ON public.tt_user_profiles 
FOR ALL 
USING (true) 
WITH CHECK (true);


-- Create tt_chat_messages table
CREATE TABLE IF NOT EXISTS public.tt_chat_messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    sender TEXT NOT NULL, -- 'user' or 'assistant'
    message_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tt_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all actions for anonymous users
CREATE POLICY "Allow anonymous full access on tt_chat_messages" 
ON public.tt_chat_messages 
FOR ALL 
USING (true) 
WITH CHECK (true);


-- Create tt_session_reflections table
CREATE TABLE IF NOT EXISTS public.tt_session_reflections (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    topic TEXT,
    emotion_shift TEXT,
    challenges TEXT,
    progress TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tt_session_reflections ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all actions for anonymous users
CREATE POLICY "Allow anonymous full access on tt_session_reflections" 
ON public.tt_session_reflections 
FOR ALL 
USING (true) 
WITH CHECK (true);
