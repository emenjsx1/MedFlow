import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
            content: 'Você é um transcritor de áudio. Transcreva exatamente o que é dito no áudio, sem adicionar interpretações ou comentários. Apenas retorne o texto transcrito.'
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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
      console.log('Audio message detected:', JSON.stringify(audioMessage, null, 2))
      
      try {
        // Get audio URL from Evolution API
        // Evolution API provides base64 or URL for media
        const mediaUrl = audioMessage.url || audioMessage.directPath
        const mimetype = audioMessage.mimetype || 'audio/ogg'
        
        if (mediaUrl && EVOLUTION_API_URL && EVOLUTION_API_KEY) {
          // If it's a direct path, construct the full URL
          let fullAudioUrl = mediaUrl
          if (!mediaUrl.startsWith('http')) {
            // Use Evolution API to get the media
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
                // Decode base64 and transcribe directly
                const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
                
                if (LOVABLE_API_KEY) {
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
                          content: 'Você é um transcritor de áudio. Transcreva exatamente o que é dito no áudio em português, sem adicionar interpretações ou comentários. Apenas retorne o texto transcrito.'
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
                    console.error('Transcription failed:', await transcribeResponse.text())
                    messageText = '[Mensagem de áudio não pôde ser transcrita]'
                  }
                }
              }
            } else {
              console.error('Failed to get media from Evolution API:', await mediaResponse.text())
              messageText = '[Mensagem de áudio recebida]'
            }
          } else {
            // Direct URL - download and transcribe
            messageText = await transcribeAudio(fullAudioUrl, audioMessage.mediaKey, mimetype)
          }
        } else {
          console.log('No audio URL or Evolution API not configured')
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

    // Find tenant by instance name
    const instanceName = instance || ''
    const tenantIdPrefix = instanceName.replace('clinic_', '')
    
    const { data: settings, error: settingsError } = await supabase
      .from('tenant_settings')
      .select('tenant_id')
      .like('whatsapp_session_id', `clinic_${tenantIdPrefix}%`)
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
