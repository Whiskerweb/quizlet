import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@supabase/supabase-js';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = request.cookies;
    let supabase;
    let user;

    // Try to get user from cookies first (SSR client)
    const serverSupabase = await createClient();
    const { data: { user: cookieUser } } = await serverSupabase.auth.getUser();
    if (cookieUser) {
      supabase = serverSupabase;
      user = cookieUser;
    } else {
      // If no user from cookies, try from Authorization header (client-side fetch)
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const tokenSupabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        });
        const { data: { user: tokenUser } } = await tokenSupabase.auth.getUser();
        if (tokenUser) {
          supabase = tokenSupabase;
          user = tokenUser;
        }
      }
    }

    if (!user || !supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = params.id;
    const body = await request.json().catch(() => ({}));
    const { score } = body;

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Update session to completed
    const { data: updatedSession, error: updateError } = await supabase
      .from('study_sessions')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        score: score !== undefined ? score : null,
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to complete session:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Session completed', session: updatedSession });
  } catch (error: any) {
    console.error('Session completion error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
