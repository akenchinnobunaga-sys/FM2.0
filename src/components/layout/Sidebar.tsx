import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PieChart,
  HandCoins,
  PiggyBank,
  Clock,
  Car,
  CalendarDays,
  FileSpreadsheet,
  Sparkles,
  ShieldCheck,
  Settings,
  Receipt,
  X,
  PanelLeftClose,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { PWAInstallButton } from '../common/PWAInstallButton';

export type NavTab =
  | 'dashboard'
  | 'work_hours'
  | 'vehicles'
  | 'general_expenses'
  | 'transactions'
  | 'accounts'
  | 'budgets'
  | 'debts'
  | 'savings'
  | 'calendar'
  | 'reports'
  | 'ai_assistant'
  | 'licensing'
  | 'architecture_spec'
  | 'admin_panel'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { isOwner } = useAuth();
  const { currency, currencySymbol } = useCurrency();

  const primarySections = [
    { id: 'work_hours' as NavTab, label: '1. Horas y Horas Extras', icon: Clock, badge: 'Sec 1' },
    { id: 'vehicles' as NavTab, label: '2. Vehículo', icon: Car, badge: 'Sec 2' },
    { id: 'general_expenses' as NavTab, label: '3. Gastos y Finanzas', icon: Receipt, badge: 'Sec 3' },
  ];

  const financialModules = [
    { id: 'dashboard' as NavTab, label: 'Panel General', icon: LayoutDashboard },
    { id: 'transactions' as NavTab, label: 'Transacciones', icon: ArrowLeftRight },
    { id: 'accounts' as NavTab, label: 'Cuentas y Fondos', icon: Wallet },
    { id: 'budgets' as NavTab, label: 'Presupuestos', icon: PieChart },
    { id: 'debts' as NavTab, label: 'Deudas y Préstamos', icon: HandCoins },
    { id: 'savings' as NavTab, label: 'Metas de Ahorro', icon: PiggyBank },
    { id: 'calendar' as NavTab, label: 'Calendario y Pagos', icon: CalendarDays },
    { id: 'reports' as NavTab, label: 'Reportes, Excel y PDF', icon: FileSpreadsheet },
    { id: 'ai_assistant' as NavTab, label: 'Asistente IA', icon: Sparkles, badge: 'IA' },
  ];

  const systemModules = [
    { id: 'licensing' as NavTab, label: 'Licencias y HWID', icon: ShieldCheck, badge: 'Win' },
    { id: 'architecture_spec' as NavTab, label: 'Arquitectura & QA', icon: FileSpreadsheet, badge: 'Doc' },
  ];

  return (
    <>
      {/* Backdrop móvil */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? '-translate-x-full lg:hidden w-0 overflow-hidden' : 'w-64 translate-x-0'
        } ${
          isOpenMobile ? '!translate-x-0 !w-72 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Encabezado Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-extrabold text-base shadow-md shadow-emerald-500/20">
              FP
            </div>
            <div>
              <span className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                Finanzas
              </span>
              <span className="text-emerald-500 font-extrabold text-base">Pro</span>
              <span className="block text-[9px] text-slate-400 font-medium tracking-wide">
                Moneda: {currency} ({currencySymbol})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Contraer y ocultar menú para más espacio"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Cerrar menú móvil"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lista de navegación */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-3">
          {/* SECCIONES PRINCIPALES */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              3 Secciones Principales
            </div>
            <div className="space-y-1">
              {primarySections.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-purple-500'}`} />
                      <span className="font-bold">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* GESTIÓN FINANCIERA */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Módulos Financieros
            </div>
            <div className="space-y-1">
              {financialModules.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DESKTOP & ESPECIFICACIONES */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Desktop & Arquitectura
            </div>
            <div className="space-y-1">
              {systemModules.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-slate-800 text-white dark:bg-slate-700 shadow-md'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sección de Administración (Solo Propietario Global) */}
          {isOwner && (
            <div className="pt-4">
              <div className="px-3 pb-2 text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Control Maestro</span>
              </div>
              <button
                onClick={() => {
                  onSelectTab('admin_panel');
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'admin_panel'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Panel del Propietario</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300">
                  Owner
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Pie de navegación */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <PWAInstallButton variant="sidebar" />
          <button
            onClick={() => {
              onSelectTab('settings');
              onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'settings'
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configuración</span>
          </button>
        </div>
      </aside>
    </>
  );
};
