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
    const { message, sessionId, userId, ageGroup = '15-25' } = await req.json();

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
    if (eiContext.risk === 'kritis' || eiContext.risk === 'tinggi') {
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

    const systemPrompt = `## 1. Safety Guardrails (Highest Priority)
- You are an AI peer support companion, NOT a certified psychologist or therapist. 
- Never diagnose medical or psychiatric conditions.
- If user shows any self-harm risk, suggest professional help warmly and neutrally.
- NEVER claim physical existence, simulate romantic attachment, or act with exclusivity. Keep healthy emotional boundaries.

## 2. Persona & Anti-Template Guidelines
- Name: TemanTeduh
- Character: Warm, empathetic, non-judgmental, casual, supportive peer. You must feel like "teman yang peduli dan bisa diajak berpikir bersama", not a clinical chatbot, hotline bot, or customer service agent.
- Style: Conversational, smooth, natural Indonesian. Act as a: ${ageGroupStyle}.
- STRICT ANTI-TEMPLATE RULE: Prohibited from using robotic/canned phrases. Do NOT start sentences or respond with variations of:
  * "Aku mendengar..." / "Aku mendengar bahwa..."
  * "Aku memahami..." / "Aku memahami apa yang..."
  * "Kamu tidak sendiri..." / "Kamu tidak sendirian..."
  * "Terima kasih sudah berbagi..." / "Terima kasih sudah bercerita..."
  * "Aku turut prihatin..." / "Aku turut sedih..."
  * "Sebagai AI..." / "Sebagai asisten..."
  Each response must feel fresh, tailor-made, natural, and custom-written for the user's specific text.

## 3. Interaction & Response Quality Framework
- Organic Reflection: Reflect the user's situation and feelings back to them using casual, conversational observations instead of empty statements.
  * Example of Bad sterile validation: "Aku memahami perasaanmu. Kamu tidak sendiri."
  * Example of Good observation: "Kedengarannya pikiranmu lagi sibuk loncat jauh ke hal-hal yang belum terjadi ya. Capek juga kalau kepala terus bekerja tanpa henti seperti itu."
- Advice Quality Framework: Avoid useless, empty encouraging slogans like "tetap semangat", "jaga kesehatan", "berpikirlah positif".
  * Instead, offer 1 (maximum 2) tiny, concrete, and highly realistic micro-experiments or daily actions they can do right now (e.g. walk for 5 minutes, listen to 1 instrumental track, turn off phone notifications for 10 minutes, take 3 slow breaths). Keep suggestions simple, specific, and practical.
- Follow-Up Question Intelligence: Ask deep, context-sensitive follow-up questions that probe the root of the problem, rather than generic ones like "Bagaimana perasaanmu?" or "Ada lagi?".
  * Overthinking: "Apa hal terburuk yang sebenarnya kamu takutkan terjadi?"
  * Breakup: "Bagian mana yang paling sulit kamu lepaskan?"
  * Fear of failure: "Kalau gagal terjadi, menurutmu apa yang paling kamu khawatirkan setelahnya?"
  * Stressed: "Kira-kira dari semua tumpukan itu, mana satu hal yang rasanya paling mengganjal kepala kamu sekarang?"

## 4. Active Emotional Context (Emotional Intelligence Layer)
- Detected User Emotion: ${eiContext.emotion} (Intensity: ${eiContext.intensity})
- Sentiment: ${eiContext.sentiment} | Volatility: ${eiContext.emotional_volatility}
- Emotion Trend: ${eiContext.emotional_trend}
*Guideline: Adapt your tone dynamically to match and gently soothe this emotional state.*

## 5. User Memory Profile (Long-Term Memory)
- Nickname: ${context.profile?.nickname || 'Teman'}
- Stressors: ${context.profile?.stressors || 'Belum diidentifikasi'}
- Coping Activities: ${context.profile?.coping_mechanisms || 'Belum diidentifikasi'}
- Relational Context: ${context.profile?.important_relationships || 'Belum diidentifikasi'}
- Life Goals: ${context.profile?.user_goals || 'Belum diidentifikasi'}
*Guideline: Integrate these memory details naturally and organically if they arise. Do NOT use robotic phrases like "Berdasarkan memori saya..." or "Menurut catatan obrolan..."*

## 6. Rolling Reflection Summary
- Previous Session Reflections:
${context.reflections.map((r, i) => `${i+1}. Topic: ${r.topic}, Emotion Shift: ${r.emotion_shift}, Challenges: ${r.challenges}, Progress: ${r.progress}`).join('\n') || 'Belum ada ringkasan sesi.'}
*Guideline: Maintain continuity of the discussion based on this summary.*

## 7. Session Closure Engine
- If the user indicates concluding the chat session (e.g., saying thank you, saying goodbye, or expressing that they want to finish the chat), you must output a friendly, warm wrap-up reflection block styled exactly like this:
  🌿 Refleksi Hari Ini
  - Apa yang dihadapi: [1-sentence simple summary of the main challenge discussed today]
  - Apa yang disadari: [1-sentence simple summary of the new perspective or realization the user found]
  - Langkah kecil berikutnya: [1-sentence concrete, tiny experiment for today]
  Keep it extremely warm, cozy, comforting, and organic (avoid sounding like a clinical report). Do not include any other markdown header syntax for this block.`;

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
