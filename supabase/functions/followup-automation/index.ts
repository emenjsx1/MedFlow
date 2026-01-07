import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL");
    const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting follow-up automation check...");

    // Get all tenant settings with follow-up enabled
    const { data: tenantSettings, error: settingsError } = await supabase
      .from("tenant_settings")
      .select(`
        tenant_id,
        followup_enabled,
        followup_days_threshold,
        followup_message_template,
        whatsapp_session_id,
        clinic_name
      `)
      .eq("followup_enabled", true);

    if (settingsError) {
      console.error("Error fetching tenant settings:", settingsError);
      throw settingsError;
    }

    if (!tenantSettings || tenantSettings.length === 0) {
      console.log("No tenants with follow-up enabled");
      return new Response(
        JSON.stringify({ message: "No tenants with follow-up enabled", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalSent = 0;
    const results: { tenantId: string; sent: number; errors: string[] }[] = [];

    for (const settings of tenantSettings) {
      const tenantResult = { tenantId: settings.tenant_id, sent: 0, errors: [] as string[] };
      
      if (!settings.whatsapp_session_id) {
        tenantResult.errors.push("WhatsApp not connected");
        results.push(tenantResult);
        continue;
      }

      const daysThreshold = settings.followup_days_threshold || 7;
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

      // Find patients who haven't had interaction in X days and are in non-final pipeline stages
      const { data: patients, error: patientsError } = await supabase
        .from("patients")
        .select("id, name, whatsapp, pipeline_stage, last_interaction_at")
        .eq("tenant_id", settings.tenant_id)
        .in("pipeline_stage", ["new", "contacted", "scheduled", "follow_up"])
        .or(`last_interaction_at.is.null,last_interaction_at.lt.${thresholdDate.toISOString()}`);

      if (patientsError) {
        console.error(`Error fetching patients for tenant ${settings.tenant_id}:`, patientsError);
        tenantResult.errors.push("Error fetching patients");
        results.push(tenantResult);
        continue;
      }

      if (!patients || patients.length === 0) {
        console.log(`No patients needing follow-up for tenant ${settings.tenant_id}`);
        results.push(tenantResult);
        continue;
      }

      console.log(`Found ${patients.length} patients needing follow-up for tenant ${settings.tenant_id}`);

      // Send follow-up messages
      for (const patient of patients) {
        if (!patient.whatsapp) continue;

        // Check if we already sent a follow-up message recently (last 24 hours)
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);

        const { data: recentMessages } = await supabase
          .from("messages")
          .select("id")
          .eq("patient_id", patient.id)
          .eq("direction", "outbound")
          .gte("sent_at", oneDayAgo.toISOString())
          .limit(1);

        if (recentMessages && recentMessages.length > 0) {
          console.log(`Skipping ${patient.name} - already contacted recently`);
          continue;
        }

        // Personalize message
        const messageTemplate = settings.followup_message_template || 
          "Olá {nome}! Notamos que faz um tempo desde sua última interação. Gostaríamos de saber como você está. Podemos ajudá-lo com algo?";
        
        const message = messageTemplate
          .replace("{nome}", patient.name.split(" ")[0])
          .replace("{clinica}", settings.clinic_name || "nossa clínica");

        try {
          // Send via Evolution API
          if (evolutionApiUrl && evolutionApiKey) {
            const response = await fetch(
              `${evolutionApiUrl}/message/sendText/${settings.whatsapp_session_id}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  apikey: evolutionApiKey,
                },
                body: JSON.stringify({
                  number: patient.whatsapp,
                  text: message,
                }),
              }
            );

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`Failed to send to ${patient.name}:`, errorText);
              tenantResult.errors.push(`Failed to send to ${patient.name}`);
              continue;
            }
          }

          // Save message to database
          await supabase.from("messages").insert({
            tenant_id: settings.tenant_id,
            patient_id: patient.id,
            body: message,
            direction: "outbound",
            status: "sent",
          });

          // Update patient last_interaction_at
          await supabase
            .from("patients")
            .update({ last_interaction_at: new Date().toISOString() })
            .eq("id", patient.id);

          tenantResult.sent++;
          totalSent++;
          console.log(`Follow-up sent to ${patient.name}`);
        } catch (sendError) {
          console.error(`Error sending to ${patient.name}:`, sendError);
          tenantResult.errors.push(`Error sending to ${patient.name}`);
        }
      }

      results.push(tenantResult);
    }

    console.log(`Follow-up automation complete. Total sent: ${totalSent}`);

    return new Response(
      JSON.stringify({ 
        message: "Follow-up automation complete", 
        totalSent,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Follow-up automation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
