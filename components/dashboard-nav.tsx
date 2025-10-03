// app/components/dashboard-nav.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Calendar, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  ChevronDown,
  Home
} from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { ThemeToggle } from './theme-toggle';
import { Clock } from 'lucide-react';

const navigation = [
  { name: 'Kalendar', href: '/dashboard', icon: Calendar },
  { name: 'Zaposleni', href: '/dashboard/employees', icon: Users },
  { name: 'Radno Vrijeme-Grupe', href: '/dashboard/work-groups', icon: Clock },
  { name: 'Izvještaji', href: '/dashboard/reports', icon: FileText },
  { name: 'Podešavanja', href: '/dashboard/settings', icon: Settings },
];

// Helper function to get user initials
const getUserInitials = (email: string) => {
  return email.split('@')[0].substring(0, 2).toUpperCase();
};

export function DashboardNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Fetch user role
      if (user) {
        const { data: userRoleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        setUserRole(userRoleData?.role || 'user');
      }
      
      setLoading(false);
    };
    
    getUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      
      // Fetch user role when auth state changes
      if (session?.user) {
        const { data: userRoleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        setUserRole(userRoleData?.role || 'user');
      } else {
        setUserRole('user');
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'user':
        return 'Korisnik';
      case 'manager':
        return 'Menadžer';
      default:
        return 'Korisnik';
    }
  };

  // Check if we're on the landing page
  const isLandingPage = pathname === '/';

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <Calendar className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Evidencija rada
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Only show when user is logged in AND not on landing page */}
          {user && !isLandingPage && (
            <div className="hidden md:flex items-center space-x-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      pathname === item.href
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            
            {loading ? (
              // Loading state
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Učitavanje...
              </div>
            ) : user ? (
              // User is logged in - show user dropdown
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white text-sm font-medium shadow-sm">
                    {user?.email ? getUserInitials(user.email) : 'U'}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{user?.email}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getRoleDisplayName(userRole)}
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-2">
                      <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                        Prijavljen kao {getRoleDisplayName(userRole)}
                      </div>
                      
                      <Link
                        href="/"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                      >
                        <Home className="h-4 w-4" />
                        <span>Početna stranica</span>
                      </Link>
                      
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          // Navigate to profile page
                        }}
                        className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                      >
                        <User className="h-4 w-4" />
                        <span>Moj profil</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          // Navigate to settings
                        }}
                        className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Podešavanja naloga</span>
                      </button>
                      
                      <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                      
                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Odjava</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // User is not logged in - show login/signup buttons
              <div className="flex space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Prijava
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">
                    Registracija
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              {/* Add Home link to mobile navigation */}
              <Link
                href="/"
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => setIsOpen(false)}
              >
                <Home className="h-5 w-5" />
                <span>Početna stranica</span>
              </Link>
              
              {/* Show navigation links only when user is logged in AND not on landing page */}
              {user && !isLandingPage && navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors',
                      pathname === item.href
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                {loading ? (
                  <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                    Učitavanje...
                  </div>
                ) : user ? (
                  // User is logged in - show user info and logout
                  <>
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full text-white text-sm font-medium">
                          {user?.email ? getUserInitials(user.email) : 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{user?.email}</span>
                          <span className="text-xs text-gray-500">
                            {getRoleDisplayName(userRole)}
                          </span>
                        </div>
                      </div>
                      <ThemeToggle />
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Odjava</span>
                    </button>
                  </>
                ) : (
                  // User is not logged in - show login/signup
                  <div className="flex flex-col space-y-2">
                    <Link
                      href="/auth/login"
                      className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      <span>Prijava</span>
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      <span>Registracija</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}