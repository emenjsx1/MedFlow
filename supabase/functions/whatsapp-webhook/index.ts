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
    let transcriptionFailed = false // Flag to skip booking-agent when transcription fails
    if (audioMessage) {
      isAudioMessage = true

      const originalMimetype = audioMessage.mimetype || 'audio/ogg; codecs=opus'
      const seconds = typeof audioMessage.seconds === 'number' ? audioMessage.seconds : Number(audioMessage.seconds ?? 0)

      console.log('Audio message detected, processing via Evolution API...', {
        seconds,
        originalMimetype,
        messageId: messageData.key?.id,
      })

      try {
        if (EVOLUTION_API_URL && EVOLUTION_API_KEY) {
          // WhatsApp voice notes (ogg/opus) frequentemente dão transcrição “lixo” quando o modelo não consegue decodificar.
          // Então pedimos ao Evolution para entregar convertido (MP4) e limitamos a saída para evitar alucinações gigantes.
          const convertToMp4 = true

          console.log('Requesting decrypted audio from Evolution API...', { convertToMp4 })

          const mediaResponse = await fetch(`${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${instance}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: EVOLUTION_API_KEY,
            },
            body: JSON.stringify({
              message: { key: { id: messageData.key?.id } },
              convertToMp4,
            }),
          })


          if (!mediaResponse.ok) {
            const errorText = await mediaResponse.text()
            console.error('Failed to get media from Evolution API:', mediaResponse.status, errorText)
            messageText = 'Não entendi o áudio, pode escrever?'
            transcriptionFailed = true
          } else {
            const mediaData = await mediaResponse.json()

            const rawBase64 = typeof mediaData?.base64 === 'string' ? mediaData.base64 : ''
            const audioBase64 = (rawBase64.includes(',') ? rawBase64.split(',').pop() : rawBase64)?.replace(/\s+/g, '') || ''

            if (!audioBase64) {
              console.error('Evolution API returned no base64 data:', JSON.stringify(mediaData))
              messageText = 'Não entendi o áudio, pode escrever?'
              transcriptionFailed = true
            } else {
              console.log('Audio decrypted successfully', {
                messageId: messageData.key?.id,
                base64Length: audioBase64.length,
                base64Head: audioBase64.slice(0, 24),
              })

              const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
              if (!LOVABLE_API_KEY) {
                console.error('LOVABLE_API_KEY not configured')
                messageText = 'Não entendi o áudio, pode escrever?'
                transcriptionFailed = true
              } else {
                // Ajuste de limite: evita respostas enormes quando a decodificação falha.
                const maxTokens = seconds > 0 ? Math.min(1200, Math.max(200, Math.round(seconds * 12))) : 600
                const audioFormat = convertToMp4 ? 'mp4' : originalMimetype.includes('ogg') ? 'ogg' : 'mp3'

                console.log('Sending audio to Lovable AI for transcription...', { audioFormat, maxTokens, seconds })

                const transcribeResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${LOVABLE_API_KEY}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    // Modelo mais estável/preciso para áudio
                    model: 'google/gemini-2.5-pro',
                    temperature: 0.1,
                    max_tokens: maxTokens,
                    messages: [
                      {
                        role: 'system',
                        content:
                          'Tu és um transcritor. Transcreve exatamente o que foi dito. Se não conseguires entender o áudio, responde apenas: [INAUDIVEL]. Não inventes texto.',
                      },
                      {
                        role: 'user',
                        content: [
                          { type: 'text', text: 'Transcreve este áudio:' },
                          {
                            type: 'input_audio',
                            input_audio: {
                              data: audioBase64,
                              format: audioFormat,
                            },
                          },
                        ],
                      },
                    ],
                  }),
                })

                if (!transcribeResponse.ok) {
                  const errorText = await transcribeResponse.text()
                  console.error('Transcription API failed:', transcribeResponse.status, errorText)
                  messageText = 'Não entendi o áudio, pode escrever?'
                  transcriptionFailed = true
                } else {
                  const transcribeResult = await transcribeResponse.json()
                  const transcript = (transcribeResult.choices?.[0]?.message?.content || '').trim()

                  // Heurística simples anti-alucinação: um áudio curto não pode virar um texto gigante.
                  const maxChars = seconds > 0 ? Math.max(280, Math.round(seconds * 80)) : 800

                  console.log('Transcription metrics:', {
                    seconds,
                    transcriptLength: transcript.length,
                    maxChars,
                  })

                  if (!transcript || transcript === '[INAUDIVEL]' || transcript.length > maxChars) {
                    console.warn('Transcription looks unreliable; falling back to ask for text.')
                    messageText = 'Não entendi o áudio, pode escrever?'
                    transcriptionFailed = true
                  } else {
                    messageText = transcript
                    console.log('Audio transcribed successfully:', messageText)
                  }
                }
              }
            }
          }
        } else {
          console.log('Evolution API not configured for audio processing')
          messageText = 'Recebi teu áudio, mas a transcrição não está disponível agora. Pode escrever?'
          transcriptionFailed = true
        }
      } catch (transcribeError) {
        console.error('Error processing audio:', transcribeError)
        messageText = 'Erro ao processar áudio. Pode escrever?'
        transcriptionFailed = true
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
      .select('tenant_id, whatsapp_session_id')
      .eq('whatsapp_session_id', instanceName)
      .maybeSingle()

    if (settingsError || !settings) {
      console.error('Tenant not found for instance:', instanceName)
      return new Response(JSON.stringify({ ok: true, error: 'Tenant not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const tenantId = settings.tenant_id

    // =====================================================================
    // Check if agent is paused for this conversation (Human Takeover)
    // =====================================================================
    const { data: agentConversation } = await supabase
      .from('agent_conversations')
      .select('id, agent_paused, agent_reactivate_at')
      .eq('tenant_id', tenantId)
      .eq('patient_phone', patientPhone)
      .maybeSingle()

    // Check if we need to auto-reactivate based on timeout
    if (agentConversation?.agent_paused && agentConversation?.agent_reactivate_at) {
      const reactivateAt = new Date(agentConversation.agent_reactivate_at)
      if (reactivateAt <= new Date()) {
        console.log('Auto-reactivating agent for conversation:', agentConversation.id)
        await supabase
          .from('agent_conversations')
          .update({
            agent_paused: false,
            agent_paused_at: null,
            agent_reactivate_at: null,
            paused_by_user_id: null
          })
          .eq('id', agentConversation.id)
      }
    }

    // Re-check after potential reactivation
    const { data: currentConversation } = await supabase
      .from('agent_conversations')
      .select('agent_paused')
      .eq('tenant_id', tenantId)
      .eq('patient_phone', patientPhone)
      .maybeSingle()

    if (currentConversation?.agent_paused) {
      console.log('Agent is paused for this conversation (Human Takeover active), skipping AI response')
      
      // Save the inbound message but don't process with AI
      const { data: patient } = await supabase
        .from('patients')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .eq('whatsapp', patientPhone)
        .maybeSingle()

      if (patient) {
        await supabase.from('messages').insert({
          tenant_id: tenantId,
          patient_id: patient.id,
          body: messageText,
          direction: 'inbound',
          sent_at: new Date().toISOString(),
        })

        // Create notification for human takeover alert
        await supabase.from('user_notifications').insert({
          tenant_id: tenantId,
          user_id: null, // Broadcast to all users in tenant
          type: 'takeover_message',
          title: '📩 Nova mensagem (Takeover)',
          message: `${patient.name || patientPhone}: ${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}`,
          data: { 
            patient_name: patient.name || patientPhone,
            patient_phone: patientPhone,
            patient_id: patient.id
          },
        })

        // Update messages count in takeover history using raw increment
        const { data: historyRecord } = await supabase
          .from('takeover_history')
          .select('id, messages_during_takeover')
          .eq('tenant_id', tenantId)
          .eq('patient_phone', patientPhone)
          .is('ended_at', null)
          .maybeSingle()

        if (historyRecord) {
          await supabase
            .from('takeover_history')
            .update({ messages_during_takeover: (historyRecord.messages_during_takeover || 0) + 1 })
            .eq('id', historyRecord.id)
        }
      }

      return new Response(
        JSON.stringify({ ok: true, agentPaused: true, message: 'Human takeover active' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // =====================================================================
    // Se a transcrição falhou, responder direto sem chamar o agente
    // =====================================================================
    if (transcriptionFailed) {
      console.log('Transcription failed, sending direct reply without calling agent...')

      // Enviar resposta direta via WhatsApp
      if (EVOLUTION_API_URL && EVOLUTION_API_KEY && settings.whatsapp_session_id) {
        const formattedPhone = patientPhone.replace(/\D/g, '')
        const whatsappNumber = formattedPhone.includes('@') ? formattedPhone : `${formattedPhone}@s.whatsapp.net`

        try {
          const sendResponse = await fetch(`${EVOLUTION_API_URL}/message/sendText/${settings.whatsapp_session_id}`, {
            method: 'POST',
            headers: {
              apikey: EVOLUTION_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              number: whatsappNumber,
              text: messageText,
            }),
          })

          if (!sendResponse.ok) {
            console.error('WhatsApp direct reply failed:', await sendResponse.text())
          } else {
            console.log('Direct reply sent successfully (transcription failed)')
          }
        } catch (err) {
          console.error('Error sending direct reply:', err)
        }
      }

      return new Response(
        JSON.stringify({ ok: true, transcriptionFailed: true, reply: messageText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
