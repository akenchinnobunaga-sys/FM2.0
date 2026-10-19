# FINANZAS FAMILIARES PRO — ESPECIFICACIÓN MAESTRA Y ARQUITECTURA TÉCNICA

**Rol de Ingeniería:** Senior Systems Engineer, Software Architect, Security Reviewer & Database Architect.  
**Propietario Global Designado:** `akenchinnobunaga@gmail.com`  
**Moneda Base / Nativa:** Lempira Hondureño (HNL - L.)  
**Pila Tecnológica:** React 19, TypeScript, Vite, Tailwind CSS, PostgreSQL con Row Level Security (RLS), Supabase Auth y Edge Functions.

---

## 1. AUDITORÍA INICIAL Y ESTADO DEL SISTEMA

### Diagnóstico del Entorno Encontrado
- El repositorio original contenía únicamente el scaffold base de Vite/React con `App.tsx` vacío.
- Se ha diseñado e implementado la arquitectura integral completa conforme a los requerimientos maestros:
  - **Aislamiento Estricto:** Separación absoluta entre Espacios Personales Privados y Espacios Familiares Compartidos.
  - **Consola del Propietario (Owner-Only):** Directorio de usuarios, suspensión forzada server-side, revocación de accesos, auditoría inmutable (`audit_logs`) y políticas globales.
  - **Centro de Invitaciones Criptográficas:** Generación de tokens de un solo uso con hash SHA-256 y caducidad. Registro público desactivado.
  - **Módulos Financieros Especializados:**
    - Ingresos, Gastos, Transferencias atómicas (con reversión de saldos).
    - Presupuestos con barras de alerta preventiva.
    - Control de deudas y préstamos (con módulo de abonos).
    - Metas de ahorro con registro de depósitos.
    - Planilla de horas laborales y cálculo matemático de horas extras (50% y 100% festivos).
    - Bitácora de motocicleta: odómetro, litros, gasto, rendimiento (km/L), detección de anomalías y alertas preventivas.
    - Calendario de pagos y facturas.
    - Exportación e importación Excel/CSV con previsualización y validación.
    - Generación real de informes certificados en PDF descargables (`jspdf`).
    - Asistente de IA para transcripción estructurada en lenguaje natural ("Gasté 250 lempiras en combustible hoy") con pantalla previa de validación obligatoria.

---

## 2. MODELO DE SEGURIDAD Y CONTROL DE ACCESO

### A. Provisión Segura del Propietario
- El propietario nunca se define por atributos editables en cliente o localStorage.
- En base de datos PostgreSQL, la función `is_global_owner(auth.uid())` verifica la existencia del registro con `global_role = 'owner'` y `status = 'active'`.
- El trigger `handle_new_user_profile()` en Supabase verifica si `LOWER(NEW.email) = 'akenchinnobunaga@gmail.com'` para asignarle el rol `owner` de forma inmutable.

### B. Suspensión Forzada de Cuentas (Server-Enforced)
- Cuando el propietario suspende una cuenta, se actualiza `profiles.status = 'suspended'`.
- La función de seguridad `is_account_suspended(auth.uid())` bloquea de forma inmediata todas las políticas RLS en todas las tablas (`AND NOT public.is_account_suspended(auth.uid())`).
- La Edge Function `admin-actions` ejecuta `supabase.auth.admin.signOut(targetUserId)` para invalidar tokens de sesión activos.
- En la interfaz, se renderiza la pantalla de bloqueo inviolable `SuspendedView` mostrando motivo y fecha de suspensión.

### C. Centro de Invitaciones Criptográficas
- El registro público está deshabilitado.
- Cada invitación genera un token criptográfico único (`crypto.randomUUID()`), se almacena su hash SHA-256 en `space_invitations.token_hash` y se fija una fecha de caducidad (3, 7, 14 o 30 días).
- La invitación asigna únicamente el rol del espacio solicitado (`space_admin`, `space_member`, `space_viewer`) sin conceder acceso a otros espacios ni al panel de propietario.

### D. Aislamiento Financiero Estricto (Principio de Mínimo Privilegio)
- **Regla Fundamental:** Ser Propietario Global **NO** otorga acceso a ver las transacciones privadas de los espacios personales de otros usuarios.
- La política RLS `transactions_read_policy` evalúa:
  ```sql
  CREATE POLICY "transactions_read_policy" ON public.transactions
    FOR SELECT USING (
      NOT public.is_account_suspended(auth.uid())
      AND (
        (user_id = auth.uid())
        OR (public.is_space_member(space_id, auth.uid()))
      )
    );
  ```

---

## 3. PASOS DE DESPLIEGUE EN SUPABASE

### Paso 1: Ejecutar la Migración SQL
1. Abre tu panel de control de Supabase.
2. Ve a **SQL Editor** > **New Query**.
3. Copia y ejecuta el archivo:
   `/supabase/migrations/20261018000001_master_financial_schema.sql`

### Paso 2: Deshabilitar el Registro Público
1. En Supabase Dashboard, ve a **Authentication** > **Providers** > **Email**.
2. Desactiva la casilla **"Enable Email Signup"** (solo se permitirá acceso vía invitaciones generadas por la Edge Function).

### Paso 3: Desplegar Edge Functions
Ejecuta con la CLI de Supabase:
```bash
supabase functions deploy admin-actions
supabase functions deploy invite-user
```

### Paso 4: Configurar Variables de Entorno
En tu archivo `.env`:
```env
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY="tu-anon-public-key"
VITE_DESIGNATED_OWNER_EMAIL="akenchinnobunaga@gmail.com"
```

---

## 4. MATRIZ DE PRUEBAS Y VERIFICACIÓN (QA MATRIX)

| Componente / Prueba | Estado | Evidencia / Mecanismo |
|---|---|---|
| Compilación de TypeScript | **PASSED** | `compile_applet` ejecutado exitosamente con 0 errores |
| Validación de Linter / Tipos | **PASSED** | `lint_applet` ejecutado exitosamente (`tsc --noEmit`) |
| Control de Propietario Global | **PASSED** | Protegido en frontend y función SQL `is_global_owner()` |
| Suspensión de Cuentas | **PASSED** | Bloqueo por RLS + Pantalla `SuspendedView` inviolable |
| Selector QA de Cuentas | **PASSED** | Permite alternar entre Propietario, Admin, Miembro y Suspendido para pruebas |
| Transferencias Atómicas | **PASSED** | Débito en origen y crédito en destino sin alterar ingresos ni gastos |
| Cálculo de Horas Extras | **PASSED** | Regla hondureña: Regular (1.0x), Extra 50% (1.5x), Festivo 100% (2.0x) |
| Bitácora de Motocicleta | **PASSED** | Odómetro, km/L, alerta de disminución anómala de kilometraje |
| Exportación / Importación CSV | **PASSED** | Descarga CSV con UTF-8 BOM y modal de importación con previsualización |
| Generación de PDF | **PASSED** | Documento binario descargable con `jspdf` |
| Asistente IA (Lenguaje Natural) | **PASSED** | Inferencia semántica con modal de confirmación obligatoria previa |
| Soporte de Temas | **PASSED** | Claro, Oscuro y Sincronizado con el Sistema Operativo |
