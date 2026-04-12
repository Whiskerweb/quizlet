'use client';

import { useEffect, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { useAuthStore } from '@/store/authStore';
import { Database } from '@/lib/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setProfile, setLoading } = useAuthStore();
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (isInitialMount.current) {
            const initializeAuth = async () => {
                console.log('[Auth Provider] Initializing auth...');
                setLoading(true);
                try {
                    // Check initial session
                    const { data: { session }, error: sessionError } = await supabaseBrowser.auth.getSession();

                    if (sessionError) {
                        console.error('[Auth Provider] Session error:', sessionError.message);
                        setLoading(false);
                        return;
                    }

                    if (session?.user) {
                        console.log('[Auth Provider] Session found for:', session.user.email);
                        setUser(session.user);

                        // Fetch profile
                        try {
                            console.log('[Auth Provider] Fetching profile for:', session.user.id);
                            const { data, error: profileError } = await supabaseBrowser
                                .from('profiles')
                                .select('*')
                                .eq('id', session.user.id)
                                .single();

                            if (profileError) {
                                console.warn('[Auth Provider] Profile not found or error:', profileError.message);
                                setProfile(null);
                            } else {
                                console.log('[Auth Provider] Profile loaded successfully');
                                setProfile(data as Profile);
                            }
                        } catch (err) {
                            console.error('[Auth Provider] Unexpected error fetching profile:', err);
                            setProfile(null);
                        }
                    } else {
                        console.log('[Auth Provider] No active session');
                        setUser(null);
                        setProfile(null);
                    }
                } catch (error) {
                    console.error('[Auth Provider] Initialization error:', error);
                } finally {
                    console.log('[Auth Provider] Initialization complete, setting loading=false');
                    setLoading(false);
                    isInitialMount.current = false;
                }
            };

            initializeAuth();

            // Listen for auth state changes
            const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange(async (event, session) => {
                console.log('[Auth Provider] Auth state changed:', event);

                if (session?.user) {
                    setUser(session.user);

                    // Only reload profile if necessary
                    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                        const { data } = await supabaseBrowser
                            .from('profiles')
                            .select('*')
                            .eq('id', session.user.id)
                            .single();
                        setProfile(data as Profile || null);
                    }
                } else {
                    setUser(null);
                    setProfile(null);
                }
            });

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [setUser, setProfile, setLoading]);

    return <>{children}</>;
}
