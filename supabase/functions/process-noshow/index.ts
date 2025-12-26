import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This function handles:
// 1. Automatic no-show marking (cron job every 15 minutes)
// 2. Manual check-in via public link

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Check if this is a check-in request
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      // No body, continue with no-show processing
    }

    // Handle check-in action
    if (body.action === 'checkin' && body.appointmentId) {
      console.log('Processing check-in for appointment:', body.appointmentId)

      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('id, status, checked_in_at, scheduled_at')
        .eq('id', body.appointmentId)
        .maybeSingle()

      if (fetchError || !appointment) {
        console.error('Appointment not found:', fetchError)
        return new Response(
          JSON.stringify({ error: 'Consulta não encontrada' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if already checked in
      if (appointment.checked_in_at) {
        return new Response(
          JSON.stringify({ success: true, message: 'Já realizou check-in' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify appointment is within 5 hours (check-in window)
      const scheduledDate = new Date(appointment.scheduled_at)
      const now = new Date()
      const hoursUntilAppointment = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60)

      // If appointment already passed (more than 1 hour ago), reject
      if (hoursUntilAppointment < -1) {
        return new Response(
          JSON.stringify({ error: 'Esta consulta já passou' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // If more than 5 hours until appointment, reject
      if (hoursUntilAppointment > 5) {
        return new Response(
          JSON.stringify({ error: 'Check-in só disponível 5 horas antes da consulta' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Perform check-in
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ 
          checked_in_at: new Date().toISOString(),
          status: 'confirmed' // Ensure status is confirmed
        })
        .eq('id', body.appointmentId)

      if (updateError) {
        console.error('Error updating appointment:', updateError)
        return new Response(
          JSON.stringify({ error: 'Erro ao realizar check-in' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Check-in successful for appointment:', body.appointmentId)

      return new Response(
        JSON.stringify({ success: true, message: 'Check-in realizado com sucesso' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process no-shows (default action)
    // Now includes BOTH pending and confirmed appointments that haven't checked in
    const now = new Date()
    console.log('Processing no-shows at:', now.toISOString())

    // Find appointments that:
    // - Are pending OR confirmed (pending = never confirmed via check-in)
    // - Haven't been checked in
    // - Appointment time + duration has passed (with 30 min grace period)
    const gracePeriodMinutes = 30

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('id, patient_name, scheduled_at, duration_minutes, tenant_id, status')
      .in('status', ['pending', 'confirmed'])
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
