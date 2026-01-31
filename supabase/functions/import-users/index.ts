
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      // Supabase API URL - Env var automatically set by Supabase
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API Anon Key - Env var automatically set by Supabase
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create client with Authorization header of the user calling the function
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 1. Authorize User (Check if caller is Admin)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    // Optional: Check specific admin role or email
    // if (user.email !== 'admin@example.com') throw new Error('Forbidden')

    // 2. Initialize Admin Client (Service Role)
    // Needs SUPABASE_SERVICE_ROLE_KEY env var
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!serviceRoleKey) throw new Error('Service Role Key not configured')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 3. Parse Request Body
    const { users } = await req.json()
    if (!users || !Array.isArray(users)) throw new Error('Invalid users data')

    const results = []

    // 4. Loop and Create Users
    for (const u of users) {
      const email = u.email
      const password = u.password
      const fullName = u.full_name

      if (!email || !password) {
        results.push({ email, error: 'Email and password required' })
        continue
      }

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Auto confirm
        user_metadata: {
          full_name: fullName
        }
      })

      if (error) {
        results.push({ email, error: error.message })
      } else {
        results.push({ email, id: data.user.id, status: 'created' })
      }
    }

    return new Response(
      JSON.stringify({ results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 to allow client to read the error message
      }
    )
  }
})
