import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../services/storage';
import { SpaceInvitation, SpaceRole } from '../../types/database';
import {
  UserPlus,
  Send,
  Copy,
  Check,
  ShieldBan,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
  X,
  ExternalLink,
} from 'lucide-react';

export const InvitationCenter: React.FC = () => {
  const { currentUser } = useAuth();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [role, setRole] = useState<SpaceRole>('space_member');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [lastGeneratedInvite, setLastGeneratedInvite] = useState<{ link: string; token: string } | null>(null);

  const state = localDB.getState();
  const invitations = state.invitations;
  const spaces = state.spaces;

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !email || !selectedSpaceId) return;

    try {
      const newInv = localDB.createInvitation({
        space_id: selectedSpaceId,
        email: email.trim(),
        role,
        invited_by: currentUser.id,
        invited_by_email: currentUser.email,
        expires_in_days: Number(expiresInDays),
      });

      const appUrl = window.location.origin;
      const inviteLink = `${appUrl}/?invite_token=${newInv.raw_token_preview}`;
      setLastGeneratedInvite({
        link: inviteLink,
        token: newInv.raw_token_preview || 'TOKEN-GEN',
      });

      setEmail('');
    } catch (err: any) {
      alert(err.message || 'Error al generar la invitación');
    }
  };

  const handleRevoke = (invitationId: string) => {
    if (!currentUser) return;
    if (confirm('¿Estás seguro de revocar esta invitación? El enlace quedará inutilizado permanentemente.')) {
      localDB.revokeInvitation(currentUser.id, currentUser.email, invitationId);
    }
  };

  const handleCopyLink = (token: string, id: string) => {
    const appUrl = window.location.origin;
    const link = `${appUrl}/?invite_token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera con Botón de Creación */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Centro de Invitaciones y Acceso Seguro</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Emite invitaciones cifradas de un solo uso con fecha de caducidad. El registro público está deshabilitado por directiva de seguridad.
          </p>
        </div>
        <button
          onClick={() => {
            if (spaces.length > 0 && !selectedSpaceId) {
              setSelectedSpaceId(spaces[0].id);
            }
            setShowInviteModal(true);
            setLastGeneratedInvite(null);
          }}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Generar Nueva Invitación</span>
        </button>
      </div>

      {/* Tabla de Invitaciones */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Registro Histórico de Invitaciones ({invitations.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Correo Invitado</th>
                <th className="py-3 px-4">Espacio Financiero</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">Vencimiento</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {invitations.map((inv) => {
                const space = state.spaces.find((s) => s.id === inv.space_id);
                const isPending = inv.status === 'pending';
                const isExpired = new Date(inv.expires_at) < new Date();

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white font-mono">
                        {inv.email}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Invitado por: {inv.invited_by_email || 'Propietario'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {space?.name || 'Espacio no encontrado'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-[10px]">
                        {inv.role === 'space_admin'
                          ? 'Administrador del Espacio'
                          : inv.role === 'space_member'
                          ? 'Miembro'
                          : 'Solo Lectura'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      <div>{new Date(inv.expires_at).toLocaleDateString('es-HN')}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(inv.expires_at).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {inv.status === 'revoked' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                          <ShieldBan className="w-3 h-3" /> Revocada
                        </span>
                      ) : inv.status === 'accepted' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          <CheckCircle className="w-3 h-3" /> Aceptada
                        </span>
                      ) : isExpired ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                          <Clock className="w-3 h-3" /> Caducada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                          <Clock className="w-3 h-3" /> Pendiente
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {isPending && !isExpired && (
                        <>
                          <button
                            onClick={() => handleCopyLink(inv.raw_token_preview || inv.id, inv.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                            title="Copiar enlace de invitación"
                          >
                            {copiedTokenId === inv.id ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleRevoke(inv.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Revocar invitación permanentemente"
                          >
                            <ShieldBan className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Generar Invitación */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Generar Invitación a Espacio Financiero
                  </h3>
                  <p className="text-xs text-slate-400">Emisión de enlace seguro de un solo uso</p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {lastGeneratedInvite ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200">
                  <div className="flex items-center gap-2 font-bold text-xs mb-1">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>¡Invitación Generada Exitosamente!</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                    Comparte este enlace exclusivo con el invitado. El enlace expirará automáticamente en la fecha asignada o tras su primer uso.
                  </p>
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-emerald-300 dark:border-emerald-800">
                    <input
                      type="text"
                      readOnly
                      value={lastGeneratedInvite.link}
                      className="w-full text-xs font-mono bg-transparent outline-none text-slate-700 dark:text-slate-300 truncate"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(lastGeneratedInvite.link);
                        setCopiedTokenId('modal');
                        setTimeout(() => setCopiedTokenId(null), 2000);
                      }}
                      className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition"
                    >
                      {copiedTokenId === 'modal' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copiar</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowInviteModal(false);
                      setLastGeneratedInvite(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold"
                  >
                    Listo
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Correo electrónico del destinatario:
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@familia.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Espacio Familiar de Destino:
                    </label>
                    <select
                      value={selectedSpaceId}
                      onChange={(e) => setSelectedSpaceId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {spaces.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          {sp.name} ({sp.currency})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Rol dentro del Espacio:
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as SpaceRole)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="space_member">Miembro (Registra transacciones)</option>
                      <option value="space_admin">Administrador (Gestiona presupuestos y miembros)</option>
                      <option value="space_viewer">Solo Lectura (Visualiza reportes)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Caducidad del Enlace de Invitación:
                  </label>
                  <select
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value={3}>3 días</option>
                    <option value={7}>7 días (Recomendado)</option>
                    <option value={14}>14 días</option>
                    <option value={30}>30 días</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Generar Token y Enlace</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
