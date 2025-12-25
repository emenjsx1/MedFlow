import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate QR Code URL using a free API
function generateQRCodeUrl(data: string, size: number = 300): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&format=png`
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
    const APP_URL = Deno.env.get('APP_URL') || 'https://pewviewagendaclin.lovable.app'

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const now = new Date()
    console.log('Running appointment reminders at:', now.toISOString())

    // Get appointments in the next 70 minutes (to catch 1h, 10min reminders)
    const oneHourFromNow = new Date(now.getTime() + 70 * 60 * 1000)
    
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .in('status', ['pending', 'confirmed'])
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', oneHourFromNow.toISOString())

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError)
      throw appointmentsError
    }

    // Fetch tenant settings for each unique tenant
    const tenantIds = [...new Set(appointments?.map(a => a.tenant_id) || [])]
    const tenantSettingsMap: Record<string, any> = {}
    
    for (const tenantId of tenantIds) {
      const { data: settings } = await supabase
        .from('tenant_settings')
        .select('clinic_name, clinic_address, clinic_phone, whatsapp_session_id, whatsapp_connected')
        .eq('tenant_id', tenantId)
        .single()
      
      if (settings) {
        tenantSettingsMap[tenantId] = settings
      }
    }

    console.log(`Found ${appointments?.length || 0} appointments to check`)

    const results = {
      oneHourReminders: 0,
      tenMinReminders: 0,
      checkinLinksSent: 0,
      errors: 0,
    }

    for (const appointment of appointments || []) {
      const scheduledAt = new Date(appointment.scheduled_at)
      const minutesUntil = Math.round((scheduledAt.getTime() - now.getTime()) / (60 * 1000))
      
      if (!appointment.patient_phone) {
        console.log(`Skipping appointment ${appointment.id}: no patient phone`)
        continue
      }

      const tenantId = appointment.tenant_id
      const instanceName = `clinic_${tenantId.substring(0, 8)}`
      
      // Format date nicely
      const dateStr = scheduledAt.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      const timeStr = scheduledAt.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })

      let message = ''
      let shouldSend = false
      let reminderType = ''
      let sendQRCode = false
      let checkinUrl = ''

      // 1 hour reminder WITH CHECK-IN LINK (55-65 minutes before)
      if (minutesUntil >= 55 && minutesUntil <= 65) {
        // Check if we already sent 1h reminder
        const { data: existingReminder } = await supabase
          .from('messages')
          .select('id')
          .eq('appointment_id', appointment.id)
          .eq('direction', 'outbound')
          .ilike('body', '%check-in%')
          .maybeSingle()

        if (!existingReminder) {
          // Generate check-in URL - send 1 hour before so patient can check in when arriving
          checkinUrl = `${APP_URL}/checkin/${appointment.id}`
          
          const tenantSettings = tenantSettingsMap[tenantId] || {}
          message = `⏰ *${appointment.patient_name}, sua consulta é em 1 hora!*\n\n📅 ${dateStr}\n⏰ ${timeStr}\n📍 ${tenantSettings.clinic_address || 'Endereço da clínica'}\n\n✅ *Para CONFIRMAR sua presença, faça o check-in ao chegar:*\n👉 ${checkinUrl}\n\n📱 Ou escaneie o QR Code ao chegar na clínica!\n\n⚠️ Sem check-in, sua consulta ficará como *não compareceu*.`
          shouldSend = true
          reminderType = '1h'
          sendQRCode = true
        }
      }
      // 10 minute reminder (simple reminder, QR code already sent at 1h)
      else if (minutesUntil >= 8 && minutesUntil <= 12) {
        // Check if we already sent 10min reminder
        const { data: existingReminder } = await supabase
          .from('messages')
          .select('id')
          .eq('appointment_id', appointment.id)
          .eq('direction', 'outbound')
          .ilike('body', '%10 minutos%')
          .maybeSingle()

        if (!existingReminder) {
          checkinUrl = `${APP_URL}/checkin/${appointment.id}`
          message = `🔔 *Último lembrete, ${appointment.patient_name}!*\n\nSua consulta começa em 10 minutos!\n⏰ ${timeStr}\n\n👉 Faça check-in agora: ${checkinUrl}`
          shouldSend = true
          reminderType = '10min'
        }
      }

      if (shouldSend && EVOLUTION_API_URL && EVOLUTION_API_KEY) {
        try {
          // First send the text message
          const textResponse = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': EVOLUTION_API_KEY,
            },
            body: JSON.stringify({
              number: appointment.patient_phone,
              text: message,
            }),
          })

          if (textResponse.ok) {
            console.log(`${reminderType} reminder sent to ${appointment.patient_name}`)
            
            // Save message to database
            await supabase.from('messages').insert({
              tenant_id: tenantId,
              patient_id: appointment.patient_id,
              appointment_id: appointment.id,
              body: message,
              direction: 'outbound',
              status: 'sent',
            })

            // Update last_contact_at
            await supabase
              .from('appointments')
              .update({ last_contact_at: new Date().toISOString() })
              .eq('id', appointment.id)

            if (reminderType === '1h') {
              results.oneHourReminders++
            } else {
              results.tenMinReminders++
            }

            // Send QR Code image for 10min reminder
            if (sendQRCode && checkinUrl) {
              try {
                const qrCodeUrl = generateQRCodeUrl(checkinUrl, 300)
                console.log(`Sending QR code image: ${qrCodeUrl}`)

                const imageResponse = await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVOLUTION_API_KEY,
                  },
                  body: JSON.stringify({
                    number: appointment.patient_phone,
                    mediatype: 'image',
                    media: qrCodeUrl,
                    caption: `📱 Escaneie este QR Code para fazer check-in automaticamente!\n\nOu clique no link: ${checkinUrl}`,
                  }),
                })

                if (imageResponse.ok) {
                  console.log(`QR Code sent to ${appointment.patient_name}`)
                  results.checkinLinksSent++
                  
                  // Save QR code message
                  await supabase.from('messages').insert({
                    tenant_id: tenantId,
                    patient_id: appointment.patient_id,
                    appointment_id: appointment.id,
                    body: `[QR Code de Check-in enviado] Link: ${checkinUrl}`,
                    direction: 'outbound',
                    status: 'sent',
                  })
                } else {
                  const errorText = await imageResponse.text()
                  console.error(`Failed to send QR code:`, errorText)
                }
              } catch (qrError) {
                console.error('Error sending QR code:', qrError)
              }
            }
          } else {
            console.error(`Failed to send ${reminderType} reminder:`, await textResponse.text())
            results.errors++
          }
        } catch (error) {
          console.error(`Error sending ${reminderType} reminder:`, error)
          results.errors++
        }
      }
    }

    console.log('Reminder results:', results)

    return new Response(
      JSON.stringify({
        success: true,
        results,
        processedAt: now.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in appointment-reminders:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
