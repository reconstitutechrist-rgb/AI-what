import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Email confirmed successfully, redirect to app
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // If no code or error occurred, redirect to login with error
  return NextResponse.redirect(new URL('/login?error=auth_callback_error', request.url));
}
