'use client';

import { useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { useAuthStore } from '@/store/authStore';
import { Database } from '@/lib/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setProfile, setLoading } = useAuthStore();

    useEffect(() => {
        const initializeAuth = async () => {
            console.log('[AuthProvider] Initializing auth...');
            try {
                // Get initial session
                const { data: { session }, error: sessionError } = await supabaseBrowser.auth.getSession();

                if (sessionError) throw sessionError;

                if (session) {
                    console.log('[AuthProvider] Session found:', session.user.id);
                    setUser(session.user);

                    // Fetch profile
                    const { data: profile, error: profileError } = await supabaseBrowser
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (profileError) {
                        console.warn('[AuthProvider] Profile not found or error:', profileError.message);
                        setProfile(null);
                    } else if (profile) {
                        setProfile(profile as Profile);
                    }
                } else {
                    console.log('[AuthProvider] No session found');
                    setUser(null);
                    setProfile(null);
                }
            } catch (error: any) {
                console.error('[AuthProvider] Auth initialization critical error:', error.message);
                setUser(null);
                setProfile(null);
            } finally {
                console.log('[AuthProvider] Initialization complete, setting loading to false');
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange(async (event, session) => {
            console.log('[AuthProvider] Auth state change event:', event);
            if (session) {
                setUser(session.user);

                // Refresh profile on sign in or token refreshed
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                    const { data: profile } = await supabaseBrowser
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (profile) {
                        setProfile(profile as Profile);
                    }
                }
            } else {
                setUser(null);
                setProfile(null);
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [setUser, setProfile, setLoading]);

    return <>{children}</>;
}
