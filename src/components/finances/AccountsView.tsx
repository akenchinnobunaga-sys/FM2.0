import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../services/storage';
import { AccountType, FinancialAccount } from '../../types/database';
import {
  Wallet,
  Building,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Plus,
  ArrowLeftRight,
  X,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export const AccountsView: React.FC = () => {
  const { currentSpace, currentUser } = useAuth();
  const { currency, currencySymbol } = useCurrency();
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Estados Form Nueva Cuenta
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<AccountType>('bank');
  const [initialBalance, setInitialBalance] = useState('');
  const [institution, setInstitution] = useState('');

  // Estados Form Transferencia
  const [fromAccId, setFromAccId] = useState('');
  const [toAccId, setToAccId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('');

  const state = localDB.getState();

  if (!currentSpace || !currentUser) {
    return <div className="p-8 text-center text-slate-500">Selecciona un espacio.</div>;
  }

  const accounts = state.accounts.filter((a) => a.space_id === currentSpace.id && !a.is_archived);
  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'bank':
        return <Building className="w-5 h-5 text-blue-500" />;
      case 'cash':
        return <Wallet className="w-5 h-5 text-emerald-500" />;
      case 'credit_card':
        return <CreditCard className="w-5 h-5 text-rose-500" />;
      case 'savings':
        return <PiggyBank className="w-5 h-5 text-purple-500" />;
      default:
        return <TrendingUp className="w-5 h-5 text-amber-500" />;
    }
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const balanceNum = parseFloat(initialBalance) || 0;

    localDB.addAccount({
      space_id: currentSpace.id,
      user_id: currentUser.id,
      name: accName.trim(),
      type: accType,
      currency: currentSpace.currency || 'HNL',
      balance: balanceNum,
      initial_balance: balanceNum,
      institution_name: institution.trim() || undefined,
      is_archived: false,
    });

    setAccName('');
    setInitialBalance('');
    setInstitution('');
    setShowNewAccountModal(false);
    setRefreshKey((k) => k + 1);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) {
      alert('Ingresa un monto válido.');
      return;
    }
    if (!fromAccId || !toAccId || fromAccId === toAccId) {
      alert('Selecciona cuentas distintas de origen y destino.');
      return;
    }

    localDB.addTransaction({
      space_id: currentSpace.id,
      user_id: currentUser.id,
      account_id: fromAccId,
      destination_account_id: toAccId,
      type: 'transfer',
      amount,
      currency: currentSpace.currency || 'HNL',
      date: new Date().toISOString().split('T')[0],
      description: transferDesc.trim() || 'Transferencia entre cuentas propias',
    });

    setTransferAmount('');
    setTransferDesc('');
    setShowTransferModal(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Acciones */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Cuentas y Fondos Financieros
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Saldo acumulado disponible: <strong>{currencySymbol} {totalBalance.toLocaleString('es-HN', { minimumFractionDigits: 2 })}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (accounts.length >= 2) {
                setFromAccId(accounts[0].id);
                setToAccId(accounts[1].id);
              }
              setShowTransferModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-blue-500" />
            <span>Transferir entre Cuentas</span>
          </button>
          <button
            onClick={() => setShowNewAccountModal(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Cuenta</span>
          </button>
        </div>
      </div>

      {/* Grid de Cuentas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700/60">
                    {getAccountIcon(acc.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {acc.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 capitalize">
                      {acc.institution_name ? `${acc.institution_name} • ` : ''}
                      {acc.type === 'credit_card'
                        ? 'Tarjeta de Crédito'
                        : acc.type === 'bank'
                        ? 'Cuenta Bancaria'
                        : acc.type === 'cash'
                        ? 'Efectivo en Mano'
                        : acc.type === 'savings'
                        ? 'Fondo de Ahorro'
                        : 'Inversión'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="my-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Saldo Disponible
                </span>
                <span
                  className={`text-2xl font-black tracking-tight font-mono ${
                    acc.balance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {currencySymbol} {acc.balance.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>Inicial: {currencySymbol} {acc.initial_balance.toLocaleString()}</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                {acc.currency || currency}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nueva Cuenta */}
      {showNewAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Crear Nueva Cuenta Financiera
              </h3>
              <button onClick={() => setShowNewAccountModal(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la Cuenta:
                </label>
                <input
                  type="text"
                  required
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  placeholder="Ej: BAC Sueldo, Billetera Efectivo, Ficohsa Ahorros..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Cuenta:
                  </label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value as AccountType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="bank">Bancaria</option>
                    <option value="cash">Efectivo</option>
                    <option value="savings">Ahorros</option>
                    <option value="credit_card">Tarjeta Crédito</option>
                    <option value="investment">Inversión</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Saldo Inicial (L.):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Entidad o Banco (Opcional):
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Ej: BAC, Ficohsa, Banpaís, Billetera personal..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowNewAccountModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Crear Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Transferencia */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-blue-500" />
                <span>Transferencia Atómica entre Cuentas</span>
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cuenta Origen (Se debitará):
                </label>
                <select
                  value={fromAccId}
                  onChange={(e) => setFromAccId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Saldo: L. {a.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cuenta Destino (Se acreditará):
                </label>
                <select
                  value={toAccId}
                  onChange={(e) => setToAccId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500"
                >
                  {accounts
                    .filter((a) => a.id !== fromAccId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Saldo: L. {a.balance.toLocaleString()})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monto a Transferir (L.):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Concepto:
                </label>
                <input
                  type="text"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  placeholder="Ej: Retiro cajero automático, traspaso a ahorros..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white"
                >
                  Confirmar Transferencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
