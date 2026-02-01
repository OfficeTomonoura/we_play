
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messageId } = await req.json()
    if (!messageId) throw new Error('Message ID is required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. メッセージ内容を取得
    const { data: message, error: messageError } = await supabase
      .from('line_messages')
      .select('*')
      .eq('id', messageId)
      .single()

    if (messageError || !message) throw new Error('Message not found')
    
    // 2. ターゲットに応じた設定の決定
    let CHANNEL_ACCESS_TOKEN = '';
    const targetType = message.target_type;

    if (targetType === 'internal') {
      CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN_INTERNAL') ?? '';
    } else if (targetType === 'external') {
      CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN_EXTERNAL') ?? '';
    }

    if (!CHANNEL_ACCESS_TOKEN) {
      throw new Error(`LINE_CHANNEL_ACCESS_TOKEN for ${targetType} is not set`)
    }

    // Flex Message の構築
    const flexMessage = {
      type: 'flex',
      altText: message.title,
      contents: {
        "type": "bubble",
        "header": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": "We Play 事務局",
              "color": "#ffffff",
              "size": "sm",
              "weight": "bold"
            }
          ],
          "backgroundColor": "#7000ff"
        },
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": message.title,
              "weight": "bold",
              "size": "xl",
              "wrap": true
            },
            {
              "type": "text",
              "text": message.message_body,
              "margin": "md",
              "wrap": true,
              "size": "sm",
              "color": "#444444"
            }
          ]
        },
        "footer": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": "※本メッセージはシステムより自動送信されています",
              "size": "xs",
              "color": "#aaaaaa",
              "align": "center"
            }
          ]
        }
      }
    };

    // 3. 配信処理 (現在は Broadcast のみ実装)
    // 将来的にはここで multicast への分岐を行う
    /* 
       Future Implementation for Multicast:
       if (shouldUseMulticast) {
          const userIds = await fetchTargetUserIds(supabase, targetType);
          await sendMulticast(userIds, flexMessage, CHANNEL_ACCESS_TOKEN);
       } else {
          await sendBroadcast(flexMessage, CHANNEL_ACCESS_TOKEN);
       }
    */

    // Broadcast (全員へ送信)
    const response = await fetch('https://api.line.me/v2/bot/message/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        messages: [flexMessage]
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('LINE Broadcast Error:', err);
      throw new Error(`LINE Broadcast failed: ${err}`);
    }

    // 4. ステータスを送信済みに更新
    await supabase
      .from('line_messages')
      .update({ status: 'sent', approved_at: new Date().toISOString() })
      .eq('id', messageId)

    return new Response(JSON.stringify({ success: true, target: targetType }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
