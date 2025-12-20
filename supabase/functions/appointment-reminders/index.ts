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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const now = new Date()
    console.log('Running appointment reminders at:', now.toISOString())

    // Get appointments in the next 70 minutes (to catch both 1h and 10min reminders)
    const oneHourFromNow = new Date(now.getTime() + 70 * 60 * 1000)
    
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*, tenant_settings:tenant_id(clinic_name, clinic_address, clinic_phone, whatsapp_session_id)')
      .in('status', ['pending', 'confirmed'])
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', oneHourFromNow.toISOString())

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError)
      throw appointmentsError
    }

    console.log(`Found ${appointments?.length || 0} appointments to check`)

    const results = {
      oneHourReminders: 0,
      tenMinReminders: 0,
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

      // 1 hour reminder (55-65 minutes before)
      if (minutesUntil >= 55 && minutesUntil <= 65) {
        // Check if we already sent 1h reminder
        const { data: existingReminder } = await supabase
          .from('messages')
          .select('id')
          .eq('appointment_id', appointment.id)
          .eq('direction', 'outbound')
          .ilike('body', '%1 hora%')
          .maybeSingle()

        if (!existingReminder) {
          message = `⏰ Lembrete: ${appointment.patient_name}!\n\nSua consulta é em 1 hora:\n📅 ${dateStr}\n⏰ ${timeStr}\n📍 ${appointment.tenant_settings?.clinic_address || 'Endereço da clínica'}\n\nNos vemos em breve!`
          shouldSend = true
          reminderType = '1h'
        }
      }
      // 10 minute reminder (8-12 minutes before)
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
          message = `🔔 Atenção ${appointment.patient_name}!\n\nSua consulta começa em 10 minutos!\n⏰ ${timeStr}\n📍 ${appointment.tenant_settings?.clinic_address || 'Endereço da clínica'}\n\nJá estamos te esperando! 😊`
          shouldSend = true
          reminderType = '10min'
        }
      }

      if (shouldSend && EVOLUTION_API_URL && EVOLUTION_API_KEY) {
        try {
          // Send WhatsApp message
          const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
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

          if (response.ok) {
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
          } else {
            console.error(`Failed to send ${reminderType} reminder:`, await response.text())
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
