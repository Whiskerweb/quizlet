import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json({ error: 'Unauthorized - No user found' }, { status: 401 });
    }

    const sessionId = params.id;

    const { data: session, error } = await supabase
      .from('study_sessions')
      .select(`
        *,
        sets:set_id (
          id,
          title
        ),
        answers (
          *,
          flashcards:flashcard_id (
            id,
            front,
            back
          )
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      console.error('[API] Session not found:', error);
      return NextResponse.json({ error: 'Session not found', details: error?.message }, { status: 404 });
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized - Not your session' }, { status: 403 });
    }

    return NextResponse.json(session);
  } catch (error: any) {
    console.error('[API] Error fetching session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}













