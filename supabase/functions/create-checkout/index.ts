/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import Stripe from 'https://esm.sh/stripe@16.5.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  
  try {
    console.log('Create checkout function called');
    
    // Check if Stripe key is available
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('STRIPE_SECRET_KEY not found');
      return new Response(JSON.stringify({ error: 'Stripe key not configured' }), { 
        status: 500, 
        headers: { ...cors, 'Content-Type': 'application/json' } 
      });
    }
    
    const stripe = new Stripe(stripeKey);
    console.log('Stripe initialized');
    
    const supa = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const auth = req.headers.get('Authorization') ?? '';
    
    console.log('Auth header present:', !!auth);
    
    const { data: { user } } = await supa.auth.getUser(auth.replace('Bearer ', ''));
    if (!user) {
      console.log('No user found');
      return new Response('Unauthorized', { status: 401, headers: cors });
    }
    
    console.log('User authenticated:', user.id);

    const { passId, successUrl, cancelUrl } = await req.json();
    console.log('Request data:', { passId, successUrl, cancelUrl });

    const { data: profile } = await supa.from('profiles').select('*').eq('id', user.id).single();
    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      console.log('Creating new Stripe customer');
      const customer = await stripe.customers.create({ email: user.email ?? undefined });
      customerId = customer.id;
      await supa.from('profiles').upsert({ id: user.id, email: user.email, stripe_customer_id: customerId });
    }
    
    console.log('Customer ID:', customerId);

    const { data: pass } = await supa.from('passes').select('*').eq('id', passId).single();
    if (!pass) {
      console.log('Pass not found:', passId);
      return new Response('Pass not found', { status: 404, headers: cors });
    }
    
    console.log('Pass found:', pass.name);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [{ price: pass.stripe_price_id, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { user_id: user.id, pass_id: String(pass.id) }
    });

    console.log('Session created:', session.url);
    return new Response(JSON.stringify({ url: session.url }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Create checkout error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...cors, 'Content-Type': 'application/json' } 
    });
  }
});
