'use client';

import { useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { useAuthStore } from '@/store/authStore';
import { Database } from '@/lib/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setProfile, setLoading } = useAuthStore();

    useEffect(() => {
        const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUser(session.user);

                if (['INITIAL_SESSION', 'SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
                    try {
                        const { data } = await supabaseBrowser
                            .from('profiles')
                            .select('*')
                            .eq('id', session.user.id)
                            .single();
                        setProfile(data as Profile | null);
                    } catch {
                        setProfile(null);
                    }
                }
            } else {
                setUser(null);
                setProfile(null);
            }

            // INITIAL_SESSION fires exactly once on startup — unblock the loading state
            if (event === 'INITIAL_SESSION') {
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [setUser, setProfile, setLoading]);

    return <>{children}</>;
}
