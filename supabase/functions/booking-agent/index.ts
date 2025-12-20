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
  use_custom_openai: boolean | null
  openai_api_key: string | null
  google_calendar_connected: boolean | null
  google_calendar_id: string | null
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

async function createGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: {
    summary: string
    description: string
    start: string
    end: string
    attendeePhone?: string
  }
): Promise<{ id: string } | null> {
  try {
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
            timeZone: 'America/Sao_Paulo',
          },
          end: {
            dateTime: event.end,
            timeZone: 'America/Sao_Paulo',
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')?.replace(/\/$/, '')
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    const body = await req.json()
    const { tenantId, patientPhone, patientName, message, conversationHistory = [] } = body

    console.log('Agent request:', { tenantId, patientPhone, message })

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

    // Get available slots from appointments (simplified - in production would check Google Calendar)
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
    
    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('scheduled_at')
      .eq('tenant_id', tenantId)
      .gte('scheduled_at', today.toISOString())
      .lte('scheduled_at', nextWeek.toISOString())
      .in('status', ['pending', 'confirmed'])

    // Generate available slots based on business hours
    const availableSlots = generateAvailableSlots(
      tenantSettings.business_hours_start || '08:00',
      tenantSettings.business_hours_end || '18:00',
      tenantSettings.working_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      tenantSettings.appointment_duration_minutes || 30,
      existingAppointments?.map(a => a.scheduled_at) || []
    )

    // Build system prompt with improved instructions
    const systemPrompt = `Você é um assistente virtual de agendamento para a clínica "${tenantSettings.clinic_name || 'Nossa Clínica'}".

INFORMAÇÕES DA CLÍNICA:
- Nome: ${tenantSettings.clinic_name || 'Nossa Clínica'}
- Endereço: ${tenantSettings.clinic_address || 'Endereço não configurado'}
- Telefone: ${tenantSettings.clinic_phone || 'Telefone não configurado'}
- Horário de funcionamento: ${tenantSettings.business_hours_start || '08:00'} às ${tenantSettings.business_hours_end || '18:00'}
- Dias de funcionamento: ${(tenantSettings.working_days || []).join(', ')}
- Duração das consultas: ${tenantSettings.appointment_duration_minutes || 30} minutos

HORÁRIOS DISPONÍVEIS PARA OS PRÓXIMOS 14 DIAS:
${availableSlots.slice(0, 15).map(s => `- ${s.formatted}`).join('\n')}
${availableSlots.length > 15 ? `\n... e mais ${availableSlots.length - 15} horários disponíveis.` : ''}

SUAS INSTRUÇÕES (SIGA RIGOROSAMENTE):
1. Seja cordial e profissional
2. Se não souber o nome do paciente, pergunte o nome COMPLETO primeiro
3. Quando tiver o nome, sugira 3-5 horários disponíveis (não pergunte qual horário, ofereça opções diretas)
4. Quando o paciente escolher um horário ou confirmar com "sim", "ok", "pode ser", etc:
   - MARQUE IMEDIATAMENTE o agendamento usando o comando:
     [AGENDAR: YYYY-MM-DD HH:MM | NOME: Nome Completo do Paciente]
   - CONFIRME que a consulta foi agendada com data, hora e local
   - PERGUNTE se o paciente tem alguma dúvida ou se precisa de mais alguma coisa
5. NUNCA peça confirmação duas vezes - quando o paciente diz "sim" ou escolhe um horário, AGENDE!
6. Após agendar, sempre finalize perguntando: "Sua consulta está confirmada! Posso ajudar em mais alguma coisa?"

INFORMAÇÕES DO PACIENTE ATUAL:
- Telefone: ${patientPhone}
- Nome: ${patientName || 'Ainda não informado'}

EXEMPLO DE FLUXO CORRETO:
Paciente: "Quero marcar consulta"
Você: "Olá! Para agendar sua consulta, qual é seu nome completo?"
Paciente: "João Silva"
Você: "Prazer, João Silva! Temos estes horários disponíveis:
- Segunda, 23/12 às 09:00
- Segunda, 23/12 às 10:00
- Terça, 24/12 às 08:30
Qual prefere?"
Paciente: "Pode ser dia 23 às 09"
Você: "[AGENDAR: 2024-12-23 09:00 | NOME: João Silva]
Perfeito, João! ✅ Sua consulta foi agendada:
📅 Data: Segunda-feira, 23/12/2024
⏰ Horário: 09:00
📍 Local: ${tenantSettings.clinic_address || 'Endereço da clínica'}

Posso ajudar em mais alguma coisa?"

Responda de forma natural e amigável em português brasileiro.`

    // Prepare messages for AI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ]

    // Choose API based on settings
    let apiUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions'
    let apiKey = LOVABLE_API_KEY
    
    if (tenantSettings.use_custom_openai && tenantSettings.openai_api_key) {
      apiUrl = 'https://api.openai.com/v1/chat/completions'
      apiKey = tenantSettings.openai_api_key
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call AI
    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: tenantSettings.use_custom_openai ? 'gpt-4o-mini' : 'google/gemini-2.5-flash',
        messages,
        temperature: 0.7,
        max_tokens: 600,
      }),
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('AI API error:', aiResponse.status, errorText)
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded', reply: 'Desculpe, estamos com muitas solicitações. Tente novamente em alguns instantes.' }),
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

    // Check for booking command
    const bookingMatch = reply.match(/\[AGENDAR:\s*(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s*\|\s*NOME:\s*([^\]]+)\]/)
    let appointmentCreated = null
    let calendarEventId: string | null = null

    if (bookingMatch) {
      const [, date, time, name] = bookingMatch
      const scheduledAt = `${date}T${time}:00`
      const durationMinutes = tenantSettings.appointment_duration_minutes || 30
      
      console.log('Creating appointment:', { date, time, name: name.trim(), scheduledAt })
      
      // Find or create patient
      let patientId: string | null = null
      
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('whatsapp', patientPhone)
        .maybeSingle()
      
      if (existingPatient) {
        patientId = existingPatient.id
        // Update patient name if we have a better one
        await supabase
          .from('patients')
          .update({ name: name.trim() })
          .eq('id', patientId)
      } else {
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            tenant_id: tenantId,
            name: name.trim(),
            whatsapp: patientPhone,
          })
          .select('id')
          .single()
        
        if (!patientError && newPatient) {
          patientId = newPatient.id
          console.log('New patient created:', patientId)
        } else {
          console.error('Patient creation error:', patientError)
        }
      }

      // Create Google Calendar event if connected
      if (tenantSettings.google_calendar_connected && 
          tenantSettings.google_calendar_id && 
          tenantSettings.google_access_token &&
          GOOGLE_CLIENT_ID && 
          GOOGLE_CLIENT_SECRET) {
        
        let accessToken = tenantSettings.google_access_token
        
        // Check if token is expired and refresh if needed
        if (tenantSettings.google_token_expires_at && tenantSettings.google_refresh_token) {
          const expiresAt = new Date(tenantSettings.google_token_expires_at)
          const now = new Date()
          
          if (now >= expiresAt) {
            console.log('Access token expired, refreshing...')
            const refreshed = await refreshGoogleToken(
              tenantSettings.google_refresh_token,
              GOOGLE_CLIENT_ID,
              GOOGLE_CLIENT_SECRET
            )
            
            if (refreshed) {
              accessToken = refreshed.access_token
              const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
              
              // Update token in database
              await supabase
                .from('tenant_settings')
                .update({
                  google_access_token: accessToken,
                  google_token_expires_at: newExpiresAt,
                })
                .eq('tenant_id', tenantId)
              
              console.log('Token refreshed successfully')
            }
          }
        }
        
        // Calculate end time
        const startDate = new Date(`${date}T${time}:00`)
        const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000)
        const endTime = endDate.toTimeString().slice(0, 5)
        
        const calendarEvent = await createGoogleCalendarEvent(
          accessToken,
          tenantSettings.google_calendar_id,
          {
            summary: `Consulta: ${name.trim()}`,
            description: `Paciente: ${name.trim()}\nTelefone: ${patientPhone}\n\nAgendado via WhatsApp`,
            start: `${date}T${time}:00`,
            end: `${date}T${endTime}:00`,
            attendeePhone: patientPhone,
          }
        )
        
        if (calendarEvent) {
          calendarEventId = calendarEvent.id
          console.log('Calendar event created:', calendarEventId)
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
          patient_name: name.trim(),
          patient_phone: patientPhone,
          scheduled_at: scheduledAt,
          status: 'confirmed',
          duration_minutes: durationMinutes,
          calendar_event_id: calendarEventId,
        })
        .select()
        .single()

      if (!appointmentError && appointment) {
        appointmentCreated = appointment
        console.log('Appointment created successfully:', appointment.id)
      } else {
        console.error('Appointment creation error:', appointmentError)
      }
    }

    // Remove the booking command from the reply sent to user
    const cleanReply = reply.replace(/\[AGENDAR:[^\]]+\]/g, '').trim()

    // Save message to database
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('whatsapp', patientPhone)
      .maybeSingle()

    // Save incoming message
    await supabase.from('messages').insert({
      tenant_id: tenantId,
      patient_id: patient?.id,
      body: message,
      direction: 'inbound',
    })

    // Save outgoing message
    await supabase.from('messages').insert({
      tenant_id: tenantId,
      patient_id: patient?.id,
      body: cleanReply,
      direction: 'outbound',
      appointment_id: appointmentCreated?.id,
    })

    // Send reply via WhatsApp (Evolution API)
    if (EVOLUTION_API_URL && EVOLUTION_API_KEY) {
      const instanceName = `clinic_${tenantId.substring(0, 8)}`
      
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

function generateAvailableSlots(
  startTime: string,
  endTime: string,
  workingDays: string[],
  durationMinutes: number,
  bookedSlots: string[]
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
      const slotDateTime = `${dateStr}T${timeStr}:00`
      
      // Check if slot is in the past
      const slotDate = new Date(slotDateTime)
      if (slotDate <= today) {
        currentMin += durationMinutes
        if (currentMin >= 60) {
          currentHour += Math.floor(currentMin / 60)
          currentMin = currentMin % 60
        }
        continue
      }
      
      // Check if slot is booked
      const isBooked = bookedSlots.some(booked => {
        const bookedDate = new Date(booked)
        return Math.abs(bookedDate.getTime() - slotDate.getTime()) < durationMinutes * 60 * 1000
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
