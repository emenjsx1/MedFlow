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

    // Buscar profissionais cadastrados
    const { data: professionals } = await supabase
      .from('professionals')
      .select('id, name, specialty, working_days, business_hours_start, business_hours_end, appointment_duration_minutes')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)

    let professionalsText = ''
    if (professionals && professionals.length > 0) {
      professionalsText = '\n\nPROFISSIONAIS DISPONÍVEIS:\n' + professionals.map(p => {
        const days = (p.working_days || []).map((day: string) => {
          const dayNames: Record<string, string> = {
            'monday': 'Seg', 'tuesday': 'Ter', 'wednesday': 'Qua',
            'thursday': 'Qui', 'friday': 'Sex', 'saturday': 'Sáb', 'sunday': 'Dom'
          }
          return dayNames[day] || day
        }).join(', ')
        return `- ${p.name}${p.specialty ? ` (${p.specialty})` : ''} - ${days} das ${p.business_hours_start || '08:00'} às ${p.business_hours_end || '18:00'}`
      }).join('\n')
    } else {
      professionalsText = '\n\nNOTA: Não há profissionais cadastrados no sistema ainda.'
    }

    // Data e hora atual (timezone de Maputo/África)
    const now = new Date()
    const maputoTime = new Intl.DateTimeFormat('pt-MZ', {
      timeZone: settings.timezone || 'Africa/Maputo',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(now)

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

DATA E HORA ATUAL: ${maputoTime}
(Usa esta informação para saber que dia é hoje ao agendar consultas. Nunca agendes para datas no passado.)

INFORMAÇÕES DA CLÍNICA:
- Nome: ${clinicName}
${clinicPhone ? `- Telefone: ${clinicPhone}` : ''}
${clinicAddress ? `- Endereço: ${clinicAddress}` : ''}
- Horário de funcionamento: ${businessHoursStart} às ${businessHoursEnd}
- Dias de atendimento: ${workingDaysText}
${professionalsText}

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

4. PROFISSIONAIS:
   - Só menciona profissionais que estão listados acima
   - NUNCA inventes nomes de doutores ou profissionais
   - Se perguntarem por alguém que não existe, diz que não temos esse profissional

5. DATAS:
   - Sempre considera a DATA ATUAL acima para calcular datas
   - Hoje é ${maputoTime.split(',')[0]}
   - Nunca agendes para datas passadas

6. SE NÃO SOUBER: "Vou verificar com a equipa e já te respondo."

7. NUNCA:
   - Dizer que és IA/bot
   - Inventar informações sobre profissionais ou serviços
   - Respostas longas tipo artigo

8. AGENDAMENTOS:
   - Quando um agendamento for confirmado, responde normalmente
   - Inclui na resposta algo como "Consulta agendada para [data] às [hora]"
   - IMPORTANTE: Quando confirmar um agendamento com o paciente, DEVE incluir no final da resposta (em uma linha separada, após um espaço em branco) um JSON estruturado com os dados do agendamento. Formato: {"action":"create_appointment","date":"YYYY-MM-DD","time":"HH:MM","professional":"Nome do Profissional ou null"}
   - O JSON deve estar em uma linha separada no final da resposta, após a mensagem normal ao paciente
   - O link de check-in será enviado automaticamente pelo sistema após criar o agendamento
   - Exemplo de resposta: "Perfeito! Sua consulta está agendada para 15/01/2025 às 14:00. Te vejo lá!\n\n{\"action\":\"create_appointment\",\"date\":\"2025-01-15\",\"time\":\"14:00\",\"professional\":\"Dr. Silva\"}"
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
    let reply = aiData.choices?.[0]?.message?.content || 'Desculpe, não entendi. Pode repetir?'

    console.log('AI reply:', reply)

    // Tentar extrair informações de agendamento da resposta da IA
    let appointmentCreated = false
    let createdAppointmentId: string | null = null
    
    try {
      // Procurar por JSON no final da resposta (pode estar em múltiplas linhas)
      const lines = reply.split('\n')
      let jsonLine = null
      
      // Procurar a última linha que parece ser JSON
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim()
        if (line.startsWith('{') && line.includes('"action"') && line.includes('create_appointment')) {
          jsonLine = line
          break
        }
      }
      
      if (jsonLine) {
        console.log('Found appointment JSON in AI response:', jsonLine)
        const appointmentData = JSON.parse(jsonLine)
        
        if (appointmentData.action === 'create_appointment' && appointmentData.date && appointmentData.time) {
          // Remover o JSON da resposta antes de enviar ao paciente
          reply = reply.replace(new RegExp(jsonLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '').trim()
          
          // Parse da data e hora
          const [year, month, day] = appointmentData.date.split('-').map(Number)
          const [hours, minutes] = appointmentData.time.split(':').map(Number)
          
          // Criar data/hora no timezone da clínica
          // Usar a data atual como base e ajustar para o timezone correto
          const appointmentDateTime = new Date()
          appointmentDateTime.setUTCFullYear(year, month - 1, day)
          appointmentDateTime.setUTCHours(hours, minutes, 0, 0)
          
          // Ajustar para o timezone da clínica
          const timezone = settings.timezone || 'Africa/Maputo'
          const timezoneOffset = new Date().toLocaleString('en-US', { timeZone: timezone, timeZoneName: 'short' })
          
          console.log('Creating appointment:', {
            date: appointmentData.date,
            time: appointmentData.time,
            professional: appointmentData.professional,
            scheduledAt: appointmentDateTime.toISOString()
          })
          
          // Verificar se a data não é no passado
          const now = new Date()
          if (appointmentDateTime < now) {
            console.error('Cannot create appointment in the past:', appointmentDateTime, 'vs', now)
          } else {
            // Encontrar profissional se especificado
            let professionalId: string | null = null
            let professionalName: string | null = appointmentData.professional && appointmentData.professional !== 'null' ? appointmentData.professional : null
            
            if (professionalName && professionals && professionals.length > 0) {
              const matchedProfessional = professionals.find((p: any) => 
                p.name.toLowerCase().includes(professionalName!.toLowerCase())
              )
              if (matchedProfessional) {
                professionalId = matchedProfessional.id
                professionalName = matchedProfessional.name
              }
            } else if (professionals && professionals.length === 1) {
              // Se só há um profissional, usar ele
              professionalId = professionals[0].id
              professionalName = professionals[0].name
            }
            
            // Duração padrão da consulta
            const durationMinutes = professionalId && professionals?.find((p: any) => p.id === professionalId)
              ? (professionals.find((p: any) => p.id === professionalId) as any).appointment_duration_minutes || settings.appointment_duration_minutes || 30
              : settings.appointment_duration_minutes || 30
            
            // Criar agendamento
            const appointmentPayload = {
              tenant_id: tenantId,
              patient_id: patientId,
              patient_name: patientName || existingPatient?.name || 'Sem nome',
              patient_phone: patientPhone,
              scheduled_at: appointmentDateTime.toISOString(),
              duration_minutes: durationMinutes,
              professional_id: professionalId,
              professional_name: professionalName,
              status: 'pending' as const,
            }
            
            console.log('Inserting appointment:', appointmentPayload)
            
            const { data: newAppointment, error: appointmentError } = await supabase
              .from('appointments')
              .insert(appointmentPayload)
              .select('id, scheduled_at, professional_name, patient_name')
              .single()
            
            if (appointmentError) {
              console.error('Error creating appointment:', appointmentError)
            } else if (newAppointment) {
              appointmentCreated = true
              createdAppointmentId = newAppointment.id
              console.log('✅ Appointment created successfully:', newAppointment.id, newAppointment.scheduled_at)
            }
          }
        } else {
          console.log('Appointment data incomplete:', appointmentData)
        }
      } else {
        console.log('No appointment JSON found in AI response')
      }
    } catch (error) {
      console.error('Error parsing appointment data from AI response:', error)
      // Continuar mesmo se houver erro ao extrair dados de agendamento
    }

    // Usar o agendamento recém-criado ou buscar um recente
    let recentAppointment: { id: string; scheduled_at: string; professional_name: string | null; patient_name: string } | null = null
    if (appointmentCreated && createdAppointmentId) {
      const { data: appointment } = await supabase
        .from('appointments')
        .select('id, scheduled_at, professional_name, patient_name')
        .eq('id', createdAppointmentId)
        .single()
      if (appointment) {
        recentAppointment = appointment
      }
    } else {
      // Buscar agendamento recente do paciente (criado nos últimos 2 minutos)
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
      const { data: foundAppointment } = await supabase
        .from('appointments')
        .select('id, scheduled_at, professional_name, patient_name')
        .eq('tenant_id', tenantId)
        .eq('patient_id', patientId)
        .eq('status', 'pending')
        .gte('created_at', twoMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (foundAppointment) {
        recentAppointment = foundAppointment
      }
    }

    // Se há um agendamento recente, adicionar link de check-in diretamente na resposta
    if (recentAppointment) {
      const appUrl = Deno.env.get('APP_URL') || 'https://medflow.app'
      const checkinLink = `${appUrl}/checkin/${recentAppointment.id}`
      
      // Adicionar o link de check-in diretamente na resposta
      reply = reply.trim() + `\n\n📋 *Link de Check-in*\nAntes da sua consulta, acesse o link abaixo para confirmar sua presença (disponível 5h antes do horário agendado):\n\n${checkinLink}`
      
      console.log('Added check-in link to reply for appointment:', recentAppointment.id)
    }

    // Salvar resposta no banco (já com o link de check-in se houver)
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
        // Enviar resposta principal
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
          console.log('WhatsApp message sent successfully (with check-in link if appointment was created)')
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
