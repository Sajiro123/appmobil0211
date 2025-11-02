import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pywmysglgyvrweysiwzp.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5d215c2dsZ3l2cndleXNpd3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDU1MjEsImV4cCI6MjA2ODg4MTUyMX0.F8aRIb5fSUpVzBFmjiXQzOcfJlqPUujuGi8TZ0H895M';

// Validar que las variables existan
if (!supabaseUrl) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL is required. Please check your .env file'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY is required. Please check your .env file'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
