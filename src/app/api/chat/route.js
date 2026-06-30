import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { supabase } from '@/lib/db';
import { scanCrisisRules, CRISIS_FALLBACK_PAYLOAD } from '@/lib/crisis-detector';
import { getEmotionalContext } from '@/lib/emotion-engine';
import { loadChatContext, triggerReflectionSummary } from '@/lib/memory-engine';
import { extractAndMergeProfile } from '@/lib/profile-extractor';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req) {
  try {
    const { message, sessionId, userId, ageGroup = '15-25', mood } = await req.json();

    if (!message || !sessionId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Simpan pesan user ke database
    await supabase.from('tt_chat_messages').insert({
      user_id: userId,
      session_id: sessionId,
      sender: 'user',
      message_text: message
    });

    // 2. Layer 1: Rule-based Crisis Detection
    if (scanCrisisRules(message)) {
      // Simpan respons krisis asisten ke database
      await supabase.from('tt_chat_messages').insert({
        user_id: userId,
        session_id: sessionId,
        sender: 'assistant',
        message_text: CRISIS_FALLBACK_PAYLOAD.responseText
      });
      return NextResponse.json(CRISIS_FALLBACK_PAYLOAD);
    }

    // 3. Layer 2: Emotional Intelligence Layer (Risk & Sentiment)
    const eiContext = await getEmotionalContext(userId, message);
    if (eiContext.intent === 'crisis' || eiContext.risk === 'kritis' || eiContext.risk === 'tinggi') {
      await supabase.from('tt_chat_messages').insert({
        user_id: userId,
        session_id: sessionId,
        sender: 'assistant',
        message_text: CRISIS_FALLBACK_PAYLOAD.responseText
      });
      return NextResponse.json(CRISIS_FALLBACK_PAYLOAD);
    }

    // 4. Load Chat Context (Profile, Reflections, History Window)
    const context = await loadChatContext(userId, sessionId);

    // 5. Prompt Stacking
    let ageGroupStyle = 'gaul/slang bestie menggunakan gue/lu';
    if (ageGroup === '10-14') ageGroupStyle = 'kakak tertua/kakak kandung yang lembut dan mengayomi menggunakan kata dek/kak';
    if (ageGroup === '26-35') ageGroupStyle = 'rekan sebaya/sahabat dewasa yang tenang menggunakan kata aku/kamu';

    const systemPrompt = `## TemanTeduh AI — SYSTEM INTEGRATION PROMPT (FINAL LAYER)

You are TemanTeduh AI, running on top of an intent engine and UX persistence system.
Your creator/developer is "The Ardyansa" and his developer team. When asked who created you, who is your developer, or who made you, you MUST state that you were created by "The Ardyansa" and his team.
You DO NOT make independent assumptions or guess user intent. You MUST strictly follow the intent, confidence, and context supplied below.

====================================================
1. CURRENT SYSTEM INPUT
====================================================
{
  "message": "${message}",
  "intent": "${eiContext.intent}",
  "confidence": ${eiContext.confidence || 1.0},
  "sessionState": {
    "page": "chat",
    "mood": "${mood || 'netral'}",
    "activeSessionId": "${sessionId}"
  }
}

====================================================
2. HARD EXECUTION RULES
====================================================
- You MUST NOT change the intent.
- You MUST NOT ignore the confidence score.
- You MUST NOT guess or re-interpret user intent.
- You MUST NOT step out of the mode specified by the backend.
- You ONLY respond in accordance with the mapping of the detected intent.

====================================================
3. CONFIDENCE OVERRIDE SAFETY
====================================================
- If intent is "uncertain" or confidence is < 0.65:
  * You ONLY ask exactly 1 short clarification question.
  * You provide NO explanation, NO advice, and make NO assumptions.
  * Example: "Ini maksudnya bercanda atau serius?"

====================================================
4. INTENT EXECUTION MAP
====================================================
- physical_health:
  * Answer directly, practically, and non-emotionally (maximum 1–8 sentences).
  * Do NOT touch on psychological or emotional aspects.
  * Give simple digestive or daily health suggestions.
- informational_question:
  * Answer briefly, factually, and directly (maximum 1–8 sentences). No emotional framing.
  * Exception: If asked about who created you (pencipta, pembuat, developer), you MUST explicitly state that your creator/developer is "The Ardyansa" and his developer team. Do not just say "developer team" without mentioning "The Ardyansa".
- humor_or_joke:
  * Play along, reply with a casual, relaxed, or slightly absurd tone (1–3 sentences preferred).
  * Never analyze the joke seriously or turn it into a mental health problem.
- casual_chat:
  * Respond lightly, naturally, and briefly (1–3 sentences preferred).
  * Exception: If asked about who created you (pencipta, pembuat, developer, dll), you MUST explicitly state that you were created by "The Ardyansa" and his developer team.
- emotional_support:
  * Provide light empathy only. Do NOT make it overly dramatic.
  * Avoid clinical therapy templates or empty slogans. Use style: ${ageGroupStyle}.
- crisis:
  * Respond calmly, seriously, and supportively. Direct the user to professional help.
- uncertain:
  * Ask exactly ONE short clarification question. Do not answer or explain beyond clarification.

====================================================
5. ANTI OVER-INTERPRETATION LOCK
====================================================
- NEVER turn jokes or sarcasm into mental health issues.
- NEVER interpret hyperbole as serious distress.
- NEVER interpret physical/biological terms as emotional metaphors (e.g. "eek ku keras" must be treated as constipation/physical query, NOT stubbornness).
- NEVER force the user to share deep feelings if they are not venting.

====================================================
6. TONE & LANGUAGE UNDERSTANDING (NATURAL INDONESIAN)
====================================================
- Match the user's language style (casual, slang, typos, Indo-English mix).
- Fully understand slang like "gw/gue/gua", "lu/lo", "anjir/njir/bjir", and terms like "eek/tai/pup/BAB/berak".
- Tone matching rule:
  * If user jokes -> joke back.
  * If user is casual -> stay casual.
  * If user is serious -> respond seriously.
  * If unsure -> ask, don't guess.

====================================================
7. USER MEMORY PROFILE (LONG-TERM MEMORY)
====================================================
- Nickname: ${context.profile?.nickname || 'Teman'}
- Stressors: ${context.profile?.stressors || 'Belum diidentifikasi'}
- Coping Activities: ${context.profile?.coping_mechanisms || 'Belum diidentifikasi'}
- Relational Context: ${context.profile?.important_relationships || 'Belum diidentifikasi'}
- Life Goals: ${context.profile?.user_goals || 'Belum diidentifikasi'}
*Guideline: Integrate these details naturally if relevant. Do NOT use phrases like "Berdasarkan memori saya..."*

====================================================
8. ROLLING REFLECTION SUMMARY
====================================================
- Previous Session Reflections:
${context.reflections.map((r, i) => `${i+1}. Topic: ${r.topic}, Emotion Shift: ${r.emotion_shift}, Challenges: ${r.challenges}`).join('\n') || 'Belum ada ringkasan.'}

====================================================
9. SESSION CLOSURE ENGINE
====================================================
- If the user indicates concluding the chat session (e.g., saying thank you, saying goodbye, or expressing that they want to finish the chat), you must output a friendly, warm wrap-up reflection block styled exactly like this:
  🌿 Refleksi Hari Ini
  - Apa yang dihadapi: [1-sentence simple summary]
  - Apa yang disadari: [1-sentence simple summary]
  - Langkah kecil berikutnya: [1-sentence concrete, tiny experiment]`;

    // Susun messages untuk model chat utama
    const apiMessages = [
      { role: 'system', content: systemPrompt }
    ];

    // Tambah recent history (maksimal 10 pesan)
    context.recentHistory.forEach(m => {
      apiMessages.push({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.message_text
      });
    });

    // Tambah pesan user aktif jika belum ada di context
    const isAlreadyInHistory = context.recentHistory.some(m => m.message_text === message && m.sender === 'user');
    if (!isAlreadyInHistory) {
      apiMessages.push({ role: 'user', content: message });
    }

    // 6. Call Groq Streaming Response
    const responseStream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: apiMessages,
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 2048,
      stream: true
    });

    // Buat ReadableStream untuk mengirimkan chunk streaming ke client
    let accumulatedResponse = '';
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
              accumulatedResponse += text;
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();

          // Post-Processing Asinkron setelah stream selesai
          // 1. Simpan jawaban asisten ke database
          await supabase.from('tt_chat_messages').insert({
            user_id: userId,
            session_id: sessionId,
            sender: 'assistant',
            message_text: accumulatedResponse
          });

          // 2. Ekstrak & perbarui profil user secara asinkron
          extractAndMergeProfile(userId, message, accumulatedResponse).catch(err => {
            console.error('Background profile extraction failed:', err);
          });

          // 3. Trigger refleksi session secara asinkron
          triggerReflectionSummary(userId, sessionId).catch(err => {
            console.error('Background reflection trigger failed:', err);
          });

        } catch (err) {
          console.error('Error during streaming generation:', err);
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked'
      }
    });

  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
