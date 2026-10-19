import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../services/storage';
import { GeneralExpenseRecord, Category } from '../../types/database';
import { ExcelService } from '../../services/excelService';
import { jsPDF } from 'jspdf';
import {
  Receipt,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  DollarSign,
  Tag,
  Filter,
  FileSpreadsheet,
  FileText,
  X,
  PieChart,
  TrendingDown,
  Settings2,
} from 'lucide-react';

export const GeneralExpensesView: React.FC = () => {
  const { currentSpace, currentUser } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<GeneralExpenseRecord | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form Gastos
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expCategoryId, setExpCategoryId] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expPayment, setExpPayment] = useState('Tarjeta BAC');
  const [expReceipt, setExpReceipt] = useState('');
  const [expNotes, setExpNotes] = useState('');

  // Form Categoría
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#10b981');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [renameCatName, setRenameCatName] = useState('');

  const state = localDB.getState();

  if (!currentSpace || !currentUser) {
    return <div className="p-8 text-center text-slate-500">Selecciona un espacio.</div>;
  }

  const allExpenses = state.generalExpenses.filter((g) => g.space_id === currentSpace.id);
  const categories = state.categories.filter((c) => c.type === 'expense');

  // Filtrado
  const filteredExpenses = allExpenses.filter((e) => {
    const startOk = !startDate || e.date >= startDate;
    const endOk = !endDate || e.date <= endDate;
    const catOk = selectedCategoryFilter === 'all' || e.category_id === selectedCategoryFilter;
    const searchOk =
      !searchTerm ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category_name.toLowerCase().includes(searchTerm.toLowerCase());
    return startOk && endOk && catOk && searchOk;
  });

  const totalExpenseAmount = filteredExpenses.reduce((acc, e) => acc + e.amount_hnl, 0);

  // Análisis por categoría (agrupación)
  const categorySummary = new Map<string, { total: number; color: string; count: number }>();
  filteredExpenses.forEach((e) => {
    const catObj = categories.find((c) => c.id === e.category_id || c.name === e.category_name);
    const prev = categorySummary.get(e.category_name) || { total: 0, color: catObj?.color || '#64748b', count: 0 };
    categorySummary.set(e.category_name, {
      total: prev.total + e.amount_hnl,
      color: prev.color,
      count: prev.count + 1,
    });
  });

  const sortedCategories = Array.from(categorySummary.entries()).sort((a, b) => b[1].total - a[1].total);
  const highestCategory = sortedCategories[0];

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expAmount);
    if (!amount || amount <= 0 || !expDesc.trim()) {
      alert('Ingresa descripción y monto válido.');
      return;
    }

    const catObj = categories.find((c) => c.id === expCategoryId) || categories[0];

    if (editingExpense) {
      localDB.updateGeneralExpense(editingExpense.id, {
        date: expDate,
        category_id: catObj.id,
        category_name: catObj.name,
        description: expDesc.trim(),
        amount_hnl: amount,
        payment_method: expPayment,
        receipt_ref: expReceipt.trim() || undefined,
        notes: expNotes.trim() || undefined,
      });
      setEditingExpense(null);
    } else {
      localDB.addGeneralExpense({
        space_id: currentSpace.id,
        user_id: currentUser.id,
        date: expDate,
        category_id: catObj.id,
        category_name: catObj.name,
        description: expDesc.trim(),
        amount_hnl: amount,
        payment_method: expPayment,
        receipt_ref: expReceipt.trim() || undefined,
        notes: expNotes.trim() || undefined,
      });
    }

    setExpDesc('');
    setExpAmount('');
    setExpReceipt('');
    setExpNotes('');
    setShowAddModal(false);
    setRefreshKey((k) => k + 1);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    localDB.addCategory({
      space_id: currentSpace.id,
      name: newCatName.trim(),
      type: 'expense',
      color: newCatColor,
      icon: 'Tag',
      is_system_default: false,
    });

    setNewCatName('');
    setRefreshKey((k) => k + 1);
  };

  const handleRenameCategory = (id: string) => {
    if (!renameCatName.trim()) return;
    localDB.renameCategory(id, renameCatName.trim());
    setEditingCategoryId(null);
    setRenameCatName('');
    setRefreshKey((k) => k + 1);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (confirm(`¿Eliminar la categoría "${name}"?`)) {
      localDB.deleteCategory(id);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleExportExcel = () => {
    const label = startDate || endDate ? `Rango: ${startDate || 'Inicio'} a ${endDate || 'Fin'}` : 'Historial Completo';
    ExcelService.exportGeneralExpensesToExcel(
      filteredExpenses,
      categories,
      `FinanzasPro_Gastos_Generales_${new Date().toISOString().split('T')[0]}.xlsx`,
      label
    );
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text('FinanzasPro - Reporte de Gastos Generales', 14, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Espacio: ${currentSpace.name} | Periodo: ${startDate || 'Inicio'} al ${endDate || 'Hoy'}`, 14, 25);
    doc.text(`Gasto Total Consolidado: L. ${totalExpenseAmount.toFixed(2)} | Categoría Mayoritaria: ${highestCategory ? highestCategory[0] : 'N/A'}`, 14, 31);
    doc.line(14, 35, 196, 35);

    let y = 44;
    doc.setFontSize(8.5);
    doc.setFillColor(245, 245, 245);
    doc.rect(14, y - 4, 182, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha', 16, y);
    doc.text('Categoría', 42, y);
    doc.text('Descripción', 85, y);
    doc.text('Método', 140, y);
    doc.text('Total (L.)', 172, y);

    y += 6;
    doc.setFont('helvetica', 'normal');
    filteredExpenses.slice(0, 30).forEach((e) => {
      doc.text(e.date, 16, y);
      doc.text(e.category_name.substring(0, 20), 42, y);
      doc.text(e.description.substring(0, 28), 85, y);
      doc.text(e.payment_method.substring(0, 15), 140, y);
      doc.text(`L. ${e.amount_hnl.toFixed(2)}`, 172, y);
      y += 5.5;
    });

    doc.save(`Reporte_Gastos_Generales_${currentSpace.name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            SECCIÓN 3 • GASTOS GENERALES Y CATEGORÍAS
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mt-0.5">
            <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Gastos Generales y Categorías Personalizables</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Administra tus consumos del hogar, despensa y servicios con categorías editables en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-600"
          >
            <Settings2 className="w-4 h-4 text-emerald-500" />
            <span>Administrar Categorías</span>
          </button>

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

          <button
            onClick={() => {
              if (categories.length > 0) setExpCategoryId(categories[0].id);
              setEditingExpense(null);
              setShowAddModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-emerald-500" />
            <span>Filtros:</span>
          </span>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por concepto..."
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs w-44"
          />

          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
          >
            <option value="all">Todas las Categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
            />
          </div>
        </div>

        {(startDate || endDate || selectedCategoryFilter !== 'all' || searchTerm) && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setSelectedCategoryFilter('all');
              setSearchTerm('');
            }}
            className="text-xs text-rose-500 font-semibold flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* KPI Cards y Análisis de Categorías */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Gasto General Filtrado</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            L. {totalExpenseAmount.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">{filteredExpenses.length} transacciones registradas</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Categoría con Mayor Consumo</span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white truncate block">
            {highestCategory ? highestCategory[0] : 'N/A'}
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold block mt-1">
            {highestCategory ? `L. ${highestCategory[1].total.toFixed(2)} (${((highestCategory[1].total / (totalExpenseAmount || 1)) * 100).toFixed(0)}%)` : 'Sin gastos'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Categorías en Uso</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {sortedCategories.length} activas
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Total configuradas: {categories.length}</span>
        </div>
      </div>

      {/* Distribución por Categorías */}
      {sortedCategories.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-500" />
            <span>Desglose Analítico por Categoría</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {sortedCategories.map(([catName, data]) => {
              const pct = totalExpenseAmount > 0 ? (data.total / totalExpenseAmount) * 100 : 0;
              return (
                <div key={catName} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/60 text-xs">
                  <div className="flex justify-between items-center mb-1 font-semibold">
                    <span className="truncate max-w-[170px] text-slate-800 dark:text-slate-200">{catName}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">L. {data.total.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: data.color }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>{data.count} movimientos</span>
                    <span className="font-bold">{pct.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabla de Gastos Generales */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4">Método de Pago</th>
                <th className="py-3 px-4">N° Recibo / Factura</th>
                <th className="py-3 px-4 text-right">Monto (HNL)</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No se encontraron gastos generales con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{exp.date}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium text-[11px]">
                        {exp.category_name}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {exp.description}
                      {exp.notes && <span className="block text-[10px] text-slate-400 font-normal">{exp.notes}</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{exp.payment_method}</td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{exp.receipt_ref || '-'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      L. {exp.amount_hnl.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditingExpense(exp);
                          setExpDate(exp.date);
                          setExpCategoryId(exp.category_id);
                          setExpDesc(exp.description);
                          setExpAmount(String(exp.amount_hnl));
                          setExpPayment(exp.payment_method);
                          setExpReceipt(exp.receipt_ref || '');
                          setExpNotes(exp.notes || '');
                          setShowAddModal(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600"
                        title="Editar gasto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar este gasto general?')) {
                            localDB.deleteGeneralExpense(exp.id);
                            setRefreshKey((k) => k + 1);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                        title="Eliminar gasto"
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

      {/* Modal Registrar Gasto */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-500" />
                <span>{editingExpense ? 'Editar Gasto General' : 'Registrar Gasto General'}</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fecha:</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Categoría:</label>
                  <select
                    value={expCategoryId}
                    onChange={(e) => setExpCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Descripción del Gasto:</label>
                <input
                  type="text"
                  required
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="Ej: Despensa quincenal en supermercado, factura de luz..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Monto en HNL (L.):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Método de Pago:</label>
                  <select
                    value={expPayment}
                    onChange={(e) => setExpPayment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  >
                    <option value="Tarjeta BAC">Tarjeta BAC</option>
                    <option value="Tarjeta Ficohsa">Tarjeta Ficohsa</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">N° Factura / Recibo:</label>
                  <input
                    type="text"
                    value={expReceipt}
                    onChange={(e) => setExpReceipt(e.target.value)}
                    placeholder="FAC-09821"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Notas Adicionales:</label>
                  <input
                    type="text"
                    value={expNotes}
                    onChange={(e) => setExpNotes(e.target.value)}
                    placeholder="Observaciones..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {editingExpense ? 'Guardar Cambios' : 'Registrar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Administrar Categorías Dinámicas */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-500" />
                <span>Gestor de Categorías Personalizables</span>
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Crear nueva categoría */}
            <form onSubmit={handleCreateCategory} className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Agregar Nueva Categoría:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Nombre de categoría (ej: Mascotas, Gimnasio...)"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                />
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-10 h-9 p-0.5 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer"
                  title="Color representativo"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shrink-0"
                >
                  Agregar
                </button>
              </div>
            </form>

            {/* Lista y Renombrado */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Categorías Existentes ({categories.length}):
              </span>
              {categories.map((c) => (
                <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  {editingCategoryId === c.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={renameCatName}
                        onChange={(e) => setRenameCatName(e.target.value)}
                        className="px-2 py-1 rounded bg-white dark:bg-slate-800 border text-xs flex-1"
                      />
                      <button
                        onClick={() => handleRenameCategory(c.id)}
                        className="px-2 py-1 bg-emerald-600 text-white rounded font-bold"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => setEditingCategoryId(null)}
                        className="text-slate-400"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingCategoryId(c.id);
                        setRenameCatName(c.name);
                      }}
                      className="p-1 text-slate-400 hover:text-emerald-500"
                      title="Renombrar categoría"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!c.is_system_default && (
                      <button
                        onClick={() => handleDeleteCategory(c.id, c.name)}
                        className="p-1 text-slate-400 hover:text-rose-500"
                        title="Eliminar categoría"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
