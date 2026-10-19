import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency, PRESET_CURRENCIES } from '../../context/CurrencyContext';
import {
  Settings,
  Sun,
  Moon,
  Laptop,
  Save,
  CheckCircle2,
  DollarSign,
  Clock,
  Car,
  ShieldCheck,
  User,
  Coins,
  Check,
  Sliders,
} from 'lucide-react';

export const UserSettingsView: React.FC = () => {
  const { currentUser, isOwner, currentSpace } = useAuth();
  const { theme, setTheme } = useTheme();
  const { currency, currencySymbol, currencyName, setCurrency, formatAmount } = useCurrency();

  const [displayName, setDisplayName] = useState(currentUser?.display_name || '');
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [selectedSymbol, setSelectedSymbol] = useState(currencySymbol);
  const [selectedName, setSelectedName] = useState(currencyName);
  const [customMode, setCustomMode] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [customSymbol, setCustomSymbol] = useState('');
  const [customName, setCustomName] = useState('');

  const [defaultHourlyRate, setDefaultHourlyRate] = useState('110.0');
  const [vehicleOilInterval, setVehicleOilInterval] = useState('2500');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleCurrencyPresetClick = (code: string, symbol: string, name: string) => {
    setSelectedCurrency(code);
    setSelectedSymbol(symbol);
    setSelectedName(name);
    setCustomMode(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (customMode && customCode.trim()) {
      const code = customCode.toUpperCase().trim();
      const sym = customSymbol.trim() || '$';
      const name = customName.trim() || code;
      setCurrency(code, sym, name);
    } else {
      setCurrency(selectedCurrency, selectedSymbol, selectedName);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          <span>Configuración Personal y Preferencias</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Personaliza tu experiencia de usuario, moneda de trabajo del sistema, apariencia y valores predeterminados.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Preferencias personales y moneda guardadas exitosamente para todo el sistema.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6 shadow-sm">
        {/* Identidad del Usuario */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-500" />
            <span>Perfil de Usuario</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre para Mostrar:
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Correo Electrónico (Inmutable):
              </label>
              <input
                type="text"
                disabled
                value={currentUser?.email || ''}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* SELECTOR DE MONEDA GLOBAL */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-500" />
              <span>Moneda del Usuario y Sistema ({currency} • {currencySymbol})</span>
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              Editable por el usuario
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Selecciona la moneda en la que deseas visualizar todos los saldos, costos vehiculares, planillas de horas y reportes de FinanzasPro.
          </p>

          {/* Grid de Monedas Predefinidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PRESET_CURRENCIES.slice(0, 8).map((c) => {
              const isSelected = !customMode && selectedCurrency === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCurrencyPresetClick(c.code, c.symbol, c.name)}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg flex-shrink-0">{c.flag || '🪙'}</span>
                    <div className="truncate">
                      <div className="font-extrabold text-xs">{c.code}</div>
                      <div className="text-[10px] text-slate-400 truncate">{c.symbol}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />}
                </button>
              );
            })}
          </div>

          {/* Más Monedas y Opción Personalizada */}
          <div className="flex flex-wrap gap-2 pt-1">
            {PRESET_CURRENCIES.slice(8).map((c) => {
              const isSelected = !customMode && selectedCurrency === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCurrencyPresetClick(c.code, c.symbol, c.name)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <span>{c.flag}</span>
                  <span>{c.code} ({c.symbol})</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setCustomMode(true)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                customMode
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  : 'border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Otra Moneda Personalizada...</span>
            </button>
          </div>

          {/* Formulario de Moneda Personalizada si está activa */}
          {customMode && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Definir Moneda Personalizada:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Código (ej. JPY, CAD, CHF):
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                    placeholder="XYZ"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Símbolo (ej. ¥, Fr., $, kr):
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value)}
                    placeholder="$"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Nombre Descriptivo:
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Mi Moneda"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Live Preview de Moneda */}
          <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Vista previa de visualización:
            </span>
            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {customMode ? (customSymbol || '$') : selectedSymbol} 1,250.00 {customMode ? (customCode || 'XYZ') : selectedCurrency}
            </div>
          </div>
        </div>

        {/* Selector de Apariencia */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Tema y Apariencia
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition ${
                theme === 'light'
                  ? 'border-emerald-500 bg-emerald-50/40 text-emerald-700 dark:text-emerald-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span>Modo Claro</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition ${
                theme === 'dark'
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400" />
              <span>Modo Oscuro</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition ${
                theme === 'system'
                  ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Laptop className="w-5 h-5 text-slate-400" />
              <span>Sistema OS</span>
            </button>
          </div>
        </div>

        {/* Configuración de Horas Extras y Vehículo */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Valores Predeterminados para Horas Extras y Vehículo
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-500" />
                <span>Tarifa por Hora Base Predeterminada ({currencySymbol}):</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={defaultHourlyRate}
                onChange={(e) => setDefaultHourlyRate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-amber-500" />
                <span>Intervalo para Mantenimiento de Aceite de Vehículo (Km):</span>
              </label>
              <input
                type="number"
                value={vehicleOilInterval}
                onChange={(e) => setVehicleOilInterval(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Preferencias y Moneda</span>
          </button>
        </div>
      </form>
    </div>
  );
};
