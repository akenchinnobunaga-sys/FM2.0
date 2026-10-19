import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../services/storage';
import { SavingGoal } from '../../types/database';
import {
  PiggyBank,
  Plus,
  CheckCircle2,
  Calendar,
  X,
  Target,
  ArrowUpRight,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export const SavingsView: React.FC = () => {
  const { currentSpace, currentUser } = useAuth();
  const { currency, currencySymbol } = useCurrency();
  const [showAddModal, setShowAddModal] = useState(false);
  const [depositGoal, setDepositGoal] = useState<SavingGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Form nueva meta
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState('#10b981');

  const state = localDB.getState();

  if (!currentSpace || !currentUser) {
    return <div className="p-8 text-center text-slate-500">Selecciona un espacio.</div>;
  }

  const savingGoals = state.savingGoals.filter((g) => g.space_id === currentSpace.id);

  const totalSaved = savingGoals.reduce((acc, g) => acc + g.current_amount, 0);
  const totalTarget = savingGoals.reduce((acc, g) => acc + g.target_amount, 0);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    const initial = parseFloat(initialAmount) || 0;
    if (!target || target <= 0 || !name.trim()) {
      alert('Ingresa un nombre y monto meta válido');
      return;
    }

    localDB.addSavingGoal({
      space_id: currentSpace.id,
      user_id: currentUser.id,
      name: name.trim(),
      target_amount: target,
      current_amount: initial,
      currency: currentSpace.currency || 'HNL',
      target_date: targetDate || undefined,
      color,
      is_completed: initial >= target,
    });

    setName('');
    setTargetAmount('');
    setInitialAmount('');
    setTargetDate('');
    setShowAddModal(false);
    setRefreshKey((k) => k + 1);
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal) return;
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      alert('Ingresa un monto válido.');
      return;
    }

    localDB.depositToSavingGoal(depositGoal.id, amount);
    setDepositGoal(null);
    setDepositAmount('');
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Metas y Fondos de Ahorro
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ahorro acumulado: <strong>{currencySymbol} {totalSaved.toLocaleString()}</strong> de una meta combinada de <strong>{currencySymbol} {totalTarget.toLocaleString()}</strong>
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Meta de Ahorro</span>
        </button>
      </div>

      {/* Grid de Metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savingGoals.map((goal) => {
          const percent = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
          return (
            <div
              key={goal.id}
              className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: goal.color }}
                    />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {goal.name}
                    </h3>
                  </div>
                  {goal.is_completed && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Completada
                    </span>
                  )}
                </div>

                <div className="my-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {currencySymbol} {goal.current_amount.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-slate-400 font-mono">
                      Meta: {currencySymbol} {goal.target_amount.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-right font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {percent.toFixed(1)}% Alcanzado
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 mt-2 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {goal.target_date ? new Date(goal.target_date).toLocaleDateString('es-HN') : 'Sin fecha tope'}
                </span>

                {!goal.is_completed && (
                  <button
                    onClick={() => setDepositGoal(goal)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Aportar</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nueva Meta */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Definir Nueva Meta de Ahorro
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la Meta:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Fondo de Emergencia, Vacaciones, Matrícula..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Monto Objetivo ({currencySymbol}):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ahorro Inicial ({currencySymbol}):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha Límite Estimada:
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Crear Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Aportar a Meta */}
      {depositGoal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Aportar a Meta de Ahorro
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Meta: <strong>{depositGoal.name}</strong>
              <br />
              Actual: {currencySymbol} {depositGoal.current_amount.toLocaleString()} de {currencySymbol} {depositGoal.target_amount.toLocaleString()}
            </p>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monto a Aportar ({currencySymbol}):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setDepositGoal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Confirmar Aporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
