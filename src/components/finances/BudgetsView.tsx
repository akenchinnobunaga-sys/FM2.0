import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../services/storage';
import { Budget } from '../../types/database';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  X,
  Save,
  Tag,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export const BudgetsView: React.FC = () => {
  const { currentSpace } = useAuth();
  const { currency, currencySymbol } = useCurrency();
  const [showModal, setShowModal] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [alertThreshold, setAlertThreshold] = useState(85);
  const [refreshKey, setRefreshKey] = useState(0);

  const state = localDB.getState();

  if (!currentSpace) {
    return <div className="p-8 text-center text-slate-500">Selecciona un espacio.</div>;
  }

  const spaceBudgets = state.budgets.filter((b) => b.space_id === currentSpace.id);
  const categories = state.categories.filter((c) => !c.space_id || c.space_id === currentSpace.id);
  const spaceTransactions = state.transactions.filter(
    (t) => t.space_id === currentSpace.id && t.type === 'expense'
  );

  const budgetsWithCalculation = spaceBudgets.map((b) => {
    const category = categories.find((c) => c.id === b.category_id);
    const spent = spaceTransactions
      .filter((t) => t.category_id === b.category_id)
      .reduce((acc, t) => acc + t.amount, 0);

    const percent = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    const remaining = Math.max(0, b.amount - spent);
    const isExceeded = spent > b.amount;
    const isNearLimit = percent >= b.alert_threshold_percent && !isExceeded;

    return {
      ...b,
      categoryName: category?.name || 'Categoría',
      spent,
      remaining,
      percent,
      isExceeded,
      isNearLimit,
    };
  });

  const totalBudgeted = spaceBudgets.reduce((acc, b) => acc + b.amount, 0);
  const totalSpentInBudgets = budgetsWithCalculation.reduce((acc, b) => acc + b.spent, 0);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(budgetAmount);
    if (!amount || amount <= 0 || !selectedCatId) {
      alert('Ingresa una categoría y un monto válido');
      return;
    }

    localDB.saveBudget({
      space_id: currentSpace.id,
      category_id: selectedCatId,
      period: 'monthly',
      amount,
      currency: currentSpace.currency || 'HNL',
      alert_threshold_percent: alertThreshold,
    });

    setBudgetAmount('');
    setShowModal(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Presupuestos Mensuales y Límites de Gasto
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total presupuestado: <strong>{currencySymbol} {totalBudgeted.toLocaleString()}</strong> | Gastado acumulado: <strong>{currencySymbol} {totalSpentInBudgets.toLocaleString()}</strong>
          </p>
        </div>

        <button
          onClick={() => {
            if (categories.length > 0 && !selectedCatId) {
              setSelectedCatId(categories[0].id);
            }
            setShowModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Configurar Presupuesto</span>
        </button>
      </div>

      {/* Grid de Presupuestos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgetsWithCalculation.map((b) => (
          <div
            key={b.id}
            className={`p-5 rounded-2xl border transition shadow-sm bg-white dark:bg-slate-800 flex flex-col justify-between ${
              b.isExceeded
                ? 'border-rose-400 dark:border-rose-800/80 bg-rose-50/10'
                : b.isNearLimit
                ? 'border-amber-400 dark:border-amber-800/80'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-emerald-500" />
                  {b.categoryName}
                </span>
                <span
                  className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                    b.isExceeded
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : b.isNearLimit
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {b.percent.toFixed(0)}%
                </span>
              </div>

              {/* Barra de Progreso */}
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full transition-all duration-300 ${
                    b.isExceeded
                      ? 'bg-rose-500'
                      : b.isNearLimit
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(b.percent, 100)}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-1">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Gastado Real</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {currencySymbol} {b.spent.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Límite Mensual</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {currencySymbol} {b.amount.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">
                {b.isExceeded ? 'Excedido por:' : 'Disponible:'}
              </span>
              <span
                className={`font-bold font-mono ${
                  b.isExceeded ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                L. {Math.abs(b.amount - b.spent).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Configurar Presupuesto */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Definir Presupuesto por Categoría
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Categoría a Presupuestar:
                </label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monto Máximo Mensual ({currencySymbol}):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="Ej: 5000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Umbral de Alerta Preventiva (%):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(Number(e.target.value))}
                    className="flex-1 accent-emerald-600"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-12 text-right">
                    {alertThreshold}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Guardar Presupuesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
