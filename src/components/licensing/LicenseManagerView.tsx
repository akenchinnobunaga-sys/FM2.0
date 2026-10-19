import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LicenseService } from '../../services/licenseService';
import { SoftwareLicense, ActivationStatus } from '../../types/database';
import {
  Key,
  ShieldCheck,
  ShieldAlert,
  Laptop,
  CheckCircle2,
  Copy,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  Plus,
  Trash2,
  FileSpreadsheet,
  Download,
  Terminal,
  PackageCheck,
  Cpu,
  Lock,
} from 'lucide-react';

export const LicenseManagerView: React.FC = () => {
  const { isOwner } = useAuth();
  const [activationStatus, setActivationStatus] = useState<ActivationStatus>(LicenseService.getActivationStatus());
  const [allLicenses, setAllLicenses] = useState<SoftwareLicense[]>([]);
  const [machineId, setMachineId] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Formulario de Activación de este equipo
  const [inputKey, setInputKey] = useState('');
  const [activationMessage, setActivationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulario Generador de Licencias (Solo Propietario)
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [tier, setTier] = useState<'personal' | 'professional' | 'enterprise'>('professional');
  const [maxInstallations, setMaxInstallations] = useState(1);
  const [durationDays, setDurationDays] = useState(365);
  const [newlyGenerated, setNewlyGenerated] = useState<SoftwareLicense | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setActivationStatus(LicenseService.getActivationStatus());
    setMachineId(LicenseService.getMachineId());
    setAllLicenses(LicenseService.getAllLicenses());
  };

  const handleActivateThisPC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    const res = LicenseService.activateWithKey(inputKey);
    if (res.success) {
      setActivationMessage({ type: 'success', text: res.message });
      setInputKey('');
      refreshData();
    } else {
      setActivationMessage({ type: 'error', text: res.message });
    }
  };

  const handleGenerateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerEmail.trim()) {
      alert('Ingresa nombre y correo electrónico del cliente.');
      return;
    }

    const lic = LicenseService.generateLicenseKey(
      customerName,
      customerEmail,
      tier,
      Number(maxInstallations),
      Number(durationDays)
    );

    setNewlyGenerated(lic);
    setCustomerName('');
    setCustomerEmail('');
    refreshData();
  };

  const handleRevoke = (licId: string) => {
    if (confirm('¿Estás seguro de REVOCAR esta clave? Las computadoras activadas con esta clave quedarán bloqueadas.')) {
      LicenseService.revokeLicense(licId);
      refreshData();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">
            SEGURIDAD Y DISTRIBUCIÓN DESKTOP
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mt-0.5">
            <Key className="w-6 h-6 text-amber-500" />
            <span>Licenciamiento y Activación de FinanzasPro</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestión criptográfica de licencias individuales, vinculación por Hardware ID (HWID) y autorización de instalación en Windows.
          </p>
        </div>

        <button
          onClick={refreshData}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar Estado</span>
        </button>
      </div>

      {/* Tarjeta de Estado de la Máquina Local */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Estado de Esta Instalación (PC Local)</h3>
                <p className="text-[11px] text-slate-400">Verificación de huella de hardware y clave activa</p>
              </div>
            </div>

            {activationStatus.is_activated ? (
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ACTIVADA</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>NO ACTIVADA</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-slate-500" />
                <span>Hardware ID (HWID de este equipo):</span>
              </span>
              <div className="flex items-center justify-between gap-2 mt-1">
                <code className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {machineId}
                </code>
                <button
                  onClick={() => copyToClipboard(machineId, 'hwid')}
                  className="p-1 hover:text-amber-500 transition"
                  title="Copiar HWID"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>Clave de Producto Vinculada:</span>
              </span>
              <div className="flex items-center justify-between gap-2 mt-1">
                <code className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 truncate">
                  {activationStatus.license_key || 'Sin licencia asignada'}
                </code>
                {activationStatus.license_key && (
                  <button
                    onClick={() => copyToClipboard(activationStatus.license_key || '', 'actkey')}
                    className="p-1 hover:text-amber-500 transition"
                    title="Copiar Clave"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Licenciatario Autorizado:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {activationStatus.customer_name || 'Desconocido'}
              </span>
              <span className="block text-[11px] text-slate-400 mt-0.5">
                Edición: {activationStatus.tier?.toUpperCase() || 'STANDARD'}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Vigencia y Expiración:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {activationStatus.expires_at ? new Date(activationStatus.expires_at).toLocaleDateString('es-HN') : 'Sin límite'}
              </span>
              <span className="block text-[11px] text-emerald-500 font-semibold mt-0.5">
                Validación Offline Habilitada
              </span>
            </div>
          </div>

          {/* Formulario para ingresar / renovar clave */}
          <form onSubmit={handleActivateThisPC} className="pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Ingresar nueva clave de activación (Ej: FPRO-PRO-1-...)"
              className="flex-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono tracking-wider focus:ring-2 focus:ring-amber-500 uppercase"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs shadow-md shadow-amber-500/20 transition whitespace-nowrap"
            >
              Activar Esta Máquina
            </button>
          </form>

          {activationMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                activationMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
              }`}
            >
              {activationMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{activationMessage.text}</span>
            </div>
          )}
        </div>

        {/* Guía de Empaquetado Windows */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <PackageCheck className="w-4 h-4" />
              <span>Instalador Windows (.exe)</span>
            </div>
            <h4 className="font-extrabold text-sm text-white">Distribución con Claves Únicas</h4>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              El instalador empaqueta la base de datos local SQLite/IndexedDB, motor de Excel y validación criptográfica de Machine ID. Cada usuario final recibe un archivo instalador <code>FinanzasPro-Setup.exe</code> y una clave individual generada en este panel.
            </p>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 space-y-1">
            <p className="text-slate-400 font-sans text-[10px] font-bold">Comando para compilar el instalador:</p>
            <div className="flex items-center justify-between">
              <code>npm run build:installer</code>
              <button
                onClick={() => copyToClipboard('npm run build:installer', 'buildcmd')}
                className="text-slate-400 hover:text-white"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-3">
            <span className="text-amber-400 font-semibold">Seguridad Criptográfica:</span> Al instalarse en la máquina del cliente, la aplicación calcula su HWID y comprueba que no supere el número de activaciones permitidas.
          </div>
        </div>
      </div>

      {/* Generador de Claves Únicas (Exclusivo Propietario) */}
      {isOwner && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">
                CONTROL MAESTRO DEL PROPIETARIO
              </span>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Generador de Claves de Activación para Clientes
              </h3>
              <p className="text-xs text-slate-400">
                Crea claves autorizadas con control de vencimiento y límite de computadoras simultáneas.
              </p>
            </div>
          </div>

          <form onSubmit={handleGenerateLicense} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre del Cliente:
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej: Juan Pérez / Empresa X"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Correo Electrónico:
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="cliente@dominio.hn"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Edición / Tier:
              </label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
              >
                <option value="personal">Personal (1 PC)</option>
                <option value="professional">Profesional (Multi-módulo)</option>
                <option value="enterprise">Empresarial / Ilimitada</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Máx. Computadoras:
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxInstallations}
                onChange={(e) => setMaxInstallations(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-center font-bold"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Emitir Clave</span>
              </button>
            </div>
          </form>

          {newlyGenerated && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block uppercase">
                ¡Clave Generada y Registrada Exitosamente!
              </span>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-amber-500/20">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 block">Clave de Activación para el Cliente:</span>
                  <code className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {newlyGenerated.license_key}
                  </code>
                </div>
                <button
                  onClick={() => copyToClipboard(newlyGenerated.license_key, 'newkey')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedKey === 'newkey' ? 'Copiada' : 'Copiar Clave'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Entrega esta clave al cliente junto con el instalador <code>FinanzasPro-Setup.exe</code>. Al abrir el programa, ingresará esta clave y se registrará automáticamente su Machine ID.
              </p>
            </div>
          )}

          {/* Tabla de Licencias Emitidas */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
              Registro Maestro de Licencias Emitidas ({allLicenses.length})
            </h4>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-3.5">Cliente</th>
                    <th className="py-3 px-3.5">Clave de Activación</th>
                    <th className="py-3 px-3.5">Edición</th>
                    <th className="py-3 px-3.5">Equipos Activos</th>
                    <th className="py-3 px-3.5">Expiración</th>
                    <th className="py-3 px-3.5">Estado</th>
                    <th className="py-3 px-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {allLicenses.map((lic) => (
                    <tr key={lic.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30">
                      <td className="py-3 px-3.5">
                        <span className="font-bold text-slate-900 dark:text-white block">{lic.customer_name}</span>
                        <span className="text-[11px] text-slate-400">{lic.customer_email}</span>
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1.5">
                          <code className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {lic.license_key}
                          </code>
                          <button
                            onClick={() => copyToClipboard(lic.license_key, lic.id)}
                            className="p-1 hover:text-amber-500 text-slate-400"
                            title="Copiar clave"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {lic.tier}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 font-mono">
                        <span className={lic.activations_count >= lic.max_installations ? 'text-amber-500 font-bold' : ''}>
                          {lic.activations_count} / {lic.max_installations} PC(s)
                        </span>
                      </td>

                      <td className="py-3 px-3.5 font-mono text-slate-500">
                        {new Date(lic.expires_at).toLocaleDateString('es-HN')}
                      </td>

                      <td className="py-3 px-3.5">
                        {lic.status === 'active' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                            ACTIVA
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                            REVOCADA
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 text-right">
                        {lic.status === 'active' ? (
                          <button
                            onClick={() => handleRevoke(lic.id)}
                            className="px-2.5 py-1 rounded-lg text-rose-500 hover:bg-rose-500/10 font-semibold text-[11px] transition"
                          >
                            Revocar
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Bloqueada</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
