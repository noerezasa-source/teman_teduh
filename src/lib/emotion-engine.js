import { Groq } from 'groq-sdk';
import { supabase } from './db';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function analyzeEmotion(messageText) {
  try {
    const systemPrompt = `Role: Senior Emotional Intelligence Analytics Engine.
Task: Analyze the user's latest message and return ONLY a valid JSON string. Do not include any explanation or markdown block (like \`\`\`json).

JSON Schema:
{
  "emotion": "primary emotion name in Indonesian (e.g. cemas, sedih, marah, takut, kecewa, lelah, netral)",
  "confidence": 0.95,
  "intensity": "rendah" | "sedang" | "tinggi",
  "sentiment": "positif" | "negatif" | "netral",
  "risk": "rendah" | "sedang" | "tinggi" | "kritis"
}

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
  * General requests for solutions or advice (e.g., "Aku ingin solusi darimu").`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: messageText }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      max_tokens: 150,
      response_format: { type: "json_object" }
    });

    const resultText = completion.choices[0]?.message?.content || '{}';
    return JSON.parse(resultText);
  } catch (error) {
    console.error('Error analyzing emotion:', error);
    return {
      emotion: 'netral',
      confidence: 1.0,
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
