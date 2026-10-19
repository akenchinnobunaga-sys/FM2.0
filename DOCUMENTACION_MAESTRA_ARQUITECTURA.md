# REGISTRO Y ESPECIFICACIÓN MAESTRA DE ARQUITECTURA DEL SISTEMA
## FinanzasPro / Finanzas Familiares Pro
**Versión de Especificación:** 2.4.0-MASTER  
**Fecha de Emisión:** 18 de Octubre de 2026  
**Rol:** Senior Systems Engineer, Software Architect, Security Reviewer, Database Architect & QA Lead  
**Estado:** VALIDADO Y CONSOLIDADO PARA PRODUCCIÓN / DISTRIBUCIÓN DESKTOP

---

## 1. RESUMEN EJECUTIVO Y OBJETIVOS DEL SISTEMA

FinanzasPro es un ecosistema integral de ingeniería de software diseñado con doble modalidad operativa:
1. **Aplicación Web Colaborativa con PostgreSQL y Supabase RLS:** Garantiza aislamiento estricto de espacios personales y familiares compartidos, control de acceso basado en roles (RBAC) y suspensión de cuentas por el Propietario Global sin fugas de datos.
2. **Aplicación Desktop para Windows (.exe) con Licenciamiento Criptográfico:** Diseñada para empaquetado en instalador individual, con generación y validación de claves únicas vinculadas a la huella de hardware del equipo (HWID / Machine ID), exportación/importación en Excel (.xlsx) y generación de reportes oficiales en PDF.

El sistema comprende tres secciones de negocio totalmente independientes:
- **SECCIÓN 1:** Horas Laborales, Horas Extras (50% y 100%), Planilla y Descanso.
- **SECCIÓN 2:** Vehículo, Combustible (km/L), Odómetro, Mantenimiento Preventivo y Costos Consolidados.
- **SECCIÓN 3:** Finanzas Generales, Gastos del Hogar, Presupuestos, Cuentas, Deudas y Metas de Ahorro.

---

## 2. REGISTRO MAESTRO DE REQUERIMIENTOS

| ID | Módulo / Área | Requerimiento | Tipo | Estado | Nivel de Evidencia / Pruebas |
|---|---|---|---|---|---|
| **REQ-01** | Control Laboral | Registro de jornada: fecha, hora entrada, salida, receso en minutos, tarifa/hora en HNL | Funcional | APROBADO & CODIFICADO | Testeado en `WorkHoursView.tsx` y validación de turnos nocturnos |
| **REQ-02** | Control Laboral | Cálculo automatizado de horas ordinarias (base 8h) y horas extras (50% diurno y 100% festivo) | Cálculo | APROBADO & CODIFICADO | Probado con fórmulas exactas y desglose de recargo |
| **REQ-03** | Control Laboral | Exportación a Excel (.xlsx) y PDF de historial completo o rango filtrado | Reportes | APROBADO & CODIFICADO | Probado con SheetJS y jsPDF con tabla formateada |
| **REQ-04** | Control Laboral | Descarga de plantilla Excel de importación y carga masiva con validación | Automatización | APROBADO & CODIFICADO | Verificado con informe de inconsistencias y duplicados |
| **REQ-05** | Vehicular | Registro de combustible: fecha, odómetro, litros/galones, costo en HNL, gasolinera | Funcional | APROBADO & CODIFICADO | Testeado en `VehicleMasterView.tsx` |
| **REQ-06** | Vehicular | Cálculo de rendimiento (km/L) entre repostajes válidos a tanque lleno | Algorítmico | APROBADO & CODIFICADO | Distingue tanque lleno vs parcial; evita cálculos erróneos |
| **REQ-07** | Vehicular | Control de odómetro: rechazo estricto de kilometrajes regresivos o inconsistentes | Integridad | APROBADO & CODIFICADO | Validación matemática de delta km > 0 |
| **REQ-08** | Vehicular | Mantenimiento preventivo/correctivo con desglose de repuestos, mano de obra y alertas de próximo km | Mantenimiento | APROBADO & CODIFICADO | Alertas de servicio vencido o próximo por fecha/km |
| **REQ-09** | Vehicular | Costo total consolidado vehicular y costo por kilómetro recorrido | Financiero | APROBADO & CODIFICADO | Agrupa combustible + taller + otros gastos / km recorridos |
| **REQ-10** | Finanzas | Aislamiento estricto entre finanzas personales y espacios familiares compartidos | Seguridad | APROBADO & CODIFICADO | RLS policies en PostgreSQL y filtrado multi-espacio |
| **REQ-11** | Finanzas | Soporte multi-divisa con Lempira Hondureño (HNL) como moneda principal | Financiero | APROBADO & CODIFICADO | Formato L. xx,xxx.xx con decimales exactos |
| **REQ-12** | Seguridad | Control de Propietario Global: suspensión inmediata de cuentas con revocación de sesión | Seguridad | APROBADO & CODIFICADO | Bloqueo absoluto de UI y consultas RLS para usuarios suspendidos |
| **REQ-13** | Desktop | Sistema de Licenciamiento individual por Hardware ID (HWID) y claves únicas | Seguridad | APROBADO & CODIFICADO | Generador y validador HMAC-SHA256 en `LicenseService.ts` |
| **REQ-14** | Desktop | Empaquetado en instalador de Windows (.exe) con base de datos local SQLite/IndexedDB | Distribución | APROBADO & ESPECIFICADO | Script de build Electron y configuración electron-builder |

---

## 3. MATRIZ DE RIESGOS DE INGENIERÍA Y MITIGACIONES TÉCNICAS

| Riesgo Técnico Identificado | Severidad | Probabilidad | Impacto en el Negocio | Estrategia de Mitigación Implementada |
|---|---|---|---|---|
| **Inconsistencias en Odómetro por Repostajes Parciales** | Alta | Media | Eficiencia km/L inflada o distorsionada | Flag obligatorio `is_full_tank`. Solo se calcula la eficiencia contra el último repostaje a tanque lleno. |
| **Valores Negativos o Retroceso en Kilometraje** | Crítica | Baja | Corrupción de métricas de costo por km | Validación estricta que rechaza odómetros menores al último registro verificado (`km <= prev_km`). |
| **Pérdida de Precisión Decimal en Moneda (HNL)** | Alta | Media | Descuadres en balances y salarios | Almacenamiento con `NUMERIC(14,2)` en base de datos y redondeo aritmético bancario `toFixed(2)`. |
| **Acceso No Autorizado de Usuario Suspendido** | Crítica | Baja | Fuga de información familiar | Doble barrera: Política RLS a nivel de fila `NOT is_user_suspended()` y guardia de contexto React `SuspendedView`. |
| **Clonación de Licencia Desktop en Múltiples PCs** | Alta | Alta | Piratería y distribución no autorizada | Generación de huella única `Machine ID` combinando hardware y validación de cuota máxima de instalaciones. |
| **Cruce de Medianoche en Jornadas Laborales** | Media | Alta | Horas trabajadas calculadas como negativas | Normalización modular: `if (diffMin < 0) diffMin += 24 * 60;` para turnos nocturnos. |
| **Corrupción de Archivo Excel al Importar** | Media | Media | Datos truncados o error en la BD | Parser defensivo con reporte descargable de filas inválidas antes del commit. |

---

## 4. ARQUITECTURA DE BASE DE DATOS Y POLÍTICAS ROW LEVEL SECURITY (RLS)

### Principio de Menor Privilegio y Multi-Tenancy
Cada tabla del sistema incorpora la columna `space_id` vinculada a la tabla `family_spaces`. 
Las políticas RLS garantizan que:
1. El usuario solo puede consultar o modificar filas de espacios donde tiene membresía activa en `space_members`.
2. Las transacciones de tipo personal (`is_private = true`) solo son visibles para el autor original de la transacción (`user_id = auth.uid()`).
3. El Propietario Global designado (`is_owner = true`) tiene supervisión sobre directorios, revocación de invitaciones y configuración global.

### Modelo DDL Consolidado (Extracto Clave)
```sql
-- Función de seguridad para validar pertenencia a espacio
CREATE OR REPLACE FUNCTION public.user_has_space_access(p_space_id UUID)
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.space_members
    WHERE space_id = p_space_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql;

-- Política RLS estricta para Registros de Vehículo
CREATE POLICY "vehicle_fuel_space_isolation" ON public.vehicle_fuel_records
FOR ALL TO authenticated
USING (public.user_has_space_access(space_id) AND NOT public.is_user_suspended(auth.uid()))
WITH CHECK (public.user_has_space_access(space_id) AND NOT public.is_user_suspended(auth.uid()));
```

---

## 5. ESPECIFICACIÓN DEL EMPAQUETADO DESKTOP PARA WINDOWS

Para generar el instalador distribuible `FinanzasPro-Setup.exe`:
- **Framework:** Electron con Vite + React + TypeScript.
- **Empaquetador:** `electron-builder` configurado para targets NSIS (Windows 64-bit).
- **Almacenamiento Local:** Motor híbrido IndexedDB / SQLite local para funcionamiento 100% offline.
- **Validación de Licencia:** Proceso de verificación en el arranque leyendo el Hardware ID local contra la clave del usuario.

Comandos de empaquetado:
```bash
npm run build
npm run electron:dist
```

El instalador final genera un ejecutable autocontenido con icono oficial, desinstalador limpio y registro de clave de licencia individual.
