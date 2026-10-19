import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../services/storage';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Plus,
  Car,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

interface DashboardOverviewProps {
  onNavigateToTab: (tab: any) => void;
  onOpenNewTransaction: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigateToTab,
  onOpenNewTransaction,
}) => {
  const { currentSpace, currentUser } = useAuth();
  const { currency, currencySymbol, currencyName, formatAmount } = useCurrency();
  const state = localDB.getState();

  if (!currentSpace) {
    return (
      <div className="p-8 text-center text-slate-500">
        No se encontró un espacio financiero activo.
      </div>
    );
  }

  // Filtrar transacciones del espacio actual
  const spaceTransactions = state.transactions.filter((t) => t.space_id === currentSpace.id);
  const spaceAccounts = state.accounts.filter((a) => a.space_id === currentSpace.id && !a.is_archived);
  const spaceBudgets = state.budgets.filter((b) => b.space_id === currentSpace.id);
  const spaceDebts = state.debts.filter((d) => d.space_id === currentSpace.id && !d.is_settled);
  const spaceSavings = state.savingGoals.filter((s) => s.space_id === currentSpace.id);
  const spaceWorkHours = state.workHours.filter((w) => w.space_id === currentSpace.id);
  const spaceFuel = state.fuelRecords.filter((m) => m.space_id === currentSpace.id);

  // Cálculos financieros
  const totalIncome = spaceTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = spaceTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netCashFlow = totalIncome - totalExpense;

  const totalBalance = spaceAccounts.reduce((acc, a) => acc + a.balance, 0);

  // Presupuestos con cálculo de gasto real
  const budgetsWithSpending = spaceBudgets.map((b) => {
    const category = state.categories.find((c) => c.id === b.category_id);
    const spent = spaceTransactions
      .filter((t) => t.category_id === b.category_id && t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    return {
      ...b,
      categoryName: category?.name || 'Categoría',
      spent,
      percentage,
      isAlert: percentage >= b.alert_threshold_percent,
    };
  });

  const alertBudgets = budgetsWithSpending.filter((b) => b.isAlert);

  // Totales de horas extras
  const totalOvertimePay = spaceWorkHours.reduce((acc, w) => acc + (w.total_pay - w.regular_hours * w.hourly_rate), 0);

  // Datos vehículo / combustible
  const latestFuel = spaceFuel[0];

  return (
    <div className="space-y-6">
      {/* Banner de Bienvenida y Acciones Rápidas */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            🔒 Espacio Financiero Personal
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Resumen General: {currentSpace.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Valores consolidados en {currency} ({currencyName}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewTransaction}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Transacción</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI de Primer Nivel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Total en Cuentas */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Saldo en Cuentas</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatAmount(totalBalance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {spaceAccounts.length} cuentas activas en este espacio
          </div>
        </div>

        {/* Ingresos del Periodo */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Ingresos Registrados</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            +{formatAmount(totalIncome)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Salarios, horas extras y aportes
          </div>
        </div>

        {/* Gastos del Periodo */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Gastos Registrados</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
            -{formatAmount(totalExpense)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Despensa, servicios, vehículo y otros
          </div>
        </div>

        {/* Flujo Neto */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Flujo de Caja Neto</span>
            <div className={`p-2 rounded-xl ${netCashFlow >= 0 ? 'bg-teal-500/10 text-teal-500' : 'bg-amber-500/10 text-amber-500'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black tracking-tight ${netCashFlow >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600'}`}>
            {netCashFlow >= 0 ? '+' : ''}{formatAmount(netCashFlow)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {netCashFlow >= 0 ? 'Superávit en el periodo' : 'Déficit temporal detectado'}
          </div>
        </div>
      </div>

      {/* Alertas Críticas de Presupuesto (si superan el umbral) */}
      {alertBudgets.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Atención: Presupuestos Cercanos o Sobre el Límite</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {alertBudgets.map((b) => (
              <div key={b.id} className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-xl border border-amber-500/30 text-xs">
                <div className="flex justify-between font-semibold mb-1">
                  <span>{b.categoryName}</span>
                  <span className="font-bold text-rose-600">{b.percentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${b.percentage >= 100 ? 'bg-rose-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(b.percentage, 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
                  <span>Gastado: {formatAmount(b.spent)}</span>
                  <span>Tope: {formatAmount(b.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fila Secundaria: Módulos Prácticos (Horas Extras, Vehículo y Deudas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tarjeta Horas Extras */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Horas Laborales y Extras</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">
              {formatAmount(totalOvertimePay)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Ingreso acumulado por horas suplementarias (50% y 100%)
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('work_hours')}
            className="mt-4 text-xs font-semibold text-emerald-600 hover:text-emerald-500 flex items-center gap-1 transition"
          >
            <span>Ver planilla de horas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tarjeta Vehículo */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vehículo</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Car className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">
              {latestFuel ? `${latestFuel.odometer_km.toLocaleString()} km` : 'Sin registros'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {latestFuel?.fuel_efficiency_kml
                ? `Rendimiento: ${latestFuel.fuel_efficiency_kml} km/L promedio`
                : 'Control de odómetro, kilometraje y mantenimientos'}
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('vehicles')}
            className="mt-4 text-xs font-semibold text-emerald-600 hover:text-emerald-500 flex items-center gap-1 transition"
          >
            <span>Ver módulo de vehículo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tarjeta Deudas Activas */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deudas Pendientes</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">
              {formatAmount(
                spaceDebts
                  .filter((d) => d.type === 'i_owe')
                  .reduce((acc, d) => acc + d.remaining_amount, 0)
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {spaceDebts.filter((d) => d.type === 'i_owe').length} compromisos por liquidar
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('debts')}
            className="mt-4 text-xs font-semibold text-emerald-600 hover:text-emerald-500 flex items-center gap-1 transition"
          >
            <span>Ver deudas y préstamos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Transacciones Recientes */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Últimas Transacciones Registradas ({spaceTransactions.length})
          </span>
          <button
            onClick={() => onNavigateToTab('transactions')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 flex items-center gap-1"
          >
            <span>Ver todas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4">Cuenta</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-right">Monto ({currencySymbol})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {spaceTransactions.slice(0, 5).map((t) => {
                const account = state.accounts.find((a) => a.id === t.account_id);
                const category = state.categories.find((c) => c.id === t.category_id);
                const isExpense = t.type === 'expense';
                const isIncome = t.type === 'income';

                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {t.date}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {t.description}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {account?.name || 'Cuenta'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px]">
                        {category?.name || (t.type === 'transfer' ? 'Transferencia' : 'Sin categoría')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold whitespace-nowrap font-mono">
                      <span
                        className={
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isExpense
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }
                      >
                        {isIncome ? '+' : isExpense ? '-' : ''}{formatAmount(t.amount)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
