import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../services/storage';
import { AccessRequest, ActivationCode } from '../../types/database';
import {
  UserCheck,
  KeyRound,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Archive,
  Plus,
  Copy,
  Check,
  AlertTriangle,
  Send,
  Calendar,
  X,
  Mail,
  Smartphone,
  Sparkles,
} from 'lucide-react';

export const ApprovalsAndCodesManager: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'codes'>('requests');

  // Solicitudes state
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [requestSearch, setRequestSearch] = useState('');
  const [selectedRequestForApproval, setSelectedRequestForApproval] = useState<AccessRequest | null>(null);
  const [approvalDurationDays, setApprovalDurationDays] = useState(365);
  const [approvalDurationLabel, setApprovalDurationLabel] = useState('1 Año Completo');
  const [confirmWithdrawRequest, setConfirmWithdrawRequest] = useState<AccessRequest | null>(null);

  // Códigos state
  const [codeFilter, setCodeFilter] = useState<'all' | 'active' | 'used' | 'expired'>('all');
  const [codeSearch, setCodeSearch] = useState('');
  const [showNewCodeModal, setShowNewCodeModal] = useState(false);
  const [newCodeEmail, setNewCodeEmail] = useState('');
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeDays, setNewCodeDays] = useState(365);
  const [newCodeLabel, setNewCodeLabel] = useState('1 Año Completo');
  const [confirmDeleteCode, setConfirmDeleteCode] = useState<ActivationCode | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  const requests = localDB.getAccessRequests();
  const codes = localDB.getActivationCodes();

  const pendingRequestsCount = requests.filter((r) => r.status === 'pending').length;

  const filteredRequests = requests.filter((r) => {
    const matchesFilter = requestFilter === 'all' || r.status === requestFilter;
    const matchesSearch =
      r.full_name.toLowerCase().includes(requestSearch.toLowerCase()) ||
      r.email.toLowerCase().includes(requestSearch.toLowerCase()) ||
      (r.phone && r.phone.includes(requestSearch));
    return matchesFilter && matchesSearch;
  });

  const filteredCodes = codes.filter((c) => {
    const isExpired = new Date(c.expires_at) < new Date();
    const effectiveStatus = c.status === 'used' ? 'used' : isExpired ? 'expired' : c.status;
    const matchesFilter = codeFilter === 'all' || effectiveStatus === codeFilter;
    const matchesSearch =
      c.code.toLowerCase().includes(codeSearch.toLowerCase()) ||
      c.user_email.toLowerCase().includes(codeSearch.toLowerCase()) ||
      c.user_name.toLowerCase().includes(codeSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleApprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForApproval || !currentUser) return;

    const res = localDB.approveAccessRequest(
      currentUser.id,
      currentUser.email,
      selectedRequestForApproval.id,
      Number(approvalDurationDays),
      approvalDurationLabel
    );

    if (res.success) {
      setSuccessMessage(res.message);
      setSelectedRequestForApproval(null);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleReject = (req: AccessRequest) => {
    if (!currentUser) return;
    if (confirm(`¿Rechazar la solicitud de acceso para ${req.full_name} (${req.email})?`)) {
      localDB.rejectAccessRequest(currentUser.id, currentUser.email, req.id);
      setSuccessMessage(`Solicitud de ${req.email} rechazada.`);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleExecuteWithdraw = () => {
    if (!confirmWithdrawRequest || !currentUser) return;
    localDB.withdrawAccessRequest(currentUser.id, currentUser.email, confirmWithdrawRequest.id);
    setSuccessMessage(`Solicitud de ${confirmWithdrawRequest.email} retirada permanentemente.`);
    setConfirmWithdrawRequest(null);
    setRefreshKey((k) => k + 1);
  };

  const handleCreateCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newCodeEmail.trim()) return;

    const newCode = localDB.createActivationCode({
      user_email: newCodeEmail.trim(),
      user_name: newCodeName.trim() || newCodeEmail.split('@')[0],
      duration_days: Number(newCodeDays),
      duration_label: newCodeLabel,
      created_by: currentUser.email,
    });

    setSuccessMessage(`Código emitido exitosamente: ${newCode.code}`);
    setShowNewCodeModal(false);
    setNewCodeEmail('');
    setNewCodeName('');
    setRefreshKey((k) => k + 1);
  };

  const handleArchiveCode = (code: ActivationCode) => {
    if (!currentUser) return;
    localDB.archiveActivationCode(currentUser.id, currentUser.email, code.id);
    setSuccessMessage(`Estado del código ${code.code} actualizado.`);
    setRefreshKey((k) => k + 1);
  };

  const handleExecuteDeleteCode = () => {
    if (!confirmDeleteCode || !currentUser) return;
    localDB.deleteActivationCode(currentUser.id, currentUser.email, confirmDeleteCode.id);
    setSuccessMessage(`Código ${confirmDeleteCode.code} eliminado del registro activo.`);
    setConfirmDeleteCode(null);
    setRefreshKey((k) => k + 1);
  };

  const copyCode = (codeText: string, id: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  return (
    <div key={refreshKey} className="space-y-6">
      {/* Mensaje de Éxito */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-between text-xs font-semibold shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selector de Sub-pestañas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('requests')}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'requests'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Solicitudes de Aprobación</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('codes')}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'codes'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Historial de Códigos de Activación ({codes.length})</span>
          </button>
        </div>

        {activeSubTab === 'codes' && (
          <button
            onClick={() => setShowNewCodeModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir Nuevo Código</span>
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* SUB-PESTAÑA 1: GESTIÓN DE SOLICITUDES DE APROBACIÓN */}
      {/* ======================================================== */}
      {activeSubTab === 'requests' && (
        <div className="space-y-4">
          {/* Controles de Búsqueda y Filtro */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                placeholder="Buscar solicitud por nombre, correo o teléfono..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setRequestFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  requestFilter === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Todas ({requests.length})
              </button>
              <button
                onClick={() => setRequestFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  requestFilter === 'pending'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Pendientes ({pendingRequestsCount})
              </button>
              <button
                onClick={() => setRequestFilter('approved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  requestFilter === 'approved'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Aprobadas ({requests.filter((r) => r.status === 'approved').length})
              </button>
              <button
                onClick={() => setRequestFilter('rejected')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  requestFilter === 'rejected'
                    ? 'bg-rose-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Rechazadas ({requests.filter((r) => r.status === 'rejected').length})
              </button>
            </div>
          </div>

          {/* Tabla de Solicitudes */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Solicitante</th>
                    <th className="py-3 px-4">Motivo / Justificación</th>
                    <th className="py-3 px-4">Fecha Solicitud</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        No se encontraron solicitudes con el filtro actual.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 dark:text-white block">{req.full_name}</span>
                          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {req.email}
                          </span>
                          {req.phone && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                              <Smartphone className="w-3 h-3" />
                              {req.phone}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-slate-600 dark:text-slate-300 text-xs line-clamp-2">
                            {req.reason || 'Sin justificación especificada.'}
                          </p>
                          {req.activation_code && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400">Código Asignado:</span>
                              <code className="text-[11px] font-mono font-bold text-amber-500">
                                {req.activation_code}
                              </code>
                              <button
                                onClick={() => copyCode(req.activation_code!, req.id)}
                                className="p-0.5 hover:text-emerald-500 text-slate-400"
                                title="Copiar código"
                              >
                                {copiedCodeId === req.id ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          <div>{new Date(req.requested_at).toLocaleDateString('es-HN')}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(req.requested_at).toLocaleTimeString('es-HN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {req.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold animate-pulse">
                              <Clock className="w-3 h-3" /> Pendiente
                            </span>
                          ) : req.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold">
                              <CheckCircle2 className="w-3 h-3" /> Aprobada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold">
                              <XCircle className="w-3 h-3" /> Rechazada
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {req.status === 'pending' && (
                            <>
                              <button
                                onClick={() => setSelectedRequestForApproval(req)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] inline-flex items-center gap-1 transition shadow-sm"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Aprobar y Emitir</span>
                              </button>
                              <button
                                onClick={() => handleReject(req)}
                                className="px-2 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-semibold text-[11px] inline-flex items-center gap-1 transition border border-rose-200 dark:border-rose-800"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Rechazar</span>
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setConfirmWithdrawRequest(req)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                            title="Retirar solicitud del historial"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-PESTAÑA 2: HISTORIAL Y GESTIÓN DE CÓDIGOS DE ACTIVACIÓN */}
      {/* ======================================================== */}
      {activeSubTab === 'codes' && (
        <div className="space-y-4">
          {/* Controles de Búsqueda y Filtro de Códigos */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={codeSearch}
                onChange={(e) => setCodeSearch(e.target.value)}
                placeholder="Buscar código de activación por clave, usuario o correo..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setCodeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  codeFilter === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Todos ({codes.length})
              </button>
              <button
                onClick={() => setCodeFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  codeFilter === 'active'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Disponibles ({codes.filter((c) => c.status === 'active' && new Date(c.expires_at) >= new Date()).length})
              </button>
              <button
                onClick={() => setCodeFilter('used')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  codeFilter === 'used'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Canjeados ({codes.filter((c) => c.status === 'used').length})
              </button>
              <button
                onClick={() => setCodeFilter('expired')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  codeFilter === 'expired'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Caducados ({codes.filter((c) => c.status === 'expired' || new Date(c.expires_at) < new Date()).length})
              </button>
            </div>
          </div>

          {/* Tabla de Códigos de Activación */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Código de Activación</th>
                    <th className="py-3 px-4">Destinatario</th>
                    <th className="py-3 px-4">Duración / Vigencia</th>
                    <th className="py-3 px-4">Vencimiento</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredCodes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No se encontraron códigos con el filtro seleccionado.
                      </td>
                    </tr>
                  ) : (
                    filteredCodes.map((c) => {
                      const isExpired = new Date(c.expires_at) < new Date();
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-500">
                            <div className="flex items-center gap-2">
                              <span>{c.code}</span>
                              <button
                                onClick={() => copyCode(c.code, c.id)}
                                className="p-1 hover:text-emerald-500 text-slate-400 rounded-md transition"
                                title="Copiar código de activación"
                              >
                                {copiedCodeId === c.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-900 dark:text-white block">{c.user_name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{c.user_email}</span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 font-semibold text-[10px] text-slate-700 dark:text-slate-200">
                              {c.duration_label} ({c.duration_days} días)
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono">
                            {new Date(c.expires_at).toLocaleDateString('es-HN')}
                          </td>

                          <td className="py-3.5 px-4">
                            {c.status === 'used' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                                Canjeado
                              </span>
                            ) : isExpired || c.status === 'expired' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                                Caducado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                Activo / Disponible
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => handleArchiveCode(c)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                              title={c.status === 'expired' ? 'Reactivar código' : 'Archivar / Desactivar código'}
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setConfirmDeleteCode(c)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                              title="Eliminar código del registro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: APROBAR SOLICITUD Y EMITIR CÓDIGO */}
      {/* ======================================================== */}
      {selectedRequestForApproval && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Aprobar Solicitud de Acceso
                  </h3>
                  <p className="text-xs text-slate-400">Emisión de código de activación</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequestForApproval(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 mb-4 space-y-1 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Datos del Solicitante:</span>
              <div className="font-bold text-slate-900 dark:text-white">{selectedRequestForApproval.full_name}</div>
              <div className="text-slate-500 font-mono">{selectedRequestForApproval.email}</div>
              {selectedRequestForApproval.phone && (
                <div className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                  {selectedRequestForApproval.phone}
                </div>
              )}
            </div>

            <form onSubmit={handleApprove} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Vigencia de la Licencia de Acceso:
                </label>
                <select
                  value={approvalDurationDays}
                  onChange={(e) => {
                    const days = Number(e.target.value);
                    setApprovalDurationDays(days);
                    if (days === 30) setApprovalDurationLabel('Mensual (30 Días)');
                    else if (days === 90) setApprovalDurationLabel('Trimestral (90 Días)');
                    else if (days === 180) setApprovalDurationLabel('Semestral (180 Días)');
                    else if (days === 365) setApprovalDurationLabel('1 Año Completo');
                    else setApprovalDurationLabel('Vitalicia / Ilimitada');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                >
                  <option value={30}>1 Mes (30 Días)</option>
                  <option value={90}>Trimestral (90 Días)</option>
                  <option value={180}>Semestral (180 Días)</option>
                  <option value={365}>1 Año Completo (365 Días)</option>
                  <option value={3650}>Vitalicia (10 Años)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequestForApproval(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                >
                  Aprobar y Generar Código
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRMAR RETIRO DE SOLICITUD */}
      {/* ======================================================== */}
      {confirmWithdrawRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-500 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Retirar Solicitud de Acceso
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
              ¿Estás seguro de retirar permanentemente la solicitud de{' '}
              <strong className="text-slate-900 dark:text-white">{confirmWithdrawRequest.full_name}</strong>{' '}
              (<span className="font-mono">{confirmWithdrawRequest.email}</span>)? Se registrará un evento de auditoría para trazabilidad.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmWithdrawRequest(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteWithdraw}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Confirmar Retiro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EMITIR NUEVO CÓDIGO MANUAL */}
      {/* ======================================================== */}
      {showNewCodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Emitir Nuevo Código de Activación
                  </h3>
                  <p className="text-xs text-slate-400">Creación directa de clave autorizada</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewCodeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCode} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Usuario:
                </label>
                <input
                  type="text"
                  required
                  value={newCodeName}
                  onChange={(e) => setNewCodeName(e.target.value)}
                  placeholder="Ej: Laura Mendoza"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico Autorizado:
                </label>
                <input
                  type="email"
                  required
                  value={newCodeEmail}
                  onChange={(e) => setNewCodeEmail(e.target.value)}
                  placeholder="usuario@dominio.hn"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Periodo de Vigencia:
                </label>
                <select
                  value={newCodeDays}
                  onChange={(e) => {
                    const days = Number(e.target.value);
                    setNewCodeDays(days);
                    if (days === 30) setNewCodeLabel('Mensual (30 Días)');
                    else if (days === 90) setNewCodeLabel('Trimestral (90 Días)');
                    else if (days === 180) setNewCodeLabel('Semestral (180 Días)');
                    else if (days === 365) setNewCodeLabel('1 Año Completo');
                    else setNewCodeLabel('Vitalicia / Ilimitada');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                >
                  <option value={30}>1 Mes (30 Días)</option>
                  <option value={90}>Trimestral (90 Días)</option>
                  <option value={180}>Semestral (180 Días)</option>
                  <option value={365}>1 Año Completo (365 Días)</option>
                  <option value={3650}>Vitalicia (10 Años)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCodeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20"
                >
                  Generar y Registrar Código
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN DE CÓDIGO */}
      {/* ======================================================== */}
      {confirmDeleteCode && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-500 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Eliminar Código de Activación
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
              ¿Estás seguro de eliminar el código{' '}
              <strong className="font-mono text-amber-500">{confirmDeleteCode.code}</strong> asignado a{' '}
              <strong>{confirmDeleteCode.user_email}</strong>? Se conservará un registro en auditoría para trazabilidad.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteCode(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteDeleteCode}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
