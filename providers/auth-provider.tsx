import createContextHook from '@nkzw/create-context-hook';
import { Session, User } from '@supabase/supabase-js';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/src/lib/supabase';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, firstName: string, lastName: string, phoneNumber: string, waiverAccepted: boolean) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          waiver_accepted: waiverAccepted,
          waiver_accepted_at: new Date().toISOString(),
        },
      },
    });

    if (error) throw error;

    // If email confirmation is disabled, create profile immediately
    if (data.user && !data.session) {
      // Email confirmation is required
      return data;
    }

    // Email confirmation is disabled, create profile and return session
    if (data.user && data.session) {
      await supabase.from('profiles').upsert({ 
        id: data.user.id, 
        email: data.user.email,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        waiver_accepted: waiverAccepted,
        waiver_accepted_at: new Date().toISOString(),
      });
    }

    return data;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Create profile on first login if it doesn't exist
    if (data.user) {
      await supabase.from('profiles').upsert({ 
        id: data.user.id, 
        email: data.user.email 
      });
    }

    return data;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return useMemo(() => ({
    user,
    loading,
    signUp,
    signIn,
    signOut,
  }), [user, loading, signUp, signIn, signOut]);
});