/**
 * Definiciones de tipos de la base de datos y modelo de dominio
 * para FinanzasPro Desktop Application
 */

export type GlobalRole = 'owner' | 'user';

export type UserStatus = 'active' | 'suspended' | 'pending_verification' | 'pending_approval' | 'blocked';

export type SpaceRole = 'space_admin' | 'space_member' | 'space_viewer';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export type AccountType = 'cash' | 'bank' | 'credit_card' | 'savings' | 'investment';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type DebtType = 'i_owe' | 'they_owe_me';

export type MaintenanceType =
  | 'oil_change'
  | 'tires'
  | 'brakes'
  | 'chain_sprocket'
  | 'engine_tuneup'
  | 'battery'
  | 'suspension'
  | 'general_inspection'
  | 'repair'
  | 'other';

export type VehicleOtherExpenseType =
  | 'repairs'
  | 'tires'
  | 'spare_parts'
  | 'insurance'
  | 'registration'
  | 'parking'
  | 'car_wash'
  | 'toll'
  | 'other';

export type FuelUnit = 'liters' | 'gallons';
export type FuelType = 'super' | 'regular' | 'diesel' | 'glp';

export interface UserProfile {
  id: string;
  email: string;
  password?: string;
  display_name: string;
  avatar_url?: string;
  global_role: GlobalRole;
  status: UserStatus;
  suspended_at?: string | null;
  suspended_by?: string | null;
  suspension_reason?: string | null;
  created_at: string;
  last_login_at?: string | null;
  license_expires_at?: string | null;
}

export interface AccessRequest {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  notification_sent: boolean;
  activation_code?: string;
}

export interface ActivationCode {
  id: string;
  code: string;
  user_email: string;
  user_name: string;
  status: 'active' | 'used' | 'expired' | 'revoked';
  duration_days: number;
  duration_label: string;
  expires_at: string;
  created_at: string;
  used_at?: string;
  created_by: string;
}


export interface FamilySpace {
  id: string;
  name: string;
  description?: string;
  currency: string;
  created_by: string;
  is_personal: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpaceMembership {
  id: string;
  space_id: string;
  user_id: string;
  role: SpaceRole;
  joined_at: string;
  space?: FamilySpace;
  user?: UserProfile;
}

export interface SpaceInvitation {
  id: string;
  space_id: string;
  email: string;
  role: SpaceRole;
  token_hash: string;
  raw_token_preview?: string;
  expires_at: string;
  status: InvitationStatus;
  invited_by: string;
  invited_by_email?: string;
  created_at: string;
  accepted_at?: string | null;
  revoked_at?: string | null;
  space?: FamilySpace;
}

export interface FinancialAccount {
  id: string;
  space_id: string;
  user_id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  initial_balance: number;
  institution_name?: string;
  is_archived: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  space_id?: string | null;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  is_system_default?: boolean;
}

export interface Transaction {
  id: string;
  space_id: string;
  user_id: string;
  account_id: string;
  destination_account_id?: string | null;
  category_id?: string | null;
  type: TransactionType;
  amount: number;
  currency: string;
  exchange_rate?: number;
  date: string; // YYYY-MM-DD
  description: string;
  tags?: string[];
  receipt_url?: string | null;
  payment_method?: string;
  created_at: string;
  account_name?: string;
  destination_account_name?: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  author_email?: string;
}

export interface Budget {
  id: string;
  space_id: string;
  category_id: string;
  period: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  alert_threshold_percent: number;
  created_at: string;
  spent_amount?: number;
  category_name?: string;
}

export interface Debt {
  id: string;
  space_id: string;
  user_id: string;
  type: DebtType;
  counterparty: string;
  total_amount: number;
  remaining_amount: number;
  interest_rate: number;
  due_date?: string;
  currency: string;
  notes?: string;
  is_settled: boolean;
  created_at: string;
}

export interface SavingGoal {
  id: string;
  space_id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  target_date?: string;
  color: string;
  is_completed: boolean;
  created_at: string;
}

/* =========================================================================
   SECCIÓN 1: HORAS LABORALES Y HORAS EXTRAS (DETALLADO Y AUDITABLE)
   ========================================================================= */
export interface WorkHourLog {
  id: string;
  space_id: string;
  user_id: string;
  work_date: string; // YYYY-MM-DD
  arrival_time: string; // HH:MM
  departure_time: string; // HH:MM
  break_duration_mins: number; // Minutos de descanso
  total_worked_hours: number; // Tiempo total transcurrido - descanso
  regular_hours: number; // Horas ordinarias (estándar 8h o configurable)
  overtime_50_hours: number; // Horas extras diurnas al 50%
  overtime_100_hours: number; // Horas extras nocturnas/festivas al 100%
  hourly_rate: number;
  currency: string;
  total_pay: number; // Salario bruto calculado
  employee_id?: string;
  notes?: string;
  created_at: string;
}

/* =========================================================================
   SECCIÓN 2: VEHÍCULO, COMBUSTIBLE, KILOMETRAJE Y MANTENIMIENTO
   ========================================================================= */
export interface FuelRecord {
  id: string;
  space_id: string;
  user_id: string;
  refueling_date: string; // YYYY-MM-DD
  odometer_km: number;
  fuel_quantity: number; // Cantidad en litros o galones
  fuel_type: FuelType;
  unit: FuelUnit;
  total_cost_hnl: number;
  cost_per_unit: number; // HNL por litro/galón
  gas_station: string;
  is_full_tank: boolean; // Solo calcular rendimiento fiable si llenó tanque
  km_traveled_since_last?: number;
  fuel_efficiency_kml?: number; // km/L
  cost_per_km_hnl?: number; // Costo por km en combustible
  notes?: string;
  created_at: string;
}

export interface MileageRecord {
  id: string;
  space_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  current_odometer_km: number;
  previous_odometer_km: number;
  km_traveled: number;
  estimated_cost_per_km?: number;
  notes?: string;
  created_at: string;
}

export interface VehicleMaintenanceRecord {
  id: string;
  space_id: string;
  user_id: string;
  maintenance_date: string; // YYYY-MM-DD
  odometer_km: number;
  maintenance_type: MaintenanceType;
  description: string;
  parts_replaced?: string;
  parts_cost: number;
  labor_cost: number;
  total_cost: number;
  workshop?: string;
  next_maintenance_date?: string;
  next_maintenance_km?: number;
  km_since_previous?: number;
  notes?: string;
  created_at: string;
}

export interface VehicleOtherExpense {
  id: string;
  space_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  expense_type: VehicleOtherExpenseType;
  description: string;
  amount_hnl: number;
  payment_method: string;
  notes?: string;
  created_at: string;
}

/* =========================================================================
   SECCIÓN 3: GASTOS GENERALES Y CATEGORÍAS PERSONALIZABLES
   ========================================================================= */
export interface GeneralExpenseRecord {
  id: string;
  space_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  category_id: string;
  category_name: string;
  description: string;
  amount_hnl: number;
  payment_method: string;
  notes?: string;
  receipt_ref?: string;
  created_at: string;
}

/* =========================================================================
   SISTEMA DE LICENCIAMIENTO SEGURO Y DISTRIBUCIÓN DESKTOP WINDOWS
   ========================================================================= */
export interface SoftwareLicense {
  id: string;
  license_key: string; // FPRO-XXXX-XXXX-XXXX
  customer_name: string;
  customer_email: string;
  tier: 'personal' | 'professional' | 'enterprise';
  max_installations: number;
  activations_count: number;
  issued_at: string;
  expires_at: string; // YYYY-MM-DD o 'lifetime'
  status: 'active' | 'revoked' | 'expired';
  machine_fingerprints: string[];
  signature: string;
  created_at: string;
}

export interface ActivationStatus {
  is_activated: boolean;
  license_key?: string;
  customer_name?: string;
  tier?: 'personal' | 'professional' | 'enterprise';
  expires_at?: string;
  machine_id?: string;
  activated_at?: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_email: string;
  action: string;
  target_type: 'user' | 'invitation' | 'membership' | 'space' | 'settings' | 'security' | 'license' | 'backup';
  target_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface AppGlobalSettings {
  invitation_policy: 'invitation_only' | 'closed';
  default_theme: 'light' | 'dark' | 'system';
  default_currency: string;
  allow_self_space_creation: boolean;
  max_spaces_per_user: number;
  require_2fa_for_owner: boolean;
  maintenance_mode: boolean;
  standard_work_hours: number; // 8
  default_hourly_rate: number; // 110
  overtime_50_multiplier: number; // 1.5
  overtime_100_multiplier: number; // 2.0
  lunch_break_minutes: number; // 60
}

export interface CalendarReminder {
  id: string;
  space_id: string;
  user_id: string;
  title: string;
  date: string;
  amount?: number;
  currency?: string;
  type: 'bill' | 'debt_due' | 'saving_milestone' | 'moto_service' | 'custom';
  is_completed: boolean;
  notes?: string;
  created_at: string;
}

export interface DatabaseBackupMetadata {
  version: string;
  backup_date: string;
  exported_by: string;
  space_id?: string;
  total_records: number;
  checksum: string;
}

export interface AiTransactionDraft {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  category_id?: string;
  category_name?: string;
  account_id?: string;
  account_name?: string;
  description: string;
  date: string;
  confidence: number;
  explanation?: string;
}

export interface MotoRecord {
  id: string;
  space_id: string;
  user_id: string;
  date: string;
  odometer_km: number;
  maintenance_type: MaintenanceType | 'fuel';
  fuel_liters?: number;
  total_cost: number;
  workshop?: string;
  invoice_ref?: string;
  notes?: string;
  fuel_economy_kml?: number;
  created_at: string;
}
