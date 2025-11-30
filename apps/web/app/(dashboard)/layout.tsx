'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { TopSearchBar } from '@/components/layout/TopSearchBar';
import { Button } from '@/components/ui/Button';
import { User, LogOut, Menu } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { setUser, setProfile, setLoading, user, profile, logout } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const supabase = createClient();

  // Detect mobile and handle sidebar state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const sidebarWidth = isSidebarOpen ? (isMobile ? '260px' : '260px') : (isMobile ? '0px' : '80px');

  return (
    <div className="min-h-screen bg-dark-background-base app-shell flex">
      {/* Sidebar */}
      <SidebarNav 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMobile={isMobile}
      />

      {/* Main Content Area */}
      <div 
        className="flex-1 flex flex-col transition-all duration-300 ease-in-out"
        style={{ 
          marginLeft: isMobile ? '0' : sidebarWidth 
        }}
      >
        {/* Top Bar */}
        <header className="h-16 border-b border-[rgba(255,255,255,0.06)] bg-dark-background-base flex items-center px-4 sm:px-6 lg:px-8 gap-4">
          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <TopSearchBar className="flex-1" />
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href={`/profile/${profile?.username}`}>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[999px] bg-dark-background-cardMuted border-2 border-[rgba(255,255,255,0.12)] flex items-center justify-center">
                  <User className="h-4 w-4 text-dark-text-secondary" />
                </div>
                <span className="hidden sm:inline text-[14px] text-dark-text-secondary">
                  {profile?.username}
                </span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="flex-shrink-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

