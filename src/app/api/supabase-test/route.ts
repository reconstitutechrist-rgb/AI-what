import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Test endpoint to verify Supabase connection
 * Access at: /api/supabase-test
 */
export async function GET() {
  try {
    // 1. Check environment variables
    const hasEnvVars = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    if (!hasEnvVars) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing Supabase environment variables',
          details: {
            NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          },
        },
        { status: 500 }
      );
    }

    // 2. Test Supabase client creation
    const supabase = await createClient();

    // 3. Test authentication endpoint (should work even without auth)
    const { data: authData, error: authError } = await supabase.auth.getSession();

    // 4. Test database connection (simple query)
    // This will fail if tables don't exist yet, which is expected
    const { data: dbData, error: dbError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful!',
      tests: {
        environmentVariables: {
          status: 'PASS',
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
        clientCreation: {
          status: 'PASS',
          message: 'Supabase client created successfully',
        },
        authEndpoint: {
          status: authError ? 'WARNING' : 'PASS',
          message: authError
            ? `Auth check failed (expected if not authenticated): ${authError.message}`
            : 'Auth endpoint accessible',
          hasSession: !!authData.session,
        },
        databaseConnection: {
          status: dbError ? 'WARNING' : 'PASS',
          message: dbError
            ? `Database query failed (expected if tables not created): ${dbError.message}`
            : 'Database accessible',
          tablesExist: !dbError,
        },
      },
      nextSteps: dbError
        ? [
            '1. Go to your Supabase Dashboard → SQL Editor',
            '2. Run the SQL scripts from docs/SUPABASE_SETUP.md to create tables',
            '3. Create the storage buckets as described in the documentation',
            '4. Run this test again to verify',
          ]
        : [
            '✅ All systems operational!',
            'You can now start using Supabase in your application',
          ],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Supabase test failed',
        message: error.message,
        details: error,
      },
      { status: 500 }
    );
  }
}
