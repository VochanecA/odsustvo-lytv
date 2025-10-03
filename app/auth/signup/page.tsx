// app/auth/signup/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import { supabase } from '../../../lib/supabase';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Lozinke se ne podudaraju');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Lozinka mora imati najmanje 6 karaktera');
      setLoading(false);
      return;
    }

    try {
      // Koristite production URL za email confirmation
      const baseUrl = 'https://odsustvo-lytv.vercel.app';
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          },
          emailRedirectTo: `${baseUrl}/auth/callback`
        }
      });

      if (authError) throw authError;

      // Ako je korisnik kreiran, napravite employee i role zapise
      if (authData.user) {
        try {
          // Prvo pronađite default kompaniju
          const { data: companies, error: companiesError } = await supabase
            .from('companies')
            .select('id')
            .eq('is_active', true)
            .limit(1);

          if (companiesError) throw companiesError;

          const companyId = companies && companies.length > 0 ? companies[0].id : null;

          if (!companyId) {
            throw new Error('Nije pronađena aktivna kompanija');
          }

          // Kreirajte employee zapis
          const { error: profileError } = await supabase
            .from('employees')
            .insert({
              user_id: authData.user.id,
              first_name: firstName,
              last_name: lastName,
              email: email,
              work_group: 1,
              company_id: companyId
            });

          if (profileError) throw profileError;

          // Kreirajte user role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role: 'user'
            });

          if (roleError) throw roleError;

          setSuccess(true);
          
          // Auto-redirect nakon 3 sekunde
          setTimeout(() => {
            router.push('/auth/login?message=check-email');
          }, 3000);

        } catch (dbError: any) {
          console.error('Database error:', dbError);
          // Ako dođe do greške sa bazom, obrišite auth korisnika
          await supabase.auth.admin.deleteUser(authData.user.id);
          throw new Error('Greška pri kreiranju profila: ' + dbError.message);
        }
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/login?message=check-email');
        }, 3000);
      }

    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'Došlo je do greške pri registraciji');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="flex items-center space-x-2">
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">✓</span>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  Evidencija rada
                </span>
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Uspešna registracija!
            </h2>
            <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800 text-sm">
                Poslali smo verifikacioni email na <strong>{email}</strong>.
              </p>
              <p className="text-green-700 text-sm mt-2">
                Molimo proverite vaš inbox i kliknite na link da verifikujete nalog.
              </p>
            </div>
            <div className="mt-6">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Preusmeravamo na stranicu za prijavu...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                Evidencija rada
              </span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Kreirajte nalog
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Popunite podatke ispod da kreirate nalog
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ime
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  placeholder="Vaše ime"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Prezime
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  placeholder="Vaše prezime"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email adresa
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                placeholder="unesite@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Lozinka
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                placeholder="Najmanje 6 karaktera"
                minLength={6}
              />
              <p className="mt-1 text-xs text-gray-500">Lozinka mora imati najmanje 6 karaktera</p>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Potvrdite lozinku
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                placeholder="Ponovite lozinku"
                minLength={6}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Kreiranje naloga...' : 'Kreirajte nalog'}
            </Button>
          </div>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
            >
              Već imate nalog? Prijavite se
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}