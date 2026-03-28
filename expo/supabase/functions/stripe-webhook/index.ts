import Stripe from 'https://esm.sh/stripe@16.5.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

Deno.serve(async (req) => {
  console.log('Webhook received:', req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'stripe-signature, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }
  
  try {
    const sig = req.headers.get('stripe-signature')!;
    const raw = await req.text();
    
    console.log('Webhook signature:', sig ? 'Present' : 'Missing');
    console.log('Webhook secret configured:', secret ? 'Yes' : 'No');

    const event = await stripe.webhooks.constructEventAsync(raw, sig, secret);
    console.log('Event type:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id!;
      const passId = Number(session.metadata?.pass_id!);

      console.log(`Processing payment for user ${userId}, pass ${passId}`);
      console.log('Session metadata:', session.metadata);

      const supa = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

      // Get the pass details
      const { data: pass, error: passError } = await supa.from('passes').select('*').eq('id', passId).single();
      if (passError || !pass) {
        console.error('Pass not found:', passError, 'Pass ID:', passId);
        return new Response(JSON.stringify({ error: 'Pass not found' }), { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }

      console.log('Pass found:', pass.name, 'Credits:', pass.credits);

      // Create purchase record
      const { data: purchase, error: purchaseError } = await supa.from('purchases').insert({
        user_id: userId, 
        pass_id: passId, 
        stripe_payment_intent: session.payment_intent as string
      }).select().single();

      if (purchaseError) {
        console.error('Failed to create purchase:', purchaseError);
        return new Response(JSON.stringify({ error: 'Failed to create purchase' }), { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }

      console.log('Purchase created:', purchase.id);

      // Add credits to user's account
      const credits = pass.unlimited ? 0 : pass.credits;
      const reason = pass.unlimited ? 'unlimited_pass_purchase' : 'pass_purchase';
      
      const { error: ledgerError } = await supa.from('credit_ledger').insert({
        user_id: userId, 
        pass_id: passId, 
        delta: credits, 
        reason: reason, 
        ref_id: purchase.id
      });

      if (ledgerError) {
        console.error('Failed to add credits:', ledgerError);
        return new Response(JSON.stringify({ error: 'Failed to add credits' }), { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }

      console.log(`Successfully processed payment: ${credits} credits added for user ${userId}`);
    }

    return new Response(JSON.stringify({ received: true }), { 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (e) {
    console.error('Webhook error:', e);
    return new Response(JSON.stringify({ error: String(e) }), { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});
