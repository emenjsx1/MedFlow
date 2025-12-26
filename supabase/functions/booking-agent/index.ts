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
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')?.replace(/\/$/, '')
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    const body = await req.json()
    const {
      tenantId,
      patientPhone: rawPatientPhone,
      patientName: rawPatientName,
      messageId,
      remoteJid,
      message,
      conversationHistory = [],
    } = body

    const patientPhone = normalizePhone(rawPatientPhone)
    const patientName = typeof rawPatientName === 'string' ? rawPatientName.trim() : ''

    console.log('=== BOOKING AGENT - MODO CLÍNICA ===')
    console.log('Request:', { tenantId, patientPhone, message, messageId })

    // Get tenant settings
    const { data: settings, error: settingsError } = await supabase
      .from('tenant_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single()

    if (settingsError) {
      console.error('Settings error:', settingsError)
      return new Response(
        JSON.stringify({ error: 'Tenant settings not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Garantir que existe paciente
    let patientId: string | null = null
    const placeholderName = 'Sem nome'

    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('whatsapp', patientPhone)
      .maybeSingle()

    if (existingPatient?.id) {
      patientId = existingPatient.id

      if (patientName && (!existingPatient.name || existingPatient.name === placeholderName)) {
        await supabase
          .from('patients')
          .update({ name: patientName })
          .eq('id', patientId)
      }
    } else {
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          tenant_id: tenantId,
          name: patientName || placeholderName,
          whatsapp: patientPhone,
        })
        .select('id')
        .single()

      if (patientError) {
        console.error('Patient creation error:', patientError)
      } else {
        patientId = newPatient?.id ?? null
      }
    }

    // Detectar se é a primeira mensagem
    const hasConversationHistory = Array.isArray(conversationHistory) && conversationHistory.length > 0

    const { data: previousMessages } = await supabase
      .from('messages')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('patient_id', patientId)
      .limit(1)

    const hasStoredHistory = (previousMessages?.length ?? 0) > 0
    const isFirstMessage = !hasConversationHistory && !hasStoredHistory

    // Salvar mensagem recebida no banco
    await supabase.from('messages').insert({
      tenant_id: tenantId,
      patient_id: patientId,
      body: message,
      direction: 'inbound',
      sent_at: new Date().toISOString(),
    })

    // Construir prompt da clínica baseado nas configurações
    const clinicName = settings.clinic_name || 'nossa clínica'
    const clinicPhone = settings.clinic_phone || ''
    const clinicAddress = settings.clinic_address || ''
    const businessHoursStart = settings.business_hours_start || '08:00'
    const businessHoursEnd = settings.business_hours_end || '18:00'
    const workingDays = settings.working_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    
    const workingDaysText = workingDays.map((day: string) => {
      const days: Record<string, string> = {
        'monday': 'Segunda',
        'tuesday': 'Terça',
        'wednesday': 'Quarta',
        'thursday': 'Quinta',
        'friday': 'Sexta',
        'saturday': 'Sábado',
        'sunday': 'Domingo'
      }
      return days[day] || day
    }).join(', ')

    // Contexto personalizado da clínica
    const businessContext = settings.agent_business_context || ''
    const greetingMessage = settings.agent_greeting_message || ''
    const faqs = settings.agent_faqs || []

    let faqsText = ''
    if (Array.isArray(faqs) && faqs.length > 0) {
      faqsText = '\n\nPERGUNTAS FREQUENTES:\n' + faqs.map((faq: { question: string; answer: string }) => 
        `P: ${faq.question}\nR: ${faq.answer}`
      ).join('\n\n')
    }

    const CLINIC_PROMPT = `Tu és a assistente virtual de ${clinicName} no WhatsApp.

INFORMAÇÕES DA CLÍNICA:
- Nome: ${clinicName}
${clinicPhone ? `- Telefone: ${clinicPhone}` : ''}
${clinicAddress ? `- Endereço: ${clinicAddress}` : ''}
- Horário de funcionamento: ${businessHoursStart} às ${businessHoursEnd}
- Dias de atendimento: ${workingDaysText}

${businessContext ? `SOBRE A CLÍNICA:\n${businessContext}\n` : ''}

REGRAS DE RESPOSTA:

1. RESPOSTAS CURTAS - máximo 2-3 frases. Nada de textos longos.

2. FORMATAÇÃO NATURAL:
   - SEM asteriscos ou markdown (*negrito*, etc)
   - SEM listas com bullets
   - Escreve como uma pessoa normal escreve no WhatsApp
   - Pode usar emoji de vez em quando 😊

3. OBJETIVO PRINCIPAL:
   - Ajudar pacientes a agendar consultas
   - Responder dúvidas sobre a clínica
   - Confirmar ou remarcar consultas

4. SE NÃO SOUBER: "Vou verificar com a equipa e já te respondo."

5. NUNCA:
   - Dizer que és IA/bot
   - Inventar informações
   - Respostas longas tipo artigo
${faqsText}

${greetingMessage ? `SAUDAÇÃO INICIAL: "${greetingMessage}"` : ''}`

    const turnDirective = isFirstMessage
      ? 'Esta é a PRIMEIRA mensagem desta conversa. Faz uma saudação curta UMA vez e depois responde ao que a pessoa perguntou.'
      : 'Esta conversa JÁ está em andamento. Não te apresentes de novo. Responde diretamente ao conteúdo da última mensagem.'

    // Preparar mensagens para IA
    const messages = [
      { role: 'system', content: `${CLINIC_PROMPT}\n\n${turnDirective}` },
      ...conversationHistory,
      { role: 'user', content: message }
    ]

    console.log('Sending to AI with clinic prompt...', { isFirstMessage, clinicName })

    // Usar Lovable AI Gateway
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'AI not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('AI API error:', aiResponse.status, errorText)
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded', reply: 'Desculpe, muitas solicitações. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({ error: 'AI API error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const aiData = await aiResponse.json()
    const reply = aiData.choices?.[0]?.message?.content || 'Desculpe, não entendi. Pode repetir?'

    console.log('AI reply:', reply)

    // Salvar resposta no banco
    await supabase.from('messages').insert({
      tenant_id: tenantId,
      patient_id: patientId,
      body: reply,
      direction: 'outbound',
      sent_at: new Date().toISOString(),
    })

    // Enviar resposta via WhatsApp
    if (EVOLUTION_API_URL && EVOLUTION_API_KEY && settings?.whatsapp_session_id) {
      const formattedPhone = patientPhone.replace(/\D/g, '')
      const whatsappNumber = formattedPhone.includes('@') ? formattedPhone : `${formattedPhone}@s.whatsapp.net`
      
      try {
        const sendResponse = await fetch(`${EVOLUTION_API_URL}/message/sendText/${settings.whatsapp_session_id}`, {
          method: 'POST',
          headers: {
            'apikey': EVOLUTION_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            number: whatsappNumber,
            text: reply,
          }),
        })

        if (!sendResponse.ok) {
          console.error('WhatsApp send failed:', await sendResponse.text())
        } else {
          console.log('WhatsApp message sent successfully')
        }
      } catch (error) {
        console.error('WhatsApp send error:', error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        reply,
        mode: 'clinic_assistant'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to normalize phone numbers
function normalizePhone(phone: string | undefined | null): string {
  if (!phone) return ''
  return phone.replace(/\D/g, '').replace(/^0+/, '')
}
