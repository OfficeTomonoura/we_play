
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-ignore: Deno global is available in edge runtime
Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record, roles } = await req.json()

    if (!record) {
      throw new Error('No record data provided')
    }

    const name = record.full_name || '名称未設定'
    const school = record.school_name || '学校未設定'
    const grade = record.grade || '学年未設定'
    
    // Format roles string
    const rolesStr = roles && roles.length > 0 ? roles.join(', ') : 'なし';
    
    // Construct message
    const messageText = `【新規応募がありました】
氏名: ${name}
学校: ${school} (${grade})
希望役職: ${rolesStr}`;

    // Send to LINE Messaging API (Push Message)
    // @ts-ignore: Deno global is available in edge runtime
    const CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN')
    // @ts-ignore: Deno global is available in edge runtime
    const TARGET_ID = Deno.env.get('LINE_TARGET_ID')

    if (!CHANNEL_ACCESS_TOKEN || !TARGET_ID) {
      console.error('Environment variables not set')
      throw new Error('Server configuration error: Token or Target ID missing')
    }

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: TARGET_ID,
        messages: [
            {
                type: 'text',
                text: messageText
            }
        ]
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('LINE API Error:', errText)
      throw new Error(`LINE API failed: ${response.status} ${errText}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error: any) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
