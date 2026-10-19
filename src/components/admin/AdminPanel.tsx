import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserDirectory } from './UserDirectory';
import { InvitationCenter } from './InvitationCenter';
import { AuditLogViewer } from './AuditLogViewer';
import { GlobalSettings } from './GlobalSettings';
import { LicenseManagerView } from '../licensing/LicenseManagerView';
import { ApprovalsAndCodesManager } from './ApprovalsAndCodesManager';
import { localDB } from '../../services/storage';
import {
  ShieldCheck,
  Users,
  UserPlus,
  History,
  Sliders,
  Lock,
  Key,
  KeyRound,
  UserCheck,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { isOwner } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState<
    'users' | 'approvals_codes' | 'invitations' | 'audit' | 'settings' | 'licenses'
  >('users');

  const pendingRequests = (localDB.getAccessRequests() || []).filter((r) => r.status === 'pending').length;

  if (!isOwner) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center bg-white dark:bg-slate-800 rounded-2xl border border-rose-500/20 shadow-xl mt-12">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Acceso Restringido</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
          Esta consola está estrictamente restringida al <strong>Propietario Global</strong> del sistema. Ningún usuario regular o administrador de espacio tiene autorización para acceder.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Zona Exclusiva del Propietario (akenchinnobunaga@gmail.com)</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Panel de Administración Global
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestión centralizada de identidades, asistencia de contraseñas, aprobación de solicitudes, códigos de activación y auditoría.
          </p>
        </div>
      </div>

      {/* Tabs Superiores */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-1 sm:space-x-2 overflow-x-auto">
        <button
          onClick={() => setActiveAdminTab('users')}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-semibold text-xs transition whitespace-nowrap ${
            activeAdminTab === 'users'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Directorio y Contraseñas</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('approvals_codes')}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-semibold text-xs transition whitespace-nowrap ${
            activeAdminTab === 'approvals_codes'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Códigos y Aprobaciones</span>
          {pendingRequests > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
              {pendingRequests}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveAdminTab('invitations')}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-semibold text-xs transition whitespace-nowrap ${
            activeAdminTab === 'invitations'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Centro de Invitaciones</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('audit')}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-semibold text-xs transition whitespace-nowrap ${
            activeAdminTab === 'audit'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Registro de Auditoría</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('settings')}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-semibold text-xs transition whitespace-nowrap ${
            activeAdminTab === 'settings'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Políticas y Seguridad</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('licenses')}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-semibold text-xs transition whitespace-nowrap ${
            activeAdminTab === 'licenses'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Licencias Desktop</span>
        </button>
      </div>

      {/* Contenido de la Tab Activa */}
      {activeAdminTab === 'users' && <UserDirectory />}
      {activeAdminTab === 'approvals_codes' && <ApprovalsAndCodesManager />}
      {activeAdminTab === 'invitations' && <InvitationCenter />}
      {activeAdminTab === 'audit' && <AuditLogViewer />}
      {activeAdminTab === 'settings' && <GlobalSettings />}
      {activeAdminTab === 'licenses' && <LicenseManagerView />}
    </div>
  );
};
