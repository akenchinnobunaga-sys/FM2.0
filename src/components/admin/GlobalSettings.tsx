import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../services/storage';
import { ShieldCheck, Save, Sliders, CheckCircle2, Lock, AlertTriangle } from 'lucide-react';

export const GlobalSettings: React.FC = () => {
  const { currentUser } = useAuth();
  const state = localDB.getState();
  const [settings, setSettings] = useState(state.globalSettings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    localDB.updateGlobalSettings(currentUser.id, currentUser.email, settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Configuraciones globales actualizadas y registradas en auditoría.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6 shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Políticas de Seguridad y Configuración del Sistema</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Solo el Propietario Global tiene facultades para modificar estos parámetros maestros.
          </p>
        </div>

        {/* Política de Registro e Invitaciones */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Control de Acceso y Registro
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                settings.invitation_policy === 'invitation_only'
                  ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="invitation_policy"
                value="invitation_only"
                checked={settings.invitation_policy === 'invitation_only'}
                onChange={() => setSettings({ ...settings, invitation_policy: 'invitation_only' })}
                className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="block text-xs font-bold text-slate-900 dark:text-white">
                  Solo con Invitación (Estricto)
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  El registro público está completamente bloqueado. Solo usuarios con tokens válidos pueden registrarse.
                </span>
              </div>
            </label>

            <label
              className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                settings.invitation_policy === 'closed'
                  ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="invitation_policy"
                value="closed"
                checked={settings.invitation_policy === 'closed'}
                onChange={() => setSettings({ ...settings, invitation_policy: 'closed' })}
                className="mt-0.5 text-rose-600 focus:ring-rose-500"
              />
              <div>
                <span className="block text-xs font-bold text-slate-900 dark:text-white">
                  Sistema Cerrado Totalmente
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Nadie puede ingresar nuevas cuentas, ni siquiera con invitación existente.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Moneda y Configuración Financiera */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Estándares Financieros del Sistema
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Moneda Base del Sistema:
              </label>
              <select
                value={settings.default_currency}
                onChange={(e) => setSettings({ ...settings, default_currency: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500"
              >
                <option value="HNL">Lempira Hondureño (HNL - L.)</option>
                <option value="USD">Dólar Estadounidense (USD - $)</option>
                <option value="EUR">Euro (EUR - €)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Máximo de Espacios Financieros por Usuario:
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={settings.max_spaces_per_user}
                onChange={(e) => setSettings({ ...settings, max_spaces_per_user: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Directivas Críticas de Seguridad */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Medidas de Seguridad Avanzadas
          </h4>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.require_2fa_for_owner}
              onChange={(e) => setSettings({ ...settings, require_2fa_for_owner: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Exigir autenticación de dos factores (2FA) para el Propietario
              </span>
              <span className="text-[11px] text-slate-400 block">
                Solicita código TOTP en cada inicio de sesión administrativo en Supabase Auth.
              </span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.maintenance_mode}
              onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
              className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
            />
            <div>
              <span className="text-xs font-semibold text-rose-800 dark:text-rose-300 block">
                Modo Mantenimiento Global
              </span>
              <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80 block">
                Pausa las escrituras de transacciones a todos los usuarios excepto al Propietario.
              </span>
            </div>
          </label>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Políticas Globales</span>
          </button>
        </div>
      </form>
    </div>
  );
};
