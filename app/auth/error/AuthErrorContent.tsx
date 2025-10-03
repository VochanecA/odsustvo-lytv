// app/auth/error/AuthErrorContent.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/button';

export default function AuthErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      router.push('/auth/signup');
    }
  }, [countdown, router]);

  const getErrorMessage = () => {
    switch (error) {
      case 'otp_expired':
        return 'Verifikacioni link je istekao. Molimo zatražite novi.';
      case 'auth_callback_failed':
        return 'Došlo je do greške pri verifikaciji. Pokušajte ponovo.';
      case 'email_not_confirmed':
        return 'Email adresa nije verifikovana. Molimo proverite vaš inbox.';
      case 'invalid_credentials':
        return 'Neispravni podaci za prijavu. Proverite email i lozinku.';
      default:
        return errorDescription || 'Došlo je do neočekivane greške pri autentifikaciji.';
    }
  };

  const getErrorTitle = () => {
    switch (error) {
      case 'otp_expired':
        return 'Link je istekao';
      case 'auth_callback_failed':
        return 'Greška pri verifikaciji';
      case 'email_not_confirmed':
        return 'Email nije verifikovan';
      case 'invalid_credentials':
        return 'Neispravni podaci';
      default:
        return 'Greška pri autentifikaciji';
    }
  };

  const getSuggestedAction = () => {
    switch (error) {
      case 'otp_expired':
      case 'email_not_confirmed':
        return '/auth/signup?resend=true';
      case 'invalid_credentials':
        return '/auth/login';
      default:
        return '/auth/signup';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 text-red-500 mb-4">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getErrorTitle()}
          </h2>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {getErrorMessage()}
          </p>
          
          <div className="mt-6 space-y-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Preusmeravamo za <span className="font-semibold">{countdown}</span> sekundi...</p>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button
                onClick={() => router.push(getSuggestedAction())}
                className="w-full"
              >
                {error === 'invalid_credentials' ? 'Pokušajte ponovo' : 'Idi na registraciju'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full"
              >
                Nazad na početnu
              </Button>
            </div>
          </div>

          {/* Debug info - samo u development modu */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-3 bg-yellow-100 dark:bg-yellow-900 rounded text-xs">
              <p className="font-semibold">Debug informacije:</p>
              <p>Error: {error || 'null'}</p>
              <p>Description: {errorDescription || 'null'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}