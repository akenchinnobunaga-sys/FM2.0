import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { SuspendedView } from './components/auth/SuspendedView';
import { DashboardOverview } from './components/finances/DashboardOverview';
import { TransactionList } from './components/finances/TransactionList';
import { AccountsView } from './components/finances/AccountsView';
import { BudgetsView } from './components/finances/BudgetsView';
import { DebtsView } from './components/finances/DebtsView';
import { SavingsView } from './components/finances/SavingsView';
import { WorkHoursView } from './components/special/WorkHoursView';
import { VehicleMasterView } from './components/special/VehicleMasterView';
import { GeneralExpensesView } from './components/finances/GeneralExpensesView';
import { CalendarView } from './components/finances/CalendarView';
import { ReportsView } from './components/finances/ReportsView';
import { AiAssistantView } from './components/ai/AiAssistantView';
import { AdminPanel } from './components/admin/AdminPanel';
import { LicenseManagerView } from './components/licensing/LicenseManagerView';
import { ArchitectureMasterView } from './components/architecture/ArchitectureMasterView';
import { UserSettingsView } from './components/settings/UserSettingsView';
import { SupabaseSetupModal } from './components/settings/SupabaseSetupModal';
import { TransactionModal } from './components/finances/TransactionModal';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { LoginView } from './components/auth/LoginView';

const AppContent: React.FC = () => {
  const { isSuspended, currentUser, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(
    () => localStorage.getItem('finanzas_sidebar_collapsed') === 'true'
  );
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('finanzas_sidebar_collapsed', String(next));
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold tracking-wide">Cargando FinanzasPro...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado en este dispositivo, mostrar pantalla de inicio de sesión
  if (!currentUser) {
    return <LoginView />;
  }

  // Si la cuenta está suspendida por el Propietario, bloquear acceso totalmente
  if (isSuspended) {
    return <SuspendedView />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      <div className="flex flex-1">
        {/* Barra Lateral Navegación (Colapsable para maximizar el espacio de trabajo) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />

        {/* Contenido Principal */}
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          <Navbar
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
            onNavigateToTab={(t) => setActiveTab(t as NavTab)}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebarCollapse={handleToggleSidebar}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardOverview
                onNavigateToTab={setActiveTab}
                onOpenNewTransaction={() => setIsNewTxModalOpen(true)}
              />
            )}
            {activeTab === 'work_hours' && <WorkHoursView key={refreshKey} />}
            {(activeTab === 'vehicles' || (activeTab as string) === 'moto') && <VehicleMasterView key={refreshKey} />}
            {activeTab === 'general_expenses' && <GeneralExpensesView key={refreshKey} />}
            {activeTab === 'transactions' && <TransactionList key={refreshKey} />}
            {activeTab === 'accounts' && <AccountsView key={refreshKey} />}
            {activeTab === 'budgets' && <BudgetsView key={refreshKey} />}
            {activeTab === 'debts' && <DebtsView key={refreshKey} />}
            {activeTab === 'savings' && <SavingsView key={refreshKey} />}
            {activeTab === 'calendar' && <CalendarView key={refreshKey} />}
            {activeTab === 'reports' && <ReportsView key={refreshKey} />}
            {activeTab === 'ai_assistant' && <AiAssistantView key={refreshKey} />}
            {activeTab === 'licensing' && <LicenseManagerView key={refreshKey} />}
            {activeTab === 'architecture_spec' && <ArchitectureMasterView />}
            {activeTab === 'admin_panel' && <AdminPanel />}
            {activeTab === 'settings' && <UserSettingsView />}
          </main>
        </div>
      </div>

      {/* Modales Globales */}
      <SupabaseSetupModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      <TransactionModal
        isOpen={isNewTxModalOpen}
        onClose={() => setIsNewTxModalOpen(false)}
        onTransactionSaved={() => setRefreshKey((k) => k + 1)}
      />

      {/* Indicador de Estado Offline PWA */}
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <AppContent />
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
