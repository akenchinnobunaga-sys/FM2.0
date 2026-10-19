import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../services/storage';
import {
  FuelRecord,
  VehicleMaintenanceRecord,
  VehicleOtherExpense,
  MaintenanceType,
  VehicleOtherExpenseType,
  FuelType,
  FuelUnit,
} from '../../types/database';
import { ExcelService } from '../../services/excelService';
import { jsPDF } from 'jspdf';
import {
  Car,
  Fuel,
  Wrench,
  Gauge,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Filter,
  AlertTriangle,
  X,
  CheckCircle2,
  Receipt,
  Layers,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export const VehicleMasterView: React.FC = () => {
  const { currentSpace, currentUser } = useAuth();
  const { currency, currencySymbol, formatAmount } = useCurrency();
  const [activeSubTab, setActiveSubTab] = useState<'fuel' | 'mileage' | 'maintenance' | 'other' | 'consolidated'>('fuel');
  const [refreshKey, setRefreshKey] = useState(0);

  // Filtros de fecha
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modales
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [showOtherModal, setShowOtherModal] = useState(false);

  // Form Combustible
  const [fuelDate, setFuelDate] = useState(new Date().toISOString().split('T')[0]);
  const [fuelOdometer, setFuelOdometer] = useState('');
  const [fuelQty, setFuelQty] = useState('');
  const [fuelUnit, setFuelUnit] = useState<FuelUnit>('liters');
  const [fuelType, setFuelType] = useState<FuelType>('super');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelStation, setFuelStation] = useState('Texaco');
  const [isFullTank, setIsFullTank] = useState(true);
  const [fuelNotes, setFuelNotes] = useState('');

  // Form Mantenimiento
  const [maintDate, setMaintDate] = useState(new Date().toISOString().split('T')[0]);
  const [maintOdometer, setMaintOdometer] = useState('');
  const [maintType, setMaintType] = useState<MaintenanceType>('oil_change');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintParts, setMaintParts] = useState('');
  const [maintPartsCost, setMaintPartsCost] = useState('');
  const [maintLaborCost, setMaintLaborCost] = useState('');
  const [maintWorkshop, setMaintWorkshop] = useState('Lubricentro');
  const [nextMaintDate, setNextMaintDate] = useState('');
  const [nextMaintKm, setNextMaintKm] = useState('');
  const [maintNotes, setMaintNotes] = useState('');

  // Form Otros Gastos
  const [otherDate, setOtherDate] = useState(new Date().toISOString().split('T')[0]);
  const [otherType, setOtherType] = useState<VehicleOtherExpenseType>('car_wash');
  const [otherDesc, setOtherDesc] = useState('');
  const [otherAmount, setOtherAmount] = useState('');
  const [otherPayment, setOtherPayment] = useState('Efectivo');
  const [otherNotes, setOtherNotes] = useState('');

  const state = localDB.getState();

  if (!currentSpace || !currentUser) {
    return <div className="p-8 text-center text-slate-500">Selecciona un espacio.</div>;
  }

  // Filtrado de colecciones por espacio y fechas
  const fuelList = state.fuelRecords.filter((f) => {
    const spaceOk = f.space_id === currentSpace.id;
    const startOk = !startDate || f.refueling_date >= startDate;
    const endOk = !endDate || f.refueling_date <= endDate;
    return spaceOk && startOk && endOk;
  });

  const mileageList = state.mileageRecords.filter((m) => {
    const spaceOk = m.space_id === currentSpace.id;
    const startOk = !startDate || m.date >= startDate;
    const endOk = !endDate || m.date <= endDate;
    return spaceOk && startOk && endOk;
  });

  const maintList = state.vehicleMaintenance.filter((m) => {
    const spaceOk = m.space_id === currentSpace.id;
    const startOk = !startDate || m.maintenance_date >= startDate;
    const endOk = !endDate || m.maintenance_date <= endDate;
    return spaceOk && startOk && endOk;
  });

  const otherList = state.vehicleOtherExpenses.filter((o) => {
    const spaceOk = o.space_id === currentSpace.id;
    const startOk = !startDate || o.date >= startDate;
    const endOk = !endDate || o.date <= endDate;
    return spaceOk && startOk && endOk;
  });

  // Totales
  const totalFuelCost = fuelList.reduce((acc, f) => acc + f.total_cost_hnl, 0);
  const totalFuelQty = fuelList.reduce((acc, f) => acc + f.fuel_quantity, 0);
  const totalMaintCost = maintList.reduce((acc, m) => acc + m.total_cost, 0);
  const totalOtherCost = otherList.reduce((acc, o) => acc + o.amount_hnl, 0);
  const consolidatedVehicleCost = totalFuelCost + totalMaintCost + totalOtherCost;

  // Promedio km/L
  const validEconomyRecords = fuelList.filter((f) => f.fuel_efficiency_kml && f.fuel_efficiency_kml > 0);
  const avgEfficiency =
    validEconomyRecords.length > 0
      ? validEconomyRecords.reduce((acc, f) => acc + (f.fuel_efficiency_kml || 0), 0) / validEconomyRecords.length
      : 39.5;

  // Último odómetro registrado en el sistema
  const latestOdometer = Math.max(
    ...fuelList.map((f) => f.odometer_km),
    ...maintList.map((m) => m.odometer_km),
    14970
  );

  // Guardar Combustible
  const handleSaveFuel = (e: React.FormEvent) => {
    e.preventDefault();
    const km = parseInt(fuelOdometer, 10);
    const qty = parseFloat(fuelQty);
    const cost = parseFloat(fuelCost);

    if (isNaN(km) || isNaN(qty) || isNaN(cost) || qty <= 0 || cost <= 0) {
      alert('Ingresa valores numéricos válidos mayores a cero.');
      return;
    }

    // Validación de odómetro inconsistente
    const lastRec = state.fuelRecords.filter((f) => f.space_id === currentSpace.id).sort((a, b) => b.odometer_km - a.odometer_km)[0];
    if (lastRec && km < lastRec.odometer_km) {
      const confirmInconsistent = confirm(
        `¡Alerta de Consistencia! El odómetro ingresado (${km} km) es MENOR al último guardado (${lastRec.odometer_km} km). ¿Deseas guardarlo de todos modos?`
      );
      if (!confirmInconsistent) return;
    }

    const unitPrice = parseFloat((cost / qty).toFixed(2));

    localDB.addFuelRecord({
      space_id: currentSpace.id,
      user_id: currentUser.id,
      refueling_date: fuelDate,
      odometer_km: km,
      fuel_quantity: qty,
      fuel_type: fuelType,
      unit: fuelUnit,
      total_cost_hnl: cost,
      cost_per_unit: unitPrice,
      gas_station: fuelStation.trim() || 'Estación Local',
      is_full_tank: isFullTank,
      notes: fuelNotes.trim() || undefined,
    });

    setFuelOdometer('');
    setFuelQty('');
    setFuelCost('');
    setFuelNotes('');
    setShowFuelModal(false);
    setRefreshKey((k) => k + 1);
  };

  // Guardar Mantenimiento
  const handleSaveMaint = (e: React.FormEvent) => {
    e.preventDefault();
    const km = parseInt(maintOdometer, 10);
    const partsC = parseFloat(maintPartsCost) || 0;
    const laborC = parseFloat(maintLaborCost) || 0;
    const total = partsC + laborC;

    if (isNaN(km) || !maintDesc.trim() || total <= 0) {
      alert('Ingresa descripción, odómetro y costo válido.');
      return;
    }

    localDB.addVehicleMaintenance({
      space_id: currentSpace.id,
      user_id: currentUser.id,
      maintenance_date: maintDate,
      odometer_km: km,
      maintenance_type: maintType,
      description: maintDesc.trim(),
      parts_replaced: maintParts.trim() || undefined,
      parts_cost: partsC,
      labor_cost: laborC,
      total_cost: total,
      workshop: maintWorkshop.trim() || 'Taller',
      next_maintenance_date: nextMaintDate || undefined,
      next_maintenance_km: nextMaintKm ? parseInt(nextMaintKm, 10) : undefined,
      notes: maintNotes.trim() || undefined,
    });

    setMaintOdometer('');
    setMaintDesc('');
    setMaintParts('');
    setMaintPartsCost('');
    setMaintLaborCost('');
    setShowMaintModal(false);
    setRefreshKey((k) => k + 1);
  };

  // Guardar Otros Gastos
  const handleSaveOther = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(otherAmount);
    if (!amount || amount <= 0 || !otherDesc.trim()) {
      alert('Ingresa una descripción y monto válido.');
      return;
    }

    localDB.addVehicleOtherExpense({
      space_id: currentSpace.id,
      user_id: currentUser.id,
      date: otherDate,
      expense_type: otherType,
      description: otherDesc.trim(),
      amount_hnl: amount,
      payment_method: otherPayment,
      notes: otherNotes.trim() || undefined,
    });

    setOtherDesc('');
    setOtherAmount('');
    setOtherNotes('');
    setShowOtherModal(false);
    setRefreshKey((k) => k + 1);
  };

  // Exportar Excel XLSX Consolidado o Filtrado
  const handleExportExcel = () => {
    const label = startDate || endDate ? `Filtrado (${startDate || 'Inicio'} al ${endDate || 'Fin'})` : 'Historial Completo';
    ExcelService.exportVehicleRecordsToExcel(
      fuelList,
      maintList,
      otherList,
      `FinanzasPro_Vehiculo_${new Date().toISOString().split('T')[0]}.xlsx`,
      label
    );
  };

  // Exportar PDF
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(245, 158, 11);
    doc.text('FinanzasPro - Reporte Consolidado de Costos de Vehículo', 14, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Espacio: ${currentSpace.name} | Periodo: ${startDate || 'Inicio'} al ${endDate || 'Hoy'}`, 14, 25);
    doc.text(`Costo Total Consolidado: L. ${consolidatedVehicleCost.toFixed(2)} | Combustible: L. ${totalFuelCost.toFixed(2)} | Taller: L. ${totalMaintCost.toFixed(2)}`, 14, 31);
    doc.line(14, 35, 196, 35);

    let y = 44;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Detalle de Repostajes de Combustible', 14, y);

    y += 7;
    doc.setFontSize(8.5);
    doc.setFillColor(245, 245, 245);
    doc.rect(14, y - 4, 182, 6, 'F');
    doc.text('Fecha', 16, y);
    doc.text('Odómetro', 42, y);
    doc.text('Cantidad', 75, y);
    doc.text('Rendimiento', 105, y);
    doc.text('Estación', 140, y);
    doc.text('Total (L.)', 172, y);

    y += 6;
    doc.setFont('helvetica', 'normal');
    fuelList.slice(0, 15).forEach((f) => {
      doc.text(f.refueling_date, 16, y);
      doc.text(`${f.odometer_km} km`, 42, y);
      doc.text(`${f.fuel_quantity} ${f.unit}`, 75, y);
      doc.text(f.fuel_efficiency_kml ? `${f.fuel_efficiency_kml} km/L` : '-', 105, y);
      doc.text(f.gas_station.substring(0, 18), 140, y);
      doc.text(`${currencySymbol} ${f.total_cost_hnl.toFixed(2)}`, 172, y);
      y += 5.5;
    });

    doc.save(`Reporte_Vehiculo_${currentSpace.name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">
            SECCIÓN 2 • CONTROL VEHICULAR INTEGRAL
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mt-0.5">
            <Car className="w-5 h-5 text-amber-500" />
            <span>Vehículo: Combustible, Kilometraje, Mantenimiento y Costos</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Seguimiento riguroso de odómetro, rendimiento (km/L), repuestos mecánicos y otros gastos sin duplicación.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition"
          >
            <FileText className="w-4 h-4" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Sub-Navegación de Secciones de Vehículo */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('fuel')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
            activeSubTab === 'fuel'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Fuel className="w-4 h-4" />
          <span>Combustible ({fuelList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('mileage')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
            activeSubTab === 'mileage'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>Kilometraje y Odómetro</span>
        </button>

        <button
          onClick={() => setActiveSubTab('maintenance')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
            activeSubTab === 'maintenance'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Mantenimiento de Taller ({maintList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('other')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
            activeSubTab === 'other'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Otros Gastos (Llantas, Matrícula)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('consolidated')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
            activeSubTab === 'consolidated'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Consolidado de Costos</span>
        </button>
      </div>

      {/* Filtros de Fecha */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-amber-500" />
            <span>Filtro de Fechas:</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
            />
          </div>
        </div>

        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs text-rose-500 font-semibold flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpiar Rango</span>
          </button>
        )}
      </div>

      {/* SUB-TAB 1: COMBUSTIBLE */}
      {activeSubTab === 'fuel' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-xs text-slate-500">
              Total Combustible Periodo: <strong>{currencySymbol} {totalFuelCost.toFixed(2)}</strong> | Rendimiento Promedio: <strong>{avgEfficiency.toFixed(1)} km/L</strong>
            </div>
            <button
              onClick={() => {
                setFuelOdometer(String(latestOdometer + 40));
                setShowFuelModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-amber-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Combustible</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Odómetro</th>
                    <th className="py-3 px-4">Cantidad</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Precio/U</th>
                    <th className="py-3 px-4">Total ({currency})</th>
                    <th className="py-3 px-4">Rendimiento</th>
                    <th className="py-3 px-4">Estación</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-mono">
                  {fuelList.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                      <td className="py-3 px-4 whitespace-nowrap">{f.refueling_date}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{f.odometer_km.toLocaleString()} km</td>
                      <td className="py-3 px-4">{f.fuel_quantity} {f.unit}</td>
                      <td className="py-3 px-4 uppercase text-[10px] font-sans font-bold text-amber-600">{f.fuel_type}</td>
                      <td className="py-3 px-4 text-slate-500">{currencySymbol} {f.cost_per_unit.toFixed(2)}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{currencySymbol} {f.total_cost_hnl.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        {f.fuel_efficiency_kml ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {f.fuel_efficiency_kml} km/L
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-300 text-[11px] truncate max-w-xs">{f.gas_station}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            if (confirm('¿Eliminar este registro de combustible?')) {
                              localDB.deleteFuelRecord(f.id);
                              setRefreshKey((k) => k + 1);
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: KILOMETRAJE */}
      {activeSubTab === 'mileage' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
            <strong>Control de Odómetro y Distancias:</strong> El sistema rechaza distancias negativas y detecta incoherencias entre lecturas consecutivas para asegurar cálculos de costo por kilómetro fiables.
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Odómetro Previo</th>
                  <th className="py-3 px-4">Odómetro Actual</th>
                  <th className="py-3 px-4">Km Recorridos</th>
                  <th className="py-3 px-4">Costo Est./Km</th>
                  <th className="py-3 px-4">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-mono">
                {mileageList.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30">
                    <td className="py-3 px-4">{m.date}</td>
                    <td className="py-3 px-4 text-slate-500">{m.previous_odometer_km.toLocaleString()} km</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{m.current_odometer_km.toLocaleString()} km</td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">+{m.km_traveled} km</td>
                    <td className="py-3 px-4">{m.estimated_cost_per_km ? `${currencySymbol} ${m.estimated_cost_per_km}/km` : '-'}</td>
                    <td className="py-3 px-4 font-sans text-slate-500 text-[11px]">{m.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: MANTENIMIENTO */}
      {activeSubTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Total en Taller y Repuestos: <strong>{currencySymbol} {totalMaintCost.toFixed(2)}</strong></span>
            <button
              onClick={() => {
                setMaintOdometer(String(latestOdometer));
                setShowMaintModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-amber-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Mantenimiento</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Odómetro</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Descripción y Repuestos</th>
                  <th className="py-3 px-4">Repuestos ({currencySymbol})</th>
                  <th className="py-3 px-4">Mano Obra ({currencySymbol})</th>
                  <th className="py-3 px-4">Total ({currency})</th>
                  <th className="py-3 px-4">Taller</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {maintList.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30">
                    <td className="py-3 px-4 font-mono whitespace-nowrap">{m.maintenance_date}</td>
                    <td className="py-3 px-4 font-mono font-bold">{m.odometer_km.toLocaleString()} km</td>
                    <td className="py-3 px-4 font-semibold text-amber-600 capitalize">{m.maintenance_type}</td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">{m.description}</div>
                      {m.parts_replaced && <div className="text-[10px] text-slate-400 truncate">Repuestos: {m.parts_replaced}</div>}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{currencySymbol} {m.parts_cost.toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{currencySymbol} {m.labor_cost.toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{currencySymbol} {m.total_cost.toFixed(2)}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] truncate">{m.workshop}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar registro de mantenimiento?')) {
                            localDB.deleteVehicleMaintenance(m.id);
                            setRefreshKey((k) => k + 1);
                          }
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: OTROS GASTOS DEL VEHÍCULO */}
      {activeSubTab === 'other' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Llantas, matrícula, lavados, parqueo: <strong>{currencySymbol} {totalOtherCost.toFixed(2)}</strong></span>
            <button
              onClick={() => setShowOtherModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-amber-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Otro Gasto</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Rubro</th>
                  <th className="py-3 px-4">Descripción</th>
                  <th className="py-3 px-4">Método Pago</th>
                  <th className="py-3 px-4">Monto ({currency})</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {otherList.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30">
                    <td className="py-3 px-4 font-mono">{o.date}</td>
                    <td className="py-3 px-4 font-semibold text-amber-600 capitalize">{o.expense_type}</td>
                    <td className="py-3 px-4 font-medium">{o.description}</td>
                    <td className="py-3 px-4 text-slate-500">{o.payment_method}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{currencySymbol} {o.amount_hnl.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar gasto?')) {
                            localDB.deleteVehicleOtherExpense(o.id);
                            setRefreshKey((k) => k + 1);
                          }
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: CONSOLIDADO */}
      {activeSubTab === 'consolidated' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Combustible Total</span>
              <span className="text-2xl font-black text-amber-600 font-mono">{currencySymbol} {totalFuelCost.toFixed(2)}</span>
              <span className="text-[11px] text-slate-400 block mt-1">{totalFuelQty.toFixed(1)} Lts consumidos</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Taller y Mantenimiento</span>
              <span className="text-2xl font-black text-rose-600 font-mono">{currencySymbol} {totalMaintCost.toFixed(2)}</span>
              <span className="text-[11px] text-slate-400 block mt-1">{maintList.length} servicios de taller</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Otros Gastos Vehículo</span>
              <span className="text-2xl font-black text-blue-600 font-mono">{currencySymbol} {totalOtherCost.toFixed(2)}</span>
              <span className="text-[11px] text-slate-400 block mt-1">Llantas, matrícula, lavado</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-amber-500/30 bg-amber-50/20 shadow-sm">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 block mb-1">COSTO CONSOLIDADO TOTAL</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{currencySymbol} {consolidatedVehicleCost.toFixed(2)}</span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 block mt-1">Sin duplicación de cuentas</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Combustible */}
      {showFuelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Fuel className="w-5 h-5 text-amber-500" />
                <span>Registrar Carga de Combustible</span>
              </h3>
              <button onClick={() => setShowFuelModal(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFuel} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fecha:</label>
                  <input
                    type="date"
                    required
                    value={fuelDate}
                    onChange={(e) => setFuelDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Odómetro (Km Actual)*:</label>
                  <input
                    type="number"
                    required
                    value={fuelOdometer}
                    onChange={(e) => setFuelOdometer(e.target.value)}
                    placeholder="Ej: 15200"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Cantidad:</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={fuelQty}
                    onChange={(e) => setFuelQty(e.target.value)}
                    placeholder="9.5"
                    className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Unidad:</label>
                  <select
                    value={fuelUnit}
                    onChange={(e) => setFuelUnit(e.target.value as FuelUnit)}
                    className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  >
                    <option value="liters">Litros</option>
                    <option value="gallons">Galones</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo:</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as FuelType)}
                    className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  >
                    <option value="super">Súper</option>
                    <option value="regular">Regular</option>
                    <option value="diesel">Diésel</option>
                    <option value="glp">GLP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Costo Total ({currencySymbol}):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={fuelCost}
                    onChange={(e) => setFuelCost(e.target.value)}
                    placeholder="300.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Gasolinera:</label>
                  <input
                    type="text"
                    value={fuelStation}
                    onChange={(e) => setFuelStation(e.target.value)}
                    placeholder="Texaco, Uno, Puma..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 cursor-pointer text-xs font-semibold text-amber-800 dark:text-amber-300">
                <input
                  type="checkbox"
                  checked={isFullTank}
                  onChange={(e) => setIsFullTank(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Tanque Lleno (Permite cálculo preciso de Km/L)</span>
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowFuelModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white"
                >
                  Guardar Carga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mantenimiento */}
      {showMaintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-500" />
                <span>Registrar Mantenimiento de Taller</span>
              </h3>
              <button onClick={() => setShowMaintModal(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaint} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fecha:</label>
                  <input
                    type="date"
                    required
                    value={maintDate}
                    onChange={(e) => setMaintDate(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Odómetro (Km):</label>
                  <input
                    type="number"
                    required
                    value={maintOdometer}
                    onChange={(e) => setMaintOdometer(e.target.value)}
                    placeholder="15000"
                    className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo:</label>
                  <select
                    value={maintType}
                    onChange={(e) => setMaintType(e.target.value as MaintenanceType)}
                    className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  >
                    <option value="oil_change">Cambio Aceite</option>
                    <option value="brakes">Frenos</option>
                    <option value="chain_sprocket">Cadena / Corona</option>
                    <option value="tires">Llantas</option>
                    <option value="engine_tuneup">Afinamiento</option>
                    <option value="battery">Batería</option>
                    <option value="general_inspection">Revisión Gral.</option>
                    <option value="repair">Reparación</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Descripción del Servicio:</label>
                <input
                  type="text"
                  required
                  value={maintDesc}
                  onChange={(e) => setMaintDesc(e.target.value)}
                  placeholder="Ej: Cambio de aceite Motul 10W40, filtro y tensión de cadena..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Repuestos Sustituidos:</label>
                <input
                  type="text"
                  value={maintParts}
                  onChange={(e) => setMaintParts(e.target.value)}
                  placeholder="Filtro de aceite, bujía NGK..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Repuestos ({currencySymbol}):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={maintPartsCost}
                    onChange={(e) => setMaintPartsCost(e.target.value)}
                    placeholder="450.00"
                    className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Mano Obra ({currencySymbol}):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={maintLaborCost}
                    onChange={(e) => setMaintLaborCost(e.target.value)}
                    placeholder="150.00"
                    className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Taller / Mecánico:</label>
                  <input
                    type="text"
                    value={maintWorkshop}
                    onChange={(e) => setMaintWorkshop(e.target.value)}
                    placeholder="Lubricentro"
                    className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-700">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Próximo Odómetro (Km):</label>
                  <input
                    type="number"
                    value={nextMaintKm}
                    onChange={(e) => setNextMaintKm(e.target.value)}
                    placeholder="Ej: 17500"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Próxima Fecha Servicio:</label>
                  <input
                    type="date"
                    value={nextMaintDate}
                    onChange={(e) => setNextMaintDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowMaintModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white"
                >
                  Guardar Mantenimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Otros Gastos */}
      {showOtherModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-500" />
                <span>Registrar Otro Gasto de Vehículo</span>
              </h3>
              <button onClick={() => setShowOtherModal(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOther} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fecha:</label>
                  <input
                    type="date"
                    required
                    value={otherDate}
                    onChange={(e) => setOtherDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo de Gasto:</label>
                  <select
                    value={otherType}
                    onChange={(e) => setOtherType(e.target.value as VehicleOtherExpenseType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  >
                    <option value="car_wash">Lavado y Engrase</option>
                    <option value="registration">Matrícula IP / Tránsito</option>
                    <option value="insurance">Seguro / Póliza</option>
                    <option value="parking">Parqueo / Estacionamiento</option>
                    <option value="tires">Llantas y Neumáticos</option>
                    <option value="spare_parts">Accesorios y Repuestos Menores</option>
                    <option value="other">Otro Gasto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Descripción:</label>
                <input
                  type="text"
                  required
                  value={otherDesc}
                  onChange={(e) => setOtherDesc(e.target.value)}
                  placeholder="Ej: Pago de boleta de matrícula IP Honduras..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Monto en {currency} ({currencySymbol}):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={otherAmount}
                    onChange={(e) => setOtherAmount(e.target.value)}
                    placeholder="120.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Método de Pago:</label>
                  <select
                    value={otherPayment}
                    onChange={(e) => setOtherPayment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta BAC">Tarjeta BAC</option>
                    <option value="Tarjeta Ficohsa">Tarjeta Ficohsa</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowOtherModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white"
                >
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
