import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
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

    // Get session with answers
    const { data: session, error: sessionError } = await supabase
      .from('study_sessions')
      .select(`
        *,
        answers (*)
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (session.completed) {
      return NextResponse.json(session);
    }

    // Calculate score
    const correctAnswers = session.answers.filter((a: any) => a.is_correct).length;
    const totalAnswers = session.answers.length;
    const score = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from('study_sessions')
      .update({
        completed: true,
        score,
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
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
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Calculate study time in minutes
    const totalStudyTime = session.answers.reduce((acc: number, a: any) => acc + (a.time_spent || 0), 0) / 60000;

    // Update user stats
    const { data: userStats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (userStats) {
      const totalSessions = userStats.total_sessions + 1;
      const totalStudyTimeMinutes = userStats.total_study_time + Math.round(totalStudyTime);
      const averageScore = ((userStats.average_score * (totalSessions - 1)) + score) / totalSessions;

      await supabase
        .from('user_stats')
        .update({
          total_sessions: totalSessions,
          total_study_time: totalStudyTimeMinutes,
          average_score: Math.round(averageScore * 100) / 100,
        })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('user_stats')
        .insert({
          user_id: user.id,
          total_sessions: 1,
          total_study_time: Math.round(totalStudyTime),
          average_score: score,
        });
    }

    // Update set stats
    const { data: setStats } = await supabase
      .from('set_stats')
      .select('*')
      .eq('set_id', session.set_id)
      .single();

    if (setStats) {
      const totalStudies = setStats.studies;
      const newAverageScore = ((setStats.average_score * totalStudies) + score) / (totalStudies + 1);

      await supabase
        .from('set_stats')
        .update({
          average_score: Math.round(newAverageScore * 100) / 100,
        })
        .eq('set_id', session.set_id);
    }

    return NextResponse.json(updatedSession);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}





