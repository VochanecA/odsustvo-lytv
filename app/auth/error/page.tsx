// app/auth/error/page.tsx
'use client';

import { Suspense } from 'react';
import AuthErrorContent from './AuthErrorContent';

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<AuthErrorFallback />}>
      <AuthErrorContent />
    </Suspense>
  );
}

function AuthErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-500 animate-spin">⟳</div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
            Učitavanje...
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Proveravamo detalje greške...
          </p>
        </div>
      </div>
    </div>
  );
}