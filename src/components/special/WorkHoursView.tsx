import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../services/storage';
import { WorkHourLog } from '../../types/database';
import { ExcelService } from '../../services/excelService';
import { jsPDF } from 'jspdf';
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  DollarSign,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  Filter,
  X,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export const WorkHoursView: React.FC = () => {
  const { currentSpace, currentUser } = useAuth();
  const { currency, currencySymbol } = useCurrency();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkHourLog | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filtros de fecha
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');

  // Estados del Formulario
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [arrivalTime, setArrivalTime] = useState('08:00');
  const [departureTime, setDepartureTime] = useState('17:00');
  const [breakMins, setBreakMins] = useState(60);
  const [hourlyRate, setHourlyRate] = useState('110.0');
  const [employeeId, setEmployeeId] = useState('EMP-001');
  const [notes, setNotes] = useState('');

  const state = localDB.getState();

  if (!currentSpace || !currentUser) {
    return <div className="p-8 text-center text-slate-500">Selecciona un espacio.</div>;
  }

  const allWorkLogs = state.workHours.filter((w) => w.space_id === currentSpace.id);

  // Filtrado por Rango de Fechas y Empleado
  const filteredLogs = allWorkLogs.filter((w) => {
    const matchesStart = !startDate || w.work_date >= startDate;
    const matchesEnd = !endDate || w.work_date <= endDate;
    const matchesEmp = !employeeFilter || (w.employee_id && w.employee_id.toLowerCase().includes(employeeFilter.toLowerCase()));
    return matchesStart && matchesEnd && matchesEmp;
  });

  // Métricas calculadas sobre los registros filtrados
  const totalRegularHrs = filteredLogs.reduce((acc, w) => acc + w.regular_hours, 0);
  const totalOt50Hrs = filteredLogs.reduce((acc, w) => acc + w.overtime_50_hours, 0);
  const totalOt100Hrs = filteredLogs.reduce((acc, w) => acc + w.overtime_100_hours, 0);
  const totalOvertimeHrs = totalOt50Hrs + totalOt100Hrs;
  const totalEarnings = filteredLogs.reduce((acc, w) => acc + w.total_pay, 0);
  const totalOvertimePay = filteredLogs.reduce(
    (acc, w) => acc + (w.total_pay - w.regular_hours * w.hourly_rate),
    0
  );

  // Cálculo automático al ingresar horas
  const calculateHoursAndPay = (arr: string, dep: string, brk: number, rate: number) => {
    try {
      const [ah, am] = arr.split(':').map(Number);
      const [dh, dm] = dep.split(':').map(Number);
      const startMin = ah * 60 + am;
      const endMin = dh * 60 + dm;
      let diffMin = endMin - startMin;
      if (diffMin < 0) diffMin += 24 * 60; // Turno nocturno que cruza medianoche

      const workedTotal = Math.max(0, (diffMin - brk) / 60);
      const regular = Math.min(8.0, workedTotal);
      const overtime = Math.max(0, workedTotal - 8.0);

      // Por defecto asignamos el overtime al 50% diurno
      const totalPay = regular * rate + overtime * rate * 1.5;

      return {
        totalWorked: parseFloat(workedTotal.toFixed(2)),
        regular: parseFloat(regular.toFixed(2)),
        ot50: parseFloat(overtime.toFixed(2)),
        ot100: 0,
        totalPay: parseFloat(totalPay.toFixed(2)),
      };
    } catch {
      return { totalWorked: 8, regular: 8, ot50: 0, ot100: 0, totalPay: 8 * rate };
    }
  };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(hourlyRate) || 110;
    const calc = calculateHoursAndPay(arrivalTime, departureTime, Number(breakMins), rate);

    if (editingLog) {
      localDB.updateWorkHourLog(editingLog.id, {
        work_date: workDate,
        arrival_time: arrivalTime,
        departure_time: departureTime,
        break_duration_mins: Number(breakMins),
        total_worked_hours: calc.totalWorked,
        regular_hours: calc.regular,
        overtime_50_hours: calc.ot50,
        overtime_100_hours: calc.ot100,
        hourly_rate: rate,
        total_pay: calc.totalPay,
        employee_id: employeeId.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setEditingLog(null);
    } else {
      localDB.addWorkHourLog({
        space_id: currentSpace.id,
        user_id: currentUser.id,
        work_date: workDate,
        arrival_time: arrivalTime,
        departure_time: departureTime,
        break_duration_mins: Number(breakMins),
        total_worked_hours: calc.totalWorked,
        regular_hours: calc.regular,
        overtime_50_hours: calc.ot50,
        overtime_100_hours: calc.ot100,
        hourly_rate: rate,
        currency: currentSpace.currency || 'HNL',
        total_pay: calc.totalPay,
        employee_id: employeeId.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }

    setNotes('');
    setShowAddModal(false);
    setRefreshKey((k) => k + 1);
  };

  const handleEdit = (log: WorkHourLog) => {
    setEditingLog(log);
    setWorkDate(log.work_date);
    setArrivalTime(log.arrival_time || '08:00');
    setDepartureTime(log.departure_time || '17:00');
    setBreakMins(log.break_duration_mins || 60);
    setHourlyRate(String(log.hourly_rate));
    setEmployeeId(log.employee_id || 'EMP-001');
    setNotes(log.notes || '');
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este registro de horas trabajadas?')) {
      localDB.deleteWorkHourLog(id);
      setRefreshKey((k) => k + 1);
    }
  };

  // Exportar Excel XLSX (Filtrado o Completo)
  const handleExportExcel = (onlyFiltered = true) => {
    const dataToExport = onlyFiltered ? filteredLogs : allWorkLogs;
    const filterDesc = onlyFiltered && (startDate || endDate)
      ? `Rango: ${startDate || 'Inicio'} a ${endDate || 'Fin'}`
      : 'Historial Completo';
    ExcelService.exportWorkHoursToExcel(dataToExport, `FinanzasPro_Horas_${new Date().toISOString().split('T')[0]}.xlsx`, filterDesc);
  };

  // Exportar PDF Certificado
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text('FinanzasPro - Reporte Oficial de Horas y Horas Extras', 14, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Espacio: ${currentSpace.name} | Periodo: ${startDate || 'Inicio'} al ${endDate || 'Hoy'}`, 14, 25);
    doc.text(`Total Devengado: L. ${totalEarnings.toFixed(2)} | Horas Totales: ${(totalRegularHrs + totalOvertimeHrs).toFixed(1)} hrs`, 14, 31);
    doc.line(14, 35, 196, 35);

    let y = 43;
    doc.setFontSize(9);
    doc.setFillColor(240, 240, 240);
    doc.rect(14, y - 5, 182, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha', 16, y);
    doc.text('Entrada / Salida', 42, y);
    doc.text('Ordinarias', 82, y);
    doc.text('Extra 50%', 110, y);
    doc.text('Extra 100%', 136, y);
    doc.text(`Total Bruto (${currencySymbol})`, 162, y);

    y += 7;
    doc.setFont('helvetica', 'normal');

    filteredLogs.forEach((w) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(w.work_date, 16, y);
      doc.text(`${w.arrival_time || '08:00'} - ${w.departure_time || '17:00'}`, 42, y);
      doc.text(`${w.regular_hours.toFixed(1)} h`, 82, y);
      doc.text(`${w.overtime_50_hours.toFixed(1)} h`, 110, y);
      doc.text(`${w.overtime_100_hours.toFixed(1)} h`, 136, y);
      doc.setFont('helvetica', 'bold');
      doc.text(`${currencySymbol} ${w.total_pay.toFixed(2)}`, 162, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
    });

    doc.save(`Reporte_Horas_${currentSpace.name.replace(/\s+/g, '_')}.pdf`);
  };

  // Descargar Plantilla Excel de Importación
  const handleDownloadTemplate = () => {
    ExcelService.downloadWorkHoursTemplate();
  };

  // Carga e Importación desde Archivo Excel (.xlsx)
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const rows = ExcelService.readWorkbookRows(buffer);

      if (!rows || rows.length <= 1) {
        alert('El archivo no contiene filas de datos para importar.');
        return;
      }

      // Descartar encabezado (fila 0)
      const dataRows = rows.slice(1);
      let importedCount = 0;
      const invalidRows: Array<{ rowNumber: number; rowData: any; reason: string }> = [];

      dataRows.forEach((row, idx) => {
        const rowNumber = idx + 2;
        const [wDate, arrTime, depTime, brkMin, rateVal, empId, notesVal] = row;

        if (!wDate || !arrTime || !depTime) {
          invalidRows.push({ rowNumber, rowData: row, reason: 'Faltan campos obligatorios (Fecha, Entrada, Salida)' });
          return;
        }

        const dateStr = String(wDate).trim();
        const arrStr = String(arrTime).trim();
        const depStr = String(depTime).trim();
        const breakNum = Number(brkMin) || 0;
        const rateNum = Number(rateVal) || 110;

        const calc = calculateHoursAndPay(arrStr, depStr, breakNum, rateNum);

        localDB.addWorkHourLog({
          space_id: currentSpace.id,
          user_id: currentUser.id,
          work_date: dateStr,
          arrival_time: arrStr,
          departure_time: depStr,
          break_duration_mins: breakNum,
          total_worked_hours: calc.totalWorked,
          regular_hours: calc.regular,
          overtime_50_hours: calc.ot50,
          overtime_100_hours: calc.ot100,
          hourly_rate: rateNum,
          currency: currentSpace.currency || 'HNL',
          total_pay: calc.totalPay,
          employee_id: empId ? String(empId).trim() : undefined,
          notes: notesVal ? String(notesVal).trim() : 'Importado desde Excel',
        });
        importedCount++;
      });

      setRefreshKey((k) => k + 1);

      if (invalidRows.length > 0) {
        if (confirm(`Se importaron ${importedCount} jornadas con éxito. Hubo ${invalidRows.length} fila(s) con inconsistencias. ¿Deseas descargar el reporte de errores en Excel?`)) {
          ExcelService.downloadErrorReport(invalidRows);
        }
      } else {
        alert(`¡Importación exitosa! Se han registrado ${importedCount} jornadas de trabajo.`);
      }
    } catch (err) {
      console.error(err);
      alert('Error al leer el archivo Excel. Asegúrate de usar el formato oficial de la plantilla.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Input de archivo oculto */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

      {/* Encabezado y Acciones de Exportación */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
            SECCIÓN 1 • CONTROL LABORAL INDEPENDIENTE
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mt-0.5">
            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Horas Laborales, Horas Extras y Planilla</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cálculo automatizado con horarios de entrada/salida y recargos diurnos (50%) y nocturnos/festivos (100%).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Descargar Plantilla */}
          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-600"
            title="Descargar plantilla Excel para llenar e importar"
          >
            <Download className="w-4 h-4 text-purple-500" />
            <span>Plantilla Excel</span>
          </button>

          {/* Importar Excel */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Importar archivo Excel completado"
          >
            <Upload className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Importar Excel</span>
          </button>

          <button
            onClick={() => handleExportExcel(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
            title="Exportar registros filtrados a libro Excel editable"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition"
            title="Generar reporte formal PDF"
          >
            <FileText className="w-4 h-4" />
            <span>Exportar PDF</span>
          </button>

          <button
            onClick={() => {
              setEditingLog(null);
              setShowAddModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Jornada</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros por Rango de Fecha */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <Filter className="w-4 h-4 text-purple-500" />
            <span>Filtrar por Rango:</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500 text-[11px]">Desde:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500 text-[11px]">Hasta:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              placeholder="ID Empleado (Ej: EMP-001)"
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs w-44"
            />
          </div>
        </div>

        {(startDate || endDate || employeeFilter) && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setEmployeeFilter('');
            }}
            className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpiar Filtros</span>
          </button>
        )}
      </div>

      {/* KPI Cards de Horas Filtradas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Horas Ordinarias</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalRegularHrs.toFixed(1)} h
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Jornada base regular</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Horas Extras Totales</span>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {totalOvertimeHrs.toFixed(1)} h
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            50%: {totalOt50Hrs.toFixed(1)}h | 100%: {totalOt100Hrs.toFixed(1)}h
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Monto por Horas Extras</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            +{currencySymbol} {totalOvertimePay.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Recargo extraordinario devengado</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Salario Bruto Total</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {currencySymbol} {totalEarnings.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">{filteredLogs.length} jornadas evaluadas</span>
        </div>
      </div>

      {/* Tabla de Registros Detallados */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Entrada / Salida</th>
                <th className="py-3 px-4">Descanso</th>
                <th className="py-3 px-4">Horas Reg.</th>
                <th className="py-3 px-4">Extra 50%</th>
                <th className="py-3 px-4">Extra 100%</th>
                <th className="py-3 px-4">Tarifa/H</th>
                <th className="py-3 px-4">Salario ({currencySymbol})</th>
                <th className="py-3 px-4">Empleado / Notas</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No hay registros que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3 px-4 font-mono font-medium whitespace-nowrap">
                      {log.work_date}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {log.arrival_time || '08:00'} - {log.departure_time || '17:00'}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500">
                      {log.break_duration_mins || 60}m
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold">
                      {log.regular_hours.toFixed(1)} h
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {log.overtime_50_hours > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
                          +{log.overtime_50_hours.toFixed(1)} h
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {log.overtime_100_hours > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
                          +{log.overtime_100_hours.toFixed(1)} h
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500">
                      {currencySymbol} {log.hourly_rate.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {currencySymbol} {log.total_pay.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-[11px] max-w-xs">
                      {log.employee_id && (
                        <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-mono mr-1">
                          {log.employee_id}
                        </span>
                      )}
                      <span className="truncate">{log.notes || 'Jornada habitual'}</span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(log)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 transition"
                        title="Editar registro"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agregar / Editar Jornada */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-500" />
                <span>{editingLog ? 'Editar Registro de Jornada' : 'Registrar Jornada Laboral'}</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha de la Jornada:
                  </label>
                  <input
                    type="date"
                    required
                    value={workDate}
                    onChange={(e) => setWorkDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ID / Código Empleado:
                  </label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="EMP-001"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hora Entrada:
                  </label>
                  <input
                    type="time"
                    required
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-center font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hora Salida:
                  </label>
                  <input
                    type="time"
                    required
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-center font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Descanso (Min):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={breakMins}
                    onChange={(e) => setBreakMins(Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tarifa por Hora Base ({currencySymbol}):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notas / Justificación de Horas Extras:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Cierre contable, despacho nocturno, guardia..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white"
                >
                  {editingLog ? 'Guardar Cambios' : 'Registrar Jornada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
