import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

    const message = data?.message
    if (!message || message.key?.fromMe) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Extract message content
    const messageText = message.message?.conversation || 
                        message.message?.extendedTextMessage?.text ||
                        ''
    
    if (!messageText) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get phone number (remove @s.whatsapp.net)
    const remoteJid = message.key?.remoteJid || ''
    const patientPhone = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '')
    
    // Get patient name from push name
    const patientName = message.pushName || ''

    console.log('Processing message from:', patientPhone, 'Name:', patientName, 'Text:', messageText)

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
        message: messageText,
        conversationHistory,
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
