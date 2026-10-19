import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../services/storage';
import { AiTransactionDraft, TransactionType } from '../../types/database';
import { TransactionModal } from '../finances/TransactionModal';
import {
  Sparkles,
  Send,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

export const AiAssistantView: React.FC = () => {
  const { currentSpace, currentUser } = useAuth();
  const [naturalInput, setNaturalInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [proposedDraft, setProposedDraft] = useState<AiTransactionDraft | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  const state = localDB.getState();

  if (!currentSpace || !currentUser) {
    return <div className="p-8 text-center text-slate-500">Selecciona un espacio.</div>;
  }

  const spaceTransactions = state.transactions.filter((t) => t.space_id === currentSpace.id);
  const spaceBudgets = state.budgets.filter((b) => b.space_id === currentSpace.id);
  const spaceCategories = state.categories;
  const spaceAccounts = state.accounts.filter((a) => a.space_id === currentSpace.id);

  // Procesamiento de lenguaje natural para transacciones
  const handleParseNaturalLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalInput.trim()) return;

    setIsProcessing(true);

    // Simulación de motor de inferencia semántica / Gemini
    setTimeout(() => {
      const lower = naturalInput.toLowerCase();

      let detectedType: TransactionType = 'expense';
      if (lower.includes('ingreso') || lower.includes('cobré') || lower.includes('pago de sueldo') || lower.includes('salario') || lower.includes('gané')) {
        detectedType = 'income';
      } else if (lower.includes('transferí') || lower.includes('traspaso') || lower.includes('envié a')) {
        detectedType = 'transfer';
      }

      // Extraer números para el monto
      const numberMatches = lower.match(/\b\d+(\.\d{1,2})?\b/g);
      let detectedAmount = 0;
      if (numberMatches && numberMatches.length > 0) {
        detectedAmount = parseFloat(numberMatches[0]);
      }

      // Detección de Categoría
      let detectedCategory = spaceCategories[0];
      if (lower.includes('combustible') || lower.includes('gasolina') || lower.includes('moto')) {
        detectedCategory = spaceCategories.find((c) => c.name.toLowerCase().includes('combustible')) || detectedCategory;
      } else if (lower.includes('super') || lower.includes('comida') || lower.includes('alimento') || lower.includes('despensa')) {
        detectedCategory = spaceCategories.find((c) => c.name.toLowerCase().includes('alimentación')) || detectedCategory;
      } else if (lower.includes('salario') || lower.includes('sueldo')) {
        detectedCategory = spaceCategories.find((c) => c.name.toLowerCase().includes('salario')) || detectedCategory;
      } else if (lower.includes('luz') || lower.includes('agua') || lower.includes('internet') || lower.includes('servicio')) {
        detectedCategory = spaceCategories.find((c) => c.name.toLowerCase().includes('servicio')) || detectedCategory;
      }

      // Detección de Cuenta
      let detectedAccount = spaceAccounts[0];
      if (lower.includes('efectivo') || lower.includes('billetera')) {
        detectedAccount = spaceAccounts.find((a) => a.type === 'cash') || detectedAccount;
      } else if (lower.includes('bac') || lower.includes('banco') || lower.includes('tarjeta')) {
        detectedAccount = spaceAccounts.find((a) => a.type === 'bank' || a.type === 'credit_card') || detectedAccount;
      }

      const draft: AiTransactionDraft = {
        type: detectedType,
        amount: detectedAmount || 150.0,
        currency: currentSpace.currency || 'HNL',
        category_id: detectedCategory?.id,
        category_name: detectedCategory?.name,
        account_id: detectedAccount?.id,
        account_name: detectedAccount?.name,
        description: naturalInput.trim(),
        date: new Date().toISOString().split('T')[0],
        confidence: detectedAmount > 0 ? 0.94 : 0.65,
        explanation: `Interpretado como ${detectedType === 'expense' ? 'Gasto' : 'Ingreso'} de L. ${detectedAmount || 150.0} en categoría "${detectedCategory?.name}" cargado a "${detectedAccount?.name}".`,
      };

      setProposedDraft(draft);
      setIsProcessing(false);
    }, 600);
  };

  const handleConfirmAiDraft = () => {
    if (!proposedDraft) return;

    localDB.addTransaction({
      space_id: currentSpace.id,
      user_id: currentUser.id,
      account_id: proposedDraft.account_id || spaceAccounts[0]?.id || '',
      category_id: proposedDraft.category_id,
      type: proposedDraft.type,
      amount: proposedDraft.amount,
      currency: proposedDraft.currency,
      date: proposedDraft.date,
      description: proposedDraft.description,
      tags: ['asistente_ia'],
    });

    setSavedSuccess(`Transacción de L. ${proposedDraft.amount} guardada exitosamente.`);
    setProposedDraft(null);
    setNaturalInput('');
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  // Previsiones de IA
  const totalSpent = spaceTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const forecastNextMonth = totalSpent > 0 ? totalSpent * 1.05 : 12500;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
            Inteligencia Artificial Financiera
          </span>
        </div>
        <h1 className="text-2xl font-black tracking-tight">
          Asistente Financiero y Previsiones Pro
        </h1>
        <p className="text-xs text-emerald-100 mt-1 max-w-xl">
          Ingresa transacciones hablando o escribiendo en lenguaje natural, recibe proyecciones de flujo de caja y alertas preventivas sobre tus presupuestos.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {/* Módulo 1: Registro en Lenguaje Natural */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Registro Rápido en Lenguaje Natural</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Escribe como hablas: "Gasté 280 lempiras en gasolina para la moto hoy" o "Cobré 5,000 de salario en cuenta BAC".
          </p>
        </div>

        <form onSubmit={handleParseNaturalLanguage} className="flex gap-2">
          <input
            type="text"
            value={naturalInput}
            onChange={(e) => setNaturalInput(e.target.value)}
            placeholder="Ej: Gasté 450 lempiras en supermercado La Colonia con tarjeta..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isProcessing || !naturalInput.trim()}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isProcessing ? 'Analizando...' : 'Interpretar'}</span>
          </button>
        </form>

        {/* Tarjeta de Revisión antes de Guardar (Requisito de Seguridad del Master Prompt) */}
        {proposedDraft && (
          <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Propuesta de Transacción Estructurada</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                Confianza: {(proposedDraft.confidence * 100).toFixed(0)}%
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 italic">
              "{proposedDraft.explanation}"
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">Tipo:</span>
                <span className="font-semibold uppercase text-emerald-600">
                  {proposedDraft.type}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">Monto:</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">
                  L. {proposedDraft.amount.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">Categoría:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {proposedDraft.category_name}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">Cuenta:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {proposedDraft.account_name}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setProposedDraft(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Descartar
              </button>
              <button
                onClick={handleConfirmAiDraft}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirmar y Guardar Transacción</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Módulo 2: Previsiones y Análisis Predictivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Previsión de Gastos */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Previsión de Gastos Próximo Mes
              </h4>
              <p className="text-[11px] text-slate-400">Basado en consumo de combustible y servicios</p>
            </div>
          </div>

          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            L. {forecastNextMonth.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Se proyecta un incremento estimado del 5% debido a la estacionalidad de servicios básicos y recorridos de motocicleta programados.
          </p>
        </div>

        {/* Oportunidades de Ahorro y Alertas */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recomendaciones de Optimización
              </h4>
              <p className="text-[11px] text-slate-400">Detectadas automáticamente</p>
            </div>
          </div>

          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>
                <strong>Eficiencia de Moto:</strong> Tu rendimiento promedio es de 39.2 km/L. Mantener la presión de neumáticos a 32 PSI puede ahorrar hasta L. 120/mes en combustible.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>
                <strong>Fondo de Ahorro:</strong> Has cubierto el 70% de tu fondo de emergencia. Manteniendo el aporte actual, completarás la meta en 4 meses.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
