import React, { useState } from 'react';
import { isSupabaseConfigured, DESIGNATED_OWNER_EMAIL } from '../../config/supabase';
import {
  Database,
  Copy,
  Check,
  ShieldCheck,
  X,
  ExternalLink,
  Terminal,
  Server,
  FileCode,
} from 'lucide-react';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'sql' | 'edge_functions'>('status');

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  const handleCopySql = () => {
    // Código SQL resumido para el portapapeles
    const sqlText = `-- FINANZAS FAMILIARES PRO - MASTER SQL MIGRATION
-- Ver archivo completo en /supabase/migrations/20261018000001_master_financial_schema.sql
-- Ejecutar en Supabase SQL Editor para habilitar RLS, funciones y tablas`;

    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Integración con Supabase PostgreSQL y RLS
              </h3>
              <p className="text-xs text-slate-400">Arquitectura de persistencia y seguridad server-side</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-2 pt-3">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'status'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Estado del Backend
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Migración SQL Maestro (RLS)
          </button>
          <button
            onClick={() => setActiveTab('edge_functions')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'edge_functions'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Edge Functions & Despliegue
          </button>
        </div>

        {/* Tab 1: Estado */}
        {activeTab === 'status' && (
          <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Conexión Supabase Live:</span>
                {isConfigured ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                    Conectado a Instancia Remota
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold">
                    Motor Local DB Activo (Simulación 100% Funcional)
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Propietario Designado:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {DESIGNATED_OWNER_EMAIL}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Moneda Nativa:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">HNL (Lempira Hondureño)</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Política de Acceso:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Invitación Exclusiva (Registro Público Bloqueado)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200 space-y-2">
              <h4 className="font-bold text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span>Garantía de Aislamiento de Espacios (RLS)</span>
              </h4>
              <p className="text-[11px] leading-relaxed">
                El sistema aplica políticas de seguridad a nivel de filas (Row Level Security) en PostgreSQL. Las transacciones privadas de cada usuario solo son accesibles por su creador. Ni siquiera el Propietario Global tiene acceso a ver los registros privados de otros miembros sin haber sido explícitamente invitado a su espacio.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: SQL */}
        {activeTab === 'sql' && (
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Archivo: /supabase/migrations/20261018000001_master_financial_schema.sql
              </span>
              <button
                onClick={handleCopySql}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copiado' : 'Copiar Referencia'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-72 border border-slate-800 leading-relaxed">
{`-- 1. TABLA PROFILES CON CONTROL DE SUSPENSIÓN Y ROL
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  global_role global_user_role NOT NULL DEFAULT 'user',
  status user_account_status NOT NULL DEFAULT 'active',
  suspended_at TIMESTAMPTZ,
  suspended_by UUID REFERENCES auth.users(id),
  suspension_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. POLÍTICA RLS PARA AISLAMIENTO ESTRICTO DE TRANSACCIONES
CREATE POLICY "transactions_read_policy" ON public.transactions
  FOR SELECT USING (
    NOT public.is_account_suspended(auth.uid())
    AND (
      (user_id = auth.uid())
      OR (public.is_space_member(space_id, auth.uid()))
    )
  );

-- 3. PROVISIÓN DEL PROPIETARIO DESIGNADO:
-- akenchinnobunaga@gmail.com`}
            </pre>
          </div>
        )}

        {/* Tab 3: Edge Functions */}
        {activeTab === 'edge_functions' && (
          <div className="flex-1 overflow-y-auto py-4 space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">
              Comandos para Despliegue en Supabase CLI:
            </h4>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 flex items-center justify-between">
                <code>supabase functions deploy admin-actions</code>
                <span className="text-[10px] text-emerald-400">Suspensión y Auditoría</span>
              </div>
              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 flex items-center justify-between">
                <code>supabase functions deploy invite-user</code>
                <span className="text-[10px] text-emerald-400">Tokens Criptográficos</span>
              </div>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
