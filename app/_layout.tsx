import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import 'react-native-url-polyfill/auto';

// Suprimir advertencia de transform-origin de react-native-calendars en web
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = function (...args: any[]) {
    // Suprimir advertencia de propiedades DOM inválidas de react-native-calendars
    if (
      args[0]?.includes?.('Invalid DOM property') &&
      (args[0]?.includes?.('transform-origin') ||
        args[0]?.includes?.('transformOrigin'))
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
