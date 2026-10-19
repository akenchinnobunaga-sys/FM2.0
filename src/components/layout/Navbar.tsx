import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  ShieldCheck,
  Sun,
  Moon,
  Laptop,
  Users,
  ChevronDown,
  Building2,
  Lock,
  Layers,
  Sparkles,
  Database,
  Menu,
  Key,
  Coins,
  PanelLeftOpen,
  PanelLeftClose,
  LogOut,
} from 'lucide-react';
import { localDB } from '../../services/storage';
import { LicenseService } from '../../services/licenseService';
import { useCurrency } from '../../context/CurrencyContext';
import { CurrencySelectorModal } from '../common/CurrencySelectorModal';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface NavbarProps {
  onOpenMobileSidebar: () => void;
  onOpenSupabaseModal: () => void;
  onNavigateToTab?: (tab: string) => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileSidebar,
  onOpenSupabaseModal,
  onNavigateToTab,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
}) => {
  const { currentUser, currentSpace, userSpaces, setCurrentSpace, switchUserPersona, signOut, isOwner } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { currency, currencySymbol } = useCurrency();
  const [showSpaceMenu, setShowSpaceMenu] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const activation = LicenseService.getActivationStatus();

  const allProfiles = localDB.getState().profiles;

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Izquierda: Botón Menú Móvil + Botón Desplegar/Contraer Desktop + Selector de Espacio */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Botón Visible en la parte superior para Contraer/Desplegar Menú en PC para mayor espacio */}
          {onToggleSidebarCollapse && (
            <button
              onClick={onToggleSidebarCollapse}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold shadow-sm transition"
              title={isSidebarCollapsed ? 'Desplegar menú lateral' : 'Contraer y ocultar menú para más espacio'}
            >
              {isSidebarCollapsed ? (
                <>
                  <PanelLeftOpen className="w-4 h-4 text-emerald-500" />
                  <span>Mostrar Menú</span>
                </>
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4 text-slate-500" />
                  <span>Ocultar Menú</span>
                </>
              )}
            </button>
          )}

          {/* Selector de Espacio Financiero Personal */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSpaceMenu(!showSpaceMenu);
                setShowPersonaMenu(false);
                setShowThemeMenu(false);
              }}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700/60 transition text-sm font-medium"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <div className="text-left hidden sm:block">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Espacio Financiero Personal
                </span>
                <span className="font-semibold text-xs leading-none truncate max-w-[170px]">
                  {currentSpace?.name || 'Mi Espacio Financiero'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showSpaceMenu && (
              <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50">
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Tus Espacios Autorizados
                </div>
                <div className="space-y-1">
                  {userSpaces.map((sp) => (
                    <button
                      key={sp.id}
                      onClick={() => {
                        setCurrentSpace(sp);
                        setShowSpaceMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition ${
                        currentSpace?.id === sp.id
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${sp.is_personal ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                          {sp.is_personal ? <Lock className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="font-medium text-xs">{sp.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">Moneda: {sp.currency}</div>
                        </div>
                      </div>
                      {currentSpace?.id === sp.id && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                          Activo
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Derecha: Moneda HNL, Estado Supabase, Selector de Persona QA, Tema y Perfil */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botón Selector de Moneda Interactivo */}
          <button
            onClick={() => setShowCurrencyModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition shadow-sm cursor-pointer"
            title="Cambiar moneda de trabajo (ej: Lempiras, Dólares, Euros, etc.)"
          >
            <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{currency} ({currencySymbol})</span>
          </button>

          {/* Botón de Instalación PWA */}
          <PWAInstallButton variant="navbar" />

          {/* Botón Ver Estado Supabase / SQL */}
          <button
            onClick={onOpenSupabaseModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
            title="Ver configuración y script SQL de Supabase"
          >
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Supabase & SQL</span>
          </button>

          {/* Estado de Licencia Desktop */}
          <button
            onClick={() => onNavigateToTab && onNavigateToTab('licensing')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
              activation.is_activated
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 hover:bg-amber-500/20'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 hover:bg-rose-500/20'
            }`}
            title="Ver estado de licencia Windows Desktop y HWID"
          >
            <Key className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">
              {activation.is_activated ? 'Licencia: Activa' : 'Sin Activar'}
            </span>
          </button>

          {/* Menú de Temas (Light / Dark / System) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowThemeMenu(!showThemeMenu);
                setShowSpaceMenu(false);
                setShowPersonaMenu(false);
              }}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
              aria-label="Cambiar tema"
            >
              {resolvedTheme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-40 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-50 text-xs">
                <button
                  onClick={() => {
                    setTheme('light');
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition ${theme === 'light' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Claro</span>
                </button>
                <button
                  onClick={() => {
                    setTheme('dark');
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition ${theme === 'dark' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-400 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span>Oscuro</span>
                </button>
                <button
                  onClick={() => {
                    setTheme('system');
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition ${theme === 'system' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  <Laptop className="w-4 h-4 text-slate-400" />
                  <span>Sistema</span>
                </button>
              </div>
            )}
          </div>

          {/* SIMULADOR QA / CAMBIADOR DE PERSONA DE PRUEBAS */}
          <div className="relative">
            <button
              onClick={() => {
                setShowPersonaMenu(!showPersonaMenu);
                setShowSpaceMenu(false);
                setShowThemeMenu(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs border border-slate-200 dark:border-slate-700 transition"
              title="Selector de cuenta para pruebas de roles y RLS"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                {currentUser?.display_name?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden md:block">
                <span className="block font-semibold text-xs leading-none">
                  {currentUser?.display_name?.split(' ')[0]}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {isOwner ? 'Propietario Global' : currentUser?.status === 'suspended' ? 'Suspendido' : 'Usuario'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showPersonaMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 p-2.5 z-50">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 mb-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {currentUser?.display_name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">{currentUser?.email}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    {isOwner && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Propietario Global
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      {currentUser?.status === 'active' ? 'Activo' : 'Suspendido'}
                    </span>
                  </div>
                </div>

                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Cambiar Cuenta de Prueba (QA):
                </div>

                <div className="space-y-1">
                  {allProfiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        switchUserPersona(p.id);
                        setShowPersonaMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                        currentUser?.id === p.id
                          ? 'bg-slate-100 dark:bg-slate-700/60 font-semibold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            p.status === 'suspended'
                              ? 'bg-rose-500'
                              : p.global_role === 'owner'
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}
                        />
                        <div>
                          <div className="font-medium text-xs">{p.display_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                            {p.email}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {p.global_role === 'owner'
                          ? 'Owner'
                          : p.status === 'suspended'
                          ? 'Bloqueado'
                          : 'Miembro'}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Opción para Cerrar Sesión y Exigir Nueva Autenticación */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
                  <button
                    onClick={() => {
                      signOut();
                      setShowPersonaMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar Sesión en este Dispositivo</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para Cambiar Moneda */}
      <CurrencySelectorModal
        isOpen={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
      />
    </header>
  );
};
