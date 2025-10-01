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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-blue-950 dark:to-gray-900">
      {/* Use DashboardNav as the main header */}
      <DashboardNav />

      <main className="container mx-auto px-4 py-16">
        <section className="text-center space-y-8">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            Moderna evidencija radnog vremena
            <br />
            <span className="text-blue-600">i odsustva zaposlenih</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Kompletno rešenje za praćenje radnih sati, godišnjih odmora, bolovanja 
            i drugih vrsta odsustva uz napredne izveštaje i PDF generatore.
          </p>

          <div className="flex justify-center space-x-4 pt-8">
            {user ? (
              // If user is logged in, show dashboard button
              <Link href="/dashboard">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Idite na Dashboard
                </Button>
              </Link>
            ) : (
              // If user is not logged in, show signup/login buttons
              <>
                <Link href="/auth/signup">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Započnite besplatno
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline">
                    Prijavite se
                  </Button>
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Upravljanje zaposlenima</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Organizujte zaposlene u grupe sa različitim radnim časovima
            </p>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Kalendarski prikaz</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Vizuelni prikaz odsustva po mesecima i godinama
            </p>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">PDF izveštaji</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Generišite detaljne mesečne i godišnje izveštaje
            </p>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Bezbedna platforma</h3>
            <p className="text-gray-600 dark:text-gray-300">
              RBAC sa admin i korisničkim ulogama
            </p>
          </div>
        </section>

        {/* Additional section for logged-in users */}
        {user && (
          <section className="mt-20 text-center">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Dobrodošli nazad, {user.email}!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Nastavite sa upravljanjem odsustvima ili pregledajte najnovije statistike.
              </p>
              <div className="flex justify-center space-x-4">
                <Link href="/dashboard">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Kalendar odsustva
                  </Button>
                </Link>
                <Link href="/dashboard/employees">
                  <Button variant="outline">
                    Upravljanje zaposlenima
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}