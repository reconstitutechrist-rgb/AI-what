"use client";

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  // Initialize Supabase client only on client-side
  const getSupabase = () => {
    if (!supabaseRef.current) {
      try {
        supabaseRef.current = createClient();
      } catch (err) {
        console.error("Supabase initialization failed:", err);
        throw err;
      }
    }
    return supabaseRef.current;
  };

  useEffect(() => {
    try {
      const supabase = getSupabase();
      
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }).catch(err => {
        console.error("Error getting session:", err);
        setLoading(false);
      });

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to initialize authentication';
      console.error("Auth initialization error:", message);
      setError(message);
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (e) {
      return { error: e };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      return { error };
    } catch (e) {
      return { error: e };
    }
  };

  const signOut = async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Error signing out:", e);
    }
  };

  const refreshSession = async () => {
    try {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    } catch (e) {
      console.error("Error refreshing session:", e);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
        <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-xl">⚠️</div>
            <h2 className="text-xl font-bold text-red-400">Configuration Error</h2>
          </div>
          <p className="text-sm text-slate-300 whitespace-pre-wrap mb-4">{error}</p>
          <div className="text-xs text-slate-500 bg-black/20 p-3 rounded-lg">
            <p className="font-semibold mb-1">How to fix:</p>
            <p>Add the required environment variables to your Vercel project settings or .env.local file.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
