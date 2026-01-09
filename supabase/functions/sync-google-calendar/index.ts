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
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Google OAuth not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Get user from auth token
    const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get tenant_id from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const tenantId = profile.tenant_id

    // Get Google Calendar settings and tokens
    const { data: settings } = await supabase
      .from('tenant_settings')
      .select('google_calendar_connected, google_calendar_id')
      .eq('tenant_id', tenantId)
      .single()

    if (!settings?.google_calendar_connected) {
      return new Response(
        JSON.stringify({ error: 'Google Calendar not connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: secrets } = await supabase
      .from('tenant_secrets')
      .select('google_access_token, google_refresh_token, google_token_expires_at')
      .eq('tenant_id', tenantId)
      .single()

    if (!secrets?.google_access_token) {
      return new Response(
        JSON.stringify({ error: 'Google Calendar tokens not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if token is expired and refresh if needed
    let accessToken = secrets.google_access_token
    const expiresAt = secrets.google_token_expires_at ? new Date(secrets.google_token_expires_at) : null
    
    if (expiresAt && expiresAt <= new Date() && secrets.google_refresh_token) {
      // Refresh the token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: secrets.google_refresh_token,
          grant_type: 'refresh_token',
        }),
      })

      const tokens = await tokenResponse.json()
      
      if (tokens.error) {
        return new Response(
          JSON.stringify({ error: 'Failed to refresh Google token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      accessToken = tokens.access_token
      const newExpiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString()

      // Update tokens in database
      await supabase
        .from('tenant_secrets')
        .update({
          google_access_token: tokens.access_token,
          google_token_expires_at: newExpiresAt,
        })
        .eq('tenant_id', tenantId)
    }

    // Get calendar events from Google Calendar
    const calendarId = settings.google_calendar_id || 'primary'
    // Get events from 7 days ago to 90 days ahead to ensure we capture today's appointments
    const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
    const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days ahead

    const eventsResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
      `timeMin=${encodeURIComponent(timeMin)}&` +
      `timeMax=${encodeURIComponent(timeMax)}&` +
      `singleEvents=true&` +
      `orderBy=startTime`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    )

    if (!eventsResponse.ok) {
      const errorData = await eventsResponse.json()
      console.error('Google Calendar API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Google Calendar events', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const eventsData = await eventsResponse.json()
    const events = eventsData.items || []

    console.log(`Found ${events.length} events in Google Calendar`)

    // Get existing appointments with calendar_event_id to avoid duplicates
    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('calendar_event_id')
      .eq('tenant_id', tenantId)
      .not('calendar_event_id', 'is', null)

    const existingEventIds = new Set(
      existingAppointments?.map(a => a.calendar_event_id) || []
    )

    // Sync events to appointments
    let synced = 0
    let skipped = 0
    let errors = 0

    for (const event of events) {
      // Skip all-day events or events without start time
      if (!event.start?.dateTime && !event.start?.date) {
        skipped++
        continue
      }

      // Skip if already synced
      if (existingEventIds.has(event.id)) {
        skipped++
        continue
      }

      // Parse event start time
      const startTime = event.start.dateTime || `${event.start.date}T00:00:00Z`
      const startDate = new Date(startTime)
      
      // Calculate duration
      let durationMinutes = 30 // default
      if (event.end?.dateTime || event.end?.date) {
        const endTime = event.end.dateTime || `${event.end.date}T00:00:00Z`
        const endDate = new Date(endTime)
        durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))
      }

      // Extract patient name from event summary or description
      let patientName = event.summary || 'Agendamento'
      if (event.description) {
        // Try to extract name from description
        const nameMatch = event.description.match(/(?:nome|name|paciente|patient)[:\s]+([^\n]+)/i)
        if (nameMatch) {
          patientName = nameMatch[1].trim()
        }
      }

      // Extract phone from description if available
      let patientPhone = null
      if (event.description) {
        const phoneMatch = event.description.match(/(?:telefone|phone|whatsapp)[:\s]+([^\n]+)/i)
        if (phoneMatch) {
          patientPhone = phoneMatch[1].trim().replace(/\D/g, '')
        }
      }

      // Determine status based on event status
      let status: 'pending' | 'confirmed' | 'cancelled' = 'pending'
      if (event.status === 'confirmed') {
        status = 'confirmed'
      } else if (event.status === 'cancelled') {
        status = 'cancelled'
      }

      try {
        // Insert appointment
        const { error: insertError } = await supabase
          .from('appointments')
          .insert({
            tenant_id: tenantId,
            calendar_event_id: event.id,
            patient_name: patientName,
            patient_phone: patientPhone,
            scheduled_at: startDate.toISOString(),
            duration_minutes: durationMinutes,
            status: status,
            notes: event.description || null,
            professional_name: event.organizer?.displayName || null,
          })

        if (insertError) {
          console.error('Error inserting appointment:', insertError)
          errors++
        } else {
          synced++
        }
      } catch (error) {
        console.error('Error processing event:', error)
        errors++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced,
        skipped,
        errors,
        total: events.length,
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

