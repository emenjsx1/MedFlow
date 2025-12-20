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
    
    // Get user from JWT - validate via an ANON client (no session storage in functions)
    const token = authHeader.replace('Bearer ', '').trim()
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY')
    const authClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(token)
    
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
        // Create instance in Evolution API with webhook configured
        console.log('Creating WhatsApp instance:', instanceName)
        
        const webhookUrl = `${SUPABASE_URL}/functions/v1/whatsapp-webhook`
        console.log('Webhook URL:', webhookUrl)
        
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
            webhook: {
              url: webhookUrl,
              byEvents: false,
              base64: false,
              headers: {},
              events: [
                'MESSAGES_UPSERT',
                'CONNECTION_UPDATE',
                'QRCODE_UPDATED',
              ],
            },
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

    if (action === 'disconnect' || action === 'restart') {
      console.log('Disconnecting/restarting instance:', instanceName)
      
      // Logout from WhatsApp
      try {
        await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
          method: 'DELETE',
          headers: {
            'apikey': EVOLUTION_API_KEY,
          },
        })
      } catch (e) {
        console.log('Logout error (may be expected):', e)
      }

      // Delete instance
      try {
        await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
          method: 'DELETE',
          headers: {
            'apikey': EVOLUTION_API_KEY,
          },
        })
      } catch (e) {
        console.log('Delete error (may be expected):', e)
      }

      // Update database
      await supabase
        .from('tenant_settings')
        .update({ whatsapp_connected: false, whatsapp_session_id: null })
        .eq('tenant_id', tenantId)

      // If restart, ensure we can return a fresh QR code reliably
      if (action === 'restart') {
        console.log('Restart requested: attempting to recreate or re-connect instance...')

        const webhookUrl = `${SUPABASE_URL}/functions/v1/whatsapp-webhook`
        console.log('Restart webhook URL:', webhookUrl)

        // Wait a bit for Evolution to process delete (it can be async)
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Poll whether instance is gone
        let stillExists = false
        for (let i = 0; i < 5; i++) {
          const checkRes = await fetch(
            `${EVOLUTION_API_URL}/instance/fetchInstances?instanceName=${instanceName}`,
            { method: 'GET', headers: { apikey: EVOLUTION_API_KEY } }
          )

          const checkData = await checkRes.json().catch(() => null)
          stillExists = Array.isArray(checkData) && checkData.length > 0
          console.log('Restart existence check:', { attempt: i + 1, stillExists })

          if (!stillExists) break
          await new Promise(resolve => setTimeout(resolve, 1500))
        }

        const ensureQr = async (reason: string) => {
          console.log('Fetching QR code during restart. Reason:', reason)
          const qrResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
            method: 'GET',
            headers: { apikey: EVOLUTION_API_KEY },
          })
          const qrData = await qrResponse.json()
          const qrCode = qrData.base64 || qrData.qrcode?.base64 || qrData.code

          if (!qrCode) {
            console.error('Restart: failed to obtain QR code:', qrData)
            return null
          }

          await supabase
            .from('tenant_settings')
            .upsert({
              tenant_id: tenantId,
              whatsapp_session_id: instanceName,
              whatsapp_connected: false,
            }, { onConflict: 'tenant_id' })

          return qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`
        }

        if (stillExists) {
          const qrcode = await ensureQr('instance-still-exists')
          if (qrcode) {
            return new Response(
              JSON.stringify({ success: true, qrcode, instanceName, restarted: true, reused: true }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }

        console.log('Creating new instance after restart...')
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
            webhook: {
              url: webhookUrl,
              byEvents: false,
              base64: false,
              headers: {},
              events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
            },
          }),
        })

        const createData = await createResponse.json().catch(() => ({}))
        console.log('Restart create response:', JSON.stringify(createData))

        if (!createResponse.ok) {
          const qrcode = await ensureQr('create-failed')
          if (qrcode) {
            return new Response(
              JSON.stringify({ success: true, qrcode, instanceName, restarted: true, reused: true }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify({ error: 'Failed to restart WhatsApp instance', details: createData }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const qrcode = createData.qrcode?.base64
          ? (createData.qrcode.base64.startsWith('data:')
              ? createData.qrcode.base64
              : `data:image/png;base64,${createData.qrcode.base64}`)
          : await ensureQr('created-no-qrcode')

        if (!qrcode) {
          return new Response(
            JSON.stringify({ error: 'Restart succeeded but QR code could not be generated' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, qrcode, instanceName, restarted: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

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
