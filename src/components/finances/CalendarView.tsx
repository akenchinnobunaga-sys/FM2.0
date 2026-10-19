import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../services/storage';
import { CalendarReminder } from '../../types/database';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Car,
  Receipt,
  PiggyBank,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export const CalendarView: React.FC = () => {
  const { currentSpace, currentUser } = useAuth();
  const { currency, currencySymbol, formatAmount } = useCurrency();
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<any>('bill');
  const [notes, setNotes] = useState('');

  const state = localDB.getState();

  if (!currentSpace || !currentUser) {
    return <div className="p-8 text-center text-slate-500">Selecciona un espacio.</div>;
  }

  const reminders = state.reminders.filter((r) => r.space_id === currentSpace.id);

  // Ordenar por fecha
  const sortedReminders = [...reminders].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const pendingReminders = sortedReminders.filter((r) => !r.is_completed);
  const completedReminders = sortedReminders.filter((r) => r.is_completed);

  const handleToggle = (id: string) => {
    localDB.toggleReminder(id);
    setRefreshKey((k) => k + 1);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      alert('Ingresa título y fecha');
      return;
    }

    localDB.addReminder({
      space_id: currentSpace.id,
      user_id: currentUser.id,
      title: title.trim(),
      date,
      amount: amount ? parseFloat(amount) : undefined,
      currency: currentSpace.currency || 'HNL',
      type,
      is_completed: false,
      notes: notes.trim() || undefined,
    });

    setTitle('');
    setAmount('');
    setNotes('');
    setShowAddModal(false);
    setRefreshKey((k) => k + 1);
  };

  const getReminderIcon = (t: string) => {
    switch (t) {
      case 'bill':
        return <Receipt className="w-4 h-4 text-rose-500" />;
      case 'moto_service':
        return <Car className="w-4 h-4 text-amber-500" />;
      case 'debt_due':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <CalendarDays className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Calendario Financiero y Vencimientos</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control de pagos programados, facturas de servicios y fechas límite.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Recordatorio</span>
        </button>
      </div>

      {/* Lista de Pendientes */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Próximos Vencimientos ({pendingReminders.length})</span>
        </h3>

        {pendingReminders.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">
            No tienes pagos o servicios pendientes programados en este espacio.
          </p>
        ) : (
          <div className="space-y-2">
            {pendingReminders.map((rem) => {
              const isOverdue = new Date(rem.date) < new Date(new Date().toDateString());
              return (
                <div
                  key={rem.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                    isOverdue
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggle(rem.id)}
                      className="w-5 h-5 rounded-lg border border-slate-300 dark:border-slate-600 flex items-center justify-center hover:border-emerald-500 transition"
                    >
                      {rem.is_completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-md bg-white dark:bg-slate-800 shadow-xs">
                          {getReminderIcon(rem.type)}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {rem.title}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] bg-rose-500 text-white font-extrabold px-1.5 py-0.2 rounded">
                            Vencido
                          </span>
                        )}
                      </div>
                      {rem.notes && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{rem.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    {rem.amount && (
                      <span className="text-xs font-bold font-mono text-slate-900 dark:text-white block">
                        {formatAmount(rem.amount)}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(rem.date).toLocaleDateString('es-HN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista de Completados */}
      {completedReminders.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Liquidados o Realizados ({completedReminders.length})</span>
          </h3>

          <div className="space-y-2 opacity-75">
            {completedReminders.map((rem) => (
              <div
                key={rem.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(rem.id)}
                    className="w-5 h-5 rounded-lg bg-emerald-500 text-white flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="line-through text-slate-400 font-medium">
                    {rem.title}
                  </span>
                </div>
                {rem.amount && (
                  <span className="text-[11px] font-mono text-slate-400 line-through">
                    {formatAmount(rem.amount)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Nuevo Recordatorio */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Programar Recordatorio o Factura
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título del Recordatorio:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Pago de Internet, Cuota de préstamo, Mantenimiento..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha de Vencimiento:
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Monto Estimado ({currencySymbol} Opcional):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo:
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                >
                  <option value="bill">Factura de Servicio Público / Privado</option>
                  <option value="debt_due">Vencimiento de Deuda / Préstamo</option>
                  <option value="moto_service">Mantenimiento de Vehículo</option>
                  <option value="custom">Otro Compromiso</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notas / Detalles:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Número de cliente, sucursal o recordatorio..."
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
                  Programar Recordatorio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
