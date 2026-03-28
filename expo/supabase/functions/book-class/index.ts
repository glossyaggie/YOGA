/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors = { 'Access-Control-Allow-Origin': '*' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const { sessionId } = await req.json();

  const supa = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const auth = req.headers.get('Authorization') ?? '';
  const { data: { user } } = await supa.auth.getUser(auth.replace('Bearer ', ''));
  if (!user) return new Response('Unauthorized', { status: 401, headers: cors });

  const { data: balanceRows } = await supa.from('credit_ledger').select('delta').eq('user_id', user.id);
  const balance = (balanceRows ?? []).reduce((a, b) => a + b.delta, 0);
  if (balance < 1) return new Response(JSON.stringify({ error: 'No credits' }), { status: 400, headers: cors });

  const { data: ses } = await supa.from('sessions').select('id, capacity').eq('id', sessionId).single();
  const { count } = await supa.from('bookings').select('*', { count: 'exact', head: true }).eq('session_id', sessionId);
  if ((count ?? 0) >= (ses?.capacity ?? 0)) return new Response(JSON.stringify({ error: 'Class full' }), { status: 400, headers: cors });

  const { data: bk } = await supa.from('bookings').insert({ user_id: user.id, session_id: sessionId }).select().single();
  await supa.from('credit_ledger').insert({ user_id: user.id, pass_id: null, delta: -1, reason: 'booking', ref_id: bk.id });

  return new Response(JSON.stringify({ ok: true, bookingId: bk.id }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});
