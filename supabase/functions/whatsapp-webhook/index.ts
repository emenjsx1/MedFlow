import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

// Function to download audio from Evolution API and transcribe it
async function transcribeAudio(audioUrl: string, mediaKey?: string, mimetype?: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY not configured')
    throw new Error('Transcription service not configured')
  }

  try {
    console.log('Downloading audio from:', audioUrl)
    
    // Download the audio file
    const audioResponse = await fetch(audioUrl)
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status}`)
    }
    
    const audioBuffer = await audioResponse.arrayBuffer()
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))
    
    console.log('Audio downloaded, size:', audioBuffer.byteLength, 'bytes')
    
    // Use Lovable AI to transcribe (using Gemini's audio understanding)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Você é um transcritor de áudio especializado em português brasileiro (pt-BR). Transcreva exatamente o que é dito no áudio em português, sem adicionar interpretações ou comentários. O áudio está em português do Brasil. Apenas retorne o texto transcrito, nada mais.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Transcreva o seguinte áudio para texto:'
              },
              {
                type: 'input_audio',
                input_audio: {
                  data: audioBase64,
                  format: mimetype?.includes('ogg') ? 'ogg' : 'mp3'
                }
              }
            ]
          }
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Transcription API error:', response.status, errorText)
      throw new Error(`Transcription failed: ${response.status}`)
    }

    const result = await response.json()
    const transcription = result.choices?.[0]?.message?.content || ''
    
    console.log('Audio transcribed:', transcription)
    return transcription.trim()
    
  } catch (error) {
    console.error('Error transcribing audio:', error)
    throw error
  }
}

// Validate webhook request - checks for webhook secret header
function validateWebhookRequest(req: Request): boolean {
  const WEBHOOK_SECRET = Deno.env.get('EVOLUTION_WEBHOOK_SECRET')
  
  // If no secret is configured, log warning but allow (for backwards compatibility during migration)
  if (!WEBHOOK_SECRET) {
    console.warn('EVOLUTION_WEBHOOK_SECRET not configured - webhook validation disabled')
    return true
  }
  
  const providedSecret = req.headers.get('x-webhook-secret')
  
  if (!providedSecret) {
    console.error('Missing x-webhook-secret header')
    return false
  }
  
  if (providedSecret !== WEBHOOK_SECRET) {
    console.error('Invalid webhook secret provided')
    return false
  }
  
  return true
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Validate webhook authentication
  if (!validateWebhookRequest(req)) {
    console.error('Webhook authentication failed')
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    const body = await req.json()
    console.log('Webhook received:', JSON.stringify(body, null, 2))

    // Evolution API webhook format
    const {
      event,
      instance,
      data,
    } = body

    // Only process incoming messages
    if (event !== 'messages.upsert') {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // data is already the message object in Evolution API format
    const messageData = data
    
    // Check if it's an incoming message (not from me)
    if (!messageData || messageData.key?.fromMe === true) {
      console.log('Ignoring: fromMe or no data')
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Extract message content - Evolution API structure
    let messageText = messageData.message?.conversation || 
                      messageData.message?.extendedTextMessage?.text ||
                      ''
    
    // Check for audio message
    const audioMessage = messageData.message?.audioMessage
    let isAudioMessage = false
    
    if (audioMessage) {
      isAudioMessage = true
      console.log('Audio message detected, processing via Evolution API...')
      
      try {
        const mimetype = audioMessage.mimetype || 'audio/ogg'
        
        if (EVOLUTION_API_URL && EVOLUTION_API_KEY) {
          // SEMPRE usar Evolution API para desencriptar o áudio do WhatsApp
          // Os arquivos do WhatsApp vêm encriptados e precisam ser desencriptados
          console.log('Requesting decrypted audio from Evolution API...')
          
          const mediaResponse = await fetch(`${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${instance}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': EVOLUTION_API_KEY,
            },
            body: JSON.stringify({
              message: messageData,
              convertToMp4: false
            }),
          })
          
          if (mediaResponse.ok) {
            const mediaData = await mediaResponse.json()
            
            if (mediaData.base64) {
              console.log('Audio decrypted successfully, base64 length:', mediaData.base64.length)
              
              const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
              
              if (LOVABLE_API_KEY) {
                console.log('Sending audio to Lovable AI for transcription...')
                
                const transcribeResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    model: 'google/gemini-2.5-flash',
                    messages: [
                      {
                        role: 'system',
                        content: 'Você é um transcritor de áudio. O áudio está em português (pode ser português de Moçambique, Brasil ou Portugal). Transcreva EXATAMENTE o que a pessoa disse, palavra por palavra. Não adicione interpretações, comentários ou traduções. Retorne APENAS o texto transcrito.'
                      },
                      {
                        role: 'user',
                        content: [
                          {
                            type: 'text',
                            text: 'Transcreva este áudio para texto:'
                          },
                          {
                            type: 'input_audio',
                            input_audio: {
                              data: mediaData.base64,
                              format: mimetype.includes('ogg') ? 'ogg' : 'mp3'
                            }
                          }
                        ]
                      }
                    ],
                  }),
                })

                if (transcribeResponse.ok) {
                  const transcribeResult = await transcribeResponse.json()
                  messageText = transcribeResult.choices?.[0]?.message?.content?.trim() || ''
                  console.log('Audio transcribed successfully:', messageText)
                } else {
                  const errorText = await transcribeResponse.text()
                  console.error('Transcription API failed:', transcribeResponse.status, errorText)
                  messageText = '[Mensagem de áudio não pôde ser transcrita]'
                }
              } else {
                console.error('LOVABLE_API_KEY not configured')
                messageText = '[Transcrição não configurada]'
              }
            } else {
              console.error('Evolution API returned no base64 data:', JSON.stringify(mediaData))
              messageText = '[Áudio não pôde ser processado]'
            }
          } else {
            const errorText = await mediaResponse.text()
            console.error('Failed to get media from Evolution API:', mediaResponse.status, errorText)
            messageText = '[Mensagem de áudio recebida - erro ao processar]'
          }
        } else {
          console.log('Evolution API not configured for audio processing')
          messageText = '[Mensagem de áudio recebida - transcrição não disponível]'
        }
      } catch (transcribeError) {
        console.error('Error processing audio:', transcribeError)
        messageText = '[Erro ao processar mensagem de áudio]'
      }
    }
    
    if (!messageText) {
      console.log('Ignoring: no text content')
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get phone number (remove @s.whatsapp.net)
    const remoteJid = messageData.key?.remoteJid || ''

    // Ignore group messages to avoid noise/spam and unnecessary AI calls
    if (remoteJid.endsWith('@g.us')) {
      console.log('Ignoring group message:', remoteJid)
      return new Response(JSON.stringify({ ok: true, ignored: true, reason: 'group' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const patientPhone = remoteJid.replace('@s.whatsapp.net', '')

    // Get patient name from push name
    const patientName = messageData.pushName || ''

    const messageId = messageData.key?.id || ''

    console.log('Processing message from:', patientPhone, 'Name:', patientName, 'Text:', messageText, 'Id:', messageId, 'IsAudio:', isAudioMessage)

    // Find tenant by instance name (instance name is clinic_{tenant_id_without_hyphens})
    const instanceName = instance || ''
    
    // Validate instance name format to prevent injection
    if (!instanceName || !/^clinic_[a-f0-9]+$/i.test(instanceName)) {
      console.error('Invalid instance name format:', instanceName)
      return new Response(JSON.stringify({ ok: true, error: 'Invalid instance format' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Extract tenant_id from whatsapp_session_id stored in database
    const { data: settings, error: settingsError } = await supabase
      .from('tenant_settings')
      .select('tenant_id')
      .eq('whatsapp_session_id', instanceName)
      .maybeSingle()

    if (settingsError || !settings) {
      console.error('Tenant not found for instance:', instanceName)
      return new Response(JSON.stringify({ ok: true, error: 'Tenant not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const tenantId = settings.tenant_id

    // Get conversation history
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('whatsapp', patientPhone)
      .maybeSingle()

    let conversationHistory: { role: string; content: string }[] = []
    
    if (patient) {
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('body, direction')
        .eq('tenant_id', tenantId)
        .eq('patient_id', patient.id)
        .order('sent_at', { ascending: false })
        .limit(10)

      if (recentMessages) {
        conversationHistory = recentMessages.reverse().map(m => ({
          role: m.direction === 'inbound' ? 'user' : 'assistant',
          content: m.body
        }))
      }
    }

    // Call booking agent
    const agentResponse = await fetch(`${SUPABASE_URL}/functions/v1/booking-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        tenantId,
        patientPhone,
        patientName,
        messageId,
        remoteJid,
        message: messageText,
        conversationHistory,
        isAudioMessage,
      }),
    })

    const agentResult = await agentResponse.json()
    console.log('Agent response:', agentResult)

    return new Response(
      JSON.stringify({ ok: true, result: agentResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
