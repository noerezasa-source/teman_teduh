import { Groq } from 'groq-sdk';
import { supabase } from './db';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 1. Loader untuk konteks memori gabungan
export async function loadChatContext(userId, sessionId) {
  try {
    // Ambil Profil Persona Jangka Panjang
    const { data: profile } = await supabase
      .from('tt_user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Ambil 2 Refleksi Rolling Summary Terakhir
    const { data: reflections } = await supabase
      .from('tt_session_reflections')
      .select('topic, emotion_shift, challenges, progress')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(2);

    // Ambil Recent Conversation Window (10 Pesan Terakhir)
    const { data: messages } = await supabase
      .from('tt_chat_messages')
      .select('sender, message_text')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      profile: profile || null,
      reflections: reflections || [],
      recentHistory: messages ? messages.reverse() : []
    };
  } catch (error) {
    console.error('Error loading chat context:', error);
    return {
      profile: null,
      reflections: [],
      recentHistory: []
    };
  }
}

// 2. Pembuat ringkasan refleksi asinkron (dipanggil jika pesan % 20 === 0)
export async function triggerReflectionSummary(userId, sessionId) {
  try {
    // Hitung jumlah pesan dalam sesi
    const { count, error: countErr } = await supabase
      .from('tt_chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if (countErr) throw countErr;

    // Trigger ringkasan refleksi setiap kelipatan 20 pesan
    if (count > 0 && count % 20 === 0) {
      // Ambil seluruh chat history sesi ini
      const { data: messages } = await supabase
        .from('tt_chat_messages')
        .select('sender, message_text')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!messages || messages.length === 0) return;

      const conversationText = messages
        .map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.message_text}`)
        .join('\n');

      const systemPrompt = `Role: Reflection and Cognitive Progress Summarizer.
Task: Read the entire conversation history provided and generate a concise reflection summary of the session so far. Return ONLY a valid JSON string. Do not write markdown wraps or explanations.

JSON Schema:
{
  "topic": "Concise summary of main topics discussed",
  "emotion_shift": "Description of how user's emotion changed from start to end of the session",
  "challenges": "Current struggles/challenges identified",
  "progress": "Any positive progress, realizations, or breakthroughs shown by the user"
}`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: conversationText }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.2,
        max_tokens: 300,
        response_format: { type: "json_object" }
      });

      const reflectionObj = JSON.parse(completion.choices[0]?.message?.content || '{}');

      // Simpan ke database
      await supabase.from('tt_session_reflections').insert({
        user_id: userId,
        session_id: sessionId,
        topic: reflectionObj.topic || 'Obrolan curhat umum',
        emotion_shift: reflectionObj.emotion_shift || 'Stabil',
        challenges: reflectionObj.challenges || 'Tidak terdeteksi',
        progress: reflectionObj.progress || 'Tidak terdeteksi'
      });
    }
  } catch (error) {
    console.error('Error in triggerReflectionSummary:', error);
  }
}
