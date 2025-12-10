import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Try to get user from cookies first
    let supabase = await createClient();
    let { data: { user } } = await supabase.auth.getUser();

    // If no user from cookies, try to get from Authorization header
    if (!user) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const client = createSupabaseClient(supabaseUrl, supabaseAnonKey);
        const { data: { user: tokenUser } } = await client.auth.getUser(token);
        user = tokenUser;
        // Use the client with token for subsequent operations
        supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        });
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { setId, mode, shuffle = false, startFrom = 1, cardOrder, sessionState, forceNew = false } = body;

    console.log('[API] Starting session:', { setId, mode, shuffle, startFrom, forceNew, userId: user.id });

    // Check if there's already an active session for this set/mode
    if (!forceNew) {
      const { data: existingSession } = await supabase
        .from('study_sessions')
        .select(`
          *,
          sets:set_id (
            id,
            title
          )
        `)
        .eq('user_id', user.id)
        .eq('set_id', setId)
        .eq('mode', mode)
        .eq('completed', false)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSession) {
        console.log('[API] Found existing active session:', existingSession.id);
        console.log('[API] Reusing existing session instead of creating a new one');
        return NextResponse.json(existingSession);
      }
    }

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

    // Calculate total cards based on startFrom parameter
    const actualTotalCards = cardOrder ? cardOrder.length : (set.flashcards.length - startFrom + 1);

    console.log('[API] Creating new session:', { setId, mode, totalCards: actualTotalCards });

    // ✅ SECURITY FIX: Validate sessionState if provided
    if (sessionState) {
      // Basic validation to prevent injection
      if (typeof sessionState !== 'object') {
        return NextResponse.json({ error: 'Invalid session state format' }, { status: 400 });
      }

      // Validate queue if present
      if (sessionState.queue && !Array.isArray(sessionState.queue)) {
        return NextResponse.json({ error: 'Invalid session state: queue must be an array' }, { status: 400 });
      }

      // Limit queue size to prevent abuse
      if (sessionState.queue && sessionState.queue.length > 1000) {
        return NextResponse.json({ error: 'Invalid session state: queue too large' }, { status: 400 });
      }

      // Validate cardData if present
      if (sessionState.cardData) {
        if (!Array.isArray(sessionState.cardData)) {
          return NextResponse.json({ error: 'Invalid session state: cardData must be an array' }, { status: 400 });
        }
        if (sessionState.cardData.length > 1000) {
          return NextResponse.json({ error: 'Invalid session state: too many cards' }, { status: 400 });
        }
      }
    }

    // Create session with parameters
    // Try with new columns first, fallback to basic if they don't exist
    let session;
    let sessionError;

    try {
      const result = await supabase
        .from('study_sessions')
        .insert({
          user_id: user.id,
          set_id: setId,
          mode,
          total_cards: actualTotalCards,
          shuffle,
          start_from: startFrom,
          card_order: cardOrder || null,
          session_state: sessionState || null,
        })
        .select(`
          *,
          sets:set_id (
            id,
            title
          )
        `)
        .single();

      session = result.data;
      sessionError = result.error;
    } catch (error: any) {
      // If error is due to missing columns, fallback to basic insert
      console.warn('[API] Failed to create session with new columns, falling back to basic:', error.message);

      const result = await supabase
        .from('study_sessions')
        .insert({
          user_id: user.id,
          set_id: setId,
          mode,
          total_cards: actualTotalCards,
        })
        .select(`
        *,
        sets:set_id (
          id,
          title
        )
      `)
        .single();

      session = result.data;
      sessionError = result.error;
    }

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










