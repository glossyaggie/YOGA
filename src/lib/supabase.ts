import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const url = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL!;
const anon = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anon, {
  auth: { 
    persistSession: true, 
    storageKey: 'hot-temple-auth',
    storage: AsyncStorage,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  }
});
