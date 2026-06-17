import { Groq } from 'groq-sdk';
import { supabase } from './db';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function analyzeEmotion(messageText) {
  try {
    const systemPrompt = `Role: Senior Emotional Intelligence and Intent Analytics Engine.
Task: Analyze the user's latest message and return ONLY a valid JSON string. Do not include any explanation or markdown block (like \`\`\`json).

JSON Schema:
{
  "intent": "crisis" | "physical_health" | "informational_question" | "humor_or_joke" | "casual_chat" | "emotional_support" | "uncertain",
  "confidence": 0.95,
  "emotion": "primary emotion name in Indonesian (e.g. cemas, sedih, marah, takut, kecewa, lelah, netral)",
  "intensity": "rendah" | "sedang" | "tinggi",
  "sentiment": "positif" | "negatif" | "netral",
  "risk": "rendah" | "sedang" | "tinggi" | "kritis"
}

INTENT RESOLUTION PRIORITY HIERARCHY (HARD RULE):
1. crisis
2. physical_health
3. informational_question
4. humor_or_joke
5. casual_chat
6. emotional_support (ONLY if strong explicit signal)
7. uncertain

INTENT CLASSIFICATION RULES:
- "crisis": Expression of wanting to end life, self-harm, suicide.
- "physical_health": User talks about physical body issues, symptoms, digestion, pain, illness, stool/feces, bowel movements, headaches (e.g., eek ku keras, berak susah, sakit perut, pusing kepala, flu, BAB keras, dll). Do NOT treat physical words as emotional metaphors (e.g. "eek keras" is a digestive query, NOT a metaphor for stubbornness).
- "informational_question": Non-emotional query seeking facts, definitions, explanations, or theories without personal venting/emotional distress (e.g. "siapa presiden indonesia", "cara kerja ginjal").
- "humor_or_joke": Jokes, puns, riddles, hyperbole, playful teasing, sarcasm (e.g. "tebak-tebakan yuk", "aku mau beli Amerika jadi presiden", "hidupku hancur wkwk"). Do NOT turn jokes or sarcasm into psychological problems.
- "casual_chat": Greetings, casual testing of the AI, small talk (e.g. "halo", "lagi apa", "siapa namamu").
- "emotional_support": Strong, explicit sharing of emotional pain, sadness, anxiety, stress, heartbreak, feeling lonely, or burnout. Do NOT escalate to emotional_support unless clearly justified with strong explicit signals.
- "uncertain": Ambiguous, mixed, or vague inputs (e.g. "eek kamu tau eek?", "eek (tai)"). Use this instead of jumping to emotional_support.

CRITICAL RISK EVALUATION RULES:
- Set risk to "kritis" ONLY if there is an explicit plan, active suicide attempt, or immediate life-threatening physical self-harm.
- Set risk to "tinggi" ONLY if there is an explicit expression of wishing to end their life, committing suicide, or performing physical self-harm (e.g., sayat lengan, bunuh diri, mengakhiri hidup).
- Set risk to "sedang" or "rendah" for ALL standard emotional struggles, questions, or daily complaints.
- EXPLICITLY CLASSIFY AS "rendah" (or at most "sedang" if extremely intensely distressed, but NEVER "tinggi" or "kritis") the following everyday struggles:
  * Overthinking (e.g., "Gimana ya cara stop overthinking?")
  * Stres kerja / sekolah / PKL (e.g., "stres banyak tugas/kerjaan")
  * Bingung / capek / lelah / penat / jenuh (e.g., "aku capek banget hari ini")
  * Sedih / kecewa / galau / patah hati / putus cinta (e.g., "baru putus dari pacar")
  * Takut gagal / khawatir masa depan / kurang percaya diri
  * Kesepian / merasa sendiri
  * Burnout / lelah mental
  * General requests for solutions or advice (e.g., "Aku ingin solusi darimu").

LANGUAGE & SLANG UNDERSTANDING:
- Semantically parse Indonesian slang (gw, lu, anjir, eek, berak, tai, pup, BAB, typo words, Indo-English mix) using their semantic meaning rather than static keyword matching.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: messageText }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      max_tokens: 200,
      response_format: { type: "json_object" }
    });

    const resultText = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(resultText);

    // Apply Confidence Override Safety: If confidence < 0.65, override intent to "uncertain"
    if (typeof parsed.confidence === 'number' && parsed.confidence < 0.65) {
      parsed.intent = 'uncertain';
    }

    return parsed;
  } catch (error) {
    console.error('Error analyzing emotion:', error);
    return {
      intent: 'uncertain',
      confidence: 1.0,
      emotion: 'netral',
      intensity: 'rendah',
      sentiment: 'netral',
      risk: 'rendah'
    };
  }
}

export async function getEmotionalContext(userId, messageText) {
  // 1. Jalankan analisis emosi real-time
  const analysis = await analyzeEmotion(messageText);

  // 2. Ambil riwayat mood log sebelumnya dari DB untuk kalkulasi tren/volatilitas
  let emotional_volatility = 'rendah';
  let emotional_trend = 'stabil';

  try {
    const { data: recentMoods, error } = await supabase
      .from('tt_user_moods')
      .select('mood, intensity, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!error && recentMoods && recentMoods.length > 0) {
      // Bandingkan emosi aktif dengan emosi sebelumnya
      const previousMood = recentMoods[0].mood;
      if (previousMood !== analysis.emotion) {
        emotional_volatility = 'sedang';
      }
      if (recentMoods.length >= 2 && recentMoods[0].mood !== recentMoods[1].mood) {
        emotional_volatility = 'tinggi';
      }

      // Deteksi tren sentiment emosi
      const negativeEmotions = ['sedih', 'cemas', 'marah', 'takut', 'kecewa', 'lelah'];
      const currentIsNegative = negativeEmotions.includes(analysis.emotion);
      const prevIsNegative = negativeEmotions.includes(previousMood);

      if (currentIsNegative && !prevIsNegative) {
        emotional_trend = 'memburuk';
      } else if (!currentIsNegative && prevIsNegative) {
        emotional_trend = 'membaik';
      } else {
        emotional_trend = 'stabil';
      }
    }
  } catch (dbErr) {
    console.error('Error fetching mood history for context:', dbErr);
  }

  // 3. Simpan mood log baru ke database (sebagai catatan mood timeline asinkron)
  try {
    await supabase.from('tt_user_moods').insert({
      user_id: userId,
      mood: analysis.emotion,
      intensity: analysis.intensity,
      notes: messageText.slice(0, 200)
    });
  } catch (dbErr) {
    console.error('Error saving mood log to database:', dbErr);
  }

  return {
    ...analysis,
    emotional_volatility,
    emotional_trend
  };
}
