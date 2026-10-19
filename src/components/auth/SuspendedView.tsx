import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, LogOut, Mail, Lock } from 'lucide-react';

export const SuspendedView: React.FC = () => {
  const { currentUser, switchUserPersona } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-rose-500/30 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow de seguridad */}
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Cuenta Suspendida</h1>
            <p className="text-xs text-rose-400 font-medium tracking-wide uppercase">
              Acceso Restringido por el Propietario
            </p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 mb-6 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Usuario:</span>
            <span className="font-mono text-slate-200">{currentUser?.email}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Fecha de suspensión:</span>
            <span className="text-slate-200">
              {currentUser?.suspended_at
                ? new Date(currentUser.suspended_at).toLocaleString('es-HN')
                : 'Reciente'}
            </span>
          </div>
          <div className="border-t border-slate-800 pt-3">
            <span className="text-xs text-slate-400 block mb-1">Motivo administrativo registrado:</span>
            <p className="text-sm text-rose-300 font-medium italic">
              "{currentUser?.suspension_reason || 'Suspensión preventiva por administración'}"
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          Por motivos de seguridad y de acuerdo a las directivas de control de acceso, todas tus sesiones activas han sido invalidadas y se han bloqueado las operaciones sobre espacios y transacciones.
        </p>

        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-xs text-amber-300 mb-6">
          <Mail className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Para solicitar una revisión o reactivación, contacta al Administrador Global: <strong>akenchinnobunaga@gmail.com</strong></span>
        </div>

        {/* Barra de simulación QA para ingenieros */}
        <div className="border-t border-slate-700/60 pt-4">
          <div className="text-xs text-slate-400 mb-2 font-medium flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Panel de Pruebas QA (Alternar rol para validar reactivación):</span>
          </div>
          <button
            onClick={() => switchUserPersona('usr-owner-001')}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <span>Cambiar a Propietario (Nobunaga) para reactivar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
