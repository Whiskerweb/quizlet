import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const shareId = params.shareId;
    
    console.log('[API] Getting set with shareId:', shareId);
    
    if (!shareId) {
      console.error('[API] No shareId provided');
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      );
    }

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[API] Missing Supabase environment variables');
      console.error('[API] URL:', supabaseUrl ? 'Set' : 'Missing');
      console.error('[API] Key:', supabaseKey ? 'Set' : 'Missing');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    console.log('[API] Creating Supabase client...');
    const supabase = await createClient();
    console.log('[API] Supabase client created');

    // Get the set - try without is_public filter first to see if set exists
    console.log('[API] Querying sets table...');
    const { data: setData, error: setError } = await supabase
      .from('sets')
      .select('*')
      .eq('share_id', shareId)
      .maybeSingle();

    if (setError) {
      console.error('[API] Error fetching set:', setError);
      console.error('[API] Error code:', setError.code);
      console.error('[API] Error message:', setError.message);
      console.error('[API] Error details:', setError.details);
      console.error('[API] Error hint:', setError.hint);
      return NextResponse.json(
        { 
          error: 'Set not found', 
          details: setError.message,
          code: setError.code,
          hint: setError.hint
        },
        { status: 404 }
      );
    }

    if (!setData) {
      console.error('[API] No set data returned for shareId:', shareId);
      return NextResponse.json(
        { error: 'Set not found' },
        { status: 404 }
      );
    }

    console.log('[API] Set found:', {
      id: setData.id,
      title: setData.title,
      is_public: setData.is_public,
      has_password: !!setData.password_hash,
      share_id: setData.share_id
    });

    // Check if set is public
    if (!setData.is_public) {
      console.log('[API] Set is not public');
      return NextResponse.json(
        { error: 'Set is not public' },
        { status: 403 }
      );
    }

    // Get flashcards
    console.log('[API] Fetching flashcards for set:', setData.id);
    const { data: flashcardsData, error: flashcardsError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('set_id', setData.id)
      .order('order', { ascending: true });

    if (flashcardsError) {
      console.error('[API] Error fetching flashcards:', flashcardsError);
      // Continue with empty array
    } else {
      console.log('[API] Flashcards fetched:', flashcardsData?.length || 0);
    }

    // Get profile
    console.log('[API] Fetching profile for user:', setData.user_id);
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, avatar')
      .eq('id', setData.user_id)
      .maybeSingle();

    if (profileError) {
      console.error('[API] Error fetching profile:', profileError);
      // Continue without profile
    } else {
      console.log('[API] Profile fetched:', profileData?.username || 'none');
    }

    // Sort flashcards
    const flashcards = (flashcardsData || []).sort(
      (a: any, b: any) => (a.order || 0) - (b.order || 0)
    );

    const result = {
      ...setData,
      flashcards,
      user: profileData
        ? {
            id: profileData.id,
            username: profileData.username,
            avatar: profileData.avatar,
          }
        : undefined,
    };

    console.log('[API] Returning set data successfully');
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] Unexpected error in share route:', error);
    console.error('[API] Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

