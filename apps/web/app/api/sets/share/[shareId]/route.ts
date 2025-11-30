import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const shareId = params.shareId;
    
    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the set
    const { data: setData, error: setError } = await supabase
      .from('sets')
      .select('*')
      .eq('share_id', shareId)
      .eq('is_public', true)
      .maybeSingle();

    if (setError) {
      console.error('Error fetching set:', setError);
      return NextResponse.json(
        { error: 'Set not found', details: setError.message },
        { status: 404 }
      );
    }

    if (!setData) {
      return NextResponse.json(
        { error: 'Set not found' },
        { status: 404 }
      );
    }

    // Get flashcards
    const { data: flashcardsData, error: flashcardsError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('set_id', setData.id)
      .order('order', { ascending: true });

    if (flashcardsError) {
      console.error('Error fetching flashcards:', flashcardsError);
      // Continue with empty array
    }

    // Get profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, avatar')
      .eq('id', setData.user_id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      // Continue without profile
    }

    // Sort flashcards
    const flashcards = (flashcardsData || []).sort(
      (a: any, b: any) => (a.order || 0) - (b.order || 0)
    );

    return NextResponse.json({
      ...setData,
      flashcards,
      user: profileData
        ? {
            id: profileData.id,
            username: profileData.username,
            avatar: profileData.avatar,
          }
        : undefined,
    });
  } catch (error: any) {
    console.error('Unexpected error in share route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

