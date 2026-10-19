import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../services/storage';
import { Transaction, TransactionType } from '../../types/database';
import { TransactionModal } from './TransactionModal';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  TrendingDown,
  TrendingUp,
  ArrowLeftRight,
  Download,
  Tag,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export const TransactionList: React.FC = () => {
  const { currentSpace } = useAuth();
  const { currency, currencySymbol } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const state = localDB.getState();

  if (!currentSpace) {
    return <div className="p-8 text-center text-slate-500">Selecciona un espacio financiero.</div>;
  }

  const transactions = state.transactions.filter((t) => t.space_id === currentSpace.id);
  const categories = state.categories.filter((c) => !c.space_id || c.space_id === currentSpace.id);
  const accounts = state.accounts.filter((a) => a.space_id === currentSpace.id);

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || t.category_id === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  const handleDelete = (id: string, desc: string) => {
    if (confirm(`¿Eliminar la transacción "${desc}"? El saldo de la cuenta será recalculado automáticamente.`)) {
      localDB.deleteTransaction(id);
      setRefreshKey((k) => k + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Encabezado y Acción */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Transacciones y Movimientos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registro detallado de ingresos, egresos y transferencias en {currentSpace.name}.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Transacción</span>
        </button>
      </div>

      {/* Controles de Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por concepto o etiqueta..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="all">Todos los tipos (Ingresos, Gastos, Transferencias)</option>
            <option value="expense">Solo Gastos</option>
            <option value="income">Solo Ingresos</option>
            <option value="transfer">Solo Transferencias</option>
          </select>
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="all">Todas las Categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Descripción y Etiquetas</th>
                <th className="py-3 px-4">Cuenta / Destino</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-right">Monto (HNL)</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No se encontraron transacciones con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => {
                  const account = accounts.find((a) => a.id === t.account_id);
                  const destAccount = accounts.find((a) => a.id === t.destination_account_id);
                  const category = categories.find((c) => c.id === t.category_id);
                  const isIncome = t.type === 'income';
                  const isExpense = t.type === 'expense';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {t.date}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {isIncome ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                            <TrendingUp className="w-3 h-3" /> Ingreso
                          </span>
                        ) : isExpense ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                            <TrendingDown className="w-3 h-3" /> Gasto
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                            <ArrowLeftRight className="w-3 h-3" /> Transferencia
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {t.description}
                        </div>
                        {t.tags && t.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {t.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-[9px] text-slate-500 font-mono"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-[11px]">
                        {account?.name || 'Cuenta'}
                        {destAccount && (
                          <span className="block text-[10px] text-blue-500 font-medium">
                            ➔ {destAccount.name}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px]">
                          {category?.name || (t.type === 'transfer' ? 'Transferencia' : 'Sin categoría')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-bold font-mono whitespace-nowrap">
                        <span
                          className={
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isExpense
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }
                        >
                          {isIncome ? '+' : isExpense ? '-' : ''} {currencySymbol}{' '}
                          {t.amount.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(t.id, t.description)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Eliminar transacción y revertir saldo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Transacción */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransactionSaved={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
};
