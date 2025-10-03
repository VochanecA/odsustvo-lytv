// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(
          new URL('/auth/signin?error=auth_callback_failed', requestUrl.origin)
        );
      }
    } catch (error) {
      console.error('Error in auth callback:', error);
      return NextResponse.redirect(
        new URL('/auth/signin?error=unexpected_error', requestUrl.origin)
      );
    }
  }

  // Successful authentication - redirect to dashboard
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
}