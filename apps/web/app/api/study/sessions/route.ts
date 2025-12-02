import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { set_id, mode, total_cards } = body;

    if (!set_id || !mode || !total_cards) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create study session
    const { data: session, error } = await supabase
      .from('study_sessions')
      .insert({
        set_id,
        mode,
        total_cards,
        user_id: user.id,
        completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create session:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(session);
  } catch (error: any) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
