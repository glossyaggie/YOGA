import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

function RootLayoutNav() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is signed in, redirect to main app
        router.replace('/(tabs)');
      } else {
        // User is not signed in, redirect to onboarding
        router.replace('/onboarding');
      }
    }
  }, [user, loading]);

  return (
    <>
      <StatusBar style="light" hidden />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}