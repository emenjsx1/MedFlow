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

      // State format: tenantId|returnUrl
      const [tenantId, returnUrl] = state.split('|')

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
        console.error('Token error:', tokens.error, tokens.error_description)
        const errorUrl = `${returnUrl || '/settings'}?google_error=${encodeURIComponent(tokens.error_description || tokens.error)}`
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, 'Location': errorUrl }
        })
      }

      // Get user's calendars
      const calendarsResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` },
      })

      const calendars = await calendarsResponse.json()
      console.log('Calendars fetched:', calendars.items?.length || 0)
      
      const primaryCalendar = calendars.items?.find((c: any) => c.primary) || calendars.items?.[0]

      // Calculate token expiration
      const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString()

      // Save tokens and calendar info to database
      await supabase
        .from('tenant_settings')
        .upsert({
          tenant_id: tenantId,
          google_calendar_connected: true,
          google_calendar_id: primaryCalendar?.id || 'primary',
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token,
          google_token_expires_at: expiresAt,
        }, { onConflict: 'tenant_id' })

      console.log('Calendar connected for tenant:', tenantId, 'Calendar:', primaryCalendar?.summary)

      // Redirect back to settings with success
      const successUrl = `${returnUrl || '/settings'}?google_success=true&calendar_name=${encodeURIComponent(primaryCalendar?.summary || 'Calendário')}`
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': successUrl }
      })
    }

    // Generate OAuth URL or handle actions
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate the JWT using an ANON client (no session storage in functions)
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY')
    const authClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser()

    if (userError || !user) {
      console.error('Auth error:', userError)
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
      // Include return URL in state so we can redirect back after OAuth
      const returnUrl = body.returnUrl || ''
      const state = `${profile.tenant_id}|${returnUrl}`

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events')
      authUrl.searchParams.set('access_type', 'offline')
      authUrl.searchParams.set('prompt', 'consent')
      authUrl.searchParams.set('state', state)

      console.log('Generated auth URL for tenant:', profile.tenant_id)

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
        .update({ 
          google_calendar_connected: false, 
          google_calendar_id: null,
          google_access_token: null,
          google_refresh_token: null,
          google_token_expires_at: null,
        })
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
