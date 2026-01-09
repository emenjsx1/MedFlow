import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  tenantId: string;
  type: 'new_appointment' | 'cancellation' | 'no_show' | 'waitlist_filled';
  appointmentData?: {
    patientName: string;
    professionalName?: string;
    scheduledAt: string;
    patientPhone?: string;
  };
}

const getEmailContent = (type: string, data: NotificationRequest['appointmentData'], clinicName: string) => {
  const formattedDate = data?.scheduledAt 
    ? new Date(data.scheduledAt).toLocaleString('pt-BR', { 
        dateStyle: 'full', 
        timeStyle: 'short',
        timeZone: 'America/Sao_Paulo'
      })
    : '';

  switch (type) {
    case 'new_appointment':
      return {
        subject: `✅ Novo Agendamento - ${data?.patientName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981;">🎉 Novo Agendamento Confirmado</h2>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Paciente:</strong> ${data?.patientName}</p>
              <p><strong>Telefone:</strong> ${data?.patientPhone || 'Não informado'}</p>
              <p><strong>Data/Hora:</strong> ${formattedDate}</p>
              ${data?.professionalName ? `<p><strong>Profissional:</strong> Dr(a). ${data.professionalName}</p>` : ''}
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Esta é uma notificação automática do sistema ${clinicName}.
            </p>
          </div>
        `,
      };
    
    case 'cancellation':
      return {
        subject: `❌ Cancelamento - ${data?.patientName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #ef4444;">⚠️ Consulta Cancelada</h2>
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Paciente:</strong> ${data?.patientName}</p>
              <p><strong>Data/Hora cancelada:</strong> ${formattedDate}</p>
              ${data?.professionalName ? `<p><strong>Profissional:</strong> Dr(a). ${data.professionalName}</p>` : ''}
            </div>
            <p style="color: #6b7280;">
              Considere oferecer este horário para pacientes na fila de espera.
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              Esta é uma notificação automática do sistema ${clinicName}.
            </p>
          </div>
        `,
      };
    
    case 'no_show':
      return {
        subject: `⚠️ Não Comparecimento - ${data?.patientName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #f59e0b;">⚠️ Paciente Não Compareceu</h2>
            <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Paciente:</strong> ${data?.patientName}</p>
              <p><strong>Telefone:</strong> ${data?.patientPhone || 'Não informado'}</p>
              <p><strong>Data/Hora:</strong> ${formattedDate}</p>
              ${data?.professionalName ? `<p><strong>Profissional:</strong> Dr(a). ${data.professionalName}</p>` : ''}
            </div>
            <p style="color: #6b7280;">
              Este paciente pode ser marcado como alto risco para futuras consultas.
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              Esta é uma notificação automática do sistema ${clinicName}.
            </p>
          </div>
        `,
      };

    case 'waitlist_filled':
      return {
        subject: `🎯 Vaga Preenchida - ${data?.patientName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981;">🎯 Vaga da Fila de Espera Preenchida</h2>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Paciente:</strong> ${data?.patientName}</p>
              <p><strong>Nova data/hora:</strong> ${formattedDate}</p>
              ${data?.professionalName ? `<p><strong>Profissional:</strong> Dr(a). ${data.professionalName}</p>` : ''}
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Esta é uma notificação automática do sistema ${clinicName}.
            </p>
          </div>
        `,
      };
    
    default:
      return {
        subject: `Notificação - ${clinicName}`,
        html: `<p>Nova notificação do sistema.</p>`,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenantId, type, appointmentData }: NotificationRequest = await req.json();

    console.log('Notification request received:', { tenantId, type, appointmentData });

    // Get tenant settings including notification emails
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: settings, error: settingsError } = await supabase
      .from('tenant_settings')
      .select('notification_emails, clinic_name, notify_owner_on_booking')
      .eq('tenant_id', tenantId)
      .single();

    if (settingsError) {
      console.error('Error fetching tenant settings:', settingsError);
      throw new Error('Failed to fetch tenant settings');
    }

    // Check if notifications are enabled
    if (!settings.notify_owner_on_booking) {
      console.log('Notifications disabled for tenant:', tenantId);
      return new Response(
        JSON.stringify({ message: 'Notifications disabled' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emails = settings.notification_emails || [];
    
    if (emails.length === 0) {
      console.log('No notification emails configured for tenant:', tenantId);
      return new Response(
        JSON.stringify({ message: 'No notification emails configured' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clinicName = settings.clinic_name || 'MedFlow';
    const { subject, html } = getEmailContent(type, appointmentData, clinicName);

    console.log('Sending notification email to:', emails);

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${clinicName} <onboarding@resend.dev>`,
        to: emails,
        subject,
        html,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Notification email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, emailData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
