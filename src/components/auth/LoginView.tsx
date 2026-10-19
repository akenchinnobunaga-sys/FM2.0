import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDB, INITIAL_OWNER_EMAIL } from '../../services/storage';
import {
  Lock,
  Mail,
  User,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Smartphone,
  Send,
  HelpCircle,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { signIn, signUpWithCode, requestAccess } = useAuth();
  const [tab, setTab] = useState<'login' | 'request' | 'redeem'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Request Access state
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqPhone, setReqPhone] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [reqSuccess, setReqSuccess] = useState<string | null>(null);
  const [reqError, setReqError] = useState<string | null>(null);

  // Redeem Code state
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemEmail, setRedeemEmail] = useState('');
  const [redeemName, setRedeemName] = useState('');
  const [redeemPassword, setRedeemPassword] = useState('');
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

  // Demo helpers state
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    try {
      const res = await signIn(loginEmail, loginPassword);
      if (!res.success) {
        setLoginError(res.message || 'Error al iniciar sesión');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Error inesperado al iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqError(null);
    setReqSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await requestAccess(reqName, reqEmail, reqPhone, reqReason);
      if (res.success) {
        setReqSuccess(
          '¡Solicitud enviada con éxito! El administrador principal (' +
            INITIAL_OWNER_EMAIL +
            ') ha recibido tu solicitud y emitirá tu código de activación o credenciales de acceso.'
        );
        setReqName('');
        setReqEmail('');
        setReqPhone('');
        setReqReason('');
      } else {
        setReqError(res.message || 'Error al enviar la solicitud.');
      }
    } catch (err: any) {
      setReqError(err.message || 'Error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemError(null);
    setRedeemSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await signUpWithCode(redeemCode, redeemEmail, redeemPassword, redeemName);
      if (res.success) {
        setRedeemSuccess('Código canjeado exitosamente. Iniciando tu sesión...');
      } else {
        setRedeemError(res.message || 'Código inválido o ya utilizado.');
      }
    } catch (err: any) {
      setRedeemError(err.message || 'Error al procesar el código.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setLoginError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Fondo con gradientes sutiles */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Tarjeta Central */}
      <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl shadow-2xl backdrop-blur-xl p-6 sm:p-8 relative z-10">
        {/* Logotipo y Título */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-emerald-500/25 mx-auto mb-3">
            FP
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">FinanzasPro</h1>
          <p className="text-xs text-slate-400 mt-1">
            Sistema de Gestión Financiera Personal y Control de Acceso
          </p>
        </div>

        {/* Pestañas de Navegación */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900/70 p-1 rounded-2xl mb-6 border border-slate-700/60 text-xs font-semibold">
          <button
            onClick={() => {
              setTab('login');
              setLoginError(null);
            }}
            className={`py-2 px-1 rounded-xl transition ${
              tab === 'login'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => {
              setTab('request');
              setReqError(null);
              setReqSuccess(null);
            }}
            className={`py-2 px-1 rounded-xl transition ${
              tab === 'request'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Solicitar Acceso
          </button>
          <button
            onClick={() => {
              setTab('redeem');
              setRedeemError(null);
              setRedeemSuccess(null);
            }}
            className={`py-2 px-1 rounded-xl transition ${
              tab === 'redeem'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Canjear Código
          </button>
        </div>

        {/* TAB 1: INICIAR SESIÓN */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Correo Electrónico:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="usuario@dominio.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Contraseña:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <span>{isSubmitting ? 'Verificando...' : 'Entrar a FinanzasPro'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Asistente de Cuentas Preconfiguradas para pruebas */}
            <div className="pt-3 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-emerald-400 transition"
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Ver cuentas registradas del sistema</span>
                </span>
                <span>{showDemoAccounts ? 'Ocultar' : 'Mostrar'}</span>
              </button>

              {showDemoAccounts && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 space-y-2 text-[11px]">
                  <p className="text-slate-400 text-[10px]">
                    Haz clic en una cuenta para rellenar los datos rápidamente:
                  </p>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => fillCredentials('akenchinnobunaga@gmail.com', 'Admin2026!')}
                      className="w-full text-left p-2 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-between transition text-slate-200"
                    >
                      <div>
                        <strong className="text-amber-400 block">Administrador Principal</strong>
                        <span className="text-slate-400 font-mono text-[10px]">akenchinnobunaga@gmail.com</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Admin2026!</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fillCredentials('maria.garcia@familia.local', 'Maria2026!')}
                      className="w-full text-left p-2 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-between transition text-slate-200"
                    >
                      <div>
                        <strong className="text-emerald-400 block">María García (Usuario)</strong>
                        <span className="text-slate-400 font-mono text-[10px]">maria.garcia@familia.local</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Maria2026!</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fillCredentials('carlos.garcia@familia.local', 'Carlos2026!')}
                      className="w-full text-left p-2 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-between transition text-slate-200"
                    >
                      <div>
                        <strong className="text-teal-400 block">Carlos García (Usuario)</strong>
                        <span className="text-slate-400 font-mono text-[10px]">carlos.garcia@familia.local</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Carlos2026!</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        )}

        {/* TAB 2: SOLICITAR ACCESO */}
        {tab === 'request' && (
          <form onSubmit={handleRequestSubmit} className="space-y-3.5">
            {reqSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{reqSuccess}</span>
              </div>
            )}
            {reqError && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{reqError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre y Apellidos:
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={reqName}
                  onChange={(e) => setReqName(e.target.value)}
                  placeholder="Ej: Roberto Gómez"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Correo Electrónico:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={reqEmail}
                  onChange={(e) => setReqEmail(e.target.value)}
                  placeholder="roberto@correo.hn"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Teléfono / WhatsApp (Opcional):
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={reqPhone}
                  onChange={(e) => setReqPhone(e.target.value)}
                  placeholder="+504 9876-5432"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Motivo / Justificación de Acceso:
              </label>
              <textarea
                rows={2}
                value={reqReason}
                onChange={(e) => setReqReason(e.target.value)}
                placeholder="Ej: Uso personal para control de horas y gastos de vehículo..."
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Enviando...' : 'Enviar Solicitud al Administrador'}</span>
            </button>
          </form>
        )}

        {/* TAB 3: CANJEAR CÓDIGO */}
        {tab === 'redeem' && (
          <form onSubmit={handleRedeemSubmit} className="space-y-3.5">
            {redeemSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{redeemSuccess}</span>
              </div>
            )}
            {redeemError && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{redeemError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Código de Activación Autorizado:
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  placeholder="FPRO-XXXX-XXXX-XXXX"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 font-mono font-bold text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre de Usuario:
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={redeemName}
                  onChange={(e) => setRedeemName(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Correo Electrónico:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={redeemEmail}
                  onChange={(e) => setRedeemEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Crear Contraseña:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={redeemPassword}
                  onChange={(e) => setRedeemPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Activando...' : 'Activar Cuenta y Entrar'}</span>
            </button>
          </form>
        )}

        {/* Pie de Página */}
        <div className="mt-6 pt-4 border-t border-slate-700/60 text-center">
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Almacenamiento Local Seguro • 100% Sin Internet</span>
          </div>
        </div>
      </div>
    </div>
  );
};
