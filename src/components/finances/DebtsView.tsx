import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../services/storage';
import { Debt, DebtType } from '../../types/database';
import {
  HandCoins,
  Plus,
  CheckCircle2,
  AlertCircle,
  Calendar,
  X,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export const DebtsView: React.FC = () => {
  const { currentSpace, currentUser } = useAuth();
  const { currency, currencySymbol } = useCurrency();
  const [showAddModal, setShowAddModal] = useState(false);
  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Form nueva deuda
  const [debtType, setDebtType] = useState<DebtType>('i_owe');
  const [counterparty, setCounterparty] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const state = localDB.getState();

  if (!currentSpace || !currentUser) {
    return <div className="p-8 text-center text-slate-500">Selecciona un espacio.</div>;
  }

  const spaceDebts = state.debts.filter((d) => d.space_id === currentSpace.id);

  const debtsIOwe = spaceDebts.filter((d) => d.type === 'i_owe');
  const debtsTheyOweMe = spaceDebts.filter((d) => d.type === 'they_owe_me');

  const totalIOwe = debtsIOwe.filter((d) => !d.is_settled).reduce((acc, d) => acc + d.remaining_amount, 0);
  const totalTheyOwe = debtsTheyOweMe.filter((d) => !d.is_settled).reduce((acc, d) => acc + d.remaining_amount, 0);

  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(totalAmount);
    if (!amount || amount <= 0 || !counterparty.trim()) {
      alert('Ingresa una contraparte y monto válido');
      return;
    }

    localDB.addDebt({
      space_id: currentSpace.id,
      user_id: currentUser.id,
      type: debtType,
      counterparty: counterparty.trim(),
      total_amount: amount,
      remaining_amount: amount,
      interest_rate: 0,
      due_date: dueDate || undefined,
      currency: currentSpace.currency || 'HNL',
      notes: notes.trim() || undefined,
      is_settled: false,
    });

    setCounterparty('');
    setTotalAmount('');
    setDueDate('');
    setNotes('');
    setShowAddModal(false);
    setRefreshKey((k) => k + 1);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDebt) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      alert('Ingresa un monto válido.');
      return;
    }

    localDB.recordDebtPayment(paymentDebt.id, amount);
    setPaymentDebt(null);
    setPaymentAmount('');
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Control de Deudas y Préstamos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Seguimiento de acreedores, deudores y registro de abonos parciales o totales.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Compromiso</span>
        </button>
      </div>

      {/* Tarjetas KPI de Deudas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>Total que Debo a Terceros</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {currencySymbol} {totalIOwe.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {debtsIOwe.filter((d) => !d.is_settled).length} compromisos pendientes de pago
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>Total que me Deben a Mí</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {currencySymbol} {totalTheyOwe.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {debtsTheyOweMe.filter((d) => !d.is_settled).length} préstamos otorgados por cobrar
          </div>
        </div>
      </div>

      {/* Lista de Deudas */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Contraparte</th>
                <th className="py-3 px-4">Monto Original</th>
                <th className="py-3 px-4">Saldo Pendiente</th>
                <th className="py-3 px-4">Vencimiento</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {spaceDebts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No hay registros de deudas o préstamos activos.
                  </td>
                </tr>
              ) : (
                spaceDebts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {d.type === 'i_owe' ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                          Yo Debo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                          Me Deben
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {d.counterparty}
                      </div>
                      {d.notes && (
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{d.notes}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {currencySymbol} {d.total_amount.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-white">
                      {currencySymbol} {d.remaining_amount.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {d.due_date ? new Date(d.due_date).toLocaleDateString('es-HN') : 'Sin fecha fija'}
                    </td>

                    <td className="py-3.5 px-4">
                      {d.is_settled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Liquidada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" /> Pendiente
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {!d.is_settled && (
                        <button
                          onClick={() => setPaymentDebt(d)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-semibold transition"
                        >
                          Abonar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Deuda */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Registrar Compromiso de Deuda o Préstamo
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDebt} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDebtType('i_owe')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                    debtType === 'i_owe'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Yo Debo (Pasivo)
                </button>
                <button
                  type="button"
                  onClick={() => setDebtType('they_owe_me')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                    debtType === 'they_owe_me'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Me Deben (Activo)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contraparte (Persona o Empresa):
                </label>
                <input
                  type="text"
                  required
                  value={counterparty}
                  onChange={(e) => setCounterparty(e.target.value)}
                  placeholder="Ej: Taller Mecánico, Juan Pérez, Tarjeta..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Monto Total ({currencySymbol}):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha de Vencimiento:
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notas explicativas:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: 2 cuotas quincenales, sin intereses..."
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
                  Guardar Compromiso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Abonar a Deuda */}
      {paymentDebt && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Registrar Abono
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Contraparte: <strong>{paymentDebt.counterparty}</strong>
              <br />
              Saldo pendiente actual: <strong>{currencySymbol} {paymentDebt.remaining_amount.toLocaleString()}</strong>
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monto del Abono ({currencySymbol}):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={paymentDebt.remaining_amount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setPaymentDebt(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
