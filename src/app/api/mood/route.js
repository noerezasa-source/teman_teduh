import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function POST(req) {
  try {
    const { userId, mood, intensity, notes = '' } = await req.json();

    if (!userId || !mood || !intensity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase.from('tt_user_moods').insert({
      user_id: userId,
      mood,
      intensity,
      notes
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Mood successfully recorded.' });
  } catch (error) {
    console.error('Error posting mood log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tt_user_moods')
      .select('id, mood, intensity, notes, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30); // Limit to last 30 entries for display optimization

    if (error) {
      throw error;
    }

    return NextResponse.json({ history: data || [] });
  } catch (error) {
    console.error('Error getting mood logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
