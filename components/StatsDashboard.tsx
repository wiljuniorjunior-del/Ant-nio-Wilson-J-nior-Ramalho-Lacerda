
import React, { useMemo } from 'react';
import { Filament, PrintJob, DashboardVisibility } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  CartesianGrid, Area, AreaChart
} from 'recharts';

interface StatsDashboardProps {
  filaments: Filament[];
  jobs: PrintJob[];
  darkMode: boolean;
  visibility: DashboardVisibility;
  onExportPDF: () => void;
  onExportExcel: () => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ filaments, jobs, darkMode, visibility, onExportPDF, onExportExcel }) => {
  const totalInvested = filaments.reduce((acc, f) => acc + f.cost, 0);
  const totalInitialGrams = filaments.reduce((acc, f) => acc + f.purchasedGrams, 0);
  const totalAvailableGrams = filaments.reduce((acc, f) => acc + f.remainingGrams, 0);
  const totalUsedGrams = totalInitialGrams - totalAvailableGrams;
  const criticalItems = filaments.filter(f => f.status === 'critical').length;
  const usagePercentage = totalInitialGrams > 0 ? (totalUsedGrams / totalInitialGrams) * 100 : 0;

  // Pie chart data: Material distribution
  const materialData = useMemo(() => {
    const map = filaments.reduce((acc, f) => {
      acc[f.material] = (acc[f.material] || 0) + f.remainingGrams;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filaments]);
  
  const COLORS_LIST = ['#1A9B9F', '#2CB5B0', '#156A6D', '#0D4F52', '#E0F7F7', '#8884d8'];

  // Bar chart data: Brand distribution
  const brandData = useMemo(() => {
    const map = filaments.reduce((acc, f) => {
      acc[f.brand] = (acc[f.brand] || 0) + f.remainingGrams;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filaments]);

  // Line chart data: Historical Evolution
  const evolutionData = useMemo(() => {
    const events = [
      ...filaments.map(f => ({ timestamp: f.createdAt, change: f.purchasedGrams })),
      ...jobs.map(j => ({ timestamp: j.jobDate, change: -j.usedGrams }))
    ].sort((a, b) => a.timestamp - b.timestamp);

    let runningTotal = 0;
    return events.map(event => {
      runningTotal += event.change;
      return {
        timestamp: event.timestamp,
        formattedDate: new Date(event.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        stock: Number((runningTotal / 1000).toFixed(2)) // Convert to kg
      };
    });
  }, [filaments, jobs]);

  const statCard = (label: string, value: string | number, sub: string, icon: React.ReactNode) => (
    <div className={`p-5 rounded-2xl shadow-sm border ${darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-white border-zinc-100'}`}>
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs font-semibold ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{label}</span>
        <div className="p-2 rounded-lg bg-emerald-50 text-[#1A9B9F] dark:bg-zinc-700">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className={`text-[10px] ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{sub}</div>
    </div>
  );

  const hasVisibleMetric = visibility.showInvested || visibility.showAvailable || visibility.showUsage || visibility.showCritical || visibility.showTotalJobs;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <h2 className="text-xl font-bold">Visão Geral</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={onExportPDF}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#1A9B9F] text-white text-xs font-bold shadow-md hover:brightness-110 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            PDF
          </button>
          <button 
            onClick={onExportExcel}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:brightness-110 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v11m0 0l-3-3m3 3l3-3" /></svg>
            Excel
          </button>
        </div>
      </div>

      {hasVisibleMetric && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {visibility.showInvested && statCard("Total Investido", `R$ ${totalInvested.toFixed(2)}`, `${filaments.length} rolos adquiridos`, 
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
            {visibility.showAvailable && statCard("Em Estoque", `${(totalAvailableGrams / 1000).toFixed(2)}kg`, `${totalAvailableGrams} gramas disponíveis`,
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            )}
            {visibility.showUsage && statCard("Consumo Geral", `${Math.round(usagePercentage)}%`, `${(totalUsedGrams / 1000).toFixed(2)}kg já consumidos`,
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            )}
            {visibility.showCritical && statCard("Itens Críticos", criticalItems, "Abaixo do limite de segurança",
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            )}
            {visibility.showTotalJobs && statCard("Total de Jobs", jobs.length, "Impressões registradas",
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01" /></svg>
            )}
        </div>
      )}

      {visibility.showEvolutionChart && (
        <div className="grid grid-cols-1 gap-6">
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-white border-zinc-100'}`}>
            <h3 className="font-bold mb-4">Evolução do Estoque (kg)</h3>
            <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionData}>
                    <defs>
                    <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1A9B9F" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1A9B9F" stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#3f3f46' : '#e4e4e7'} />
                    <XAxis 
                    dataKey="formattedDate" 
                    stroke={darkMode ? '#a1a1aa' : '#71717a'} 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    />
                    <YAxis 
                    stroke={darkMode ? '#a1a1aa' : '#71717a'} 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    />
                    <Tooltip 
                    contentStyle={{ 
                        backgroundColor: darkMode ? '#18181b' : '#ffffff',
                        borderColor: darkMode ? '#3f3f46' : '#e4e4e7',
                        borderRadius: '12px',
                        fontSize: '12px'
                    }}
                    itemStyle={{ color: '#1A9B9F', fontWeight: 'bold' }}
                    />
                    <Area 
                    type="monotone" 
                    dataKey="stock" 
                    name="Estoque (kg)"
                    stroke="#1A9B9F" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorStock)" 
                    animationDuration={1500}
                    />
                </AreaChart>
                </ResponsiveContainer>
            </div>
            </div>
        </div>
      )}

      {(visibility.showMaterialChart || visibility.showBrandChart) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibility.showMaterialChart && (
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-white border-zinc-100'}`}>
                <h3 className="font-bold mb-4">Estoque por Material</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={materialData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        >
                        {materialData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_LIST[index % COLORS_LIST.length]} />
                        ))}
                        </Pie>
                        <Tooltip 
                        contentStyle={{ 
                            backgroundColor: darkMode ? '#18181b' : '#ffffff',
                            borderRadius: '12px'
                        }}
                        />
                        <Legend />
                    </PieChart>
                    </ResponsiveContainer>
                </div>
                </div>
            )}

            {visibility.showBrandChart && (
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-white border-zinc-100'}`}>
                <h3 className="font-bold mb-4">Estoque por Marca (g)</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={brandData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#3f3f46' : '#e4e4e7'} />
                        <XAxis dataKey="name" stroke={darkMode ? '#a1a1aa' : '#71717a'} fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke={darkMode ? '#a1a1aa' : '#71717a'} fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                        cursor={{fill: darkMode ? '#27272a' : '#f4f4f5'}}
                        contentStyle={{ 
                            backgroundColor: darkMode ? '#18181b' : '#ffffff',
                            borderRadius: '12px'
                        }}
                        />
                        <Bar dataKey="value" name="Grama (g)" fill="#1A9B9F" radius={[4, 4, 0, 0]} />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};
