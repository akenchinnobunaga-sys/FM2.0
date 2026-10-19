/**
 * Servicio Avanzado de Automatización Excel (.xlsx) y Plantillas de Importación
 * Utiliza SheetJS (xlsx) para generar libros editables reales con fórmulas,
 * anchos de columna, formato numérico y pestañas de instrucciones.
 */

import * as XLSX from 'xlsx';
import {
  WorkHourLog,
  FuelRecord,
  MileageRecord,
  VehicleMaintenanceRecord,
  VehicleOtherExpense,
  GeneralExpenseRecord,
  Category,
} from '../types/database';

export interface ImportValidationResult<T> {
  success: boolean;
  totalRows: number;
  validRows: T[];
  invalidRows: Array<{ rowNumber: number; rowData: any; reason: string }>;
  duplicateCount: number;
  errorReportAvailable: boolean;
}

export class ExcelService {
  /**
   * Descarga un libro de trabajo XLSX en el navegador
   */
  private static downloadWorkbook(wb: XLSX.WorkBook, filename: string): void {
    XLSX.writeFile(wb, filename);
  }

  // =========================================================================
  // 1. EXPORTACIÓN REAL DE DATOS (.XLSX)
  // =========================================================================

  /**
   * Exporta registros de Horas Laborales y Horas Extras (Historial o Rango Filtrado)
   */
  public static exportWorkHoursToExcel(
    records: WorkHourLog[],
    filename = 'FinanzasPro_Horas_Laborales.xlsx',
    filterLabel = 'Historial Completo'
  ): void {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen Ejecutivo
    const totalReg = records.reduce((acc, r) => acc + r.regular_hours, 0);
    const totalOt50 = records.reduce((acc, r) => acc + r.overtime_50_hours, 0);
    const totalOt100 = records.reduce((acc, r) => acc + r.overtime_100_hours, 0);
    const totalGross = records.reduce((acc, r) => acc + r.total_pay, 0);

    const summaryData = [
      ['FINANZASPRO - REPORTE DE HORAS LABORALES Y HORAS EXTRAS'],
      ['Filtro aplicado:', filterLabel],
      ['Fecha de emisión:', new Date().toLocaleString('es-HN')],
      ['Total Registros:', records.length],
      [],
      ['Métrica', 'Valor', 'Unidad'],
      ['Total Horas Ordinarias', totalReg.toFixed(2), 'Horas'],
      ['Total Horas Extras 50% (Diurnas)', totalOt50.toFixed(2), 'Horas'],
      ['Total Horas Extras 100% (Festivas/Nocturnas)', totalOt100.toFixed(2), 'Horas'],
      ['Total Horas Extras Combinadas', (totalOt50 + totalOt100).toFixed(2), 'Horas'],
      ['Remuneración Bruta Total Calculada', totalGross.toFixed(2), 'HNL (L.)'],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen_Ejecutivo');

    // Hoja 2: Detalle de Registros
    const detailHeaders = [
      'ID Registro',
      'Fecha (YYYY-MM-DD)',
      'Hora Entrada',
      'Hora Salida',
      'Descanso (Min)',
      'Horas Trabajadas',
      'Horas Normales',
      'Extra 50%',
      'Extra 100%',
      'Tarifa/Hora (L.)',
      'Total Pagado (L.)',
      'ID Empleado',
      'Notas / Observaciones',
    ];

    const detailRows = records.map((r) => [
      r.id,
      r.work_date,
      r.arrival_time || '08:00',
      r.departure_time || '17:00',
      r.break_duration_mins || 60,
      r.total_worked_hours || (r.regular_hours + r.overtime_50_hours + r.overtime_100_hours),
      r.regular_hours,
      r.overtime_50_hours,
      r.overtime_100_hours,
      r.hourly_rate,
      r.total_pay,
      r.employee_id || 'EMP-01',
      r.notes || '',
    ]);

    const wsDetail = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);
    wsDetail['!cols'] = [
      { wch: 15 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 16 },
      { wch: 14 },
      { wch: 35 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalle_Horas');

    this.downloadWorkbook(wb, filename);
  }

  /**
   * Exporta registros de Vehículo (Combustible, Kilometraje, Mantenimientos y Otros Gastos)
   */
  public static exportVehicleRecordsToExcel(
    fuelRecords: FuelRecord[],
    maintenanceRecords: VehicleMaintenanceRecord[],
    otherExpenses: VehicleOtherExpense[],
    filename = 'FinanzasPro_Costos_Vehiculo.xlsx',
    filterLabel = 'Historial Completo'
  ): void {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen General
    const totalFuel = fuelRecords.reduce((acc, f) => acc + f.total_cost_hnl, 0);
    const totalMaint = maintenanceRecords.reduce((acc, m) => acc + m.total_cost, 0);
    const totalOther = otherExpenses.reduce((acc, o) => acc + o.amount_hnl, 0);
    const totalCost = totalFuel + totalMaint + totalOther;

    const summaryData = [
      ['FINANZASPRO - CONSOLIDADO DE COSTOS DEL VEHÍCULO'],
      ['Filtro aplicado:', filterLabel],
      ['Fecha de emisión:', new Date().toLocaleString('es-HN')],
      [],
      ['Rubro de Costo', 'Total Invertido (HNL)', 'N° Operaciones'],
      ['Combustible (Gasolina/Diesel)', totalFuel.toFixed(2), fuelRecords.length],
      ['Mantenimiento y Reparaciones de Taller', totalMaint.toFixed(2), maintenanceRecords.length],
      ['Otros Gastos (Llantas, Matrícula, Seguro, etc.)', totalOther.toFixed(2), otherExpenses.length],
      ['COSTO TOTAL INTEGRADO DEL VEHÍCULO', totalCost.toFixed(2), fuelRecords.length + maintenanceRecords.length + otherExpenses.length],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 45 }, { wch: 22 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Consolidado_Vehiculo');

    // Hoja 2: Combustible
    const fuelHeaders = [
      'ID',
      'Fecha',
      'Odómetro (Km)',
      'Cantidad',
      'Unidad',
      'Tipo Combustible',
      'Precio/Unidad (L.)',
      'Costo Total (L.)',
      'Gasolinera',
      'Tanque Lleno',
      'Km Recorridos',
      'Rendimiento (Km/L)',
      'Costo/Km (L.)',
      'Notas',
    ];
    const fuelRows = fuelRecords.map((f) => [
      f.id,
      f.refueling_date,
      f.odometer_km,
      f.fuel_quantity,
      f.unit,
      f.fuel_type.toUpperCase(),
      f.cost_per_unit,
      f.total_cost_hnl,
      f.gas_station,
      f.is_full_tank ? 'SÍ' : 'NO',
      f.km_traveled_since_last || '-',
      f.fuel_efficiency_kml ? f.fuel_efficiency_kml.toFixed(2) : '-',
      f.cost_per_km_hnl ? f.cost_per_km_hnl.toFixed(2) : '-',
      f.notes || '',
    ]);
    const wsFuel = XLSX.utils.aoa_to_sheet([fuelHeaders, ...fuelRows]);
    wsFuel['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 25 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsFuel, 'Combustible');

    // Hoja 3: Mantenimiento
    const maintHeaders = [
      'ID',
      'Fecha',
      'Odómetro (Km)',
      'Tipo Mantenimiento',
      'Descripción',
      'Repuestos Sustituidos',
      'Costo Repuestos (L.)',
      'Costo Mano Obra (L.)',
      'Costo Total (L.)',
      'Taller / Servicio',
      'Próximo Servicio (Fecha)',
      'Próximo Odómetro (Km)',
      'Notas',
    ];
    const maintRows = maintenanceRecords.map((m) => [
      m.id,
      m.maintenance_date,
      m.odometer_km,
      m.maintenance_type,
      m.description,
      m.parts_replaced || 'Ninguno',
      m.parts_cost,
      m.labor_cost,
      m.total_cost,
      m.workshop || 'Taller',
      m.next_maintenance_date || '-',
      m.next_maintenance_km || '-',
      m.notes || '',
    ]);
    const wsMaint = XLSX.utils.aoa_to_sheet([maintHeaders, ...maintRows]);
    wsMaint['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 30 }, { wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsMaint, 'Mantenimiento');

    // Hoja 4: Otros Gastos del Vehículo
    const otherHeaders = ['ID', 'Fecha', 'Tipo de Gasto', 'Descripción', 'Monto (HNL)', 'Método de Pago', 'Notas'];
    const otherRows = otherExpenses.map((o) => [
      o.id,
      o.date,
      o.expense_type,
      o.description,
      o.amount_hnl,
      o.payment_method,
      o.notes || '',
    ]);
    const wsOther = XLSX.utils.aoa_to_sheet([otherHeaders, ...otherRows]);
    wsOther['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 35 }, { wch: 16 }, { wch: 16 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsOther, 'Otros_Gastos');

    this.downloadWorkbook(wb, filename);
  }

  /**
   * Exporta Gastos Generales y Categorías Personalizables
   */
  public static exportGeneralExpensesToExcel(
    expenses: GeneralExpenseRecord[],
    categories: Category[],
    filename = 'FinanzasPro_Gastos_Generales.xlsx',
    filterLabel = 'Historial Completo'
  ): void {
    const wb = XLSX.utils.book_new();

    const totalExp = expenses.reduce((acc, e) => acc + e.amount_hnl, 0);

    // Resumen por Categoría
    const catMap = new Map<string, number>();
    expenses.forEach((e) => {
      const current = catMap.get(e.category_name) || 0;
      catMap.set(e.category_name, current + e.amount_hnl);
    });

    const summaryData = [
      ['FINANZASPRO - REPORTE DE GASTOS GENERALES Y CATEGORÍAS'],
      ['Filtro aplicado:', filterLabel],
      ['Fecha de emisión:', new Date().toLocaleString('es-HN')],
      ['Gasto General Acumulado:', `${totalExp.toFixed(2)} HNL`],
      [],
      ['Categoría', 'Total Gastado (HNL)', '% del Total'],
    ];

    Array.from(catMap.entries()).forEach(([catName, amount]) => {
      const pct = totalExp > 0 ? (amount / totalExp) * 100 : 0;
      summaryData.push([catName, amount.toFixed(2), `${pct.toFixed(1)}%`]);
    });

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 35 }, { wch: 22 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen_Categorias');

    // Detalle
    const headers = ['ID', 'Fecha', 'Categoría', 'Descripción', 'Monto (HNL)', 'Método de Pago', 'N° Recibo / Factura', 'Notas'];
    const rows = expenses.map((e) => [
      e.id,
      e.date,
      e.category_name,
      e.description,
      e.amount_hnl,
      e.payment_method,
      e.receipt_ref || '-',
      e.notes || '',
    ]);

    const wsDetail = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    wsDetail['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 35 }, { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalle_Gastos');

    this.downloadWorkbook(wb, filename);
  }

  // =========================================================================
  // 2. DESCARGA DE PLANTILLAS EXCEL DE IMPORTACIÓN (.XLSX)
  // =========================================================================

  /**
   * Genera y descarga la Plantilla Excel para Horas Laborales
   */
  public static downloadWorkHoursTemplate(): void {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Datos a rellenar
    const headers = [
      'Fecha (YYYY-MM-DD)*',
      'Hora Entrada (HH:MM)*',
      'Hora Salida (HH:MM)*',
      'Minutos Descanso',
      'Tarifa Hora HNL*',
      'ID Empleado',
      'Notas / Observaciones',
    ];
    const sampleRows = [
      ['2026-10-19', '08:00', '17:00', 60, 110.0, 'EMP-01', 'Jornada ordinaria normal'],
      ['2026-10-20', '08:00', '19:30', 60, 110.0, 'EMP-01', 'Cierre de inventario con 2.5h extras al 50%'],
      ['2026-10-25', '09:00', '15:00', 0, 110.0, 'EMP-01', 'Turno especial en domingo festivo al 100%'],
    ];
    const wsData = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    wsData['!cols'] = [{ wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, wsData, 'Datos_Horas');

    // Hoja 2: Instrucciones
    const instructions = [
      ['GUÍA DE LLENADO DE PLANTILLA DE HORAS LABORALES'],
      ['Los campos marcados con (*) son obligatorios.'],
      [],
      ['Columna', 'Formato Requerido', 'Ejemplo', 'Descripción'],
      ['Fecha', 'YYYY-MM-DD', '2026-10-20', 'Año a 4 dígitos, mes y día a 2 dígitos'],
      ['Hora Entrada', 'HH:MM (24 horas)', '08:00', 'Hora exacta de inicio de la jornada'],
      ['Hora Salida', 'HH:MM (24 horas)', '17:30', 'Hora exacta de finalización'],
      ['Minutos Descanso', 'Número entero', '60', 'Tiempo de almuerzo o pausa deducible en minutos'],
      ['Tarifa Hora HNL', 'Número decimal', '110.00', 'Sueldo base por hora en lempiras'],
      ['ID Empleado', 'Texto opcional', 'EMP-01', 'Código o identificador de la persona'],
      ['Notas', 'Texto libre', 'Horas extras por entrega', 'Justificación o detalle de la labor'],
    ];
    const wsInst = XLSX.utils.aoa_to_sheet(instructions);
    wsInst['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 18 }, { wch: 55 }];
    XLSX.utils.book_append_sheet(wb, wsInst, 'Instrucciones');

    this.downloadWorkbook(wb, 'Plantilla_FinanzasPro_Horas_Laborales.xlsx');
  }

  /**
   * Genera y descarga la Plantilla Excel para Combustible
   */
  public static downloadFuelTemplate(): void {
    const wb = XLSX.utils.book_new();

    const headers = [
      'Fecha (YYYY-MM-DD)*',
      'Odómetro Km Actual*',
      'Cantidad Combustible*',
      'Unidad (litros/galones)*',
      'Tipo (super/regular/diesel/glp)*',
      'Costo Total HNL*',
      'Gasolinera*',
      'Tanque Lleno (SI/NO)*',
      'Notas',
    ];
    const sampleRows = [
      ['2026-10-18', 15200, 9.5, 'litros', 'super', 285.0, 'Texaco Los Próceres', 'SI', 'Tanque completo lleno'],
      ['2026-10-22', 15580, 9.2, 'litros', 'super', 278.0, 'Uno El Trapiche', 'SI', 'Calcula 41.3 km/L'],
    ];
    const wsData = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    wsData['!cols'] = [{ wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 28 }, { wch: 18 }, { wch: 25 }, { wch: 22 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, wsData, 'Datos_Combustible');

    const instructions = [
      ['GUÍA DE LLENADO DE PLANTILLA DE COMBUSTIBLE'],
      ['El sistema calcula automáticamente el rendimiento (Km/L) entre repostajes con Tanque Lleno = SI.'],
      [],
      ['Columna', 'Formato', 'Valores Permitidos'],
      ['Fecha', 'YYYY-MM-DD', 'Ej: 2026-10-18'],
      ['Odómetro Km', 'Número entero positivo', 'Debe ser mayor al kilometraje previo'],
      ['Cantidad Combustible', 'Número decimal', 'Ej: 9.50'],
      ['Unidad', 'Texto exacto', 'litros ó galones'],
      ['Tipo', 'Texto exacto', 'super, regular, diesel, glp'],
      ['Costo Total HNL', 'Número decimal en Lempiras', 'Ej: 285.00'],
      ['Gasolinera', 'Texto', 'Nombre de la estación'],
      ['Tanque Lleno', 'Texto', 'SI ó NO'],
    ];
    const wsInst = XLSX.utils.aoa_to_sheet(instructions);
    wsInst['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, wsInst, 'Instrucciones');

    this.downloadWorkbook(wb, 'Plantilla_FinanzasPro_Combustible.xlsx');
  }

  /**
   * Genera y descarga la Plantilla Excel para Mantenimiento de Vehículo
   */
  public static downloadMaintenanceTemplate(): void {
    const wb = XLSX.utils.book_new();

    const headers = [
      'Fecha (YYYY-MM-DD)*',
      'Odómetro Km*',
      'Tipo Mantenimiento*',
      'Descripción del Servicio*',
      'Repuestos Sustituidos',
      'Costo Repuestos HNL*',
      'Costo Mano de Obra HNL*',
      'Taller / Mecánico*',
      'Próximo Servicio Km',
      'Próxima Fecha Servicio',
      'Notas',
    ];
    const sampleRows = [
      ['2026-10-15', 15000, 'oil_change', 'Cambio de aceite sintético 10W40 y filtro', 'Filtro aceite original', 450.0, 150.0, 'Lubricentro Rápido', 17500, '2027-01-15', 'Tensión de cadena realizada'],
      ['2026-10-20', 15250, 'brakes', 'Cambio pastillas freno delantero', 'Pastillas cerámicas', 380.0, 120.0, 'Frenos del Centro', 20000, '', 'Excelente agarre'],
    ];
    const wsData = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    wsData['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 22 }, { wch: 35 }, { wch: 25 }, { wch: 22 }, { wch: 25 }, { wch: 25 }, { wch: 22 }, { wch: 22 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, wsData, 'Datos_Mantenimiento');

    const instructions = [
      ['GUÍA DE LLENADO DE PLANTILLA DE MANTENIMIENTO'],
      ['Tipos de Mantenimiento válidos: oil_change, tires, brakes, chain_sprocket, engine_tuneup, battery, suspension, general_inspection, repair, other'],
    ];
    const wsInst = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInst, 'Instrucciones');

    this.downloadWorkbook(wb, 'Plantilla_FinanzasPro_Mantenimiento.xlsx');
  }

  /**
   * Genera y descarga la Plantilla Excel para Gastos Generales
   */
  public static downloadGeneralExpensesTemplate(): void {
    const wb = XLSX.utils.book_new();

    const headers = [
      'Fecha (YYYY-MM-DD)*',
      'Nombre Categoría*',
      'Descripción del Gasto*',
      'Monto en HNL*',
      'Método de Pago*',
      'N° Recibo / Factura',
      'Notas',
    ];
    const sampleRows = [
      ['2026-10-18', 'Alimentación y Despensa', 'Compra quincenal supermercado La Colonia', 2850.0, 'Tarjeta BAC', 'FAC-98124', 'Despensa del hogar'],
      ['2026-10-19', 'Servicios del Hogar', 'Factura energía eléctrica ENEE', 1420.0, 'Efectivo', 'REC-0012', 'Mes de septiembre'],
      ['2026-10-20', 'Salud y Farmacia', 'Medicamentos preventivos farmacia Simán', 450.0, 'Transferencia', 'TR-8812', 'Vitaminas y botiquín'],
    ];
    const wsData = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    wsData['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 40 }, { wch: 18 }, { wch: 20 }, { wch: 22 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, wsData, 'Datos_Gastos');

    const instructions = [
      ['GUÍA DE LLENADO DE PLANTILLA DE GASTOS GENERALES'],
      ['Si la categoría indicada no existe, FinanzasPro la creará automáticamente.'],
      ['Métodos de pago sugeridos: Efectivo, Tarjeta BAC, Tarjeta Ficohsa, Transferencia, Cheque, Billetera.'],
    ];
    const wsInst = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInst, 'Instrucciones');

    this.downloadWorkbook(wb, 'Plantilla_FinanzasPro_Gastos_Generales.xlsx');
  }

  // =========================================================================
  // 3. PARSEADOR Y VALIDADOR DE ARCHIVOS EXCEL
  // =========================================================================

  /**
   * Lee un archivo Excel o CSV desde un ArrayBuffer y retorna filas crudas
   */
  public static readWorkbookRows(data: ArrayBuffer): any[][] {
    const wb = XLSX.read(data, { type: 'array' });
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_json(ws, { header: 1 });
  }

  /**
   * Genera informe de errores descargable en Excel
   */
  public static downloadErrorReport(invalidRows: Array<{ rowNumber: number; rowData: any; reason: string }>): void {
    const wb = XLSX.utils.book_new();
    const headers = ['Fila en Archivo Original', 'Motivo del Rechazo / Inconsistencia', 'Datos Leídos'];
    const rows = invalidRows.map((item) => [
      item.rowNumber,
      item.reason,
      JSON.stringify(item.rowData),
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [{ wch: 25 }, { wch: 55 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Errores_Validacion');

    this.downloadWorkbook(wb, 'FinanzasPro_Reporte_Errores_Importacion.xlsx');
  }
}
