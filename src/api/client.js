import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tfqtvzknqlxnwosowrbi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcXR2emtucWx4bndvc293cmJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MzE1MTEsImV4cCI6MjA4NTMwNzUxMX0.GOE4xWP9CCtwq6xUflyaF4U9lOylTys09Be1P0yMku4';

// シングルトンとしてクライアントを作成
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
