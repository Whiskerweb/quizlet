'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { TopSearchBar } from '@/components/layout/TopSearchBar';
import { Button } from '@/components/ui/Button';
import { User, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { setUser, setProfile, setLoading, user, profile, logout } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setProfile(profile);
        }
      } else {
        router.push('/login');
        return;
      }
      
      setLoading(false);
      setIsChecking(false);
    };

    checkAuth();
  }, [router, setUser, setProfile, setLoading, supabase]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  // Show nothing while checking to avoid hydration mismatch
  if (isChecking) {
    return (
      <div className="min-h-screen bg-dark-background-base flex items-center justify-center app-shell">
        <p className="text-dark-text-secondary">Loading...</p>
      </div>
    );
  }

  // If no user after checking, show nothing (redirect is happening)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-background-base app-shell flex">
      {/* Sidebar */}
      <SidebarNav />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-[260px]">
        {/* Top Bar */}
        <header className="h-16 border-b border-[rgba(255,255,255,0.06)] bg-dark-background-base flex items-center px-8 gap-4">
          <TopSearchBar />
          <div className="flex items-center gap-3">
            <Link href={`/profile/${profile?.username}`}>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[999px] bg-dark-background-cardMuted border-2 border-[rgba(255,255,255,0.12)] flex items-center justify-center">
                  <User className="h-4 w-4 text-dark-text-secondary" />
                </div>
                <span className="text-[14px] text-dark-text-secondary">{profile?.username}</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1120px] mx-auto px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

