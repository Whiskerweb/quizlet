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










