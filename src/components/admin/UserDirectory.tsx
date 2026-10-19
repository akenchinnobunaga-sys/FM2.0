import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../services/storage';
import { UserProfile } from '../../types/database';
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  UserX,
  UserCheck,
  Calendar,
  Layers,
  AlertTriangle,
  X,
  CheckCircle2,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';

export const UserDirectory: React.FC = () => {
  const { currentUser, refreshProfile, isOwner } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  const [selectedUserForSuspend, setSelectedUserForSuspend] = useState<UserProfile | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Estados para Administración de Contraseñas (akenchinnobunaga@gmail.com)
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<UserProfile | null>(null);
  const [showReadablePassword, setShowReadablePassword] = useState(true);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [copiedPassword, setCopiedPassword] = useState(false);

  const state = localDB.getState();
  const profiles = state.profiles;
  const memberships = state.memberships;
  const spaces = state.spaces;

  const isMainAdmin =
    currentUser?.email === 'akenchinnobunaga@gmail.com' || isOwner;

  const filteredUsers = profiles.filter((user) => {
    const matchesSearch =
      user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPassword || !currentUser || !newPasswordValue.trim()) return;

    localDB.updateUserPassword(currentUser.id, currentUser.email, selectedUserForPassword.id, newPasswordValue.trim());
    setActionMessage(`Contraseña actualizada exitosamente para ${selectedUserForPassword.email}.`);
    setSelectedUserForPassword(null);
    setNewPasswordValue('');
    refreshProfile();
  };

  const handleCopyPassword = (pass: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2500);
  };

  const handleSuspend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForSuspend || !currentUser) return;

    try {
      localDB.suspendUser(
        currentUser.id,
        currentUser.email,
        selectedUserForSuspend.id,
        suspensionReason.trim() || 'Suspensión preventiva administrativa'
      );
      setActionMessage(`Usuario ${selectedUserForSuspend.email} suspendido exitosamente.`);
      setSelectedUserForSuspend(null);
      setSuspensionReason('');
      refreshProfile();
    } catch (err: any) {
      alert(err.message || 'Error al suspender usuario');
    }
  };

  const handleReactivate = (user: UserProfile) => {
    if (!currentUser) return;
    if (confirm(`¿Reactivar la cuenta de ${user.display_name} (${user.email})?`)) {
      localDB.reactivateUser(currentUser.id, currentUser.email, user.id);
      setActionMessage(`Usuario ${user.email} reactivado.`);
      refreshProfile();
    }
  };

  return (
    <div className="space-y-6">
      {/* Notificación de acción */}
      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Controles de Búsqueda y Filtro */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o correo electrónico..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Todos ({profiles.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setStatusFilter('suspended')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              statusFilter === 'suspended'
                ? 'bg-rose-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Suspendidos
          </button>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Rol Global</th>
                <th className="py-3 px-4">Estado Cuenta</th>
                <th className="py-3 px-4">Espacios y Membresías</th>
                <th className="py-3 px-4">Registro / Actividad</th>
                <th className="py-3 px-4 text-right">Acciones de Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredUsers.map((user) => {
                const userMembers = memberships.filter((m) => m.user_id === user.id);
                const isThisOwner = user.global_role === 'owner';

                return (
                  <tr key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
                          {user.display_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {user.display_name}
                            {isThisOwner && (
                              <span className="p-0.5 rounded bg-amber-500/10 text-amber-500" title="Propietario del Sistema">
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {isThisOwner ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                          Propietario Global
                        </span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          Usuario Estándar
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {user.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Suspendido
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {userMembers.length === 0 ? (
                          <span className="text-slate-400 text-[11px] italic">Espacio Financiero Personal</span>
                        ) : (
                          userMembers.map((m) => {
                            const space = spaces.find((s) => s.id === m.space_id);
                            return (
                              <span
                                key={m.id}
                                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 text-[10px] flex items-center gap-1"
                              >
                                <Layers className="w-2.5 h-2.5 text-slate-400" />
                                <span>{space?.name || 'Espacio'}</span>
                                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                                  ({m.role === 'space_admin' ? 'Admin' : m.role === 'space_member' ? 'Miembro' : 'Lector'})
                                </span>
                              </span>
                            );
                          })
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      <div>Reg: {new Date(user.created_at).toLocaleDateString('es-HN')}</div>
                      {user.last_login_at && (
                        <div className="text-[10px] text-slate-400">
                          Último: {new Date(user.last_login_at).toLocaleDateString('es-HN')}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isMainAdmin && (
                          <button
                            onClick={() => {
                              setSelectedUserForPassword(user);
                              setShowReadablePassword(true);
                              setNewPasswordValue('');
                              setCopiedPassword(false);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold text-[11px] inline-flex items-center gap-1 border border-amber-500/30 transition shadow-sm"
                            title="Ver contraseña en texto legible o restablecerla"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Contraseña</span>
                          </button>
                        )}

                        {isThisOwner ? (
                          <span className="text-[10px] text-slate-400 italic">Inmutable</span>
                        ) : user.status === 'suspended' ? (
                          <button
                            onClick={() => handleReactivate(user)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] inline-flex items-center gap-1 transition"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Reactivar</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedUserForSuspend(user)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-medium text-[11px] inline-flex items-center gap-1 border border-rose-200 dark:border-rose-800 transition"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Suspender</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Suspensión con Motivo */}
      {selectedUserForSuspend && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-2.5 rounded-xl bg-rose-500/10">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Suspender Cuenta de Usuario
                </h3>
                <p className="text-xs text-rose-500 font-medium">Acción administrativa de alta severidad</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Estás a punto de suspender el acceso para{' '}
              <strong className="text-slate-900 dark:text-white">{selectedUserForSuspend.display_name}</strong>{' '}
              (<span className="font-mono">{selectedUserForSuspend.email}</span>). Todas sus sesiones serán invalidadas inmediatamente y se bloqueará el acceso a cualquier espacio.
            </p>

            <form onSubmit={handleSuspend} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo obligatorio de la suspensión (Auditoría):
                </label>
                <textarea
                  required
                  rows={3}
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Ej: Uso no autorizado, solicitud de seguridad o retiro de miembro..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForSuspend(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1.5"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Confirmar Suspensión</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Asistencia y Gestión de Contraseñas (Exclusivo akenchinnobunaga@gmail.com) */}
      {selectedUserForPassword && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Asistencia de Contraseña
                  </h3>
                  <p className="text-xs text-slate-400">Exclusivo: akenchinnobunaga@gmail.com</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForPassword(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 mb-4 space-y-1 text-xs">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Usuario Seleccionado:</span>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {selectedUserForPassword.display_name}
              </div>
              <div className="text-slate-500 font-mono">{selectedUserForPassword.email}</div>
            </div>

            {/* Visualización de Contraseña Actual en Texto Legible */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Contraseña Actual (Legible para el Administrador):
              </label>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 select-all">
                  {showReadablePassword
                    ? selectedUserForPassword.password || localDB.getUserPassword(selectedUserForPassword.id) || 'Sin clave'
                    : '••••••••••••'}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowReadablePassword(!showReadablePassword)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                    title={showReadablePassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showReadablePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyPassword(
                        selectedUserForPassword.password || localDB.getUserPassword(selectedUserForPassword.id) || ''
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                  >
                    {copiedPassword ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPassword ? 'Copiada' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Asignar o Restablecer Nueva Contraseña */}
            <form onSubmit={handleSavePassword} className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-700">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Restablecer / Asignar Nueva Contraseña:
                </label>
                <input
                  type="text"
                  required
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  placeholder="Escribe la nueva contraseña para el usuario..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedUserForPassword(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Guardar Nueva Contraseña</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
