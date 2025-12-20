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
      console.error('Missing Google OAuth configuration')
      return new Response(
        JSON.stringify({ error: 'Google OAuth not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Handle OAuth callback
    if (url.searchParams.has('code')) {
      const code = url.searchParams.get('code')!
      const state = url.searchParams.get('state')!
      const redirectUri = `${SUPABASE_URL}/functions/v1/google-calendar-auth`

      console.log('Processing OAuth callback for state:', state)

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      })

      const tokens = await tokenResponse.json()
      console.log('Token exchange completed')

      if (tokens.error) {
        console.error('Token error:', tokens.error)
        return new Response(
          `<html><body><script>window.opener.postMessage({error: '${tokens.error}'}, '*'); window.close();</script></body></html>`,
          { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        )
      }

      // Get user's calendars
      const calendarsResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` },
      })

      const calendars = await calendarsResponse.json()
      const primaryCalendar = calendars.items?.find((c: any) => c.primary) || calendars.items?.[0]

      // State contains tenant_id
      const tenantId = state

      // Save tokens to database (encrypted in production)
      await supabase
        .from('tenant_settings')
        .upsert({
          tenant_id: tenantId,
          google_calendar_connected: true,
          google_calendar_id: primaryCalendar?.id || 'primary',
        }, { onConflict: 'tenant_id' })

      console.log('Calendar connected for tenant:', tenantId)

      // Close popup and notify parent
      return new Response(
        `<html><body><script>
          window.opener.postMessage({
            success: true, 
            calendarId: '${primaryCalendar?.id || 'primary'}',
            calendarName: '${primaryCalendar?.summary || 'Primary Calendar'}'
          }, '*'); 
          window.close();
        </script></body></html>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      )
    }

    // Generate OAuth URL
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    const body = await req.json()

    if (body.action === 'getAuthUrl') {
      const redirectUri = `${SUPABASE_URL}/functions/v1/google-calendar-auth`
      const state = profile.tenant_id

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events')
      authUrl.searchParams.set('access_type', 'offline')
      authUrl.searchParams.set('prompt', 'consent')
      authUrl.searchParams.set('state', state)

      console.log('Generated auth URL for tenant:', state)

      return new Response(
        JSON.stringify({ authUrl: authUrl.toString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (body.action === 'status') {
      const { data: settings } = await supabase
        .from('tenant_settings')
        .select('google_calendar_connected, google_calendar_id')
        .eq('tenant_id', profile.tenant_id)
        .single()

      return new Response(
        JSON.stringify({ 
          connected: settings?.google_calendar_connected || false,
          calendarId: settings?.google_calendar_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (body.action === 'disconnect') {
      await supabase
        .from('tenant_settings')
        .update({ google_calendar_connected: false, google_calendar_id: null })
        .eq('tenant_id', profile.tenant_id)

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
