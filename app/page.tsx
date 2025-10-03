// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, Users, FileText, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { DashboardNav } from '@/components/dashboard-nav';
import { supabase } from '@/lib/supabase';

// Feature card component for better reusability and performance
const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
}) => {
  return (
    <div className="group text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col transform hover:-translate-y-1">
      <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors duration-300">
        <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 leading-relaxed flex-grow">
        {description}
      </p>
    </div>
  );
};

// Loading component with skeleton UI
const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
      <p className="text-gray-600 dark:text-gray-300">Učitavanje...</p>
    </div>
  </div>
);

// Main component with optimizations
export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
        // Trigger animations after component mounts
        setTimeout(() => setIsVisible(true), 100);
      }
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

  if (loading) {
    return <LoadingState />;
  }

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

      <main id="main-content" className="container mx-auto px-4 py-16 md:py-24" tabIndex={-1}>
        <section className={`text-center space-y-8 transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
              Moderna evidencija radnog vremena
              <br />
              <span className="text-blue-600 dark:text-blue-400">i odsustva zaposlenih</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed mt-6">
              Kompletno rešenje za praćenje radnih sati, godišnjih odmora, bolovanja 
              i drugih vrsta odsustva uz napredne izveštaje i PDF generatore.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-10">
              {user ? (
                // If user is logged in, show dashboard button
                <Link 
                  href="/dashboard" 
                  className="inline-flex group"
                  aria-label="Idite na kontrolnu tablu"
                >
                  <Button 
                    size="lg" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg group-hover:shadow-lg transition-all duration-300"
                  >
                    Idite na Dashboard
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              ) : (
                // If user is not logged in, show signup/login buttons
                <>
                  <Link 
                    href="/auth/signup" 
                    className="inline-flex group"
                    aria-label="Započnite besplatnu probu"
                  >
                    <Button 
                      size="lg" 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg group-hover:shadow-lg transition-all duration-300"
                    >
                      Započnite besplatno
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
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
                      className="px-8 py-3 text-lg border-2 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 transition-all duration-300"
                    >
                      Prijavite se
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        <section className={`grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20 md:mt-28 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="sr-only">Karakteristike platforme</h2>
          
          <FeatureCard 
            icon={Users}
            title="Upravljanje zaposlenima"
            description="Organizujte zaposlene u grupe sa različitim radnim časovima"
          />
          
          <FeatureCard 
            icon={Calendar}
            title="Kalendarski prikaz"
            description="Vizuelni prikaz odsustva po mjesecima i godinama"
          />
          
          <FeatureCard 
            icon={FileText}
            title="PDF izvještaji"
            description="Generišite detaljne mjesečne i godišnje izvještaje"
          />
          
          <FeatureCard 
            icon={Shield}
            title="Bezbjedna platforma"
            description="RBAC sa admin i korisničkim ulogama"
          />
        </section>

        {/* Additional section for logged-in users */}
        {user && (
          <section className={`mt-20 md:mt-28 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 md:p-12 border border-blue-200 dark:border-blue-800 shadow-lg">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Dobrodošli nazad, <span className="text-blue-600 dark:text-blue-400">{user.email}</span>!
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
                  Nastavite sa upravljanjem odsustvima ili pregledajte najnovije statistike.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link 
                    href="/dashboard" 
                    className="inline-flex group"
                    aria-label="Pogledajte kalendar odsustva"
                  >
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 group-hover:shadow-md transition-all duration-300"
                    >
                      Kalendar odsustva
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link 
                    href="/dashboard/employees" 
                    className="inline-flex"
                    aria-label="Upravljajte zaposlenima"
                  >
                    <Button 
                      variant="outline"
                      className="px-6 py-3 border-2 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 transition-all duration-300"
                    >
                      Upravljanje zaposlenima
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Stats section for additional credibility */}
        <section className={`mt-20 md:mt-28 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Pridružite se stotinama zadovoljnih korisnika
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Naša platforma se koristi u preko 200 kompanija širom regiona
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { value: '200+', label: 'Kompanija' },
              { value: '5000+', label: 'Zaposlenih' },
              { value: '99.9%', label: 'Uptime' },
              { value: '24/7', label: 'Podrška' }
            ].map((stat, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className={`mt-20 md:mt-28 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 md:p-12 text-center text-white shadow-xl">
            <h2 className="text-3xl font-bold mb-4">
              Spremni da počnete?
            </h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-lg">
              Registrujte se danas i dobijete 30 dana besplatnog korišćenja svih funkcionalnosti.
            </p>
            {user ? (
              <Link 
                href="/dashboard" 
                className="inline-flex group"
              >
                <Button 
                  size="lg"
                  variant="secondary"
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg group-hover:shadow-lg transition-all duration-300"
                >
                  Idite na Dashboard
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            ) : (
              <Link 
                href="/auth/signup" 
                className="inline-flex group"
              >
                <Button 
                  size="lg"
                  variant="secondary"
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg group-hover:shadow-lg transition-all duration-300"
                >
                  Započnite besplatno
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            )}
          </div>
        </section>
      </main>

      {/* Footer for better structure */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 dark:text-gray-300 mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Evidencija rada. Sva prava zadržana.
            </p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Politika privatnosti
              </Link>
              <Link href="/terms" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Uslovi korišćenja
              </Link>
              <Link href="/contact" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Kontakt
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}