import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This function should be called by a cron job every 15 minutes
// It marks appointments as no_show if:
// 1. The appointment time has passed (scheduled_at + duration_minutes)
// 2. Status is 'confirmed'
// 3. Patient hasn't checked in (checked_in_at is null)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const now = new Date()
    console.log('Processing no-shows at:', now.toISOString())

    // Find appointments that:
    // - Are confirmed
    // - Haven't been checked in
    // - Appointment time + duration has passed (with 30 min grace period)
    const gracePeriodMinutes = 30

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('id, patient_name, scheduled_at, duration_minutes, tenant_id')
      .eq('status', 'confirmed')
      .is('checked_in_at', null)
      .lt('scheduled_at', now.toISOString())

    if (error) {
      console.error('Error fetching appointments:', error)
      throw error
    }

    console.log('Found', appointments?.length || 0, 'potential no-shows to check')

    let markedCount = 0

    for (const appointment of appointments || []) {
      const scheduledAt = new Date(appointment.scheduled_at)
      const durationMinutes = appointment.duration_minutes || 30
      const endTime = new Date(scheduledAt.getTime() + (durationMinutes + gracePeriodMinutes) * 60 * 1000)

      // Only mark as no-show if the appointment end time + grace period has passed
      if (now > endTime) {
        const { error: updateError } = await supabase
          .from('appointments')
          .update({ 
            status: 'no_show',
            auto_noshow_at: now.toISOString()
          })
          .eq('id', appointment.id)

        if (updateError) {
          console.error('Error marking no-show for', appointment.id, ':', updateError)
        } else {
          console.log('Marked as no-show:', appointment.patient_name, 'scheduled at', appointment.scheduled_at)
          markedCount++
        }
      }
    }

    console.log('Marked', markedCount, 'appointments as no-show')

    return new Response(
      JSON.stringify({ 
        success: true, 
        checked: appointments?.length || 0,
        marked: markedCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Process no-show error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
