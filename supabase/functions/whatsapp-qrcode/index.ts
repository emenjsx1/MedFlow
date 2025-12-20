import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')?.replace(/\/$/, '') // Remove trailing slash
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      console.error('Missing Evolution API configuration')
      return new Response(
        JSON.stringify({ error: 'Evolution API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Evolution API URL:', EVOLUTION_API_URL)

    // Get tenant_id from auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    
    // Get user from JWT
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get tenant_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.tenant_id) {
      console.error('Profile error:', profileError)
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const tenantId = profile.tenant_id
    const instanceName = `clinic_${tenantId.substring(0, 8)}`

    const { action } = await req.json()
    console.log('Action:', action, 'Instance:', instanceName)

    if (action === 'create') {
      // First, try to fetch existing instance
      console.log('Checking if instance exists...')
      const fetchResponse = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances?instanceName=${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      })
      
      const fetchData = await fetchResponse.json()
      console.log('Fetch instances response:', JSON.stringify(fetchData))

      let instanceExists = false
      if (Array.isArray(fetchData) && fetchData.length > 0) {
        instanceExists = true
        console.log('Instance already exists')
      }

      if (!instanceExists) {
        // Create instance in Evolution API
        console.log('Creating WhatsApp instance:', instanceName)
        
        const createResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
          },
          body: JSON.stringify({
            instanceName,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
          }),
        })

        const createData = await createResponse.json()
        console.log('Create response:', JSON.stringify(createData))

        if (!createResponse.ok && !createData.instance) {
          return new Response(
            JSON.stringify({ error: 'Failed to create instance', details: createData }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // If qrcode is in create response, use it directly
        if (createData.qrcode?.base64) {
          await supabase
            .from('tenant_settings')
            .upsert({
              tenant_id: tenantId,
              whatsapp_session_id: instanceName,
              whatsapp_connected: false,
            }, { onConflict: 'tenant_id' })

          return new Response(
            JSON.stringify({ 
              success: true, 
              qrcode: createData.qrcode.base64,
              instanceName 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Get QR Code via connect endpoint
      console.log('Fetching QR code...')
      const qrResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      })

      const qrData = await qrResponse.json()
      console.log('QR response:', JSON.stringify(qrData))

      // Check different possible QR code locations in response
      const qrCode = qrData.base64 || qrData.qrcode?.base64 || qrData.code

      if (qrCode) {
        // Save session info to database
        await supabase
          .from('tenant_settings')
          .upsert({
            tenant_id: tenantId,
            whatsapp_session_id: instanceName,
            whatsapp_connected: false,
          }, { onConflict: 'tenant_id' })

        return new Response(
          JSON.stringify({ 
            success: true, 
            qrcode: qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`,
            instanceName 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Maybe already connected?
      if (qrData.instance?.state === 'open') {
        await supabase
          .from('tenant_settings')
          .upsert({
            tenant_id: tenantId,
            whatsapp_session_id: instanceName,
            whatsapp_connected: true,
          }, { onConflict: 'tenant_id' })

        return new Response(
          JSON.stringify({ 
            success: true, 
            alreadyConnected: true,
            instanceName 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ error: 'Failed to generate QR code', details: qrData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'status') {
      // Check connection status
      const statusResponse = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      })

      const statusData = await statusResponse.json()
      console.log('Status response:', JSON.stringify(statusData))

      // Handle case where instance doesn't exist
      if (statusResponse.status === 404) {
        return new Response(
          JSON.stringify({ 
            connected: false,
            state: 'not_created',
            instanceName
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const isConnected = statusData.instance?.state === 'open' || statusData.state === 'open'

      // Update database
      if (isConnected) {
        await supabase
          .from('tenant_settings')
          .upsert({
            tenant_id: tenantId,
            whatsapp_session_id: instanceName,
            whatsapp_connected: true,
          }, { onConflict: 'tenant_id' })
      }

      return new Response(
        JSON.stringify({ 
          connected: isConnected,
          state: statusData.instance?.state || statusData.state,
          instanceName
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'disconnect') {
      // Logout from WhatsApp
      await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      })

      // Delete instance
      await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      })

      // Update database
      await supabase
        .from('tenant_settings')
        .update({ whatsapp_connected: false, whatsapp_session_id: null })
        .eq('tenant_id', tenantId)

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
