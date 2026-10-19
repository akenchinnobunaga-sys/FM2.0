/**
 * Supabase Edge Function: invite-user
 * Genera invitaciones seguras con token de un solo uso hasheado (SHA-256)
 * y fecha de expiración.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, spaceId, role, expiresInDays = 7 } = await req.json();

    if (!email || !spaceId || !role) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros requeridos (email, spaceId, role)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar permisos: Propietario o Administrador del espacio
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('global_role')
      .eq('id', user.id)
      .single();

    const isOwner = profile?.global_role === 'owner';

    if (!isOwner) {
      const { data: membership } = await supabaseClient
        .from('space_memberships')
        .select('role')
        .eq('space_id', spaceId)
        .eq('user_id', user.id)
        .single();

      if (membership?.role !== 'space_admin') {
        return new Response(
          JSON.stringify({ error: 'No tienes permisos de administración en este espacio' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generar token criptográfico único
    const rawToken = crypto.randomUUID() + '-' + crypto.randomUUID();
    const tokenHash = await sha256(rawToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays));

    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: invitation, error: insertError } = await adminSupabase
      .from('space_invitations')
      .insert({
        space_id: spaceId,
        email: email.trim().toLowerCase(),
        role,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
        invited_by: user.id,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Registrar en auditoría
    await adminSupabase.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action: 'INVITATION_CREATED',
      target_type: 'invitation',
      target_id: invitation.id,
      details: { email, space_id: spaceId, role, expires_at: expiresAt.toISOString() },
    });

    const inviteLink = `${Deno.env.get('APP_URL') || ''}/?invite_token=${rawToken}`;

    return new Response(
      JSON.stringify({
        success: true,
        invitation,
        raw_token: rawToken,
        invite_link: inviteLink,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Error al crear invitación' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
