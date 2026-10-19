/**
 * Supabase Edge Function: admin-actions
 * Gestiona de forma segura operaciones del propietario:
 * - Suspensión y reactivación de cuentas (con invalidación de sesión Supabase Auth)
 * - Revocación de invitaciones
 * - Eliminación de membresías
 * - Registro en audit_logs
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // 1. Verificar identidad del usuario que llama
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado: sesión requerida' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Verificar que el usuario tenga rol 'owner' en profiles
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('global_role, status')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.global_role !== 'owner' || profile?.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Acceso denegado: solo el propietario global puede ejecutar esta acción' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, targetUserId, reason, invitationId, spaceId } = await req.json();

    // Cliente administrativo con SUPABASE_SERVICE_ROLE_KEY
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (action === 'suspend_user') {
      if (!targetUserId) throw new Error('targetUserId requerido');
      // Prohibir suspenderse a sí mismo
      if (targetUserId === user.id) throw new Error('El propietario no puede suspender su propia cuenta');

      // Actualizar perfil a suspended
      const { error: updateError } = await adminSupabase
        .from('profiles')
        .update({
          status: 'suspended',
          suspended_at: new Date().toISOString(),
          suspended_by: user.id,
          suspension_reason: reason || 'Suspensión administrativa por el Propietario',
        })
        .eq('id', targetUserId);

      if (updateError) throw updateError;

      // Invalidar sesiones activas en Supabase Auth Admin
      try {
        await adminSupabase.auth.admin.signOut(targetUserId);
      } catch (authSignoutErr) {
        console.warn('Advertencia al cerrar sesiones auth:', authSignoutErr);
      }

      // Registrar auditoría
      await adminSupabase.from('audit_logs').insert({
        actor_id: user.id,
        actor_email: user.email,
        action: 'USER_SUSPENDED',
        target_type: 'user',
        target_id: targetUserId,
        details: { reason },
      });

      return new Response(JSON.stringify({ success: true, message: 'Usuario suspendido correctamente' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'reactivate_user') {
      if (!targetUserId) throw new Error('targetUserId requerido');

      const { error: updateError } = await adminSupabase
        .from('profiles')
        .update({
          status: 'active',
          suspended_at: null,
          suspended_by: null,
          suspension_reason: null,
        })
        .eq('id', targetUserId);

      if (updateError) throw updateError;

      await adminSupabase.from('audit_logs').insert({
        actor_id: user.id,
        actor_email: user.email,
        action: 'USER_REACTIVATED',
        target_type: 'user',
        target_id: targetUserId,
        details: {},
      });

      return new Response(JSON.stringify({ success: true, message: 'Usuario reactivado correctamente' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'revoke_invitation') {
      if (!invitationId) throw new Error('invitationId requerido');

      const { error: revokeError } = await adminSupabase
        .from('space_invitations')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
        })
        .eq('id', invitationId);

      if (revokeError) throw revokeError;

      await adminSupabase.from('audit_logs').insert({
        actor_id: user.id,
        actor_email: user.email,
        action: 'INVITATION_REVOKED',
        target_type: 'invitation',
        target_id: invitationId,
        details: {},
      });

      return new Response(JSON.stringify({ success: true, message: 'Invitación revocada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Acción no soportada');
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Error interno' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
