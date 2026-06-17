import { Groq } from 'groq-sdk';
import { supabase } from './db';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function extractAndMergeProfile(userId, userMessage, assistantResponse) {
  try {
    const systemPrompt = `Role: Long-term User Memory Profiler.
Task: Analyze the latest chat exchange between user and assistant. Extract user personal facts and return ONLY a valid JSON string containing fields that have new or updated information. Do not include fields that are not mentioned or haven't changed. Do not include markdown wraps.

JSON Fields:
{
  "nickname": "user preferred name",
  "communication_style": "description of user's typing style (e.g. kasual, sopan, singkat, emosional)",
  "favorite_topics": "comma separated topics user likes to talk about",
  "user_goals": "what the user wants to achieve in life or chat",
  "personality_traits": "apparent traits (e.g. introvert, perfeksionis, sensitif)",
  "preferred_response_length": "short" | "medium" | "long",
  "stressors": "what causes stress for the user",
  "coping_mechanisms": "what helps the user feel better",
  "important_relationships": "key people in user's life (family, friends, partner)"
}`;

    const conversationText = `User: ${userMessage}\nAssistant: ${assistantResponse}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: conversationText }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      max_tokens: 300,
      response_format: { type: "json_object" }
    });

    const extractedJSON = JSON.parse(completion.choices[0]?.message?.content || '{}');

    // Filter keys with meaningful data
    const keys = Object.keys(extractedJSON).filter(
      k => extractedJSON[k] !== undefined && extractedJSON[k] !== null && extractedJSON[k] !== ''
    );
    if (keys.length === 0) return null;

    // Fetch existing profile to merge
    const { data: existingProfile } = await supabase
      .from('tt_user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const mergedProfile = { ...existingProfile, ...extractedJSON, user_id: userId, updated_at: new Date() };

    // Smart merge for specific fields
    if (existingProfile) {
      if (extractedJSON.favorite_topics && existingProfile.favorite_topics) {
        const mergedTopics = Array.from(new Set([
          ...existingProfile.favorite_topics.split(',').map(s => s.trim()),
          ...extractedJSON.favorite_topics.split(',').map(s => s.trim())
        ])).join(', ');
        mergedProfile.favorite_topics = mergedTopics;
      }
      if (extractedJSON.stressors && existingProfile.stressors && !existingProfile.stressors.includes(extractedJSON.stressors)) {
        mergedProfile.stressors = `${existingProfile.stressors}; ${extractedJSON.stressors}`;
      }
      if (extractedJSON.coping_mechanisms && existingProfile.coping_mechanisms && !existingProfile.coping_mechanisms.includes(extractedJSON.coping_mechanisms)) {
        mergedProfile.coping_mechanisms = `${existingProfile.coping_mechanisms}; ${extractedJSON.coping_mechanisms}`;
      }
    }

    // Upsert into Supabase
    const { error } = await supabase.from('tt_user_profiles').upsert(mergedProfile);
    if (error) {
      console.error('Error upserting memory profile:', error);
    }

    return mergedProfile;
  } catch (error) {
    console.error('Error in profile-extractor:', error);
    return null;
  }
}
