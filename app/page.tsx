// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, Users, FileText, Shield } from 'lucide-react';
import { DashboardNav } from '@/components/dashboard-nav';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    
    getUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Add skip to main content link for keyboard users
  useEffect(() => {
    // Focus management for better accessibility
    if (!loading && user) {
      // If user is logged in, ensure focus is managed properly
      const mainElement = document.querySelector('main');
      if (mainElement && !mainElement.hasAttribute('tabindex')) {
        mainElement.setAttribute('tabindex', '-1');
      }
    }
  }, [loading, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-blue-950 dark:to-gray-900">
      {/* Skip to main content link for screen readers */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
      >
        Preskoči na glavni sadržaj
      </a>

      {/* Use DashboardNav as the main header */}
      <DashboardNav />

      <main id="main-content" className="container mx-auto px-4 py-16" tabIndex={-1}>
        <section className="text-center space-y-8" aria-labelledby="main-heading">
          <h1 id="main-heading" className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            Moderna evidencija radnog vremena
            <br />
            <span className="text-blue-600 dark:text-blue-400">i odsustva zaposlenih</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Kompletno rešenje za praćenje radnih sati, godišnjih odmora, bolovanja 
            i drugih vrsta odsustva uz napredne izveštaje i PDF generatore.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
            {user ? (
              // If user is logged in, show dashboard button
              <Link 
                href="/dashboard" 
                className="inline-flex"
                aria-label="Idite na kontrolnu tablu"
              >
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                >
                  Idite na Dashboard
                </Button>
              </Link>
            ) : (
              // If user is not logged in, show signup/login buttons
              <>
                <Link 
                  href="/auth/signup" 
                  className="inline-flex"
                  aria-label="Započnite besplatnu probu"
                >
                  <Button 
                    size="lg" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                  >
                    Započnite besplatno
                  </Button>
                </Link>
                <Link 
                  href="/auth/login" 
                  className="inline-flex"
                  aria-label="Prijavite se na vaš nalog"
                >
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="px-8 py-3 text-lg border-2"
                  >
                    Prijavite se
                  </Button>
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20" aria-labelledby="features-heading">
          <h2 id="features-heading" className="sr-only">Karakteristike platforme</h2>
          
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
            <Users 
              className="h-12 w-12 text-blue-600 mx-auto mb-4" 
              aria-hidden="true"
            />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Upravljanje zaposlenima
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Organizujte zaposlene u grupe sa različitim radnim časovima
            </p>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
            <Calendar 
              className="h-12 w-12 text-blue-600 mx-auto mb-4" 
              aria-hidden="true"
            />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Kalendarski prikaz
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Vizuelni prikaz odsustva po mjesecima i godinama
            </p>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
            <FileText 
              className="h-12 w-12 text-blue-600 mx-auto mb-4" 
              aria-hidden="true"
            />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              PDF izvještaji
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Generišite detaljne mjesečne i godišnje izvještaje
            </p>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
            <Shield 
              className="h-12 w-12 text-blue-600 mx-auto mb-4" 
              aria-hidden="true"
            />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Bezbedna platforma
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              RBAC sa admin i korisničkim ulogama
            </p>
          </div>
        </section>

        {/* Additional section for logged-in users */}
        {user && (
          <section className="mt-20 text-center" aria-labelledby="welcome-back-heading">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8 border border-blue-200 dark:border-blue-800">
              <h2 id="welcome-back-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Dobrodošli nazad, <span className="text-blue-600 dark:text-blue-400">{user.email}</span>!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
                Nastavite sa upravljanjem odsustvima ili pregledajte najnovije statistike.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link 
                  href="/dashboard" 
                  className="inline-flex"
                  aria-label="Pogledajte kalendar odsustva"
                >
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                  >
                    Kalendar odsustva
                  </Button>
                </Link>
                <Link 
                  href="/dashboard/employees" 
                  className="inline-flex"
                  aria-label="Upravljajte zaposlenima"
                >
                  <Button 
                    variant="outline"
                    className="px-6 py-2 border-2"
                  >
                    Upravljanje zaposlenima
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Loading state for better UX */}
        {loading && (
          <div 
            className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50"
            role="status"
            aria-live="polite"
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Učitavanje...</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer for better structure */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-20">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            &copy; {new Date().getFullYear()} Evidencija rada. Sva prava zadržana.
          </p>
        </div>
      </footer>
    </div>
  );
}