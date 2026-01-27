
import { jsPDF } from 'jspdf';
// Use autoTable as a separate function import to avoid module augmentation issues with jsPDF types
import autoTable from 'jspdf-autotable';
import { Filament, PrintJob, AppSettings } from '../types';

export const generateInventoryPDF = (filaments: Filament[], jobs: PrintJob[], settings: AppSettings) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const dateStr = new Date().toLocaleDateString();

  // Primary Color: #1A9B9F (approx RGB: 26, 155, 159)
  // Fix: Explicitly define as tuple [number, number, number] to satisfy Color type requirement in autoTable
  const primaryColor: [number, number, number] = [26, 155, 159];

  // Title & Header
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('Montserrat', 'bold');
  doc.text('MERAKI 3D', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('RELATÓRIO EXECUTIVO DE ESTOQUE', 14, 28);
  doc.text(`Gerado em: ${dateStr}`, pageWidth - 14, 28, { align: 'right' });

  // Summary Box
  const totalInvested = filaments.reduce((acc, f) => acc + f.cost, 0);
  const totalInitial = filaments.reduce((acc, f) => acc + f.purchasedGrams, 0);
  const totalRemaining = filaments.reduce((acc, f) => acc + f.remainingGrams, 0);
  const totalUsed = totalInitial - totalRemaining;

  doc.setDrawColor(230);
  doc.setFillColor(245, 250, 250);
  doc.roundedRect(14, 35, pageWidth - 28, 30, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Investimento Total:', 20, 45);
  doc.text('Estoque Disponível:', 20, 52);
  doc.text('Consumo Total:', 20, 59);

  doc.setFontSize(11);
  doc.setTextColor(40);
  doc.text(`${settings.currency} ${totalInvested.toFixed(2)}`, 60, 45);
  doc.text(`${(totalRemaining / 1000).toFixed(2)} kg`, 60, 52);
  doc.text(`${(totalUsed / 1000).toFixed(2)} kg`, 60, 59);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Total de Rolos:', 110, 45);
  doc.text('Total de Impressões:', 110, 52);
  doc.text('Itens Críticos:', 110, 59);

  doc.setFontSize(11);
  doc.setTextColor(40);
  doc.text(`${filaments.length}`, 150, 45);
  doc.text(`${jobs.length}`, 150, 52);
  doc.text(`${filaments.filter(f => f.status === 'critical').length}`, 150, 59);

  // Filament Table
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Detalhamento de Inventário', 14, 80);

  const filamentRows = filaments.map(f => [
    f.id,
    f.brand,
    f.material,
    f.colorName,
    `${f.remainingGrams}g`,
    `${settings.currency} ${f.cost.toFixed(2)}`,
    f.status.toUpperCase()
  ]);

  // Use the autoTable function directly instead of doc.autoTable to avoid module augmentation errors
  autoTable(doc, {
    startY: 85,
    head: [['ID', 'Marca', 'Material', 'Cor', 'Saldo', 'Custo', 'Status']],
    body: filamentRows,
    headStyles: { fillColor: primaryColor },
    alternateRowStyles: { fillColor: [240, 248, 248] },
    margin: { top: 85 },
  });

  // Jobs Table (New Page if needed)
  // Accessing finalY from the doc object which is modified by autoTable side-effects
  const finalY = (doc as any).lastAutoTable?.finalY || 150;
  
  if (jobs.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Histórico de Consumo Recente', 14, finalY + 15);

    const jobRows = jobs.slice(0, 15).map(j => [
      new Date(j.jobDate).toLocaleDateString(),
      j.title,
      j.filamentId,
      `${j.usedGrams}g`,
      `${settings.currency} ${j.cost.toFixed(2)}`
    ]);

    // Use the autoTable function directly instead of doc.autoTable to avoid module augmentation errors
    autoTable(doc, {
      startY: finalY + 20,
      head: [['Data', 'Peça / Job', 'Filamento', 'Consumo', 'Custo']],
      body: jobRows,
      headStyles: { fillColor: [60, 60, 60] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });
  }

  // Footer
  // Fix: getNumberOfPages is a direct method of the jsPDF instance (doc), not doc.internal
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `MERAKI 3D - Sistema de Gestão de Filamentos - Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`Meraki3D_Relatorio_${dateStr.replace(/\//g, '-')}.pdf`);
};
