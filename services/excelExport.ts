
import * as XLSX from 'xlsx';
import { Filament, PrintJob, AppSettings } from '../types';

export const generateInventoryExcel = (filaments: Filament[], jobs: PrintJob[], settings: AppSettings) => {
  const wb = XLSX.utils.book_new();

  // 1. Summary Sheet
  const totalInvested = filaments.reduce((acc, f) => acc + f.cost, 0);
  const totalInitial = filaments.reduce((acc, f) => acc + f.purchasedGrams, 0);
  const totalRemaining = filaments.reduce((acc, f) => acc + f.remainingGrams, 0);
  const summaryData = [
    { Descrição: 'Total Investido', Valor: `${settings.currency} ${totalInvested.toFixed(2)}` },
    { Descrição: 'Estoque Total (kg)', Valor: (totalRemaining / 1000).toFixed(2) },
    { Descrição: 'Consumo Total (kg)', Valor: ((totalInitial - totalRemaining) / 1000).toFixed(2) },
    { Descrição: 'Total de Rolos', Valor: filaments.length },
    { Descrição: 'Total de Impressões', Valor: jobs.length },
    { Descrição: 'Itens Críticos', Valor: filaments.filter(f => f.status === 'critical').length },
  ];
  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumo Geral');

  // 2. Detailed Inventory Sheet
  const inventoryData = filaments.map(f => ({
    ID: f.id,
    Marca: f.brand,
    Material: f.material,
    Cor: f.colorName,
    'Peso Inicial (g)': f.purchasedGrams,
    'Saldo Atual (g)': f.remainingGrams,
    'Diâmetro (mm)': f.diameterMm,
    'Tara Spool (g)': f.emptySpoolGrams,
    Custo: f.cost,
    Moeda: f.currency,
    Localização: f.storageLocation,
    Status: f.status.toUpperCase(),
    'Data Cadastro': new Date(f.createdAt).toLocaleString(),
  }));
  const inventoryWs = XLSX.utils.json_to_sheet(inventoryData);
  XLSX.utils.book_append_sheet(wb, inventoryWs, 'Estoque Detalhado');

  // 3. Print Jobs Sheet
  const jobsData = jobs.map(j => ({
    ID: j.id,
    Título: j.title,
    Data: new Date(j.jobDate).toLocaleString(),
    'ID Impressora': j.printerId,
    'ID Filamento': j.filamentId,
    'Consumo (g)': j.usedGrams,
    'Custo Estimado': j.cost.toFixed(2),
    Notas: j.notes
  }));
  const jobsWs = XLSX.utils.json_to_sheet(jobsData);
  XLSX.utils.book_append_sheet(wb, jobsWs, 'Consumo - Jobs');

  // 4. Material Grouping
  const materialMap = filaments.reduce((acc, f) => {
    acc[f.material] = (acc[f.material] || 0) + f.remainingGrams;
    return acc;
  }, {} as Record<string, number>);
  const materialData = Object.entries(materialMap).map(([mat, grams]) => ({
    Material: mat,
    'Saldo Total (g)': grams,
    'Saldo Total (kg)': (grams / 1000).toFixed(2)
  }));
  const materialWs = XLSX.utils.json_to_sheet(materialData);
  XLSX.utils.book_append_sheet(wb, materialWs, 'Agrupado por Material');

  // 5. Brand Grouping
  const brandMap = filaments.reduce((acc, f) => {
    acc[f.brand] = (acc[f.brand] || 0) + f.remainingGrams;
    return acc;
  }, {} as Record<string, number>);
  const brandData = Object.entries(brandMap).map(([brand, grams]) => ({
    Marca: brand,
    'Saldo Total (g)': grams,
    'Saldo Total (kg)': (grams / 1000).toFixed(2)
  }));
  const brandWs = XLSX.utils.json_to_sheet(brandData);
  XLSX.utils.book_append_sheet(wb, brandWs, 'Agrupado por Marca');

  // Write file
  const dateStr = new Date().toLocaleDateString().replace(/\//g, '-');
  XLSX.writeFile(wb, `Meraki3D_Estoque_${dateStr}.xlsx`);
};
