import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../services/storage';
import { Transaction } from '../../types/database';
import { jsPDF } from 'jspdf';
import {
  FileSpreadsheet,
  Download,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Layers,
  X,
  Calendar,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export const ReportsView: React.FC = () => {
  const { currentSpace, currentUser } = useAuth();
  const { currency, currencySymbol, formatAmount } = useCurrency();
  const [importText, setImportText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const state = localDB.getState();

  if (!currentSpace || !currentUser) {
    return <div className="p-8 text-center text-slate-500">Selecciona un espacio.</div>;
  }

  const spaceTransactions = state.transactions.filter((t) => t.space_id === currentSpace.id);
  const spaceAccounts = state.accounts.filter((a) => a.space_id === currentSpace.id);
  const spaceCategories = state.categories;

  // Cálculos
  const totalIncome = spaceTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = spaceTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // 1. Exportar a CSV (Compatible Excel)
  const handleExportCSV = () => {
    const headers = ['ID', 'Fecha', 'Tipo', 'Descripcion', 'Monto_HNL', 'Cuenta', 'Categoria', 'Etiquetas'];
    const rows = spaceTransactions.map((t) => {
      const acc = spaceAccounts.find((a) => a.id === t.account_id);
      const cat = spaceCategories.find((c) => c.id === t.category_id);
      return [
        t.id,
        t.date,
        t.type,
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount.toFixed(2),
        `"${(acc?.name || '').replace(/"/g, '""')}"`,
        `"${(cat?.name || '').replace(/"/g, '""')}"`,
        `"${(t.tags || []).join(', ')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Finanzas_${currentSpace.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Generar PDF descargable con jsPDF
  const handleGeneratePDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Encabezado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text('FinanzasPro - Estado Financiero Personal', 14, 20);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Espacio Financiero: ${currentSpace.name}`, 14, 28);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-HN')} ${new Date().toLocaleTimeString('es-HN')}`, 14, 34);
    doc.text(`Generado por: ${currentUser.display_name} (${currentUser.email})`, 14, 40);

    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 44, 196, 44);

    // Resumen de Totales
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text(`Resumen de Movimientos Consolidados (${currency})`, 14, 52);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Ingresos:`, 14, 60);
    doc.setTextColor(16, 185, 129);
    doc.text(`+ ${currencySymbol} ${totalIncome.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`, 70, 60);

    doc.setTextColor(80, 80, 80);
    doc.text(`Total Gastos:`, 14, 66);
    doc.setTextColor(225, 29, 72);
    doc.text(`- ${currencySymbol} ${totalExpense.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`, 70, 66);

    doc.setTextColor(80, 80, 80);
    doc.text(`Flujo Neto de Caja:`, 14, 72);
    doc.setTextColor(netBalance >= 0 ? 16 : 225, netBalance >= 0 ? 185 : 29, netBalance >= 0 ? 129 : 72);
    doc.text(`${currencySymbol} ${netBalance.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`, 70, 72);

    // Tabla de Transacciones
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Detalle de Transacciones del Periodo', 14, 84);

    let y = 92;
    doc.setFontSize(9);
    doc.setFillColor(245, 245, 245);
    doc.rect(14, y - 5, 182, 7, 'F');
    doc.text('Fecha', 16, y);
    doc.text('Descripción', 42, y);
    doc.text('Tipo', 115, y);
    doc.text('Monto (L.)', 165, y);

    y += 7;
    doc.setFont('helvetica', 'normal');

    spaceTransactions.slice(0, 25).forEach((t) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.setTextColor(90, 90, 90);
      doc.text(t.date, 16, y);
      doc.text(t.description.substring(0, 38), 42, y);
      doc.text(t.type === 'income' ? 'Ingreso' : t.type === 'expense' ? 'Gasto' : 'Transfer', 115, y);

      if (t.type === 'income') {
        doc.setTextColor(16, 185, 129);
      } else if (t.type === 'expense') {
        doc.setTextColor(225, 29, 72);
      } else {
        doc.setTextColor(59, 130, 246);
      }

      doc.text(`${t.amount.toFixed(2)}`, 165, y);
      y += 6;
    });

    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('FinanzasPro • Documento Certificado de Gestión Financiera Personal', 14, 288);

    doc.save(`Estado_Financiero_${currentSpace.name.replace(/\s+/g, '_')}.pdf`);
  };

  // 3. Procesar importación CSV
  const handleParseImport = () => {
    if (!importText.trim()) return;

    try {
      const lines = importText.trim().split(/\r?\n/);
      if (lines.length < 2) {
        alert('El archivo o texto debe tener encabezado y al menos una fila de datos');
        return;
      }

      const rows: any[] = [];
      const defaultAcc = spaceAccounts[0];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');

        // Formato esperado: Fecha, Tipo (income/expense), Monto, Descripción
        const date = parts[0]?.trim() || new Date().toISOString().split('T')[0];
        const type = parts[1]?.toLowerCase().includes('ingreso') || parts[1]?.toLowerCase().includes('income') ? 'income' : 'expense';
        const amount = parseFloat(parts[2]?.trim());
        const description = parts[3]?.trim() || 'Movimiento importado';

        const isValid = !isNaN(amount) && amount > 0;

        rows.push({
          rowNumber: i,
          date,
          type,
          amount: isNaN(amount) ? 0 : amount,
          description,
          isValid,
          account_id: defaultAcc?.id,
        });
      }

      setImportPreview(rows);
    } catch (err: any) {
      alert('Error al analizar formato CSV: ' + err.message);
    }
  };

  const handleCommitImport = () => {
    if (!importPreview || importPreview.length === 0) return;

    const validRows = importPreview.filter((r) => r.isValid);
    let count = 0;

    validRows.forEach((r) => {
      localDB.addTransaction({
        space_id: currentSpace.id,
        user_id: currentUser.id,
        account_id: r.account_id || spaceAccounts[0]?.id || '',
        type: r.type,
        amount: r.amount,
        currency: currentSpace.currency || 'HNL',
        date: r.date,
        description: r.description,
        tags: ['importado_csv'],
      });
      count++;
    });

    setImportStatus(`Se importaron exitosamente ${count} transacciones a ${currentSpace.name}.`);
    setImportPreview(null);
    setImportText('');
    setShowImportModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Centro de Reportes, Excel y Exportación PDF</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Descarga tus registros en formatos estándar verificables o importa plantillas de datos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV / Excel</span>
          </button>

          <button
            onClick={handleGeneratePDF}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      {/* Notificación de Importación Exitosa */}
      {importStatus && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{importStatus}</span>
          </div>
          <button onClick={() => setImportStatus(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tarjetas de Información del Reporte */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Volumen de Transacciones</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {spaceTransactions.length} registros
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Auditables bajo RLS</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Ingresos Acumulados</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatAmount(totalIncome)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Salarios y fuentes directas</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Gastos Totales</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {formatAmount(totalExpense)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Egresos liquidados</span>
        </div>
      </div>

      {/* Modal Importar Datos */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-500" />
                <span>Importar Planilla de Transacciones (CSV)</span>
              </h3>
              <button onClick={() => setShowImportModal(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!importPreview ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Pega las líneas CSV en el formato: <br />
                  <code className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                    Fecha,Tipo,Monto,Descripcion
                  </code>
                </p>

                <textarea
                  rows={6}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`Fecha,Tipo,Monto,Descripcion\n2026-10-18,gasto,150.00,Combustible Texaco\n2026-10-18,ingreso,5000.00,Pago quincena`}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleParseImport}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    Analizar y Previsualizar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Filas Detectadas ({importPreview.length})
                  </span>
                  <button
                    onClick={() => setImportPreview(null)}
                    className="text-xs text-emerald-600 font-semibold"
                  >
                    Modificar datos
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 text-slate-500">
                      <tr>
                        <th className="p-2">Fecha</th>
                        <th className="p-2">Tipo</th>
                        <th className="p-2">Monto</th>
                        <th className="p-2">Descripción</th>
                        <th className="p-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {importPreview.map((r, i) => (
                        <tr key={i} className={r.isValid ? '' : 'bg-rose-50/50'}>
                          <td className="p-2 font-mono">{r.date}</td>
                          <td className="p-2 capitalize">{r.type}</td>
                          <td className="p-2 font-mono">L. {r.amount}</td>
                          <td className="p-2 truncate max-w-xs">{r.description}</td>
                          <td className="p-2">
                            {r.isValid ? (
                              <span className="text-[10px] text-emerald-600 font-bold">Válido</span>
                            ) : (
                              <span className="text-[10px] text-rose-600 font-bold">Inválido</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCommitImport}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                  >
                    Confirmar e Importar al Espacio
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
