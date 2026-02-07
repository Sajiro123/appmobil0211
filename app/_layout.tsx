import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useConsoleWarningFilter } from '@/hooks/useConsoleWarningFilter';
import 'react-native-url-polyfill/auto';

export default function RootLayout() {
  useFrameworkReady();
  useConsoleWarningFilter();

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
