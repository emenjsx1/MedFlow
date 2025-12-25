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
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { campaignId, tenantId } = await req.json()

    if (!campaignId || !tenantId) {
      return new Response(
        JSON.stringify({ error: 'campaignId and tenantId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Starting campaign:', campaignId, 'for tenant:', tenantId)

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('tenant_id', tenantId)
      .single()

    if (campaignError || !campaign) {
      console.error('Campaign not found:', campaignError)
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get tenant settings for WhatsApp
    const { data: settings } = await supabase
      .from('tenant_settings')
      .select('whatsapp_connected, whatsapp_session_id')
      .eq('tenant_id', tenantId)
      .single()

    if (!settings?.whatsapp_connected || !settings?.whatsapp_session_id) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp not connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update campaign status to sending
    await supabase
      .from('campaigns')
      .update({ status: 'sending', sent_at: new Date().toISOString() })
      .eq('id', campaignId)

    // Get pending recipients
    const { data: recipients, error: recipientsError } = await supabase
      .from('campaign_recipients')
      .select('id, patient_id, patients!inner(whatsapp, name)')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')

    if (recipientsError) {
      console.error('Error fetching recipients:', recipientsError)
      throw recipientsError
    }

    console.log('Sending to', recipients?.length || 0, 'recipients')

    let sentCount = 0
    let failedCount = 0

    for (const recipient of recipients || []) {
      const patient = recipient.patients as any
      const phone = patient?.whatsapp

      if (!phone) {
        failedCount++
        await supabase
          .from('campaign_recipients')
          .update({ status: 'failed', error_message: 'No phone number' })
          .eq('id', recipient.id)
        continue
      }

      try {
        // Format phone for WhatsApp
        const formattedPhone = phone.replace(/\D/g, '')
        
        // Send message via Evolution API
        if (EVOLUTION_API_URL && EVOLUTION_API_KEY) {
          // Send text message
          if (campaign.message) {
            const personalizedMessage = campaign.message
              .replace('{nome}', patient.name || 'Cliente')

            await fetch(`${EVOLUTION_API_URL}/message/sendText/${settings.whatsapp_session_id}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_API_KEY,
              },
              body: JSON.stringify({
                number: formattedPhone,
                text: personalizedMessage,
              }),
            })
          }

          // Send image if exists
          if (campaign.image_url) {
            await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${settings.whatsapp_session_id}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_API_KEY,
              },
              body: JSON.stringify({
                number: formattedPhone,
                mediatype: 'image',
                media: campaign.image_url,
                caption: campaign.message ? undefined : '', // Caption only if no separate text
              }),
            })
          }

          // Send audio if exists
          if (campaign.audio_url) {
            await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${settings.whatsapp_session_id}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_API_KEY,
              },
              body: JSON.stringify({
                number: formattedPhone,
                mediatype: 'audio',
                media: campaign.audio_url,
              }),
            })
          }

          sentCount++
          await supabase
            .from('campaign_recipients')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', recipient.id)
        } else {
          throw new Error('Evolution API not configured')
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (sendError) {
        console.error('Error sending to', phone, ':', sendError)
        failedCount++
        await supabase
          .from('campaign_recipients')
          .update({ 
            status: 'failed', 
            error_message: sendError instanceof Error ? sendError.message : 'Unknown error' 
          })
          .eq('id', recipient.id)
      }
    }

    // Update campaign with final counts
    await supabase
      .from('campaigns')
      .update({ 
        status: 'completed', 
        sent_count: sentCount,
        failed_count: failedCount 
      })
      .eq('id', campaignId)

    console.log('Campaign completed. Sent:', sentCount, 'Failed:', failedCount)

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        failed: failedCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Campaign error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
