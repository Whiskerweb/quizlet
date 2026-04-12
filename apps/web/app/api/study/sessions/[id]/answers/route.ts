import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(
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
        // Create a new supabase client with the token for subsequent operations
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
    const { flashcardId, isCorrect, timeSpent } = body;

    // Verify session ownership
    const { data: session, error: sessionError } = await supabase
      .from('study_sessions')
      .select('id, user_id, completed')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (session.completed) {
      return NextResponse.json({ error: 'Session already completed' }, { status: 400 });
    }

    // Create answer
    const { error: answerError } = await supabase
      .from('answers')
      .insert({
        session_id: sessionId,
        flashcard_id: flashcardId,
        is_correct: isCorrect,
        time_spent: timeSpent || null,
      });

    if (answerError) {
      return NextResponse.json({ error: answerError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Answer submitted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}










