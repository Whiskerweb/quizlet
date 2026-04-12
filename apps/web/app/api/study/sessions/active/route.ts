import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// GET /api/study/sessions/active - Get user's active (incomplete) sessions
export async function GET(request: NextRequest) {
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

    // Get set_id from query params (optional filter)
    const { searchParams } = new URL(request.url);
    const setId = searchParams.get('setId');

    let query = supabase
      .from('study_sessions')
      .select(`
        *,
        sets:set_id (
          id,
          title
        )
      `)
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('started_at', { ascending: false });

    if (setId) {
      query = query.eq('set_id', setId);
    }

    const { data: sessions, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(sessions || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
