import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../services/storage';
import { TransactionType } from '../../types/database';
import { X, Save, ArrowLeftRight, TrendingDown, TrendingUp } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionSaved: () => void;
  initialData?: {
    type?: TransactionType;
    amount?: number;
    description?: string;
    category_id?: string;
    account_id?: string;
  };
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onTransactionSaved,
  initialData,
}) => {
  const { currentSpace, currentUser } = useAuth();
  const { currency, currencySymbol } = useCurrency();
  const state = localDB.getState();

  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [amount, setAmount] = useState<string>(initialData?.amount ? String(initialData.amount) : '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(initialData?.account_id || '');
  const [destAccountId, setDestAccountId] = useState('');
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
  const [tags, setTags] = useState('');

  if (!isOpen || !currentSpace || !currentUser) return null;

  const accounts = state.accounts.filter((a) => a.space_id === currentSpace.id && !a.is_archived);
  const categories = state.categories.filter((c) => !c.space_id || c.space_id === currentSpace.id);

  // Seleccionar primera cuenta si no hay ninguna preseleccionada
  const activeAccountId = accountId || (accounts[0]?.id ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      alert('Ingresa un monto válido mayor a 0');
      return;
    }

    if (!activeAccountId) {
      alert('Debes seleccionar una cuenta financiera');
      return;
    }

    if (type === 'transfer') {
      if (!destAccountId) {
        alert('Debes seleccionar una cuenta de destino para la transferencia');
        return;
      }
      if (activeAccountId === destAccountId) {
        alert('La cuenta origen y la cuenta destino no pueden ser la misma');
        return;
      }
    }

    localDB.addTransaction({
      space_id: currentSpace.id,
      user_id: currentUser.id,
      account_id: activeAccountId,
      destination_account_id: type === 'transfer' ? destAccountId : null,
      category_id: type === 'transfer' ? null : categoryId || null,
      type,
      amount: numAmount,
      currency: currency || currentSpace.currency || 'HNL',
      exchange_rate: 1.0,
      date,
      description: description.trim() || (type === 'transfer' ? 'Transferencia interna' : 'Movimiento financiero'),
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    });

    onTransactionSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Registrar Movimiento Financiero
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Tipo (Gasto, Ingreso, Transferencia) */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              type === 'expense'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Gasto</span>
          </button>

          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Ingreso</span>
          </button>

          <button
            type="button"
            onClick={() => setType('transfer')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              type === 'transfer'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Transferencia</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Monto y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Monto ({currency}):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fecha del movimiento:
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Cuentas Origen y Destino */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {type === 'transfer' ? 'Cuenta Origen (Retiro):' : 'Cuenta de Pago / Depósito:'}
              </label>
              <select
                value={activeAccountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({currencySymbol} {acc.balance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cuenta Destino (Ingreso):
                </label>
                <select
                  value={destAccountId}
                  onChange={(e) => setDestAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Seleccionar cuenta destino...</option>
                  {accounts
                    .filter((a) => a.id !== activeAccountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({currencySymbol} {acc.balance.toLocaleString()})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Categoría:
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Seleccionar categoría...</option>
                  {categories
                    .filter((c) => (type === 'income' ? c.type === 'income' : c.type === 'expense'))
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descripción o concepto:
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Combustible moto, supermercado, salario quincenal..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Etiquetas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Etiquetas (separadas por comas):
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="moto, combustible, urgente, quincena"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Transacción</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
