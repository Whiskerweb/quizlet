import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { setId, mode } = body;

    // Get set and flashcards
    const { data: set, error: setError } = await supabase
      .from('sets')
      .select(`
        id,
        flashcards (*)
      `)
      .eq('id', setId)
      .single();

    if (setError || !set) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 });
    }

    if (!set.flashcards || set.flashcards.length === 0) {
      return NextResponse.json({ error: 'Set has no flashcards' }, { status: 400 });
    }

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('study_sessions')
      .insert({
        user_id: user.id,
        set_id: setId,
        mode,
        total_cards: set.flashcards.length,
      })
      .select(`
        *,
        sets:set_id (
          id,
          title
        )
      `)
      .single();

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    // Increment studies count
    await supabase.rpc('increment_set_studies', { set_id_param: setId });

    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

