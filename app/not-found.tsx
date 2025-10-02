// app/not-found.tsx
import Link from 'next/link';
import { Button } from '../components/ui/button';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-4">
            <Search className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Strana nije pronađena
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Žao nam je, stranica koju tražite ne postoji. Možda je uklonjena, promenjen naziv ili privremeno nedostupna.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="w-full sm:w-auto">
              <Home className="h-4 w-4 mr-2" />
              Početna stranica
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="w-full sm:w-auto">
              Vrati se na dashboard
            </Button>
          </Link>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Potrebna vam je pomoć? Kontaktirajte{' '}
            <a href="mailto:support@yourcompany.com" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              podršku
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}