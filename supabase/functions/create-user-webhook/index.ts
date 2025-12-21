import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const payload = await req.json();
    console.log('Received webhook payload:', JSON.stringify(payload, null, 2));

    // Extract data from payload - adjust these fields based on the actual webhook format
    // For now, expecting: email, document (CPF/CNPJ), and optionally name
    const { email, document, cpf, cnpj, name, full_name, nome } = payload;

    const userEmail = email;
    const userDocument = document || cpf || cnpj;
    const userName = name || full_name || nome || '';

    if (!userEmail) {
      console.error('Missing email in payload');
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userDocument) {
      console.error('Missing document (CPF/CNPJ) in payload');
      return new Response(
        JSON.stringify({ error: 'Document (CPF/CNPJ) is required for password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean document - remove any non-numeric characters for the password
    const cleanDocument = userDocument.replace(/\D/g, '');

    if (cleanDocument.length < 6) {
      console.error('Document too short:', cleanDocument.length);
      return new Response(
        JSON.stringify({ error: 'Document must have at least 6 digits' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Create new user with email and document as password
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password: cleanDocument,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: userName,
        document: cleanDocument,
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

    console.log('User created successfully:', newUser.user?.id);

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
