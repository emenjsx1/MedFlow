import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-token',
};

// Token de verificação do webhook
const WEBHOOK_TOKEN = "agendaclin";

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

    // Verificar token de autenticação
    const token = req.headers.get('x-webhook-token') || req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (token !== WEBHOOK_TOKEN) {
      console.error('Invalid or missing webhook token');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = await req.json();
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
    // Formato: { event, order_id, customer: { name, email, document? }, amount, ... }
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

    // Create new user with email and document/temp password
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

    console.log('User created successfully:', newUser.user?.id, 'Email:', userEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User created successfully',
        user_id: newUser.user?.id,
        email: userEmail
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
