import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Delay between messages in milliseconds (3-5 seconds randomized to appear more human-like)
function getRandomDelay(): number {
  return Math.floor(Math.random() * 2000) + 3000 // 3000-5000ms
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
      .select('whatsapp_connected, whatsapp_session_id, clinic_name')
      .eq('tenant_id', tenantId)
      .single()

    if (!settings?.whatsapp_connected) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp not connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const instanceName = settings.whatsapp_session_id || `clinic_${tenantId.substring(0, 8)}`

    // Update campaign status to sending
    await supabase
      .from('campaigns')
      .update({ status: 'sending', sent_at: new Date().toISOString() })
      .eq('id', campaignId)

    // Get pending recipients with patient details
    const { data: recipients, error: recipientsError } = await supabase
      .from('campaign_recipients')
      .select('id, patient_id, patients!inner(whatsapp, name, email)')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')

    if (recipientsError) {
      console.error('Error fetching recipients:', recipientsError)
      throw recipientsError
    }

    const totalRecipients = recipients?.length || 0
    console.log('Sending to', totalRecipients, 'recipients with delays between messages')

    let sentCount = 0
    let failedCount = 0

    for (let i = 0; i < (recipients || []).length; i++) {
      const recipient = recipients![i]
      const patient = recipient.patients as any
      const phone = patient?.whatsapp

      console.log(`Processing ${i + 1}/${totalRecipients}: ${patient?.name}`)

      if (!phone) {
        failedCount++
        await supabase
          .from('campaign_recipients')
          .update({ status: 'failed', error_message: 'No phone number' })
          .eq('id', recipient.id)
        continue
      }

      try {
        // Format phone for WhatsApp (remove non-digits)
        const formattedPhone = phone.replace(/\D/g, '')
        
        // Personalize message with patient data
        const personalizeMessage = (text: string): string => {
          return text
            .replace(/\{nome\}/gi, patient.name || 'Cliente')
            .replace(/\{email\}/gi, patient.email || '')
            .replace(/\{telefone\}/gi, phone)
            .replace(/\{clinica\}/gi, settings.clinic_name || 'Nossa Clínica')
        }

        // Send message via Evolution API
        if (EVOLUTION_API_URL && EVOLUTION_API_KEY) {
          // Send text message
          if (campaign.message) {
            const personalizedMessage = personalizeMessage(campaign.message)
            console.log(`Sending text to ${formattedPhone}`)

            const textResponse = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
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

            if (!textResponse.ok) {
              const errorText = await textResponse.text()
              console.error('Text send error:', errorText)
              throw new Error(`Failed to send text: ${textResponse.status}`)
            }

            // Small delay between text and media
            if (campaign.image_url || campaign.audio_url) {
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          }

          // Send image if exists
          if (campaign.image_url) {
            console.log(`Sending image to ${formattedPhone}`)
            const imageResponse = await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_API_KEY,
              },
              body: JSON.stringify({
                number: formattedPhone,
                mediatype: 'image',
                media: campaign.image_url,
                caption: campaign.message ? undefined : '',
              }),
            })

            if (!imageResponse.ok) {
              console.error('Image send error:', await imageResponse.text())
            }

            // Small delay between image and audio
            if (campaign.audio_url) {
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          }

          // Send audio if exists
          if (campaign.audio_url) {
            console.log(`Sending audio to ${formattedPhone}`)
            const audioResponse = await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`, {
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

            if (!audioResponse.ok) {
              console.error('Audio send error:', await audioResponse.text())
            }
          }

          sentCount++
          await supabase
            .from('campaign_recipients')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', recipient.id)

          console.log(`✅ Sent successfully to ${patient.name}`)

        } else {
          throw new Error('Evolution API not configured')
        }

        // IMPORTANT: Delay between recipients to avoid WhatsApp rate limiting/blocking
        // Wait 3-5 seconds between each message (randomized to appear more natural)
        if (i < (recipients || []).length - 1) {
          const delay = getRandomDelay()
          console.log(`⏳ Waiting ${delay}ms before next message...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

      } catch (sendError) {
        console.error('❌ Error sending to', phone, ':', sendError)
        failedCount++
        await supabase
          .from('campaign_recipients')
          .update({ 
            status: 'failed', 
            error_message: sendError instanceof Error ? sendError.message : 'Unknown error' 
          })
          .eq('id', recipient.id)

        // Still wait before next attempt even on error
        if (i < (recipients || []).length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
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

    console.log('🎉 Campaign completed. Sent:', sentCount, 'Failed:', failedCount)

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
