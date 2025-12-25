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

    const { appointmentId } = await req.json()

    if (!appointmentId) {
      return new Response(
        JSON.stringify({ error: 'Appointment ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Fetching appointment for check-in: ${appointmentId}`)

    // Fetch appointment with tenant settings
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .maybeSingle()

    if (appointmentError) {
      console.error('Error fetching appointment:', appointmentError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar consulta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!appointment) {
      console.log('Appointment not found:', appointmentId)
      return new Response(
        JSON.stringify({ error: 'Consulta não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch tenant settings separately
    const { data: tenantSettings } = await supabase
      .from('tenant_settings')
      .select('clinic_name, clinic_address, clinic_phone')
      .eq('tenant_id', appointment.tenant_id)
      .single()

    console.log(`Appointment found: ${appointment.patient_name}, status: ${appointment.status}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        appointment: {
          ...appointment,
          tenant_settings: tenantSettings
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in get-appointment-checkin:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
