import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
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








