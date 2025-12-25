import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TenantSettings {
  clinic_name: string | null
  clinic_address: string | null
  clinic_phone: string | null
  business_hours_start: string | null
  business_hours_end: string | null
  working_days: string[] | null
  appointment_duration_minutes: number | null
  agent_greeting_message: string | null
  agent_booking_confirmation: string | null
  agent_business_context: string | null
  agent_faqs: { question: string; answer: string }[] | null
  use_custom_openai: boolean | null
  google_calendar_connected: boolean | null
  google_calendar_id: string | null
  timezone: string | null
  notify_owner_on_booking: boolean | null
  notification_emails: string[] | null
}

interface TenantSecrets {
  openai_api_key: string | null
  google_access_token: string | null
  google_refresh_token: string | null
  google_token_expires_at: string | null
}

async function refreshGoogleToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })
    
    if (!response.ok) {
      console.error('Failed to refresh token:', await response.text())
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error refreshing token:', error)
    return null
  }
}

// Fetch Google Calendar events to check availability
async function fetchGoogleCalendarEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<{ start: string; end: string }[]> {
  try {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
    })
    
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to fetch calendar events:', errorText)
      return []
    }

    const data = await response.json()
    const events: { start: string; end: string }[] = []
    
    console.log(`Calendar ${calendarId} returned ${data.items?.length || 0} raw items`)
    
    for (const item of data.items || []) {
      // Skip all-day events (they have date instead of dateTime)
      if (item.start?.dateTime && item.end?.dateTime) {
        console.log(`Event found: ${item.summary || 'No title'} from ${item.start.dateTime} to ${item.end.dateTime}`)
        events.push({
          start: item.start.dateTime,
          end: item.end.dateTime,
        })
      } else {
        console.log(`Skipped all-day event: ${item.summary || 'No title'}`)
      }
    }
    
    console.log(`Fetched ${events.length} calendar events for availability check`)
    return events
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return []
  }
}

async function createGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: {
    summary: string
    description: string
    start: string
    end: string
    attendeePhone?: string
    timezone?: string
  }
): Promise<{ id: string } | null> {
  try {
    const tz = event.timezone || 'America/Sao_Paulo'
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: event.summary,
          description: event.description,
          start: {
            dateTime: event.start,
            timeZone: tz,
          },
          end: {
            dateTime: event.end,
            timeZone: tz,
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 60 },
              { method: 'popup', minutes: 15 },
            ],
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to create calendar event:', errorText)
      return null
    }

    const data = await response.json()
    console.log('Google Calendar event created:', data.id)
    return { id: data.id }
  } catch (error) {
    console.error('Error creating calendar event:', error)
    return null
  }
}

// Send email notification for new appointments
async function sendAppointmentEmailNotification(
  settings: TenantSettings,
  ownerEmail: string | null,
  appointment: {
    patient_name: string
    patient_phone: string
    scheduled_at: string
    professional_name: string | null
  }
): Promise<void> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  
  if (!RESEND_API_KEY) {
    console.log('RESEND_API_KEY not configured, skipping email notification')
    return
  }

  // Build email list
  const emailList: string[] = []
  
  if (settings.notify_owner_on_booking !== false && ownerEmail) {
    emailList.push(ownerEmail)
  }
  
  if (settings.notification_emails && settings.notification_emails.length > 0) {
    emailList.push(...settings.notification_emails)
  }
  
  if (emailList.length === 0) {
    console.log('No emails configured for notifications')
    return
  }

  // Format date/time based on timezone
  const timezone = settings.timezone || 'America/Sao_Paulo'
  const scheduledDate = new Date(appointment.scheduled_at)
  const formattedDate = scheduledDate.toLocaleDateString('pt-BR', { 
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const formattedTime = scheduledDate.toLocaleTimeString('pt-BR', { 
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit'
  })

  const clinicName = settings.clinic_name || 'Sua Clínica'
  const professionalText = appointment.professional_name 
    ? `<p><strong>Profissional:</strong> ${appointment.professional_name}</p>` 
    : ''

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${clinicName} <onboarding@resend.dev>`,
        to: emailList,
        subject: `📅 Novo Agendamento - ${appointment.patient_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Novo Agendamento Criado</h2>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Paciente:</strong> ${appointment.patient_name}</p>
              <p><strong>Telefone:</strong> ${appointment.patient_phone}</p>
              ${professionalText}
              <p><strong>Data:</strong> ${formattedDate}</p>
              <p><strong>Horário:</strong> ${formattedTime}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Este agendamento foi criado via WhatsApp pelo agente de IA.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px;">
              ${clinicName} - Sistema de Agendamento Inteligente
            </p>
          </div>
        `,
      }),
    })

    if (!response.ok) {
      console.error('Email notification failed:', await response.text())
    } else {
      console.log('Email notification sent to:', emailList.join(', '))
    }
  } catch (error) {
    console.error('Error sending email notification:', error)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')?.replace(/\/$/, '')
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')

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

    console.log('Agent request:', { tenantId, patientPhone, message, messageId, remoteJid })

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

    const tenantSettings = settings as TenantSettings

    // Get tenant secrets (Google tokens, OpenAI key) - stored separately for security
    const { data: secretsData } = await supabase
      .from('tenant_secrets')
      .select('openai_api_key, google_access_token, google_refresh_token, google_token_expires_at')
      .eq('tenant_id', tenantId)
      .maybeSingle()

    const tenantSecrets: TenantSecrets = secretsData || {
      openai_api_key: null,
      google_access_token: null,
      google_refresh_token: null,
      google_token_expires_at: null,
    }

    // Find or create patient early so messages list can show a name
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

      // If we got a pushName and the stored name is missing/placeholder, update it
      if (patientName && (!existingPatient.name || existingPatient.name === placeholderName)) {
        await supabase
          .from('patients')
          .update({ name: patientName })
          .eq('id', patientId)
      }
    } else {
      // Always create patient if doesn't exist (even without name) to ensure messages are linked
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          tenant_id: tenantId,
          name: patientName || placeholderName,
          whatsapp: patientPhone,
        })
        .select('id')
        .single()

      if (!patientError && newPatient) {
        patientId = newPatient.id
        console.log('Patient created with id:', patientId)
      } else {
        console.error('Patient creation error:', patientError)
      }
    }

    // Track agent conversation - find or create active conversation
    let conversationId: string | null = null
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    
    // Look for an active conversation (started in last 30 minutes without outcome)
    const { data: existingConversation } = await supabase
      .from('agent_conversations')
      .select('id, messages_count')
      .eq('tenant_id', tenantId)
      .eq('patient_phone', patientPhone)
      .is('outcome', null)
      .gte('started_at', thirtyMinutesAgo)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingConversation) {
      conversationId = existingConversation.id
      // Increment messages count
      await supabase
        .from('agent_conversations')
        .update({ messages_count: (existingConversation.messages_count || 0) + 1 })
        .eq('id', conversationId)
    } else {
      // Create new conversation
      const { data: newConversation } = await supabase
        .from('agent_conversations')
        .insert({
          tenant_id: tenantId,
          patient_phone: patientPhone,
          patient_id: patientId,
          messages_count: 1,
        })
        .select('id')
        .single()
      
      if (newConversation) {
        conversationId = newConversation.id
        console.log('New agent conversation started:', conversationId)
      }
    }

    // Fetch professionals for this tenant
    const { data: professionals } = await supabase
      .from('professionals')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name')

    const hasProfessionals = professionals && professionals.length > 0
    console.log(`Found ${professionals?.length || 0} active professionals`)

    // Fetch waitlist with patient info
    const { data: waitlistData } = await supabase
      .from('waitlist')
      .select('*, patient:patients(name, whatsapp)')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('priority', { ascending: false })

    const waitlistCount = waitlistData?.length || 0
    console.log(`Found ${waitlistCount} patients on waitlist`)

    // Fetch upcoming appointments count
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    const { data: todayAppointments } = await supabase
      .from('appointments')
      .select('id, scheduled_at, patient_name, professional_name, status')
      .eq('tenant_id', tenantId)
      .gte('scheduled_at', `${todayStr}T00:00:00`)
      .lte('scheduled_at', `${todayStr}T23:59:59`)
      .in('status', ['pending', 'confirmed'])
      .order('scheduled_at')

    const todayAppointmentsCount = todayAppointments?.length || 0

    // Get available slots from appointments AND Google Calendar
    const nextWeek = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)

    // Build slots per professional (or single global slot list if no professionals)
    interface SlotInfo {
      date: string
      time: string
      formatted: string
      professionalId?: string
      professionalName?: string
    }
    
    let availableSlots: SlotInfo[] = []
    
    // Helper function to get valid access token
    const getValidAccessToken = async (): Promise<string | null> => {
      if (!tenantSecrets.google_access_token) return null
      
      let accessToken = tenantSecrets.google_access_token
      
      // Check if token is expired and refresh if needed
      if (tenantSecrets.google_token_expires_at && tenantSecrets.google_refresh_token) {
        const expiresAt = new Date(tenantSecrets.google_token_expires_at)
        const now = new Date()
        
        if (now >= expiresAt && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
          const refreshed = await refreshGoogleToken(
            tenantSecrets.google_refresh_token,
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET
          )
          
          if (refreshed) {
            accessToken = refreshed.access_token
            const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
            
            // Update token in tenant_secrets table
            await supabase
              .from('tenant_secrets')
              .update({
                google_access_token: accessToken,
                google_token_expires_at: newExpiresAt,
              })
              .eq('tenant_id', tenantId)
            
            console.log('Token refreshed successfully')
          }
        }
      }
      
      return accessToken
    }

    // Day names in Portuguese
    const dayTranslation: Record<string, string> = {
      'monday': 'Segunda-feira',
      'tuesday': 'Terça-feira',
      'wednesday': 'Quarta-feira',
      'thursday': 'Quinta-feira',
      'friday': 'Sexta-feira',
      'saturday': 'Sábado',
      'sunday': 'Domingo'
    }

    // Check if a professional works today
    const todayDayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today.getDay()]
    
    if (hasProfessionals) {
      // Get valid access token once for all professionals
      const accessToken = tenantSettings.google_calendar_connected ? await getValidAccessToken() : null
      
      // Generate slots for each professional
      for (const prof of professionals!) {
        // Get appointments for this professional
        const { data: profAppointments } = await supabase
          .from('appointments')
          .select('scheduled_at, duration_minutes')
          .eq('tenant_id', tenantId)
          .eq('professional_id', prof.id)
          .gte('scheduled_at', today.toISOString())
          .lte('scheduled_at', nextWeek.toISOString())
          .in('status', ['pending', 'confirmed'])

        const bookedRanges: { start: Date; end: Date }[] = []
        
        // Add appointments from database
        for (const apt of profAppointments || []) {
          const start = new Date(apt.scheduled_at)
          const duration = apt.duration_minutes || prof.appointment_duration_minutes || 30
          const end = new Date(start.getTime() + duration * 60 * 1000)
          bookedRanges.push({ start, end })
        }

        // Fetch Google Calendar events for this professional or main calendar
        const calendarId = prof.google_calendar_id || tenantSettings.google_calendar_id
        if (tenantSettings.google_calendar_connected && calendarId && accessToken) {
          const calendarEvents = await fetchGoogleCalendarEvents(
            accessToken,
            calendarId,
            today.toISOString(),
            nextWeek.toISOString()
          )
          
          for (const event of calendarEvents) {
            bookedRanges.push({
              start: new Date(event.start),
              end: new Date(event.end),
            })
          }
        }

        // Generate slots for this professional
        const profSlots = generateAvailableSlotsWithRanges(
          prof.business_hours_start || '08:00',
          prof.business_hours_end || '18:00',
          prof.working_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          prof.appointment_duration_minutes || 30,
          bookedRanges
        )

        // Add professional info to slots
        for (const slot of profSlots) {
          availableSlots.push({
            ...slot,
            professionalId: prof.id,
            professionalName: prof.name,
          })
        }
      }

      // Sort by date/time, then by professional name
      availableSlots.sort((a, b) => {
        const dateCompare = `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)
        if (dateCompare !== 0) return dateCompare
        return (a.professionalName || '').localeCompare(b.professionalName || '')
      })

      console.log(`Total available slots across all professionals: ${availableSlots.length}`)
    } else {
      // No professionals - use tenant settings (legacy mode)
      const { data: existingAppointments } = await supabase
        .from('appointments')
        .select('scheduled_at, duration_minutes')
        .eq('tenant_id', tenantId)
        .gte('scheduled_at', today.toISOString())
        .lte('scheduled_at', nextWeek.toISOString())
        .in('status', ['pending', 'confirmed'])

      const bookedRanges: { start: Date; end: Date }[] = []
      
      for (const apt of existingAppointments || []) {
        const start = new Date(apt.scheduled_at)
        const duration = apt.duration_minutes || tenantSettings.appointment_duration_minutes || 30
        const end = new Date(start.getTime() + duration * 60 * 1000)
        bookedRanges.push({ start, end })
      }

      if (tenantSettings.google_calendar_connected && 
          tenantSettings.google_calendar_id && 
          tenantSecrets.google_access_token &&
          GOOGLE_CLIENT_ID && 
          GOOGLE_CLIENT_SECRET) {
        
        const accessToken = await getValidAccessToken()
        
        if (accessToken) {
          const calendarEvents = await fetchGoogleCalendarEvents(
            accessToken,
            tenantSettings.google_calendar_id,
            today.toISOString(),
            nextWeek.toISOString()
          )
          
          for (const event of calendarEvents) {
            bookedRanges.push({
              start: new Date(event.start),
              end: new Date(event.end),
            })
          }
        }
      }

      const slots = generateAvailableSlotsWithRanges(
        tenantSettings.business_hours_start || '08:00',
        tenantSettings.business_hours_end || '18:00',
        tenantSettings.working_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        tenantSettings.appointment_duration_minutes || 30,
        bookedRanges
      )
      
      availableSlots = slots.map(s => ({ ...s }))
    }

    // Get current year for the prompt
    const currentYear = new Date().getFullYear()
    
    // Build business context section
    const businessContextSection = tenantSettings.agent_business_context 
      ? `\n\nSOBRE O NEGÓCIO (use essas informações para responder perguntas sobre serviços, preços, etc.):\n${tenantSettings.agent_business_context}\n`
      : ''

    // Build custom FAQs section
    const customFaqs = tenantSettings.agent_faqs && tenantSettings.agent_faqs.length > 0
      ? tenantSettings.agent_faqs.map(faq => `- "${faq.question}" → "${faq.answer}"`).join('\n')
      : ''

    // Build detailed professionals info with schedules
    let professionalsDetailedInfo = ''
    if (hasProfessionals && professionals) {
      professionalsDetailedInfo = `\n📋 PROFISSIONAIS DA CLÍNICA (INFORMAÇÃO COMPLETA):\n`
      for (const prof of professionals) {
        const workDays = (prof.working_days || []).map((d: string) => dayTranslation[d] || d).join(', ')
        const worksToday = (prof.working_days || []).includes(todayDayName)
        const profTodaySlots = availableSlots.filter(s => s.professionalId === prof.id && s.date === todayStr)
        
        professionalsDetailedInfo += `
👨‍⚕️ ${prof.name}${prof.specialty ? ` - ${prof.specialty}` : ''}
   • Horário: ${prof.business_hours_start || '08:00'} às ${prof.business_hours_end || '18:00'}
   • Dias de trabalho: ${workDays}
   • Duração consulta: ${prof.appointment_duration_minutes || 30} minutos
   • Trabalha HOJE (${dayTranslation[todayDayName]}): ${worksToday ? 'SIM ✅' : 'NÃO ❌'}
   • Vagas disponíveis hoje: ${profTodaySlots.length}
`
      }
    }

    // Build waitlist info
    const waitlistInfo = `\n📝 LISTA DE ESPERA:
- Total de pacientes na fila: ${waitlistCount}
${waitlistCount > 0 && waitlistData ? `- Próximos na fila: ${waitlistData.slice(0, 3).map(w => w.patient?.name || 'Paciente').join(', ')}` : '- A lista está vazia'}
`

    // Build today's summary
    const todaySummary = `\n📅 RESUMO DE HOJE (${today.toLocaleDateString('pt-BR')}):
- Consultas agendadas hoje: ${todayAppointmentsCount}
- Vagas disponíveis hoje: ${availableSlots.filter(s => s.date === todayStr).length}
${todayAppointments && todayAppointments.length > 0 ? `- Próximas consultas: ${todayAppointments.slice(0, 3).map(a => `${a.patient_name} às ${new Date(a.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}${a.professional_name ? ` com ${a.professional_name}` : ''}`).join(', ')}` : ''}
`

    // Format available slots for prompt (group by time to show which professionals are available)
    const slotsForPrompt = hasProfessionals
      ? availableSlots.slice(0, 25).map(s => `- ${s.formatted} com ${s.professionalName} (${s.date})`).join('\n')
      : availableSlots.slice(0, 20).map(s => `- ${s.formatted} (${s.date})`).join('\n')

    // Build system prompt with improved instructions
    const systemPrompt = `Você é um assistente virtual INTELIGENTE da clínica "${tenantSettings.clinic_name || 'Nossa Clínica'}".
Você tem ACESSO COMPLETO a todas as informações da clínica e pode responder QUALQUER pergunta sobre profissionais, horários, disponibilidade, lista de espera, etc.

📆 DATA/HORA ATUAL: ${today.toLocaleDateString('pt-BR')} ${today.toLocaleTimeString('pt-BR')} (${currentYear})
DIA DA SEMANA: ${dayTranslation[todayDayName]}

🏥 INFORMAÇÕES DA CLÍNICA:
- Nome: ${tenantSettings.clinic_name || 'Nossa Clínica'}
- Endereço: ${tenantSettings.clinic_address || 'Endereço não configurado'}
- Telefone/Suporte: ${tenantSettings.clinic_phone || 'Telefone não configurado'}
- Horário geral: ${tenantSettings.business_hours_start || '08:00'} às ${tenantSettings.business_hours_end || '18:00'}
- Dias de funcionamento: ${(tenantSettings.working_days || []).map(d => dayTranslation[d] || d).join(', ')}
${professionalsDetailedInfo}${todaySummary}${waitlistInfo}${businessContextSection}

⏰ HORÁRIOS DISPONÍVEIS PARA OS PRÓXIMOS 14 DIAS:
${slotsForPrompt}
${availableSlots.length > 25 ? `\n... e mais ${availableSlots.length - 25} horários disponíveis.` : ''}

📌 SUAS CAPACIDADES (você pode fazer TUDO isso):
1. ✅ Responder sobre QUALQUER profissional: horário, dias de trabalho, especialidade, se trabalha hoje
2. ✅ Verificar disponibilidade no Google Calendar em tempo real
3. ✅ Informar quantas pessoas estão na lista de espera
4. ✅ Adicionar paciente à lista de espera
5. ✅ Agendar consultas com qualquer profissional disponível
6. ✅ Informar sobre consultas de hoje e próximos dias
7. ✅ Responder perguntas sobre serviços, preços, localização

📋 COMANDOS ESPECIAIS (use quando apropriado):
- Para AGENDAR: [AGENDAR: ${currentYear}-MM-DD HH:MM | NOME: Nome Paciente${hasProfessionals ? ' | PROFISSIONAL: Nome Profissional' : ''}]
- Para LISTA DE ESPERA: [LISTA_ESPERA: NOME: Nome Paciente | DATA_PREFERIDA: ${currentYear}-MM-DD | HORARIO: HH:MM]

📝 INSTRUÇÕES:
1. Seja cordial, profissional e PROATIVO
2. Se perguntarem sobre um profissional específico, use as informações detalhadas acima
3. Se perguntarem "o Dr. X trabalha hoje?", verifique os dias de trabalho do profissional
4. Se não houver vagas, ofereça adicionar à lista de espera
5. Se não souber o nome do paciente para agendamento, pergunte primeiro
6. Use as informações em tempo real - você tem acesso a tudo!

${customFaqs ? `❓ PERGUNTAS FREQUENTES CONFIGURADAS:\n${customFaqs}\n` : ''}

👤 PACIENTE ATUAL:
- Telefone: ${patientPhone}
- Nome: ${patientName || 'Ainda não informado'}

Responda de forma natural, amigável e COMPLETA em português brasileiro. Você é um assistente inteligente que SABE DE TUDO sobre a clínica!`

    // Prepare messages for AI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ]

    // Check if tenant uses custom OpenAI key
    const useCustomOpenAI = tenantSettings.use_custom_openai && tenantSecrets.openai_api_key
    
    // Use Lovable AI Gateway (preferred) or custom OpenAI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    
    let aiResponse: Response
    
    if (useCustomOpenAI) {
      // Use custom OpenAI API
      aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tenantSecrets.openai_api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 600,
        }),
      })
    } else if (LOVABLE_API_KEY) {
      // Use Lovable AI Gateway (no rate limits, preferred)
      aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
    } else if (GOOGLE_GEMINI_API_KEY) {
      // Fallback to direct Gemini API (may have rate limits)
      const geminiMessages = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : m.role === 'system' ? 'user' : m.role,
        parts: [{ text: m.role === 'system' ? `[SYSTEM INSTRUCTIONS]\n${m.content}` : m.content }]
      }))
      
      aiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: geminiMessages,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 600,
            },
          }),
        }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'AI API not configured. Please ensure LOVABLE_API_KEY is available.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('AI API error:', aiResponse.status, errorText)
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded', reply: 'Desculpe, estamos com muitas solicitações. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted', reply: 'Desculpe, o serviço de IA está temporariamente indisponível.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({ error: 'AI API error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const aiData = await aiResponse.json()
    
    // Parse response - Lovable AI and OpenAI use same format, Gemini is different
    let reply: string
    if (!useCustomOpenAI && !LOVABLE_API_KEY && GOOGLE_GEMINI_API_KEY) {
      // Direct Gemini API format
      reply = aiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, não entendi. Pode repetir?'
    } else {
      // OpenAI-compatible format (Lovable AI Gateway and OpenAI)
      reply = aiData.choices?.[0]?.message?.content || 'Desculpe, não entendi. Pode repetir?'
    }

    console.log('AI reply:', reply)

    // Check for booking command - now supports optional PROFISSIONAL field
    const bookingMatchWithProf = reply.match(/\[AGENDAR:\s*(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s*\|\s*NOME:\s*([^|\]]+)\s*\|\s*PROFISSIONAL:\s*([^\]]+)\]/)
    const bookingMatchSimple = reply.match(/\[AGENDAR:\s*(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s*\|\s*NOME:\s*([^\]]+)\]/)
    
    const bookingMatch = bookingMatchWithProf || bookingMatchSimple
    let appointmentCreated = null
    let calendarEventId: string | null = null

    if (bookingMatch) {
      const [, date, time, nameRaw] = bookingMatch
      const professionalNameFromAI = bookingMatchWithProf ? bookingMatchWithProf[4]?.trim() : null
      const name = nameRaw.trim()
      const tenantTimezone = tenantSettings.timezone || 'America/Sao_Paulo'
      
      // Create scheduledAt - the time provided by user is in their timezone
      // We'll store it as a simple ISO timestamp and use the timezone setting for display
      const scheduledAt = `${date}T${time}:00`
      
      console.log('Booking request:', { date, time, name, scheduledAt, timezone: tenantTimezone })
      
      // Find the professional to use
      let selectedProfessional: { id: string; name: string; google_calendar_id: string | null; appointment_duration_minutes: number | null } | null = null
      let durationMinutes = tenantSettings.appointment_duration_minutes || 30
      
      if (hasProfessionals && professionals) {
        if (professionalNameFromAI) {
          // Try to find the professional by name
          selectedProfessional = professionals.find(p => 
            p.name.toLowerCase().includes(professionalNameFromAI.toLowerCase()) ||
            professionalNameFromAI.toLowerCase().includes(p.name.toLowerCase())
          ) || null
        }
        
        // If no specific professional found, find first available for this slot
        if (!selectedProfessional) {
          const slotForTime = availableSlots.find(s => s.date === date && s.time === time)
          if (slotForTime?.professionalId) {
            selectedProfessional = professionals.find(p => p.id === slotForTime.professionalId) || null
          }
        }
        
        // Fallback to first professional
        if (!selectedProfessional && professionals.length > 0) {
          selectedProfessional = professionals[0]
        }
        
        if (selectedProfessional) {
          durationMinutes = selectedProfessional.appointment_duration_minutes || 30
        }
      }
      
      console.log('Creating appointment:', { 
        date, time, name, scheduledAt, 
        professional: selectedProfessional?.name || 'none'
      })
      
      // Find or create patient (reuse existing if possible)
      let bookingPatientId: string | null = patientId

      const { data: patientRow } = await supabase
        .from('patients')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('whatsapp', patientPhone)
        .maybeSingle()

      if (patientRow?.id) {
        bookingPatientId = patientRow.id
        await supabase
          .from('patients')
          .update({ name: name })
          .eq('id', bookingPatientId)
      } else {
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            tenant_id: tenantId,
            name: name,
            whatsapp: patientPhone,
          })
          .select('id')
          .single()

        if (!patientError && newPatient) {
          bookingPatientId = newPatient.id
          console.log('New patient created:', bookingPatientId)
        } else {
          console.error('Patient creation error:', patientError)
        }
      }

      // keep patientId updated for message linking
      patientId = bookingPatientId

      // Create Google Calendar event if connected
      const calendarIdToUse = selectedProfessional?.google_calendar_id || tenantSettings.google_calendar_id
      
      if (tenantSettings.google_calendar_connected && 
          calendarIdToUse && 
          tenantSecrets.google_access_token &&
          GOOGLE_CLIENT_ID && 
          GOOGLE_CLIENT_SECRET) {
        
        const accessToken = await getValidAccessToken()
        
        if (accessToken) {
          // Calculate end time
          const startDate = new Date(`${date}T${time}:00`)
          const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000)
          const endTime = endDate.toTimeString().slice(0, 5)
          
          const calendarEvent = await createGoogleCalendarEvent(
            accessToken,
            calendarIdToUse,
            {
              summary: `Consulta: ${name}${selectedProfessional ? ` - ${selectedProfessional.name}` : ''}`,
              description: `Paciente: ${name}\nTelefone: ${patientPhone}${selectedProfessional ? `\nProfissional: ${selectedProfessional.name}` : ''}\n\nAgendado via WhatsApp`,
              start: `${date}T${time}:00`,
              end: `${date}T${endTime}:00`,
              attendeePhone: patientPhone,
              timezone: tenantTimezone,
            }
          )
          
          if (calendarEvent) {
            calendarEventId = calendarEvent.id
            console.log('Calendar event created:', calendarEventId, 'with timezone:', tenantTimezone)
          }
        }
      } else {
        console.log('Google Calendar not connected or missing credentials')
      }

      // Create appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          tenant_id: tenantId,
          patient_id: patientId,
          patient_name: name,
          patient_phone: patientPhone,
          scheduled_at: scheduledAt,
          status: 'confirmed',
          duration_minutes: durationMinutes,
          calendar_event_id: calendarEventId,
          professional_id: selectedProfessional?.id || null,
          professional_name: selectedProfessional?.name || null,
        })
        .select()
        .single()

      if (!appointmentError && appointment) {
        appointmentCreated = appointment
        console.log('Appointment created successfully:', appointment.id, 'for professional:', selectedProfessional?.name)
        
        // Send email notification
        // Get owner email from profiles table
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('tenant_id', tenantId)
          .limit(1)
          .maybeSingle()
        
        await sendAppointmentEmailNotification(
          tenantSettings,
          ownerProfile?.email || null,
          {
            patient_name: name,
            patient_phone: patientPhone,
            scheduled_at: scheduledAt,
            professional_name: selectedProfessional?.name || null,
          }
        )
      } else {
        console.error('Appointment creation error:', appointmentError)
      }
    }

    // Check for waitlist command
    // Format: [LISTA_ESPERA: NOME: Nome Paciente | DATA_PREFERIDA: 2025-01-15 | HORARIO: 09:00]
    const waitlistMatch = reply.match(/\[LISTA_ESPERA:\s*NOME:\s*([^|]+)\s*(?:\|\s*DATA_PREFERIDA:\s*(\d{4}-\d{2}-\d{2}))?\s*(?:\|\s*HORARIO:\s*(\d{2}:\d{2}))?\s*\]/)
    let waitlistAdded = null

    if (waitlistMatch) {
      const [, nameRaw, preferredDate, preferredTime] = waitlistMatch
      const name = nameRaw.trim()
      
      console.log('Adding to waitlist:', { name, preferredDate, preferredTime })

      // Find or create patient
      let waitlistPatientId: string | null = patientId

      const { data: patientRow } = await supabase
        .from('patients')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('whatsapp', patientPhone)
        .maybeSingle()

      if (patientRow?.id) {
        waitlistPatientId = patientRow.id
        await supabase
          .from('patients')
          .update({ name: name })
          .eq('id', waitlistPatientId)
      } else {
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            tenant_id: tenantId,
            name: name,
            whatsapp: patientPhone,
          })
          .select('id')
          .single()

        if (!patientError && newPatient) {
          waitlistPatientId = newPatient.id
          console.log('New patient created for waitlist:', waitlistPatientId)
        }
      }

      if (waitlistPatientId) {
        // Check if patient is already on waitlist
        const { data: existingWaitlist } = await supabase
          .from('waitlist')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('patient_id', waitlistPatientId)
          .eq('is_active', true)
          .maybeSingle()

        if (existingWaitlist) {
          // Update existing waitlist entry
          const { data: updated, error: updateError } = await supabase
            .from('waitlist')
            .update({
              preferred_date: preferredDate || null,
              preferred_time_start: preferredTime || null,
            })
            .eq('id', existingWaitlist.id)
            .select()
            .single()

          if (!updateError && updated) {
            waitlistAdded = updated
            console.log('Waitlist entry updated:', updated.id)
          }
        } else {
          // Create new waitlist entry
          const { data: newWaitlist, error: waitlistError } = await supabase
            .from('waitlist')
            .insert({
              tenant_id: tenantId,
              patient_id: waitlistPatientId,
              preferred_date: preferredDate || null,
              preferred_time_start: preferredTime || null,
              is_active: true,
              priority: 0,
            })
            .select()
            .single()

          if (!waitlistError && newWaitlist) {
            waitlistAdded = newWaitlist
            console.log('Patient added to waitlist:', newWaitlist.id)
          } else {
            console.error('Waitlist creation error:', waitlistError)
          }
        }
        
        patientId = waitlistPatientId
      }
    }

    // Remove the booking and waitlist commands from the reply sent to user
    const cleanReply = reply
      .replace(/\[AGENDAR:[^\]]+\]/g, '')
      .replace(/\[LISTA_ESPERA:[^\]]+\]/g, '')
      .trim()

    // Save incoming message
    await supabase.from('messages').insert({
      tenant_id: tenantId,
      patient_id: patientId,
      body: message,
      direction: 'inbound',
    })

    // Save outgoing message
    await supabase.from('messages').insert({
      tenant_id: tenantId,
      patient_id: patientId,
      body: cleanReply,
      direction: 'outbound',
      appointment_id: appointmentCreated?.id,
    })

    // Update conversation outcome if we have a result
    if (conversationId) {
      let outcome: string | null = null
      
      if (appointmentCreated) {
        outcome = 'booking_success'
      } else if (waitlistAdded) {
        outcome = 'waitlist_added'
      }
      // For info_only and abandoned, we track them later or via a cleanup job
      
      if (outcome) {
        await supabase
          .from('agent_conversations')
          .update({ 
            outcome,
            appointment_id: appointmentCreated?.id || null,
            ended_at: new Date().toISOString()
          })
          .eq('id', conversationId)
        console.log('Conversation outcome updated:', outcome)
      }
    }
    if (EVOLUTION_API_URL && EVOLUTION_API_KEY) {
      const instanceName = `clinic_${tenantId.replace(/-/g, '')}`
      
      // Add 10 second delay before sending response
      console.log('Waiting 10 seconds before sending reply...')
      await new Promise(resolve => setTimeout(resolve, 10000))
      
      try {
        await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
          },
          body: JSON.stringify({
            number: patientPhone,
            text: cleanReply,
          }),
        })
        console.log('WhatsApp message sent')
      } catch (e) {
        console.error('Error sending WhatsApp:', e)
      }
    }

    return new Response(
      JSON.stringify({ 
        reply: cleanReply,
        appointmentCreated,
        calendarEventId,
        waitlistAdded,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function normalizePhone(input: unknown): string {
  const str = typeof input === 'string' ? input : ''
  // Keep only digits (handles "+258...", spaces, etc.)
  return str.replace(/\D/g, '')
}

// New function that checks against time ranges (more accurate)
function generateAvailableSlotsWithRanges(
  startTime: string,
  endTime: string,
  workingDays: string[],
  durationMinutes: number,
  bookedRanges: { start: Date; end: Date }[]
): { date: string; time: string; formatted: string }[] {
  const slots: { date: string; time: string; formatted: string }[] = []
  const today = new Date()
  
  const dayMap: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6
  }
  
  const workingDayNumbers = workingDays.map(d => dayMap[d.toLowerCase()])
  
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const date = new Date(today)
    date.setDate(today.getDate() + dayOffset)
    
    if (!workingDayNumbers.includes(date.getDay())) continue
    
    const dateStr = date.toISOString().split('T')[0]
    
    let currentHour = startHour
    let currentMin = startMin
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`
      const slotStart = new Date(`${dateStr}T${timeStr}:00`)
      const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000)
      
      // Check if slot is in the past
      if (slotStart <= today) {
        currentMin += durationMinutes
        if (currentMin >= 60) {
          currentHour += Math.floor(currentMin / 60)
          currentMin = currentMin % 60
        }
        continue
      }
      
      // Check if slot overlaps with any booked range
      const isBooked = bookedRanges.some(range => {
        // Overlap: slot starts before range ends AND slot ends after range starts
        return slotStart < range.end && slotEnd > range.start
      })
      
      if (!isBooked) {
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
        const formatted = `${dayNames[date.getDay()]}, ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} às ${timeStr}`
        
        slots.push({ date: dateStr, time: timeStr, formatted })
      }
      
      currentMin += durationMinutes
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60)
        currentMin = currentMin % 60
      }
    }
  }
  
  return slots
}

// Keep legacy function for backward compatibility
function generateAvailableSlots(
  startTime: string,
  endTime: string,
  workingDays: string[],
  durationMinutes: number,
  bookedSlots: string[]
): { date: string; time: string; formatted: string }[] {
  const bookedRanges = bookedSlots.map(slot => {
    const start = new Date(slot)
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
    return { start, end }
  })
  return generateAvailableSlotsWithRanges(startTime, endTime, workingDays, durationMinutes, bookedRanges)
}
