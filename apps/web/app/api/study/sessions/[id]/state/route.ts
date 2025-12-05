import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// PATCH /api/study/sessions/[id]/state - Update session state (for persistence)
export async function PATCH(
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = params.id;
    const body = await request.json();
    const { sessionState } = body;

    console.log('[API] Updating session state:', {
      sessionId,
      userId: user.id,
      stateKeys: sessionState ? Object.keys(sessionState) : 'null',
      currentIndex: sessionState?.currentIndex,
      cardsCount: sessionState?.cards?.length,
    });

    // Verify session ownership
    const { data: existingSession, error: fetchError } = await supabase
      .from('study_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (fetchError) {
      console.error('[API] Error fetching session:', fetchError);
      return NextResponse.json({ error: `Session fetch error: ${fetchError.message}` }, { status: 404 });
    }

    if (!existingSession || existingSession.user_id !== user.id) {
      console.error('[API] Unauthorized access attempt:', {
        exists: !!existingSession,
        sessionUserId: existingSession?.user_id,
        requestUserId: user.id,
      });
      return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 403 });
    }

    // Update session state
    const { data: session, error } = await supabase
      .from('study_sessions')
      .update({ session_state: sessionState })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('[API] Error updating session state:', error);
      
      // Check if column exists
      if (error.message?.includes('column') && error.message?.includes('session_state')) {
        console.error('[API] ⚠️ Column session_state does not exist! Run migration: supabase/add_session_parameters.sql');
        return NextResponse.json({ 
          error: 'Database migration required', 
          details: 'Column session_state does not exist. Run supabase/add_session_parameters.sql',
        }, { status: 500 });
      }
      
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    console.log('[API] ✅ Session state updated successfully');
    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
