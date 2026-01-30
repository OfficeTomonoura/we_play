
// Supabase JS library must be loaded before this script
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// TODO: Replace these values with your actual project URL and Anon Key from Supabase Dashboard
const SUPABASE_URL = 'https://tfqtvzknqlxnwosowrbi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcXR2emtucWx4bndvc293cmJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MzE1MTEsImV4cCI6MjA4NTMwNzUxMX0.GOE4xWP9CCtwq6xUflyaF4U9lOylTys09Be1P0yMku4';

// Initialize the Supabase client
// Initialize the Supabase client
window.supabaseClient = null;

if (typeof createClient !== 'undefined') {
    // Some versions expose createClient globally
    window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized (createClient)');
} else if (window.supabase && typeof window.supabase.createClient === 'function') {
    // Standard CDN loading: window.supabase is the library object
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized (window.supabase.createClient)');
} else {
    console.error('Supabase library not loaded. Make sure to include the CDN script tag before this script.');
}

// Global alias if needed (careful with conflicts)
// const supabase = window.supabaseClient; 
