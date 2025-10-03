// app/auth/error/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/button';

export default function AuthErrorPage() {
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
      default:
        return errorDescription || 'Došlo je do neočekivane greške.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-500">⚠️</div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
            Greška pri verifikaciji
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {getErrorMessage()}
          </p>
          <div className="mt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Preusmjeravamo za {countdown} sekundi...
            </p>
            <Button
              onClick={() => router.push('/auth/signup')}
              className="mt-4 w-full"
            >
              Idi na registraciju
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}