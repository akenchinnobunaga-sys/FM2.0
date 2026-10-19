import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../services/storage';
import {
  ShieldCheck,
  Search,
  Filter,
  History,
  Key,
  AlertTriangle,
  FileCode,
  Trash2,
  CheckCircle2,
  X,
} from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const state = localDB.getState();
  const auditLogs = state.auditLogs;

  const filteredLogs = auditLogs.filter((log) => {
    const text = `${log.action} ${log.actor_email} ${log.target_type} ${JSON.stringify(log.details)}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  const handleClearLogs = () => {
    if (!currentUser) return;
    localDB.clearAuditLogs(currentUser.id, currentUser.email);
    setShowConfirmClear(false);
    setFeedbackMessage('Registro histórico de actividades depurado exitosamente.');
    setRefreshKey((k) => k + 1);
  };

  const handleDeleteSingleLog = (id: string) => {
    if (!currentUser) return;
    localDB.deleteAuditLog(currentUser.id, currentUser.email, id);
    setLogToDelete(null);
    setFeedbackMessage('Registro eliminado de la base de datos local.');
    setRefreshKey((k) => k + 1);
  };

  return (
    <div key={refreshKey} className="space-y-4">
      {feedbackMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Controles de Búsqueda y Depuración */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar eventos de auditoría por acción, correo o metadatos..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {auditLogs.length > 0 && (
          <button
            onClick={() => setShowConfirmClear(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-semibold text-xs border border-rose-200 dark:border-rose-800 flex items-center justify-center gap-1.5 transition shrink-0"
            title="Eliminar historial de actividades"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpiar Registro de Actividades</span>
          </button>
        )}
      </div>

      {/* Tabla de Logs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Fecha (UTC)</th>
                <th className="py-3 px-4">Actor Responsable</th>
                <th className="py-3 px-4">Acción de Seguridad</th>
                <th className="py-3 px-4">Objetivo</th>
                <th className="py-3 px-4">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-mono">
              {filteredLogs.map((log) => {
                const isSuspension = log.action.includes('SUSPEND');
                const isInvite = log.action.includes('INVITATION');
                const isReactivate = log.action.includes('REACTIVATE');

                return (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('es-HN')}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {log.actor_email}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isSuspension
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : isReactivate
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : isInvite
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <span className="capitalize">{log.target_type}</span>
                      {log.target_id && (
                        <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                          ID: {log.target_id}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-sans flex items-center gap-1 transition"
                        >
                          <FileCode className="w-3 h-3 text-slate-400" />
                          <span>Ver JSON</span>
                        </button>
                        <button
                          onClick={() => setLogToDelete(log.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Eliminar este registro individual"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Inspector JSON */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-2xl max-w-lg w-full p-5 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="font-bold text-xs uppercase tracking-wider text-emerald-400">
                Detalle del Registro de Auditoría ({selectedLog.action})
              </span>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto max-h-96 border border-slate-800">
              {JSON.stringify(selectedLog, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Modal Confirmación: Limpiar Todo el Historial de Actividades */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-500 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Limpiar Historial de Actividades
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
              ¿Está seguro de eliminar el registro histórico de actividades? Esta acción purgará los eventos anteriores para optimizar el almacenamiento local, registrando un nuevo evento de auditoría que certifica la depuración administrativa.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearLogs}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20"
              >
                Confirmar Limpieza
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación: Eliminar Registro Individual */}
      {logToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-500 mb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Eliminar Registro
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
              ¿Deseas eliminar este registro de auditoría individual?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setLogToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteSingleLog(logToDelete)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
