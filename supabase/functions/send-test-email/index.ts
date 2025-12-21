import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Template: Email de boas-vindas / Conta criada
const getWelcomeEmailHtml = (userName: string, userEmail: string, password: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao AgendaClin!</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          
          <!-- Header com gradiente -->
          <tr>
            <td style="background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #10b981 100%); padding: 40px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                🎉 Bem-vindo ao AgendaClin!
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 12px 0 0 0; font-size: 16px;">
                Sua conta foi criada com sucesso
              </p>
            </td>
          </tr>
          
          <!-- Conteúdo principal -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Olá <strong>${userName || 'Cliente'}</strong>,
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Obrigado por escolher o AgendaClin! Sua compra foi confirmada e sua conta já está pronta para uso. Abaixo estão suas credenciais de acesso:
              </p>
              
              <!-- Box de credenciais -->
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #0ea5e9;">
                <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0; font-weight: 600;">
                  Suas Credenciais de Acesso
                </p>
                
                <table role="presentation" style="width: 100%; margin-top: 16px;">
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Email:</span>
                    </td>
                    <td style="padding: 8px 0;">
                      <strong style="color: #0ea5e9; font-size: 16px;">${userEmail}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Senha temporária:</span>
                    </td>
                    <td style="padding: 8px 0;">
                      <code style="background-color: #1f2937; color: #10b981; padding: 6px 12px; border-radius: 6px; font-size: 16px; font-weight: 600;">${password}</code>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Aviso de segurança -->
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                  ⚠️ <strong>Importante:</strong> Por segurança, recomendamos que você altere sua senha após o primeiro acesso.
                </p>
              </div>
              
              <!-- Botão de acesso -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://agendaclin.lovable.app/login" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #10b981 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(14, 165, 233, 0.4);">
                  Acessar Minha Conta →
                </a>
              </div>
              
              <!-- Recursos -->
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 24px 0 16px 0;">
                Com o AgendaClin você pode:
              </p>
              
              <ul style="color: #6b7280; font-size: 14px; line-height: 2; padding-left: 20px; margin: 0;">
                <li>✅ Automatizar confirmações de consultas via WhatsApp</li>
                <li>✅ Reduzir faltas com lembretes inteligentes</li>
                <li>✅ Gerenciar lista de espera automaticamente</li>
                <li>✅ Integrar com Google Calendar</li>
                <li>✅ Acompanhar métricas em tempo real</li>
              </ul>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">
                Precisa de ajuda? Responda este email ou acesse nosso suporte.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2024 AgendaClin. Todos os direitos reservados.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Template: Senha alterada com sucesso
const getPasswordChangedEmailHtml = (userName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Senha Alterada - AgendaClin</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                🔐 Senha Alterada
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 12px 0 0 0; font-size: 16px;">
                Sua senha foi atualizada com sucesso
              </p>
            </td>
          </tr>
          
          <!-- Conteúdo -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Olá <strong>${userName || 'Cliente'}</strong>,
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Este email confirma que sua senha do AgendaClin foi alterada com sucesso.
              </p>
              
              <!-- Box de confirmação -->
              <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #10b981; text-align: center;">
                <p style="color: #059669; font-size: 18px; font-weight: 600; margin: 0;">
                  ✅ Senha atualizada com sucesso!
                </p>
              </div>
              
              <!-- Aviso de segurança -->
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                  ⚠️ <strong>Não foi você?</strong> Se você não solicitou esta alteração, entre em contato conosco imediatamente respondendo este email.
                </p>
              </div>
              
              <!-- Botão -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://agendaclin.lovable.app/login" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Acessar Minha Conta →
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2024 AgendaClin. Todos os direitos reservados.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Template: Assinatura cancelada
const getSubscriptionCancelledEmailHtml = (userName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assinatura Cancelada - AgendaClin</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 40px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                😢 Sentiremos sua falta
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 12px 0 0 0; font-size: 16px;">
                Sua assinatura foi cancelada
              </p>
            </td>
          </tr>
          
          <!-- Conteúdo -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Olá <strong>${userName || 'Cliente'}</strong>,
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Confirmamos o cancelamento da sua assinatura do AgendaClin. Seus dados permanecerão salvos por 30 dias caso deseje retornar.
              </p>
              
              <!-- Box -->
              <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #6b7280;">
                <p style="color: #4b5563; font-size: 14px; margin: 0; line-height: 1.6;">
                  <strong>O que você perde:</strong><br>
                  • Confirmações automáticas via WhatsApp<br>
                  • Lembretes inteligentes<br>
                  • Gestão de lista de espera<br>
                  • Relatórios e métricas
                </p>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 24px 0;">
                Mudou de ideia? Você pode reativar sua conta a qualquer momento:
              </p>
              
              <!-- Botão -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://agendaclin.lovable.app" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #10b981 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Reativar Minha Conta →
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2024 AgendaClin. Todos os direitos reservados.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Template: Pagamento pendente
const getPaymentPendingEmailHtml = (userName: string, planName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pagamento Pendente - AgendaClin</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                ⏳ Pagamento Pendente
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 12px 0 0 0; font-size: 16px;">
                Estamos aguardando a confirmação
              </p>
            </td>
          </tr>
          
          <!-- Conteúdo -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Olá <strong>${userName || 'Cliente'}</strong>,
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Recebemos sua solicitação de assinatura do plano <strong>${planName || 'AgendaClin'}</strong>. Estamos aguardando a confirmação do pagamento.
              </p>
              
              <!-- Box -->
              <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #f59e0b;">
                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                  <strong>Status:</strong> Aguardando confirmação de pagamento<br><br>
                  Assim que o pagamento for confirmado, você receberá um email com suas credenciais de acesso.
                </p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0;">
                Se você já realizou o pagamento, aguarde alguns minutos para a confirmação. Pagamentos via PIX ou boleto podem levar até 3 dias úteis.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2024 AgendaClin. Todos os direitos reservados.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Template: Renovação de assinatura
const getSubscriptionRenewedEmailHtml = (userName: string, planName: string, nextBillingDate: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assinatura Renovada - AgendaClin</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #10b981 100%); padding: 40px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                🔄 Assinatura Renovada!
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 12px 0 0 0; font-size: 16px;">
                Seu acesso continua garantido
              </p>
            </td>
          </tr>
          
          <!-- Conteúdo -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Olá <strong>${userName || 'Cliente'}</strong>,
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Ótimas notícias! Sua assinatura do plano <strong>${planName || 'AgendaClin'}</strong> foi renovada com sucesso.
              </p>
              
              <!-- Box -->
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #10b981;">
                <p style="color: #059669; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
                  ✅ Renovação confirmada!
                </p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Próxima cobrança: <strong>${nextBillingDate || 'Em breve'}</strong>
                </p>
              </div>
              
              <!-- Botão -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://agendaclin.lovable.app/dashboard" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #10b981 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Acessar Dashboard →
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2024 AgendaClin. Todos os direitos reservados.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, name } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    let html = '';
    let subject = '';
    
    switch (type) {
      case 'welcome':
        html = getWelcomeEmailHtml(name || 'Cliente', email, 'AgendaClin123');
        subject = '🎉 Bem-vindo ao AgendaClin! Suas credenciais de acesso';
        break;
      case 'password_changed':
        html = getPasswordChangedEmailHtml(name || 'Cliente');
        subject = '🔐 Sua senha foi alterada - AgendaClin';
        break;
      case 'subscription_cancelled':
        html = getSubscriptionCancelledEmailHtml(name || 'Cliente');
        subject = '😢 Sua assinatura foi cancelada - AgendaClin';
        break;
      case 'payment_pending':
        html = getPaymentPendingEmailHtml(name || 'Cliente', 'Trimestral');
        subject = '⏳ Pagamento pendente - AgendaClin';
        break;
      case 'subscription_renewed':
        html = getSubscriptionRenewedEmailHtml(name || 'Cliente', 'Trimestral', '21/01/2025');
        subject = '🔄 Assinatura renovada - AgendaClin';
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid email type. Use: welcome, password_changed, subscription_cancelled, payment_pending, subscription_renewed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const { data, error } = await resend.emails.send({
      from: 'AgendaClin <agendaclin@mozcodes.space>',
      to: [email],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Error sending email:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Email sent successfully:', type, 'to', email);
    
    return new Response(
      JSON.stringify({ success: true, message: `Email "${type}" sent to ${email}`, data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
