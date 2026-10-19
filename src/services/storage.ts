/**
 * Motor de persistencia y almacenamiento local con semántica relacional para FinanzasPro
 * Gestiona de forma aislada e independiente:
 * 1. Horas Laborales y Horas Extras
 * 2. Vehículo (Combustible, Kilometraje, Mantenimiento y Otros Gastos)
 * 3. Gastos Generales y Categorías Personalizables
 * 4. Centro de Respaldos (Exportar/Restaurar Base de Datos Completa)
 */

import {
  UserProfile,
  FamilySpace,
  SpaceMembership,
  SpaceInvitation,
  FinancialAccount,
  Category,
  Transaction,
  Budget,
  Debt,
  SavingGoal,
  WorkHourLog,
  FuelRecord,
  MileageRecord,
  VehicleMaintenanceRecord,
  VehicleOtherExpense,
  GeneralExpenseRecord,
  CalendarReminder,
  AuditLog,
  AppGlobalSettings,
  AccessRequest,
  ActivationCode,
} from '../types/database';

export const INITIAL_OWNER_EMAIL = 'akenchinnobunaga@gmail.com';
const STORAGE_KEY = 'finanzaspro_desktop_master_db_v2';

export interface DatabaseState {
  profiles: UserProfile[];
  spaces: FamilySpace[];
  memberships: SpaceMembership[];
  invitations: SpaceInvitation[];
  accounts: FinancialAccount[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  debts: Debt[];
  savingGoals: SavingGoal[];
  workHours: WorkHourLog[];
  fuelRecords: FuelRecord[];
  mileageRecords: MileageRecord[];
  vehicleMaintenance: VehicleMaintenanceRecord[];
  vehicleOtherExpenses: VehicleOtherExpense[];
  generalExpenses: GeneralExpenseRecord[];
  reminders: CalendarReminder[];
  auditLogs: AuditLog[];
  accessRequests: AccessRequest[];
  activationCodes: ActivationCode[];
  globalSettings: AppGlobalSettings;
  lastBackupDate?: string;
}

const seedInitialDatabase = (): DatabaseState => {
  const ownerId = 'usr-owner-001';
  const spaceAdminId = 'usr-admin-002';
  const memberId = 'usr-member-003';
  const suspendedId = 'usr-susp-004';

  const personalSpaceId = 'spc-personal-001';
  const familySpaceId = 'spc-family-001';

  const profiles: UserProfile[] = [
    {
      id: ownerId,
      email: INITIAL_OWNER_EMAIL,
      password: 'Admin2026!',
      display_name: 'Nobunaga Kenchin (Administrador)',
      global_role: 'owner',
      status: 'active',
      created_at: '2026-09-01T08:00:00Z',
      last_login_at: '2026-10-17T20:00:00Z',
    },
    {
      id: spaceAdminId,
      email: 'maria.garcia@familia.local',
      password: 'Maria2026!',
      display_name: 'María García',
      global_role: 'user',
      status: 'active',
      created_at: '2026-09-05T10:30:00Z',
      last_login_at: '2026-10-16T15:20:00Z',
    },
    {
      id: memberId,
      email: 'carlos.garcia@familia.local',
      password: 'Carlos2026!',
      display_name: 'Carlos García',
      global_role: 'user',
      status: 'active',
      created_at: '2026-09-10T14:15:00Z',
      last_login_at: '2026-10-15T09:40:00Z',
    },
    {
      id: suspendedId,
      email: 'juan.perez@externo.local',
      password: 'Juan2026!',
      display_name: 'Juan Pérez (Suspendido)',
      global_role: 'user',
      status: 'suspended',
      suspended_at: '2026-10-10T11:00:00Z',
      suspended_by: ownerId,
      suspension_reason: 'Incumplimiento de directiva de seguridad y uso indebido',
      created_at: '2026-09-12T09:00:00Z',
      last_login_at: '2026-10-09T18:00:00Z',
    },
  ];

  const spaces: FamilySpace[] = [
    {
      id: familySpaceId,
      name: 'Finanzas Principales (Honduras HNL)',
      description: 'Espacio principal de gestión de gastos, vehículo y horas laborales.',
      currency: 'HNL',
      created_by: ownerId,
      is_personal: false,
      created_at: '2026-09-01T08:10:00Z',
      updated_at: '2026-09-01T08:10:00Z',
    },
    {
      id: personalSpaceId,
      name: 'Mi Espacio Personal Privado',
      description: 'Finanzas confidenciales no compartidas.',
      currency: 'HNL',
      created_by: ownerId,
      is_personal: true,
      created_at: '2026-09-01T08:05:00Z',
      updated_at: '2026-09-01T08:05:00Z',
    },
  ];

  const memberships: SpaceMembership[] = [
    { id: 'mem-1', space_id: familySpaceId, user_id: ownerId, role: 'space_admin', joined_at: '2026-09-01T08:10:00Z' },
    { id: 'mem-2', space_id: personalSpaceId, user_id: ownerId, role: 'space_admin', joined_at: '2026-09-01T08:05:00Z' },
  ];

  const categories: Category[] = [
    { id: 'cat-1', name: 'Alimentación y Supermercado', type: 'expense', icon: 'ShoppingCart', color: '#10b981', is_system_default: true },
    { id: 'cat-2', name: 'Servicios Básicos (Agua, Luz, Internet)', type: 'expense', icon: 'Zap', color: '#3b82f6', is_system_default: true },
    { id: 'cat-3', name: 'Salud, Médicos y Farmacia', type: 'expense', icon: 'HeartPulse', color: '#ec4899', is_system_default: true },
    { id: 'cat-4', name: 'Educación y Cursos', type: 'expense', icon: 'GraduationCap', color: '#8b5cf6', is_system_default: true },
    { id: 'cat-5', name: 'Vivienda y Reparaciones Hogar', type: 'expense', icon: 'Home', color: '#f59e0b', is_system_default: true },
    { id: 'cat-6', name: 'Salario Fijo Principal', type: 'income', icon: 'Briefcase', color: '#06b6d4', is_system_default: true },
    { id: 'cat-7', name: 'Horas Extras y Compensaciones', type: 'income', icon: 'Clock', color: '#10b981', is_system_default: true },
    { id: 'cat-8', name: 'Ventas y Trabajos Extra', type: 'income', icon: 'TrendingUp', color: '#14b8a6', is_system_default: true },
  ];

  const accounts: FinancialAccount[] = [
    {
      id: 'acc-1',
      space_id: familySpaceId,
      user_id: ownerId,
      name: 'BAC Credomatic Sueldo',
      type: 'bank',
      currency: 'HNL',
      balance: 28450.0,
      initial_balance: 15000.0,
      institution_name: 'BAC Credomatic',
      is_archived: false,
      created_at: '2026-09-01T08:20:00Z',
    },
    {
      id: 'acc-2',
      space_id: familySpaceId,
      user_id: ownerId,
      name: 'Efectivo en Billetera',
      type: 'cash',
      currency: 'HNL',
      balance: 3200.0,
      initial_balance: 1500.0,
      institution_name: 'Caja Física',
      is_archived: false,
      created_at: '2026-09-01T08:22:00Z',
    },
    {
      id: 'acc-3',
      space_id: familySpaceId,
      user_id: ownerId,
      name: 'Ficohsa Cuenta Ahorros',
      type: 'savings',
      currency: 'HNL',
      balance: 45000.0,
      initial_balance: 40000.0,
      institution_name: 'Banco Ficohsa',
      is_archived: false,
      created_at: '2026-09-05T10:40:00Z',
    },
  ];

  const transactions: Transaction[] = [
    {
      id: 'tx-1',
      space_id: familySpaceId,
      user_id: ownerId,
      account_id: 'acc-1',
      category_id: 'cat-6',
      type: 'income',
      amount: 19500.0,
      currency: 'HNL',
      date: '2026-10-01',
      description: 'Pago primera quincena sueldo',
      created_at: '2026-10-01T12:00:00Z',
    },
    {
      id: 'tx-2',
      space_id: familySpaceId,
      user_id: ownerId,
      account_id: 'acc-1',
      category_id: 'cat-1',
      type: 'expense',
      amount: 3850.0,
      currency: 'HNL',
      date: '2026-10-05',
      description: 'Supermercado La Colonia despensa quincenal',
      created_at: '2026-10-05T16:30:00Z',
    },
    {
      id: 'tx-3',
      space_id: familySpaceId,
      user_id: ownerId,
      account_id: 'acc-1',
      category_id: 'cat-2',
      type: 'expense',
      amount: 1680.0,
      currency: 'HNL',
      date: '2026-10-10',
      description: 'Factura energía eléctrica ENEE y servicio de Internet',
      created_at: '2026-10-10T14:00:00Z',
    },
    {
      id: 'tx-4',
      space_id: familySpaceId,
      user_id: ownerId,
      account_id: 'acc-1',
      destination_account_id: 'acc-2',
      type: 'transfer',
      amount: 2500.0,
      currency: 'HNL',
      date: '2026-10-12',
      description: 'Retiro en cajero automático para gastos corrientes en efectivo',
      created_at: '2026-10-12T11:20:00Z',
    },
  ];

  /* SECCIÓN 1: HORAS LABORALES Y HORAS EXTRAS */
  const workHours: WorkHourLog[] = [
    {
      id: 'wh-1',
      space_id: familySpaceId,
      user_id: ownerId,
      work_date: '2026-10-12',
      arrival_time: '08:00',
      departure_time: '18:30',
      break_duration_mins: 60,
      total_worked_hours: 9.5,
      regular_hours: 8.0,
      overtime_50_hours: 1.5,
      overtime_100_hours: 0.0,
      hourly_rate: 110.0,
      currency: 'HNL',
      total_pay: 110.0 * 8.0 + 110.0 * 1.5 * 1.5, // 880 + 247.5 = 1127.50
      employee_id: 'EMP-001',
      notes: 'Turno extendido por cierre de pedidos quincenales',
      created_at: '2026-10-12T19:30:00Z',
    },
    {
      id: 'wh-2',
      space_id: familySpaceId,
      user_id: ownerId,
      work_date: '2026-10-13',
      arrival_time: '08:00',
      departure_time: '20:00',
      break_duration_mins: 60,
      total_worked_hours: 11.0,
      regular_hours: 8.0,
      overtime_50_hours: 3.0,
      overtime_100_hours: 0.0,
      hourly_rate: 110.0,
      currency: 'HNL',
      total_pay: 110.0 * 8.0 + 110.0 * 1.5 * 3.0, // 880 + 495 = 1375.00
      employee_id: 'EMP-001',
      notes: 'Reemplazo de guardia operativa vespertina',
      created_at: '2026-10-13T20:30:00Z',
    },
    {
      id: 'wh-3',
      space_id: familySpaceId,
      user_id: ownerId,
      work_date: '2026-10-15',
      arrival_time: '09:00',
      departure_time: '16:00',
      break_duration_mins: 60,
      total_worked_hours: 6.0,
      regular_hours: 0.0,
      overtime_50_hours: 0.0,
      overtime_100_hours: 6.0,
      hourly_rate: 110.0,
      currency: 'HNL',
      total_pay: 110.0 * 2.0 * 6.0, // 1320.00 al 100% festivo
      employee_id: 'EMP-001',
      notes: 'Jornada especial en día festivo programado',
      created_at: '2026-10-15T18:00:00Z',
    },
    {
      id: 'wh-4',
      space_id: familySpaceId,
      user_id: ownerId,
      work_date: '2026-10-16',
      arrival_time: '08:00',
      departure_time: '17:00',
      break_duration_mins: 60,
      total_worked_hours: 8.0,
      regular_hours: 8.0,
      overtime_50_hours: 0.0,
      overtime_100_hours: 0.0,
      hourly_rate: 110.0,
      currency: 'HNL',
      total_pay: 110.0 * 8.0, // 880.00
      employee_id: 'EMP-001',
      notes: 'Jornada ordinaria sin horas extras',
      created_at: '2026-10-16T17:15:00Z',
    },
  ];

  /* SECCIÓN 2: VEHÍCULO, COMBUSTIBLE, KILOMETRAJE Y MANTENIMIENTO */
  const fuelRecords: FuelRecord[] = [
    {
      id: 'fuel-1',
      space_id: familySpaceId,
      user_id: ownerId,
      refueling_date: '2026-10-01',
      odometer_km: 14200,
      fuel_quantity: 9.5,
      fuel_type: 'super',
      unit: 'liters',
      total_cost_hnl: 295.0,
      cost_per_unit: 31.05,
      gas_station: 'Texaco Los Próceres',
      is_full_tank: true,
      km_traveled_since_last: 380,
      fuel_efficiency_kml: 40.0,
      cost_per_km_hnl: 0.78,
      notes: 'Tanque lleno con Gasolina Superior',
      created_at: '2026-10-01T08:30:00Z',
    },
    {
      id: 'fuel-2',
      space_id: familySpaceId,
      user_id: ownerId,
      refueling_date: '2026-10-07',
      odometer_km: 14590,
      fuel_quantity: 9.6,
      fuel_type: 'super',
      unit: 'liters',
      total_cost_hnl: 300.0,
      cost_per_unit: 31.25,
      gas_station: 'Uno El Trapiche',
      is_full_tank: true,
      km_traveled_since_last: 390,
      fuel_efficiency_kml: 40.6,
      cost_per_km_hnl: 0.77,
      notes: 'Rendimiento verificado: 40.6 km/L',
      created_at: '2026-10-07T09:15:00Z',
    },
    {
      id: 'fuel-3',
      space_id: familySpaceId,
      user_id: ownerId,
      refueling_date: '2026-10-14',
      odometer_km: 14970,
      fuel_quantity: 9.3,
      fuel_type: 'super',
      unit: 'liters',
      total_cost_hnl: 290.0,
      cost_per_unit: 31.18,
      gas_station: 'Puma Las Lomas',
      is_full_tank: true,
      km_traveled_since_last: 380,
      fuel_efficiency_kml: 40.86,
      cost_per_km_hnl: 0.76,
      notes: 'Llenado antes de recorrido largo',
      created_at: '2026-10-14T11:45:00Z',
    },
  ];

  const mileageRecords: MileageRecord[] = [
    {
      id: 'mil-1',
      space_id: familySpaceId,
      user_id: ownerId,
      date: '2026-10-01',
      previous_odometer_km: 13820,
      current_odometer_km: 14200,
      km_traveled: 380,
      estimated_cost_per_km: 0.78,
      notes: 'Control odómetro inicio de mes',
      created_at: '2026-10-01T08:35:00Z',
    },
    {
      id: 'mil-2',
      space_id: familySpaceId,
      user_id: ownerId,
      date: '2026-10-07',
      previous_odometer_km: 14200,
      current_odometer_km: 14590,
      km_traveled: 390,
      estimated_cost_per_km: 0.77,
      notes: 'Trayectos laborales y personales',
      created_at: '2026-10-07T09:20:00Z',
    },
    {
      id: 'mil-3',
      space_id: familySpaceId,
      user_id: ownerId,
      date: '2026-10-14',
      previous_odometer_km: 14590,
      current_odometer_km: 14970,
      km_traveled: 380,
      estimated_cost_per_km: 0.76,
      notes: 'Lectura de inspección regular',
      created_at: '2026-10-14T11:50:00Z',
    },
  ];

  const vehicleMaintenance: VehicleMaintenanceRecord[] = [
    {
      id: 'vm-1',
      space_id: familySpaceId,
      user_id: ownerId,
      maintenance_date: '2026-10-05',
      odometer_km: 14500,
      maintenance_type: 'oil_change',
      description: 'Cambio de aceite sintético Motul 7100 10W40 y filtro de aceite original',
      parts_replaced: 'Aceite 1L 10W40, Filtro de Aceite K&N',
      parts_cost: 520.0,
      labor_cost: 150.0,
      total_cost: 670.0,
      workshop: 'Lubricentro Rápido Moto Pro',
      next_maintenance_date: '2027-01-05',
      next_maintenance_km: 17000,
      km_since_previous: 2500,
      notes: 'Motor funcionando en óptimas condiciones',
      created_at: '2026-10-05T15:00:00Z',
    },
    {
      id: 'vm-2',
      space_id: familySpaceId,
      user_id: ownerId,
      maintenance_date: '2026-09-15',
      odometer_km: 13800,
      maintenance_type: 'brakes',
      description: 'Sustitución de pastillas de freno delanteras y purga de líquido DOT4',
      parts_replaced: 'Pastillas cerámicas de alto rendimiento',
      parts_cost: 420.0,
      labor_cost: 180.0,
      total_cost: 600.0,
      workshop: 'Frenos del Centro',
      next_maintenance_date: '2027-03-15',
      next_maintenance_km: 23800,
      km_since_previous: 4200,
      notes: 'Frenado probado y verificado',
      created_at: '2026-09-15T12:00:00Z',
    },
  ];

  const vehicleOtherExpenses: VehicleOtherExpense[] = [
    {
      id: 'vo-1',
      space_id: familySpaceId,
      user_id: ownerId,
      date: '2026-10-08',
      expense_type: 'car_wash',
      description: 'Lavado a presión con desengrasado y lubricación de cadena',
      amount_hnl: 120.0,
      payment_method: 'Efectivo',
      notes: 'Carwash El Centro',
      created_at: '2026-10-08T16:00:00Z',
    },
    {
      id: 'vo-2',
      space_id: familySpaceId,
      user_id: ownerId,
      date: '2026-09-25',
      expense_type: 'registration',
      description: 'Pago de boleta de matrícula municipal de vehículo',
      amount_hnl: 850.0,
      payment_method: 'Tarjeta BAC',
      notes: 'Instituto de la Propiedad (IP Honduras)',
      created_at: '2026-09-25T11:00:00Z',
    },
  ];

  /* SECCIÓN 3: GASTOS GENERALES Y CATEGORÍAS PERSONALIZABLES */
  const generalExpenses: GeneralExpenseRecord[] = [
    {
      id: 'ge-1',
      space_id: familySpaceId,
      user_id: ownerId,
      date: '2026-10-04',
      category_id: 'cat-1',
      category_name: 'Alimentación y Supermercado',
      description: 'Compras del mes en La Colonia (despensa, carnes y verduras)',
      amount_hnl: 4250.0,
      payment_method: 'Tarjeta BAC',
      notes: 'Factura con descuento de tercera edad incluido',
      receipt_ref: 'FAC-COL-09182',
      created_at: '2026-10-04T16:30:00Z',
    },
    {
      id: 'ge-2',
      space_id: familySpaceId,
      user_id: ownerId,
      date: '2026-10-09',
      category_id: 'cat-2',
      category_name: 'Servicios Básicos (Agua, Luz, Internet)',
      description: 'Pago recibo energía eléctrica ENEE y Tigo Hogar',
      amount_hnl: 1890.0,
      payment_method: 'Banca en Línea',
      notes: 'Aviso de pago al día',
      receipt_ref: 'REC-ENEE-4491',
      created_at: '2026-10-09T14:15:00Z',
    },
    {
      id: 'ge-3',
      space_id: familySpaceId,
      user_id: ownerId,
      date: '2026-10-12',
      category_id: 'cat-3',
      category_name: 'Salud, Médicos y Farmacia',
      description: 'Medicamentos recetados y vitaminas en Farmacia Simán',
      amount_hnl: 680.0,
      payment_method: 'Efectivo',
      notes: 'Tratamiento preventivo gripe',
      receipt_ref: 'SIM-88912',
      created_at: '2026-10-12T10:00:00Z',
    },
    {
      id: 'ge-4',
      space_id: familySpaceId,
      user_id: ownerId,
      date: '2026-10-15',
      category_id: 'cat-4',
      category_name: 'Educación y Cursos',
      description: 'Material escolar y libros de texto técnicos',
      amount_hnl: 540.0,
      payment_method: 'Efectivo',
      notes: 'Librería Navarro',
      receipt_ref: 'LIB-00219',
      created_at: '2026-10-15T15:40:00Z',
    },
  ];

  const budgets: Budget[] = [
    {
      id: 'bdg-1',
      space_id: familySpaceId,
      category_id: 'cat-1',
      period: 'monthly',
      amount: 7500.0,
      currency: 'HNL',
      alert_threshold_percent: 85,
      created_at: '2026-09-01T08:30:00Z',
    },
    {
      id: 'bdg-2',
      space_id: familySpaceId,
      category_id: 'cat-2',
      period: 'monthly',
      amount: 3000.0,
      currency: 'HNL',
      alert_threshold_percent: 90,
      created_at: '2026-09-01T08:30:00Z',
    },
  ];

  const debts: Debt[] = [
    {
      id: 'dbt-1',
      space_id: familySpaceId,
      user_id: ownerId,
      type: 'i_owe',
      counterparty: 'Taller Repuestos del Centro',
      total_amount: 3500.0,
      remaining_amount: 1500.0,
      interest_rate: 0.0,
      due_date: '2026-11-05',
      currency: 'HNL',
      notes: 'Saldo de repuestos mecánicos',
      is_settled: false,
      created_at: '2026-09-15T10:00:00Z',
    },
  ];

  const savingGoals: SavingGoal[] = [
    {
      id: 'svg-1',
      space_id: familySpaceId,
      user_id: ownerId,
      name: 'Fondo de Emergencia Familiar (6 Meses)',
      target_amount: 60000.0,
      current_amount: 45000.0,
      currency: 'HNL',
      target_date: '2027-04-30',
      color: '#10b981',
      is_completed: false,
      created_at: '2026-09-01T08:40:00Z',
    },
  ];

  const reminders: CalendarReminder[] = [
    {
      id: 'rem-1',
      space_id: familySpaceId,
      user_id: ownerId,
      title: 'Pago Factura Internet Tigo Hogar',
      date: '2026-10-22',
      amount: 980.0,
      currency: 'HNL',
      type: 'bill',
      is_completed: false,
      notes: 'Contrato residencial 8920192',
      created_at: '2026-10-01T08:00:00Z',
    },
    {
      id: 'rem-2',
      space_id: familySpaceId,
      user_id: ownerId,
      title: 'Próximo Cambio de Aceite del Vehículo (17,000 Km)',
      date: '2027-01-05',
      amount: 670.0,
      currency: 'HNL',
      type: 'moto_service',
      is_completed: false,
      notes: 'Lubricentro Rápido Moto Pro',
      created_at: '2026-10-05T15:05:00Z',
    },
  ];

  const invitations: SpaceInvitation[] = [
    {
      id: 'inv-1',
      space_id: familySpaceId,
      email: 'luis.garcia@familia.local',
      role: 'space_member',
      token_hash: 'hash-abc-token-123',
      raw_token_preview: 'INV-DEMO-8742-XQ',
      expires_at: '2026-10-25T18:00:00Z',
      status: 'pending',
      invited_by: ownerId,
      invited_by_email: INITIAL_OWNER_EMAIL,
      created_at: '2026-10-15T10:00:00Z',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'aud-1',
      actor_id: ownerId,
      actor_email: INITIAL_OWNER_EMAIL,
      action: 'SYSTEM_INITIALIZED',
      target_type: 'settings',
      target_id: 'app_global_settings',
      details: { message: 'FinanzasPro Desktop configurado exitosamente' },
      created_at: '2026-09-01T08:00:00Z',
    },
  ];

  const accessRequests: AccessRequest[] = [
    {
      id: 'req-1',
      full_name: 'Roberto Gómez',
      email: 'roberto.gomez@empresa.hn',
      phone: '+504 9876-5432',
      status: 'pending',
      reason: 'Solicitud de acceso para módulo de horas y vehículo',
      requested_at: '2026-10-18T14:30:00Z',
      notification_sent: true,
    },
    {
      id: 'req-2',
      full_name: 'Ana Martínez',
      email: 'ana.martinez@finanzas.local',
      phone: '+504 3321-8899',
      status: 'pending',
      reason: 'Gestión de presupuestos y ahorros personales',
      requested_at: '2026-10-19T06:15:00Z',
      notification_sent: true,
    },
  ];

  const activationCodes: ActivationCode[] = [
    {
      id: 'act-1',
      code: 'FPRO-7892-XK91-2026',
      user_email: 'maria.garcia@familia.local',
      user_name: 'María García',
      status: 'used',
      duration_days: 365,
      duration_label: '1 Año Completo',
      expires_at: '2027-09-05T00:00:00Z',
      created_at: '2026-09-05T10:00:00Z',
      used_at: '2026-09-05T10:30:00Z',
      created_by: INITIAL_OWNER_EMAIL,
    },
    {
      id: 'act-2',
      code: 'FPRO-9941-MN42-FREE',
      user_email: 'roberto.gomez@empresa.hn',
      user_name: 'Roberto Gómez',
      status: 'active',
      duration_days: 90,
      duration_label: 'Trimestral (90 Días)',
      expires_at: '2027-01-18T00:00:00Z',
      created_at: '2026-10-18T15:00:00Z',
      created_by: INITIAL_OWNER_EMAIL,
    },
  ];

  const globalSettings: AppGlobalSettings = {
    invitation_policy: 'invitation_only',
    default_theme: 'system',
    default_currency: 'HNL',
    allow_self_space_creation: false,
    max_spaces_per_user: 5,
    require_2fa_for_owner: true,
    maintenance_mode: false,
    standard_work_hours: 8,
    default_hourly_rate: 110.0,
    overtime_50_multiplier: 1.5,
    overtime_100_multiplier: 2.0,
    lunch_break_minutes: 60,
  };

  return {
    profiles,
    spaces,
    memberships,
    invitations,
    accounts,
    categories,
    transactions,
    budgets,
    debts,
    savingGoals,
    workHours,
    fuelRecords,
    mileageRecords,
    vehicleMaintenance,
    vehicleOtherExpenses,
    generalExpenses,
    reminders,
    auditLogs,
    accessRequests,
    activationCodes,
    globalSettings,
    lastBackupDate: new Date().toISOString(),
  };
};

class LocalDatabaseManager {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Garantizar que las nuevas colecciones existan si provienen de versión anterior
        if (!parsed.fuelRecords) parsed.fuelRecords = [];
        if (!parsed.mileageRecords) parsed.mileageRecords = [];
        if (!parsed.vehicleMaintenance) parsed.vehicleMaintenance = [];
        if (!parsed.vehicleOtherExpenses) parsed.vehicleOtherExpenses = [];
        if (!parsed.generalExpenses) parsed.generalExpenses = [];
        if (!parsed.accessRequests) {
          parsed.accessRequests = [
            {
              id: 'req-1',
              full_name: 'Roberto Gómez',
              email: 'roberto.gomez@empresa.hn',
              phone: '+504 9876-5432',
              status: 'pending',
              reason: 'Solicitud de acceso para módulo de horas y vehículo',
              requested_at: '2026-10-18T14:30:00Z',
              notification_sent: true,
            },
            {
              id: 'req-2',
              full_name: 'Ana Martínez',
              email: 'ana.martinez@finanzas.local',
              phone: '+504 3321-8899',
              status: 'pending',
              reason: 'Gestión de presupuestos y ahorros personales',
              requested_at: '2026-10-19T06:15:00Z',
              notification_sent: true,
            },
          ];
        }
        if (!parsed.activationCodes) {
          parsed.activationCodes = [
            {
              id: 'act-1',
              code: 'FPRO-7892-XK91-2026',
              user_email: 'maria.garcia@familia.local',
              user_name: 'María García',
              status: 'used',
              duration_days: 365,
              duration_label: '1 Año Completo',
              expires_at: '2027-09-05T00:00:00Z',
              created_at: '2026-09-05T10:00:00Z',
              used_at: '2026-09-05T10:30:00Z',
              created_by: INITIAL_OWNER_EMAIL,
            },
            {
              id: 'act-2',
              code: 'FPRO-9941-MN42-FREE',
              user_email: 'roberto.gomez@empresa.hn',
              user_name: 'Roberto Gómez',
              status: 'active',
              duration_days: 90,
              duration_label: 'Trimestral (90 Días)',
              expires_at: '2027-01-18T00:00:00Z',
              created_at: '2026-10-18T15:00:00Z',
              created_by: INITIAL_OWNER_EMAIL,
            },
          ];
        }

        // Asegurar que cada perfil tenga contraseña
        if (parsed.profiles) {
          parsed.profiles = parsed.profiles.map((p: any) => {
            if (!p.password) {
              if (p.email === INITIAL_OWNER_EMAIL) p.password = 'Admin2026!';
              else if (p.email.includes('maria')) p.password = 'Maria2026!';
              else if (p.email.includes('carlos')) p.password = 'Carlos2026!';
              else p.password = 'Finanzas2026!';
            }
            return p;
          });
        }

        return parsed;
      }
    } catch (e) {
      console.warn('Error reading local state, falling back to seed:', e);
    }
    const initial = seedInitialDatabase();
    this.saveState(initial);
    return initial;
  }

  private saveState(state: DatabaseState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public resetToDefault(): void {
    this.state = seedInitialDatabase();
    this.saveState(this.state);
  }

  // =========================================================================
  // SECCIÓN 1: HORAS LABORALES Y HORAS EXTRAS
  // =========================================================================
  public addWorkHourLog(log: Omit<WorkHourLog, 'id' | 'created_at'>): WorkHourLog {
    const newLog: WorkHourLog = {
      ...log,
      id: 'wh-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      created_at: new Date().toISOString(),
    };
    this.state.workHours.unshift(newLog);
    this.saveState(this.state);
    return newLog;
  }

  public updateWorkHourLog(id: string, updates: Partial<WorkHourLog>): WorkHourLog | null {
    const idx = this.state.workHours.findIndex((w) => w.id === id);
    if (idx === -1) return null;
    this.state.workHours[idx] = { ...this.state.workHours[idx], ...updates };
    this.saveState(this.state);
    return this.state.workHours[idx];
  }

  public deleteWorkHourLog(id: string): boolean {
    const idx = this.state.workHours.findIndex((w) => w.id === id);
    if (idx === -1) return false;
    this.state.workHours.splice(idx, 1);
    this.saveState(this.state);
    return true;
  }

  // =========================================================================
  // SECCIÓN 2: VEHÍCULO, COMBUSTIBLE, KILOMETRAJE Y MANTENIMIENTO
  // =========================================================================
  public addFuelRecord(rec: Omit<FuelRecord, 'id' | 'created_at'>): FuelRecord {
    // Calcular distancia y rendimiento respecto al repostaje con odómetro inmediatamente anterior
    let kmSinceLast: number | undefined = undefined;
    let kml: number | undefined = undefined;
    let costPerKm: number | undefined = undefined;

    const previousFuel = this.state.fuelRecords
      .filter((f) => f.space_id === rec.space_id && f.odometer_km < rec.odometer_km)
      .sort((a, b) => b.odometer_km - a.odometer_km)[0];

    if (previousFuel) {
      kmSinceLast = rec.odometer_km - previousFuel.odometer_km;
      if (kmSinceLast > 0 && rec.fuel_quantity > 0) {
        // Si la unidad es galones, convertir a litros para km/L (1 galón US = 3.78541 L)
        const liters = rec.unit === 'gallons' ? rec.fuel_quantity * 3.78541 : rec.fuel_quantity;
        kml = parseFloat((kmSinceLast / liters).toFixed(2));
        costPerKm = parseFloat((rec.total_cost_hnl / kmSinceLast).toFixed(2));
      }
    }

    const newRec: FuelRecord = {
      ...rec,
      id: 'fuel-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      km_traveled_since_last: kmSinceLast || rec.km_traveled_since_last,
      fuel_efficiency_kml: kml || rec.fuel_efficiency_kml,
      cost_per_km_hnl: costPerKm || rec.cost_per_km_hnl,
      created_at: new Date().toISOString(),
    };

    this.state.fuelRecords.unshift(newRec);

    // Agregar también al registro de kilometraje
    if (previousFuel) {
      this.state.mileageRecords.unshift({
        id: 'mil-' + Date.now(),
        space_id: rec.space_id,
        user_id: rec.user_id,
        date: rec.refueling_date,
        previous_odometer_km: previousFuel.odometer_km,
        current_odometer_km: rec.odometer_km,
        km_traveled: rec.odometer_km - previousFuel.odometer_km,
        estimated_cost_per_km: costPerKm,
        notes: `Repostaje en ${rec.gas_station}`,
        created_at: new Date().toISOString(),
      });
    }

    this.saveState(this.state);
    return newRec;
  }

  public deleteFuelRecord(id: string): boolean {
    const idx = this.state.fuelRecords.findIndex((f) => f.id === id);
    if (idx === -1) return false;
    this.state.fuelRecords.splice(idx, 1);
    this.saveState(this.state);
    return true;
  }

  public addVehicleMaintenance(rec: Omit<VehicleMaintenanceRecord, 'id' | 'created_at'>): VehicleMaintenanceRecord {
    const prevMaint = this.state.vehicleMaintenance
      .filter((m) => m.space_id === rec.space_id && m.odometer_km < rec.odometer_km)
      .sort((a, b) => b.odometer_km - a.odometer_km)[0];

    const kmSince = prevMaint ? rec.odometer_km - prevMaint.odometer_km : undefined;

    const newMaint: VehicleMaintenanceRecord = {
      ...rec,
      id: 'vm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      km_since_previous: kmSince,
      created_at: new Date().toISOString(),
    };

    this.state.vehicleMaintenance.unshift(newMaint);

    // Si tiene próximo kilometraje o fecha, agregar recordatorio automático en calendario
    if (rec.next_maintenance_date || rec.next_maintenance_km) {
      this.state.reminders.push({
        id: 'rem-maint-' + Date.now(),
        space_id: rec.space_id,
        user_id: rec.user_id,
        title: `Próximo Servicio: ${rec.description.substring(0, 35)} (${rec.next_maintenance_km || 'Programado'} Km)`,
        date: rec.next_maintenance_date || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
        amount: rec.total_cost,
        currency: 'HNL',
        type: 'moto_service',
        is_completed: false,
        notes: `Taller recomendado: ${rec.workshop || 'Mecánico de confianza'}`,
        created_at: new Date().toISOString(),
      });
    }

    this.saveState(this.state);
    return newMaint;
  }

  public deleteVehicleMaintenance(id: string): boolean {
    const idx = this.state.vehicleMaintenance.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    this.state.vehicleMaintenance.splice(idx, 1);
    this.saveState(this.state);
    return true;
  }

  public addVehicleOtherExpense(rec: Omit<VehicleOtherExpense, 'id' | 'created_at'>): VehicleOtherExpense {
    const newOther: VehicleOtherExpense = {
      ...rec,
      id: 'vo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      created_at: new Date().toISOString(),
    };
    this.state.vehicleOtherExpenses.unshift(newOther);
    this.saveState(this.state);
    return newOther;
  }

  public deleteVehicleOtherExpense(id: string): boolean {
    const idx = this.state.vehicleOtherExpenses.findIndex((o) => o.id === id);
    if (idx === -1) return false;
    this.state.vehicleOtherExpenses.splice(idx, 1);
    this.saveState(this.state);
    return true;
  }

  // =========================================================================
  // SECCIÓN 3: GASTOS GENERALES Y CATEGORÍAS PERSONALIZABLES
  // =========================================================================
  public addGeneralExpense(exp: Omit<GeneralExpenseRecord, 'id' | 'created_at'>): GeneralExpenseRecord {
    const newExp: GeneralExpenseRecord = {
      ...exp,
      id: 'ge-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      created_at: new Date().toISOString(),
    };
    this.state.generalExpenses.unshift(newExp);
    this.saveState(this.state);
    return newExp;
  }

  public updateGeneralExpense(id: string, updates: Partial<GeneralExpenseRecord>): GeneralExpenseRecord | null {
    const idx = this.state.generalExpenses.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    this.state.generalExpenses[idx] = { ...this.state.generalExpenses[idx], ...updates };
    this.saveState(this.state);
    return this.state.generalExpenses[idx];
  }

  public deleteGeneralExpense(id: string): boolean {
    const idx = this.state.generalExpenses.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    this.state.generalExpenses.splice(idx, 1);
    this.saveState(this.state);
    return true;
  }

  // --- Gestión Dinámica de Categorías (Añadir, Renombrar, Eliminar) ---
  public addCategory(cat: Omit<Category, 'id'>): Category {
    const newCat: Category = {
      ...cat,
      id: 'cat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
    };
    this.state.categories.push(newCat);
    this.saveState(this.state);
    return newCat;
  }

  public renameCategory(id: string, newName: string, newColor?: string): boolean {
    const cat = this.state.categories.find((c) => c.id === id);
    if (!cat) return false;
    const oldName = cat.name;
    cat.name = newName.trim();
    if (newColor) cat.color = newColor;

    // Actualizar nombres en los gastos generales asociados
    this.state.generalExpenses.forEach((g) => {
      if (g.category_id === id || g.category_name === oldName) {
        g.category_name = cat.name;
      }
    });

    this.saveState(this.state);
    return true;
  }

  public deleteCategory(id: string): boolean {
    const idx = this.state.categories.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.state.categories.splice(idx, 1);
    this.saveState(this.state);
    return true;
  }

  // =========================================================================
  // CENTRO DE BASE DE DATOS Y RESPALDOS (NATIVE BACKUP & RESTORE)
  // =========================================================================
  public createDatabaseBackup(): string {
    const metadata = {
      app: 'FinanzasPro Desktop',
      version: '2.0.0',
      exported_at: new Date().toISOString(),
      owner_email: INITIAL_OWNER_EMAIL,
      total_records:
        this.state.workHours.length +
        this.state.fuelRecords.length +
        this.state.vehicleMaintenance.length +
        this.state.vehicleOtherExpenses.length +
        this.state.generalExpenses.length +
        this.state.transactions.length,
    };

    const payload = {
      metadata,
      data: this.state,
    };

    this.state.lastBackupDate = new Date().toISOString();
    this.saveState(this.state);

    return JSON.stringify(payload, null, 2);
  }

  public restoreDatabaseBackup(jsonString: string): { success: boolean; message: string; recordCount: number } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || (!parsed.data && !parsed.workHours && !parsed.profiles)) {
        return { success: false, message: 'El archivo de respaldo no tiene una estructura compatible con FinanzasPro.', recordCount: 0 };
      }

      const backupData: DatabaseState = parsed.data || parsed;

      // Validar integridad mínima
      if (!Array.isArray(backupData.profiles) || !Array.isArray(backupData.spaces)) {
        return { success: false, message: 'Estructura interna corrupta: faltan colecciones maestras.', recordCount: 0 };
      }

      // Reemplazo atómico seguro
      this.state = {
        ...seedInitialDatabase(),
        ...backupData,
        lastBackupDate: new Date().toISOString(),
      };

      this.saveState(this.state);

      const count =
        (this.state.workHours?.length || 0) +
        (this.state.fuelRecords?.length || 0) +
        (this.state.vehicleMaintenance?.length || 0) +
        (this.state.vehicleOtherExpenses?.length || 0) +
        (this.state.generalExpenses?.length || 0) +
        (this.state.transactions?.length || 0);

      return {
        success: true,
        message: `¡Base de datos restaurada con éxito! Se cargaron ${count} registros históricos.`,
        recordCount: count,
      };
    } catch (err: any) {
      return { success: false, message: `Error al procesar el archivo JSON: ${err.message}`, recordCount: 0 };
    }
  }

  public getDatabaseStats() {
    const s = this.state;
    const jsonLen = JSON.stringify(s).length;
    const kb = (jsonLen / 1024).toFixed(1);

    return {
      workHoursCount: s.workHours?.length || 0,
      fuelRecordsCount: s.fuelRecords?.length || 0,
      maintenanceCount: s.vehicleMaintenance?.length || 0,
      otherVehicleCount: s.vehicleOtherExpenses?.length || 0,
      generalExpensesCount: s.generalExpenses?.length || 0,
      categoriesCount: s.categories?.length || 0,
      accountsCount: s.accounts?.length || 0,
      totalRecords:
        (s.workHours?.length || 0) +
        (s.fuelRecords?.length || 0) +
        (s.vehicleMaintenance?.length || 0) +
        (s.vehicleOtherExpenses?.length || 0) +
        (s.generalExpenses?.length || 0) +
        (s.transactions?.length || 0),
      storageSizeKB: parseFloat(kb),
      lastBackupDate: s.lastBackupDate,
    };
  }

  // --- Transacciones (Compatibilidad) ---
  public addTransaction(tx: Omit<Transaction, 'id' | 'created_at'>): Transaction {
    const newTx: Transaction = {
      ...tx,
      id: 'tx-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    this.state.transactions.unshift(newTx);
    const sourceAccount = this.state.accounts.find((a) => a.id === tx.account_id);
    if (sourceAccount) {
      if (tx.type === 'expense') sourceAccount.balance -= tx.amount;
      else if (tx.type === 'income') sourceAccount.balance += tx.amount;
      else if (tx.type === 'transfer' && tx.destination_account_id) {
        sourceAccount.balance -= tx.amount;
        const destAccount = this.state.accounts.find((a) => a.id === tx.destination_account_id);
        if (destAccount) destAccount.balance += tx.amount;
      }
    }
    this.saveState(this.state);
    return newTx;
  }

  public deleteTransaction(id: string): boolean {
    const index = this.state.transactions.findIndex((t) => t.id === id);
    if (index === -1) return false;
    const tx = this.state.transactions[index];
    const sourceAccount = this.state.accounts.find((a) => a.id === tx.account_id);
    if (sourceAccount) {
      if (tx.type === 'expense') sourceAccount.balance += tx.amount;
      else if (tx.type === 'income') sourceAccount.balance -= tx.amount;
      else if (tx.type === 'transfer' && tx.destination_account_id) {
        sourceAccount.balance += tx.amount;
        const destAccount = this.state.accounts.find((a) => a.id === tx.destination_account_id);
        if (destAccount) destAccount.balance -= tx.amount;
      }
    }
    this.state.transactions.splice(index, 1);
    this.saveState(this.state);
    return true;
  }

  // --- Cuentas ---
  public addAccount(acc: Omit<FinancialAccount, 'id' | 'created_at'>): FinancialAccount {
    const newAcc: FinancialAccount = {
      ...acc,
      id: 'acc-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    this.state.accounts.push(newAcc);
    this.saveState(this.state);
    return newAcc;
  }

  // --- Presupuestos ---
  public saveBudget(budget: Omit<Budget, 'id' | 'created_at'>): Budget {
    const idx = this.state.budgets.findIndex(
      (b) => b.space_id === budget.space_id && b.category_id === budget.category_id
    );
    if (idx >= 0) {
      this.state.budgets[idx] = { ...this.state.budgets[idx], ...budget };
      this.saveState(this.state);
      return this.state.budgets[idx];
    }
    const newBudget: Budget = {
      ...budget,
      id: 'bdg-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    this.state.budgets.push(newBudget);
    this.saveState(this.state);
    return newBudget;
  }

  // --- Deudas ---
  public addDebt(debt: Omit<Debt, 'id' | 'created_at'>): Debt {
    const newDebt: Debt = {
      ...debt,
      id: 'dbt-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    this.state.debts.unshift(newDebt);
    this.saveState(this.state);
    return newDebt;
  }

  public recordDebtPayment(debtId: string, paymentAmount: number): Debt | null {
    const debt = this.state.debts.find((d) => d.id === debtId);
    if (!debt) return null;
    debt.remaining_amount = Math.max(0, debt.remaining_amount - paymentAmount);
    if (debt.remaining_amount === 0) debt.is_settled = true;
    this.saveState(this.state);
    return debt;
  }

  // --- Metas de Ahorro ---
  public addSavingGoal(goal: Omit<SavingGoal, 'id' | 'created_at'>): SavingGoal {
    const newGoal: SavingGoal = {
      ...goal,
      id: 'svg-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    this.state.savingGoals.unshift(newGoal);
    this.saveState(this.state);
    return newGoal;
  }

  public depositToSavingGoal(goalId: string, amount: number): SavingGoal | null {
    const goal = this.state.savingGoals.find((g) => g.id === goalId);
    if (!goal) return null;
    goal.current_amount += amount;
    if (goal.current_amount >= goal.target_amount) goal.is_completed = true;
    this.saveState(this.state);
    return goal;
  }

  // --- Recordatorios ---
  public addReminder(reminder: Omit<CalendarReminder, 'id' | 'created_at'>): CalendarReminder {
    const newRem: CalendarReminder = {
      ...reminder,
      id: 'rem-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    this.state.reminders.push(newRem);
    this.saveState(this.state);
    return newRem;
  }

  public toggleReminder(id: string): void {
    const rem = this.state.reminders.find((r) => r.id === id);
    if (rem) {
      rem.is_completed = !rem.is_completed;
      this.saveState(this.state);
    }
  }

  // --- Control de Usuarios & Auditoría ---
  public suspendUser(actorId: string, actorEmail: string, targetUserId: string, reason: string): boolean {
    const target = this.state.profiles.find((p) => p.id === targetUserId);
    if (!target) return false;
    if (target.global_role === 'owner') {
      throw new Error('Regla de seguridad: La cuenta del Administrador Propietario no puede ser suspendida.');
    }
    target.status = 'suspended';
    target.suspended_at = new Date().toISOString();
    target.suspended_by = actorId;
    target.suspension_reason = reason;

    this.logAudit({
      actor_id: actorId,
      actor_email: actorEmail,
      action: 'USER_SUSPENDED',
      target_type: 'user',
      target_id: targetUserId,
      details: { target_email: target.email, reason },
    });

    this.saveState(this.state);
    return true;
  }

  public reactivateUser(actorId: string, actorEmail: string, targetUserId: string): boolean {
    const target = this.state.profiles.find((p) => p.id === targetUserId);
    if (!target) return false;
    target.status = 'active';
    target.suspended_at = null;
    target.suspended_by = null;
    target.suspension_reason = null;

    this.logAudit({
      actor_id: actorId,
      actor_email: actorEmail,
      action: 'USER_REACTIVATED',
      target_type: 'user',
      target_id: targetUserId,
      details: { target_email: target.email },
    });

    this.saveState(this.state);
    return true;
  }

  public createInvitation(inv: {
    space_id: string;
    email: string;
    role: any;
    invited_by: string;
    invited_by_email: string;
    expires_in_days: number;
  }): SpaceInvitation {
    const rawToken = 'INV-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
    const tokenHash = 'hash_' + rawToken;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + inv.expires_in_days);

    const newInv: SpaceInvitation = {
      id: 'inv-' + Date.now(),
      space_id: inv.space_id,
      email: inv.email.toLowerCase().trim(),
      role: inv.role,
      token_hash: tokenHash,
      raw_token_preview: rawToken,
      expires_at: expiresAt.toISOString(),
      status: 'pending',
      invited_by: inv.invited_by,
      invited_by_email: inv.invited_by_email,
      created_at: new Date().toISOString(),
    };

    this.state.invitations.unshift(newInv);
    this.saveState(this.state);
    return newInv;
  }

  public revokeInvitation(actorId: string, actorEmail: string, invitationId: string): boolean {
    const inv = this.state.invitations.find((i) => i.id === invitationId);
    if (!inv) return false;
    inv.status = 'revoked';
    inv.revoked_at = new Date().toISOString();
    this.saveState(this.state);
    return true;
  }

  public updateSpaceCurrency(spaceId: string, newCurrency: string): FamilySpace | null {
    const space = this.state.spaces.find((s) => s.id === spaceId);
    if (!space) return null;
    space.currency = newCurrency;
    space.updated_at = new Date().toISOString();
    this.saveState(this.state);
    return space;
  }

  public updateGlobalSettings(actorId: string, actorEmail: string, newSettings: Partial<AppGlobalSettings>): AppGlobalSettings {
    this.state.globalSettings = { ...this.state.globalSettings, ...newSettings };
    this.saveState(this.state);
    return this.state.globalSettings;
  }

  public logAudit(log: Omit<AuditLog, 'id' | 'created_at'>): void {
    const newLog: AuditLog = {
      ...log,
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString(),
    };
    if (!this.state.auditLogs) this.state.auditLogs = [];
    this.state.auditLogs.unshift(newLog);
    this.saveState(this.state);
  }

  public authenticate(email: string, password: string): { success: boolean; user?: UserProfile; message?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.state.profiles.find((p) => p.email.toLowerCase() === cleanEmail);
    if (!user) {
      return { success: false, message: 'No existe una cuenta registrada con este correo electrónico.' };
    }
    if (user.status === 'suspended') {
      return { success: false, message: `Cuenta suspendida: ${user.suspension_reason || 'Consulte al administrador global.'}` };
    }
    if (user.status === 'pending_approval' || user.status === 'pending_verification') {
      return { success: false, message: 'Tu cuenta está pendiente de aprobación por el administrador principal.' };
    }
    if (user.password && user.password !== password) {
      return { success: false, message: 'Contraseña incorrecta. Por favor verifica tus credenciales.' };
    }

    user.last_login_at = new Date().toISOString();
    this.saveState(this.state);
    return { success: true, user };
  }

  public getUserPassword(userId: string): string | undefined {
    const user = this.state.profiles.find((p) => p.id === userId);
    return user?.password;
  }

  public updateUserPassword(actorId: string, actorEmail: string, targetUserId: string, newPassword: string): boolean {
    const user = this.state.profiles.find((p) => p.id === targetUserId);
    if (!user) return false;
    user.password = newPassword;
    this.logAudit({
      actor_id: actorId,
      actor_email: actorEmail,
      action: 'USER_PASSWORD_UPDATED',
      target_type: 'user',
      target_id: targetUserId,
      details: { target_email: user.email },
    });
    this.saveState(this.state);
    return true;
  }

  public getAccessRequests(): AccessRequest[] {
    return this.state.accessRequests || [];
  }

  public createAccessRequest(req: { full_name: string; email: string; phone?: string; reason?: string }): AccessRequest {
    if (!this.state.accessRequests) this.state.accessRequests = [];
    const newReq: AccessRequest = {
      id: 'req-' + Date.now(),
      full_name: req.full_name.trim(),
      email: req.email.trim().toLowerCase(),
      phone: req.phone?.trim() || '',
      status: 'pending',
      reason: req.reason?.trim() || 'Solicitud de acceso al sistema',
      requested_at: new Date().toISOString(),
      notification_sent: true,
    };
    this.state.accessRequests.unshift(newReq);
    this.saveState(this.state);
    return newReq;
  }

  public approveAccessRequest(
    actorId: string,
    actorEmail: string,
    requestId: string,
    durationDays: number = 365,
    durationLabel: string = '1 Año Completo'
  ): { success: boolean; code?: string; message: string } {
    const req = this.state.accessRequests?.find((r) => r.id === requestId);
    if (!req) return { success: false, message: 'Solicitud no encontrada.' };

    const randomSeg = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `FPRO-${randomSeg}-${Date.now().toString().slice(-4)}`;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const activationCode: ActivationCode = {
      id: 'act-' + Date.now(),
      code,
      user_email: req.email,
      user_name: req.full_name,
      status: 'active',
      duration_days: durationDays,
      duration_label: durationLabel,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
      created_by: actorEmail,
    };

    if (!this.state.activationCodes) this.state.activationCodes = [];
    this.state.activationCodes.unshift(activationCode);

    req.status = 'approved';
    req.activation_code = code;
    req.reviewed_at = new Date().toISOString();
    req.reviewed_by = actorEmail;

    this.logAudit({
      actor_id: actorId,
      actor_email: actorEmail,
      action: 'ACCESS_REQUEST_APPROVED',
      target_type: 'user',
      target_id: requestId,
      details: { email: req.email, generated_code: code },
    });

    this.saveState(this.state);
    return { success: true, code, message: 'Solicitud aprobada con éxito. Código generado: ' + code };
  }

  public rejectAccessRequest(actorId: string, actorEmail: string, requestId: string, reason?: string): boolean {
    const req = this.state.accessRequests?.find((r) => r.id === requestId);
    if (!req) return false;
    req.status = 'rejected';
    req.reviewed_at = new Date().toISOString();
    req.reviewed_by = actorEmail;
    this.logAudit({
      actor_id: actorId,
      actor_email: actorEmail,
      action: 'ACCESS_REQUEST_REJECTED',
      target_type: 'user',
      target_id: requestId,
      details: { email: req.email, reason: reason || 'Rechazado administrativamente' },
    });
    this.saveState(this.state);
    return true;
  }

  public withdrawAccessRequest(actorId: string, actorEmail: string, requestId: string): boolean {
    if (!this.state.accessRequests) return false;
    const idx = this.state.accessRequests.findIndex((r) => r.id === requestId);
    if (idx === -1) return false;
    const removed = this.state.accessRequests.splice(idx, 1)[0];
    this.logAudit({
      actor_id: actorId,
      actor_email: actorEmail,
      action: 'ACCESS_REQUEST_WITHDRAWN',
      target_type: 'user',
      target_id: requestId,
      details: { email: removed.email },
    });
    this.saveState(this.state);
    return true;
  }

  public getActivationCodes(): ActivationCode[] {
    return this.state.activationCodes || [];
  }

  public createActivationCode(data: {
    user_email: string;
    user_name: string;
    duration_days: number;
    duration_label: string;
    created_by: string;
  }): ActivationCode {
    if (!this.state.activationCodes) this.state.activationCodes = [];
    const randomSeg = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `FPRO-${randomSeg}-${Date.now().toString().slice(-4)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.duration_days);

    const newCode: ActivationCode = {
      id: 'act-' + Date.now(),
      code,
      user_email: data.user_email.trim().toLowerCase(),
      user_name: data.user_name.trim(),
      status: 'active',
      duration_days: data.duration_days,
      duration_label: data.duration_label,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
      created_by: data.created_by,
    };
    this.state.activationCodes.unshift(newCode);
    this.logAudit({
      actor_id: 'owner',
      actor_email: data.created_by,
      action: 'ACTIVATION_CODE_CREATED',
      target_type: 'license',
      target_id: newCode.id,
      details: { code, email: data.user_email },
    });
    this.saveState(this.state);
    return newCode;
  }

  public redeemActivationCode(
    codeStr: string,
    email: string,
    password?: string,
    fullName?: string
  ): { success: boolean; user?: UserProfile; message: string } {
    if (!this.state.activationCodes) this.state.activationCodes = [];
    const cleanCode = codeStr.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    const codeObj = this.state.activationCodes.find(
      (c) => c.code.toUpperCase() === cleanCode
    );

    if (!codeObj) {
      return { success: false, message: 'Código de activación inválido.' };
    }
    if (codeObj.status === 'used') {
      return { success: false, message: 'Este código de activación ya fue canjeado anteriormente.' };
    }
    if (codeObj.status === 'expired' || new Date(codeObj.expires_at) < new Date()) {
      return { success: false, message: 'Este código de activación ha caducado.' };
    }
    if (codeObj.status === 'revoked') {
      return { success: false, message: 'Este código ha sido revocado por el administrador.' };
    }

    codeObj.status = 'used';
    codeObj.used_at = new Date().toISOString();

    let user = this.state.profiles.find((p) => p.email.toLowerCase() === cleanEmail);
    if (!user) {
      user = {
        id: 'usr-' + Date.now(),
        email: cleanEmail,
        display_name: fullName?.trim() || codeObj.user_name || cleanEmail.split('@')[0],
        password: password || 'Finanzas2026!',
        global_role: 'user',
        status: 'active',
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
        license_expires_at: codeObj.expires_at,
      };
      this.state.profiles.push(user);
    } else {
      user.status = 'active';
      user.license_expires_at = codeObj.expires_at;
      if (password) user.password = password;
      if (fullName) user.display_name = fullName;
    }

    this.ensurePersonalSpace(user.id, user.display_name);

    this.logAudit({
      actor_id: user.id,
      actor_email: user.email,
      action: 'ACTIVATION_CODE_REDEEMED',
      target_type: 'license',
      target_id: codeObj.id,
      details: { code: cleanCode, email: user.email },
    });

    this.saveState(this.state);
    return { success: true, user, message: 'Código canjeado con éxito. ¡Bienvenido!' };
  }

  public archiveActivationCode(actorId: string, actorEmail: string, codeId: string): boolean {
    const code = this.state.activationCodes?.find((c) => c.id === codeId);
    if (!code) return false;
    code.status = code.status === 'expired' ? 'active' : 'expired';
    this.saveState(this.state);
    return true;
  }

  public deleteActivationCode(actorId: string, actorEmail: string, codeId: string): boolean {
    if (!this.state.activationCodes) return false;
    const idx = this.state.activationCodes.findIndex((c) => c.id === codeId);
    if (idx === -1) return false;
    const removed = this.state.activationCodes.splice(idx, 1)[0];
    this.logAudit({
      actor_id: actorId,
      actor_email: actorEmail,
      action: 'ACTIVATION_CODE_DELETED',
      target_type: 'license',
      target_id: codeId,
      details: { code: removed.code, user_email: removed.user_email },
    });
    this.saveState(this.state);
    return true;
  }

  public clearAuditLogs(actorId: string, actorEmail: string): boolean {
    const count = this.state.auditLogs.length;
    this.state.auditLogs = [];
    this.logAudit({
      actor_id: actorId,
      actor_email: actorEmail,
      action: 'AUDIT_LOGS_CLEARED',
      target_type: 'security',
      target_id: 'audit_table',
      details: { purged_count: count },
    });
    return true;
  }

  public deleteAuditLog(actorId: string, actorEmail: string, logId: string): boolean {
    const idx = this.state.auditLogs.findIndex((l) => l.id === logId);
    if (idx === -1) return false;
    this.state.auditLogs.splice(idx, 1);
    this.saveState(this.state);
    return true;
  }

  public ensurePersonalSpace(userId: string, userName: string): FamilySpace {
    let space = this.state.spaces.find((s) => s.created_by === userId && s.is_personal);
    if (!space) {
      space = {
        id: 'spc-personal-' + userId,
        name: `Espacio de ${userName.split(' ')[0]}`,
        description: 'Espacio financiero personal privado e independiente.',
        currency: 'HNL',
        created_by: userId,
        is_personal: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.state.spaces.push(space);

      // Agregar membresía admin
      this.state.memberships.push({
        id: 'mem-' + Date.now(),
        space_id: space.id,
        user_id: userId,
        role: 'space_admin',
        joined_at: new Date().toISOString(),
      });

      this.saveState(this.state);
    }
    return space;
  }
}

export const localDB = new LocalDatabaseManager();
