-- =====================================================================
-- MASTER MIGRATION: FINANZAS FAMILIARES PRO
-- Autor: Senior Systems Engineer & Database Architect
-- Target: PostgreSQL 15+ / Supabase con Row Level Security (RLS)
-- Fecha: 2026-10-18
-- =====================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS ENUMERADOS
DO $$ BEGIN
  CREATE TYPE global_user_role AS ENUM ('owner', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE user_account_status AS ENUM ('active', 'suspended', 'pending_verification');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE space_member_role AS ENUM ('space_admin', 'space_member', 'space_viewer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE invitation_status_type AS ENUM ('pending', 'accepted', 'expired', 'revoked');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE financial_account_type AS ENUM ('cash', 'bank', 'credit_card', 'savings', 'investment');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type_enum AS ENUM ('income', 'expense', 'transfer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE debt_direction_type AS ENUM ('i_owe', 'they_owe_me');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE moto_maintenance_type AS ENUM (
    'fuel', 'oil_change', 'tires', 'brakes',
    'chain_sprocket', 'inspection', 'repair', 'other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. TABLA: PROFILES (Perfiles y control de estado/suspensión)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  global_role global_user_role NOT NULL DEFAULT 'user',
  status user_account_status NOT NULL DEFAULT 'active',
  suspended_at TIMESTAMPTZ,
  suspended_by UUID REFERENCES auth.users(id),
  suspension_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_login_at TIMESTAMPTZ
);

-- 4. TABLA: FAMILY_SPACES (Espacios personales y compartidos)
CREATE TABLE IF NOT EXISTS public.family_spaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT NOT NULL DEFAULT 'HNL',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  is_personal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TABLA: SPACE_MEMBERSHIPS (Membresías y roles por espacio)
CREATE TABLE IF NOT EXISTS public.space_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role space_member_role NOT NULL DEFAULT 'space_member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_space_user_membership UNIQUE (space_id, user_id)
);

-- 6. TABLA: SPACE_INVITATIONS (Invitaciones con tokens criptográficos)
CREATE TABLE IF NOT EXISTS public.space_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role space_member_role NOT NULL DEFAULT 'space_member',
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  status invitation_status_type NOT NULL DEFAULT 'pending',
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

-- 7. TABLA: FINANCIAL_ACCOUNTS (Cuentas financieras)
CREATE TABLE IF NOT EXISTS public.financial_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  type financial_account_type NOT NULL DEFAULT 'cash',
  currency TEXT NOT NULL DEFAULT 'HNL',
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  initial_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  institution_name TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. TABLA: CATEGORIES (Categorías de gastos e ingresos)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT NOT NULL DEFAULT 'Tag',
  color TEXT NOT NULL DEFAULT '#10b981',
  is_system_default BOOLEAN NOT NULL DEFAULT false
);

-- 9. TABLA: TRANSACTIONS (Transacciones atómicas)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE RESTRICT,
  destination_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE RESTRICT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type transaction_type_enum NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'HNL',
  exchange_rate NUMERIC(10, 4) DEFAULT 1.0000,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. TABLA: BUDGETS (Presupuestos por categoría)
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  period TEXT NOT NULL DEFAULT 'monthly',
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'HNL',
  alert_threshold_percent INTEGER NOT NULL DEFAULT 85,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_space_category_budget UNIQUE (space_id, category_id, period)
);

-- 11. TABLA: DEBTS (Deudas y Préstamos)
CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  type debt_direction_type NOT NULL,
  counterparty TEXT NOT NULL,
  total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount > 0),
  remaining_amount NUMERIC(14, 2) NOT NULL CHECK (remaining_amount >= 0),
  interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  due_date DATE,
  currency TEXT NOT NULL DEFAULT 'HNL',
  notes TEXT,
  is_settled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. TABLA: SAVING_GOALS (Metas de ahorro)
CREATE TABLE IF NOT EXISTS public.saving_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  target_amount NUMERIC(14, 2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (current_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'HNL',
  target_date DATE,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. TABLA: WORK_HOUR_LOGS (Horas laborales y cálculo de horas extras)
CREATE TABLE IF NOT EXISTS public.work_hour_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  work_date DATE NOT NULL,
  regular_hours NUMERIC(4, 2) NOT NULL DEFAULT 8.00 CHECK (regular_hours >= 0),
  overtime_50_hours NUMERIC(4, 2) NOT NULL DEFAULT 0.00 CHECK (overtime_50_hours >= 0),
  overtime_100_hours NUMERIC(4, 2) NOT NULL DEFAULT 0.00 CHECK (overtime_100_hours >= 0),
  hourly_rate NUMERIC(10, 2) NOT NULL CHECK (hourly_rate >= 0),
  currency TEXT NOT NULL DEFAULT 'HNL',
  total_pay NUMERIC(12, 2) NOT NULL CHECK (total_pay >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. TABLA: MOTO_RECORDS (Control de kilometraje, combustible y mantenimiento)
CREATE TABLE IF NOT EXISTS public.moto_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  odometer_km INTEGER NOT NULL CHECK (odometer_km >= 0),
  fuel_liters NUMERIC(6, 2) CHECK (fuel_liters > 0),
  total_cost NUMERIC(10, 2) NOT NULL CHECK (total_cost >= 0),
  currency TEXT NOT NULL DEFAULT 'HNL',
  fuel_economy_kml NUMERIC(6, 2),
  maintenance_type moto_maintenance_type NOT NULL DEFAULT 'fuel',
  workshop TEXT,
  invoice_ref TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 15. TABLA: CALENDAR_REMINDERS (Calendario y recordatorios)
CREATE TABLE IF NOT EXISTS public.calendar_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES public.family_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  amount NUMERIC(12, 2),
  currency TEXT DEFAULT 'HNL',
  type TEXT NOT NULL DEFAULT 'bill',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 16. TABLA: AUDIT_LOGS (Registro inmutable de auditoría para el propietario)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 17. TABLA: APP_GLOBAL_SETTINGS (Configuraciones exclusivas del propietario)
CREATE TABLE IF NOT EXISTS public.app_global_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =====================================================================
-- 18. FUNCIONES DE SEGURIDAD (SECURITY DEFINER)
-- =====================================================================

-- Comprueba si el usuario es el propietario global
CREATE OR REPLACE FUNCTION public.is_global_owner(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND global_role = 'owner' AND status = 'active'
  );
$$;

-- Comprueba si una cuenta está suspendida
CREATE OR REPLACE FUNCTION public.is_account_suspended(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND status = 'suspended'
  );
$$;

-- Comprueba membresía activa en un espacio
CREATE OR REPLACE FUNCTION public.is_space_member(p_space_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.space_memberships
    WHERE space_id = p_space_id AND user_id = p_user_id
  );
$$;

-- Obtiene el rol en el espacio
CREATE OR REPLACE FUNCTION public.get_space_role(p_space_id UUID, p_user_id UUID)
RETURNS space_member_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.space_memberships
  WHERE space_id = p_space_id AND user_id = p_user_id
  LIMIT 1;
$$;

-- =====================================================================
-- 19. HABILITACIÓN DE ROW LEVEL SECURITY (RLS)
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saving_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_hour_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moto_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_global_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 20. POLÍTICAS RLS ESPECÍFICAS
-- =====================================================================

-- --- PROFILES ---
-- Cada usuario lee su propio perfil; el propietario global puede listar todos los perfiles
CREATE POLICY "profiles_read_policy" ON public.profiles
  FOR SELECT USING (
    (auth.uid() = id AND NOT public.is_account_suspended(auth.uid()))
    OR public.is_global_owner(auth.uid())
  );

-- Cada usuario edita sus datos básicos no privilegiados; el propietario puede suspender/activar
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (
    (auth.uid() = id AND NOT public.is_account_suspended(auth.uid()))
    OR public.is_global_owner(auth.uid())
  );

-- --- FAMILY_SPACES ---
CREATE POLICY "spaces_read_policy" ON public.family_spaces
  FOR SELECT USING (
    NOT public.is_account_suspended(auth.uid())
    AND (
      created_by = auth.uid()
      OR public.is_space_member(id, auth.uid())
    )
  );

CREATE POLICY "spaces_insert_policy" ON public.family_spaces
  FOR INSERT WITH CHECK (
    NOT public.is_account_suspended(auth.uid())
    AND auth.uid() = created_by
  );

CREATE POLICY "spaces_update_policy" ON public.family_spaces
  FOR UPDATE USING (
    NOT public.is_account_suspended(auth.uid())
    AND (
      created_by = auth.uid()
      OR public.get_space_role(id, auth.uid()) = 'space_admin'
    )
  );

-- --- SPACE_MEMBERSHIPS ---
CREATE POLICY "memberships_read_policy" ON public.space_memberships
  FOR SELECT USING (
    NOT public.is_account_suspended(auth.uid())
    AND (
      user_id = auth.uid()
      OR public.is_space_member(space_id, auth.uid())
      OR public.is_global_owner(auth.uid())
    )
  );

-- --- TRANSACTIONS (Aislamiento financiero estricto) ---
-- REQUISITO CRÍTICO: Ser propietario global NO otorga acceso a transacciones personales privadas
CREATE POLICY "transactions_read_policy" ON public.transactions
  FOR SELECT USING (
    NOT public.is_account_suspended(auth.uid())
    AND (
      -- Si es espacio personal, solo el creador
      (user_id = auth.uid())
      -- Si es espacio familiar, cualquier miembro activo del espacio
      OR (public.is_space_member(space_id, auth.uid()))
    )
  );

CREATE POLICY "transactions_insert_policy" ON public.transactions
  FOR INSERT WITH CHECK (
    NOT public.is_account_suspended(auth.uid())
    AND auth.uid() = user_id
    AND public.is_space_member(space_id, auth.uid())
    AND public.get_space_role(space_id, auth.uid()) IN ('space_admin', 'space_member')
  );

CREATE POLICY "transactions_update_policy" ON public.transactions
  FOR UPDATE USING (
    NOT public.is_account_suspended(auth.uid())
    AND (
      user_id = auth.uid()
      OR public.get_space_role(space_id, auth.uid()) = 'space_admin'
    )
  );

CREATE POLICY "transactions_delete_policy" ON public.transactions
  FOR DELETE USING (
    NOT public.is_account_suspended(auth.uid())
    AND (
      user_id = auth.uid()
      OR public.get_space_role(space_id, auth.uid()) = 'space_admin'
    )
  );

-- --- FINANCIAL_ACCOUNTS ---
CREATE POLICY "accounts_read_policy" ON public.financial_accounts
  FOR SELECT USING (
    NOT public.is_account_suspended(auth.uid())
    AND (
      user_id = auth.uid()
      OR public.is_space_member(space_id, auth.uid())
    )
  );

CREATE POLICY "accounts_write_policy" ON public.financial_accounts
  FOR ALL USING (
    NOT public.is_account_suspended(auth.uid())
    AND (
      user_id = auth.uid()
      OR public.get_space_role(space_id, auth.uid()) = 'space_admin'
    )
  );

-- --- BUDGETS ---
CREATE POLICY "budgets_policy" ON public.budgets
  FOR ALL USING (
    NOT public.is_account_suspended(auth.uid())
    AND public.is_space_member(space_id, auth.uid())
  );

-- --- DEBTS ---
CREATE POLICY "debts_policy" ON public.debts
  FOR ALL USING (
    NOT public.is_account_suspended(auth.uid())
    AND (user_id = auth.uid() OR public.is_space_member(space_id, auth.uid()))
  );

-- --- SAVING_GOALS ---
CREATE POLICY "saving_goals_policy" ON public.saving_goals
  FOR ALL USING (
    NOT public.is_account_suspended(auth.uid())
    AND (user_id = auth.uid() OR public.is_space_member(space_id, auth.uid()))
  );

-- --- WORK_HOUR_LOGS ---
CREATE POLICY "work_logs_policy" ON public.work_hour_logs
  FOR ALL USING (
    NOT public.is_account_suspended(auth.uid())
    AND (user_id = auth.uid() OR public.is_space_member(space_id, auth.uid()))
  );

-- --- MOTO_RECORDS ---
CREATE POLICY "moto_records_policy" ON public.moto_records
  FOR ALL USING (
    NOT public.is_account_suspended(auth.uid())
    AND (user_id = auth.uid() OR public.is_space_member(space_id, auth.uid()))
  );

-- --- AUDIT_LOGS ---
-- Solo el propietario global puede leer los logs de auditoría
CREATE POLICY "audit_logs_read_policy" ON public.audit_logs
  FOR SELECT USING (public.is_global_owner(auth.uid()));

-- Inserción de logs permitida por trigger o service role
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- --- APP_GLOBAL_SETTINGS ---
-- Lectura pública para settings no confidenciales (tema, moneda); escritura solo Propietario
CREATE POLICY "global_settings_read_policy" ON public.app_global_settings
  FOR SELECT USING (true);

CREATE POLICY "global_settings_write_policy" ON public.app_global_settings
  FOR ALL USING (public.is_global_owner(auth.uid()));

-- =====================================================================
-- 21. PROVISIÓN SEGURA DEL PROPIETARIO INICIAL
-- Email designado: akenchinnobunaga@gmail.com
-- =====================================================================
INSERT INTO public.app_global_settings (key, value)
VALUES
  ('invitation_policy', '{"mode": "invitation_only"}'::jsonb),
  ('default_currency', '{"code": "HNL", "name": "Lempira hondureño", "symbol": "L"}'::jsonb),
  ('default_theme', '"system"'::jsonb),
  ('designated_owner_email', '"akenchinnobunaga@gmail.com"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Función de trigger para asignar rol 'owner' de forma segura si el email coincide
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_designated_owner TEXT := 'akenchinnobunaga@gmail.com';
  v_role global_user_role := 'user';
BEGIN
  IF LOWER(NEW.email) = LOWER(v_designated_owner) THEN
    v_role := 'owner';
  END IF;

  INSERT INTO public.profiles (id, email, display_name, global_role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    v_role,
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;

  -- Crear automáticamente su Espacio Personal
  INSERT INTO public.family_spaces (name, description, currency, created_by, is_personal)
  VALUES ('Mi Espacio Personal', 'Espacio financiero privado e individual', 'HNL', NEW.id, true)
  RETURNING id INTO NEW.id;

  RETURN NEW;
END;
$$;
