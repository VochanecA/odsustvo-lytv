// // app/lib/supabase.ts
// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// if (!supabaseUrl || !supabaseAnonKey) {
//   throw new Error(
//     'Missing Supabase environment variables. Please check your .env.local file.'
//   );
// }

// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   auth: {
//     persistSession: true,
//     autoRefreshToken: true,
//   },
// });

// lib/supabase.ts
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

// Odredite base URL na osnovu okruženja
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Za server-side rendering
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://odsustvo-lytv.vercel.app';
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Ovo je važno za email confirmation
  },
});

// Admin klijent za operacije koje zahtevaju elevated privileges (server-side only)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Helper funkcija za dobijanje base URL-a
export const getBaseUrlUtil = getBaseUrl;

// Type helper za Supabase responses
export type SupabaseResponse<T> = {
  data: T | null;
  error: any;
};

// Utility funkcije za često korišćene upite
export const supabaseHelpers = {
  // Kompanije
  getCompanies: (filters?: { is_active?: boolean }) => {
    let query = supabase.from('companies').select('*');
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    return query.order('name');
  },

  // Službe po kompaniji
  getDepartmentsByCompany: (companyId: string, filters?: { is_active?: boolean }) => {
    let query = supabase.from('departments').select('*').eq('company_id', companyId);
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    return query.order('name');
  },

  // Zaposleni po kompaniji
  getEmployeesByCompany: (companyId: string, filters?: { department_id?: string; is_active?: boolean }) => {
    let query = supabase.from('employees').select('*').eq('company_id', companyId);
    
    if (filters?.department_id) {
      query = query.eq('department_id', filters.department_id);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    
    return query.order('first_name');
  },
};