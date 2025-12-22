import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-token',
};

// Token de verificação do webhook
const WEBHOOK_TOKEN = "agendaclin";

// Template de email de boas-vindas
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
                <a href="https://agendacliin.lovable.app/login" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #10b981 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(14, 165, 233, 0.4);">
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      console.log('Method not allowed:', req.method);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar token de autenticação (header, query param ou body)
    const url = new URL(req.url);
    const queryToken = url.searchParams.get('token');
    const headerToken = req.headers.get('x-webhook-token') || req.headers.get('authorization')?.replace('Bearer ', '');
    
    // Ler o body para verificar token (clone para não consumir)
    const bodyText = await req.text();
    let payload: any = {};
    let bodyToken: string | null = null;
    
    try {
      payload = JSON.parse(bodyText);
      bodyToken = payload.token || payload.webhook_token || null;
    } catch {
      console.error('Failed to parse JSON body');
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const token = headerToken || queryToken || bodyToken;
    
    if (token !== WEBHOOK_TOKEN) {
      console.error('Invalid or missing webhook token. Received:', token);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Received webhook payload:', JSON.stringify(payload, null, 2));

    // Verificar se é evento de pagamento confirmado
    if (payload.event !== 'payment_confirmed') {
      console.log('Ignoring event:', payload.event);
      return new Response(
        JSON.stringify({ success: true, message: 'Event ignored', event: payload.event }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair dados do payload no formato da plataforma de pagamento
    const customer = payload.customer || {};
    const userEmail = customer.email || payload.email;
    const userName = customer.name || payload.name || '';
    const userDocument = customer.document || customer.cpf || customer.cnpj || payload.document || payload.cpf || payload.cnpj;

    if (!userEmail) {
      console.error('Missing email in payload');
      return new Response(
        JSON.stringify({ error: 'Email is required in customer data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Senha temporária fixa - usuário poderá alterar depois
    const password = "AgendaClin123";

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(u => u.email === userEmail);

    if (userExists) {
      console.log('User already exists:', userEmail);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User already exists',
          email: userEmail 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new user with email and temp password
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: userName,
        document: userDocument || null,
        order_id: payload.order_id,
        amount: payload.amount,
        payment_method: payload.payment_method,
        created_via: 'payment_webhook'
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create user', details: createError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = newUser.user?.id;
    console.log('User created successfully:', userId, 'Email:', userEmail);

    // Criar tenant, profile e role admin para o novo usuário
    if (userId) {
      try {
        // Criar tenant
        const { data: tenantData, error: tenantError } = await supabaseAdmin
          .from('tenants')
          .insert({
            name: `${userName || 'Cliente'}'s Clinic`,
            timezone: 'America/Sao_Paulo'
          })
          .select('id')
          .single();

        if (tenantError) {
          console.error('Error creating tenant:', tenantError);
        } else {
          const tenantId = tenantData.id;
          console.log('Tenant created:', tenantId);

          // Criar profile
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: userId,
              email: userEmail,
              full_name: userName || 'Cliente',
              tenant_id: tenantId
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
          } else {
            console.log('Profile created for user:', userId);
          }

          // Criar role admin (todos os donos de negócio são admin)
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: userId,
              role: 'admin'
            });

          if (roleError) {
            console.error('Error creating role:', roleError);
          } else {
            console.log('Admin role assigned to user:', userId);
          }

          // Criar tenant_settings
          const { error: settingsError } = await supabaseAdmin
            .from('tenant_settings')
            .insert({
              tenant_id: tenantId
            });

          if (settingsError) {
            console.error('Error creating tenant settings:', settingsError);
          } else {
            console.log('Tenant settings created:', tenantId);
          }
        }
      } catch (setupError) {
        console.error('Error setting up user account:', setupError);
        // Continuar mesmo se falhar - o usuário foi criado
      }
    }

    // Enviar email de boas-vindas com credenciais
    try {
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
      
      const emailHtml = getWelcomeEmailHtml(userName, userEmail, password);
      
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'AgendaClin <agendaclin@mozcodes.space>',
        to: [userEmail],
        subject: '🎉 Bem-vindo ao AgendaClin! Suas credenciais de acesso',
        html: emailHtml,
      });

      if (emailError) {
        console.error('Error sending welcome email:', emailError);
      } else {
        console.log('Welcome email sent successfully:', emailData);
      }
    } catch (emailErr) {
      console.error('Exception sending welcome email:', emailErr);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User created successfully',
        user_id: newUser.user?.id,
        email: userEmail,
        email_sent: true
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Webhook processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
