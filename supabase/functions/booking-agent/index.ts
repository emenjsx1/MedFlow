import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ========================================
// MODO ASSISTENTE PESSOAL DO EMEN
// Temporário - apenas responde baseado no prompt personalizado
// ========================================

const EMEN_ASSISTANT_PROMPT = `SYSTEM PROMPT — Assistente do Emen (WhatsApp)

Tu és o Assistente do Emen no WhatsApp.

⸻

📝 COMO RESPONDER

PRIMEIRA MENSAGEM da conversa:
- Começa com uma saudação curta: "Olá! Sou o assistente do Emen. Ele está ocupado no momento, mas vou tentar te ajudar."
- Em seguida, responde à pergunta/pedido da pessoa normalmente

MENSAGENS SEGUINTES:
- Responde diretamente, como uma conversa normal
- NÃO repete que és assistente
- NÃO adiciona notas de rodapé
- Apenas conversa naturalmente

⸻

🧠 Contexto do Emen (para orientar respostas)

• Empreendedor digital e estrategista
• Comunicação direta, clara e objetiva
• Focado em soluções práticas e resultados
• Trabalha com projetos, serviços e soluções digitais

⸻

🗣️ Estilo de Conversa

• Português simples e natural
• Tom humano, educado e profissional
• Emoji ocasionalmente 😊👍
• Frases curtas e claras

⸻

🛠️ Como agir

• Sempre tenta ajudar primeiro
• Se houver dúvida → explica
• Se houver pedido → entende melhor
• Faz perguntas curtas quando necessário

⸻

🔁 Quando não puderes responder

Se for algo que exige decisão, confirmação, preço ou algo muito específico:

"Essa questão o Emen precisa responder pessoalmente. Vou anotar e ele retorna assim que possível."

⸻

❌ Nunca fazer

• Nunca dizer que és IA, bot ou ChatGPT
• Nunca inventar preços, prazos ou promessas
• Nunca falar de assuntos pessoais

Tu és o apoio do Emen quando ele está ocupado.`

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

    console.log('=== MODO ASSISTENTE PESSOAL EMEN ===')
    console.log('Request:', { tenantId, patientPhone, message, messageId })

    // Get tenant settings (para obter whatsapp_session_id)
    const { data: settings, error: settingsError } = await supabase
      .from('tenant_settings')
      .select('whatsapp_session_id')
      .eq('tenant_id', tenantId)
      .single()

    if (settingsError) {
      console.error('Settings error:', settingsError)
      return new Response(
        JSON.stringify({ error: 'Tenant settings not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Garantir que existe paciente (para manter histórico e evitar repetir saudação)
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

    // Detectar se é a primeira mensagem (para só saudar uma vez)
    const hasConversationHistory = Array.isArray(conversationHistory) && conversationHistory.length > 0

    const { data: previousMessages } = await supabase
      .from('messages')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('patient_id', patientId)
      .limit(1)

    const hasStoredHistory = (previousMessages?.length ?? 0) > 0
    const isFirstMessage = !hasConversationHistory && !hasStoredHistory

    // Salvar mensagem recebida no banco (com patient_id para o webhook conseguir montar histórico)
    await supabase.from('messages').insert({
      tenant_id: tenantId,
      patient_id: patientId,
      body: message,
      direction: 'inbound',
      sent_at: new Date().toISOString(),
    })

    const turnDirective = isFirstMessage
      ? 'Esta é a PRIMEIRA mensagem desta conversa. Faz uma saudação curta UMA vez e depois responde/age em cima do que a pessoa perguntou. Se não puderes responder por ser assunto pessoal, recusa educadamente e redireciona para temas de projetos/negócios.'
      : 'Esta conversa JÁ está em andamento. Não te apresentes de novo (não repitas "Sou o assistente do Emen" e não repitas saudação). Responde diretamente ao conteúdo da última mensagem.'

    // Preparar mensagens para IA - APENAS o prompt do Emen
    const messages = [
      { role: 'system', content: `${EMEN_ASSISTANT_PROMPT}\n\n${turnDirective}` },
      ...conversationHistory,
      { role: 'user', content: message }
    ]

    console.log('Sending to AI with Emen prompt...', { isFirstMessage, hasConversationHistory, hasStoredHistory })

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
        mode: 'emen_personal_assistant'
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
