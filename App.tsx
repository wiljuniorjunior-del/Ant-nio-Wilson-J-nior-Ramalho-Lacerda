
import React, { useState, useEffect, useMemo } from 'react';
import { Filament, PrintJob, AppSettings, ViewMode, MaterialType, FilamentStatus, DashboardVisibility, ApiConfig } from './types';
import { db } from './services/db';
import { syncService } from './services/syncService';
import { COLORS, LogoRhombus, INITIAL_SETTINGS } from './constants';
import { FilamentCard } from './components/FilamentCard';
import { StatsDashboard } from './components/StatsDashboard';
import { ApkGuideModal } from './components/ApkGuideModal';
import { generateInventoryPDF } from './services/pdfExport';
import { generateInventoryExcel } from './services/excelExport';

const App: React.FC = () => {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [activeView, setActiveView] = useState<ViewMode>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // UI States
  const [showFilamentModal, setShowFilamentModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showWeighModal, setShowWeighModal] = useState(false);
  const [showApkGuide, setShowApkGuide] = useState(false);
  const [editingFilament, setEditingFilament] = useState<Filament | null>(null);
  const [targetFilament, setTargetFilament] = useState<Filament | null>(null);

  useEffect(() => {
    setFilaments(db.getFilaments());
    setJobs(db.getJobs());
    const storedSettings = db.getSettings();
    const finalSettings = {
        ...storedSettings,
        dashboardVisibility: storedSettings.dashboardVisibility || INITIAL_SETTINGS.dashboardVisibility,
        apiConfig: storedSettings.apiConfig || INITIAL_SETTINGS.apiConfig
    };
    setSettings(finalSettings);
    
    if (finalSettings.apiConfig.baseUrl) {
      syncService.testConnection(finalSettings.apiConfig).then(setIsOnline);
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });
  }, []);

  const handleInstall = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((result: any) => {
        if (result.outcome === 'accepted') {
          setInstallPrompt(null);
        }
      });
    }
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar link:', err);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const canShare = navigator.share && shareUrl.startsWith('http');

    if (canShare) {
      try {
        await navigator.share({
          title: 'MERAKI 3D - Gestão de Filamentos',
          text: 'Acesse o sistema de controle de estoque da Meraki 3D.',
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Erro ao compartilhar:', err);
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const updateFilaments = (newFilaments: Filament[]) => {
    setFilaments(newFilaments);
    db.saveFilaments(newFilaments);
    if (settings.apiConfig.autoSync && isOnline) handlePush();
  };

  const updateJobs = (newJobs: PrintJob[]) => {
    setJobs(newJobs);
    db.saveJobs(newJobs);
    if (settings.apiConfig.autoSync && isOnline) handlePush();
  };

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    db.saveSettings(newSettings);
  };

  const handlePush = async () => {
    if (!settings.apiConfig.baseUrl) return;
    setSyncLoading(true);
    const success = await syncService.pushData(settings.apiConfig, filaments, jobs);
    if (success) {
      updateSettings({
        ...settings,
        apiConfig: { ...settings.apiConfig, lastSync: Date.now() }
      });
      setIsOnline(true);
    } else {
      setIsOnline(false);
    }
    setSyncLoading(false);
  };

  const handlePull = async () => {
    if (!settings.apiConfig.baseUrl) return;
    if (!confirm("Isso irá substituir os dados locais pelos dados do site. Continuar?")) return;
    
    setSyncLoading(true);
    const remoteData = await syncService.pullData(settings.apiConfig);
    if (remoteData) {
      setFilaments(remoteData.filaments);
      setJobs(remoteData.jobs);
      db.saveFilaments(remoteData.filaments);
      db.saveJobs(remoteData.jobs);
      updateSettings({
        ...settings,
        apiConfig: { ...settings.apiConfig, lastSync: Date.now() }
      });
      setIsOnline(true);
      alert("Dados sincronizados com sucesso!");
    } else {
      setIsOnline(false);
      alert("Falha ao buscar dados do site.");
    }
    setSyncLoading(false);
  };

  const calculateStatus = (remaining: number, threshold: number): FilamentStatus => {
    if (remaining <= 0) return FilamentStatus.EMPTY;
    if (remaining <= threshold) return FilamentStatus.CRITICAL;
    return FilamentStatus.NORMAL;
  };

  const filteredFilaments = useMemo(() => {
    return filaments.filter(f => 
      f.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.colorName.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => a.id.localeCompare(b.id));
  }, [filaments, searchQuery]);

  const handleSaveFilament = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = formData.get('id') as string;
    const purchasedGrams = Number(formData.get('purchasedGrams'));
    
    const newFilament: Filament = {
      id: id || `FIL-${String(filaments.length + 1).padStart(3, '0')}`,
      brand: formData.get('brand') as string,
      material: formData.get('material') as MaterialType,
      colorName: formData.get('colorName') as string,
      colorHex: formData.get('colorHex') as string,
      purchasedGrams: purchasedGrams,
      remainingGrams: editingFilament ? editingFilament.remainingGrams : purchasedGrams,
      diameterMm: Number(formData.get('diameterMm')),
      emptySpoolGrams: Number(formData.get('emptySpoolGrams')),
      cost: Number(formData.get('cost')),
      currency: settings.currency,
      storageLocation: formData.get('storageLocation') as string,
      notes: formData.get('notes') as string,
      status: editingFilament 
        ? calculateStatus(editingFilament.remainingGrams, settings.lowStockThreshold)
        : FilamentStatus.NORMAL,
      createdAt: editingFilament ? editingFilament.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    if (editingFilament) {
      updateFilaments(filaments.map(f => f.id === editingFilament.id ? newFilament : f));
    } else {
      updateFilaments([...filaments, newFilament]);
    }
    
    setShowFilamentModal(false);
    setEditingFilament(null);
  };

  const handleRegisterUsage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!targetFilament) return;

    const formData = new FormData(e.currentTarget);
    const usedGrams = Number(formData.get('usedGrams'));
    const costPerGram = targetFilament.cost / targetFilament.purchasedGrams;

    const newJob: PrintJob = {
      id: crypto.randomUUID(),
      title: formData.get('title') as string,
      jobDate: Date.now(),
      printerId: formData.get('printerId') as string,
      filamentId: targetFilament.id,
      usedGrams: usedGrams,
      cost: usedGrams * costPerGram,
      notes: formData.get('notes') as string,
      createdAt: Date.now(),
    };

    const newRemaining = Math.max(0, targetFilament.remainingGrams - usedGrams);
    const updatedFilament = {
      ...targetFilament,
      remainingGrams: newRemaining,
      status: calculateStatus(newRemaining, settings.lowStockThreshold),
      updatedAt: Date.now(),
    };

    updateJobs([newJob, ...jobs]);
    updateFilaments(filaments.map(f => f.id === targetFilament.id ? updatedFilament : f));
    setShowJobModal(false);
    setTargetFilament(null);
  };

  const handleWeightAdjustment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!targetFilament) return;

    const formData = new FormData(e.currentTarget);
    const totalMeasured = Number(formData.get('totalWeight'));
    const newRemaining = Math.max(0, totalMeasured - targetFilament.emptySpoolGrams);

    const updatedFilament = {
      ...targetFilament,
      remainingGrams: newRemaining,
      status: calculateStatus(newRemaining, settings.lowStockThreshold),
      updatedAt: Date.now(),
    };

    updateFilaments(filaments.map(f => f.id === targetFilament.id ? updatedFilament : f));
    setShowWeighModal(false);
    setTargetFilament(null);
  };

  const handleDeleteFilament = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este filamento?')) {
      updateFilaments(filaments.filter(f => f.id !== id));
    }
  };

  const handleExportPDF = () => {
    generateInventoryPDF(filaments, jobs, settings);
  };

  const handleExportExcel = () => {
    generateInventoryExcel(filaments, jobs, settings);
  };

  const toggleDashboardElement = (key: keyof DashboardVisibility) => {
    updateSettings({
        ...settings,
        dashboardVisibility: {
            ...settings.dashboardVisibility,
            [key]: !settings.dashboardVisibility[key]
        }
    });
  };

  return (
    <div className={`min-h-screen pb-24 ${settings.darkMode ? 'bg-zinc-900 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      <header className={`sticky top-0 z-40 px-4 py-3 border-b shadow-sm backdrop-blur-md ${settings.darkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-zinc-200'}`}>
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <LogoRhombus className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-black tracking-tight text-[#1A9B9F]">MERAKI 3D</h1>
              <div className="flex items-center gap-1.5 mt-[-2px]">
                <p className="text-[9px] uppercase tracking-widest font-semibold opacity-60">Filament Control</p>
                {settings.apiConfig.baseUrl && (
                  <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold ${isOnline ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    <div className={`w-1 h-1 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {isOnline ? 'CLOUD ON' : 'CLOUD OFF'}
                  </div>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={() => updateSettings({ ...settings, darkMode: !settings.darkMode })}
            className={`p-2 rounded-xl border ${settings.darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-100 border-zinc-200'}`}
          >
            {settings.darkMode ? (
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" /></svg>
            ) : (
              <svg className="w-5 h-5 text-zinc-500" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeView === 'inventory' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="Buscar filamento, marca ou material..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl border transition-all focus:ring-2 focus:ring-[#1A9B9F] outline-none ${settings.darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'}`}
                />
                <svg className="w-5 h-5 absolute left-3 top-3.5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <div className={`px-4 py-3 rounded-2xl border flex items-center gap-3 ${settings.darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'}`}>
                <div className="text-right">
                  <p className="text-[10px] opacity-60 uppercase font-bold">Saldo Total</p>
                  <p className="font-bold text-[#1A9B9F]">{(filaments.reduce((a,b)=>a+b.remainingGrams,0)/1000).toFixed(1)}kg</p>
                </div>
                <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700" />
                <div className="text-right">
                  <p className="text-[10px] opacity-60 uppercase font-bold">Investido</p>
                  <p className="font-bold text-zinc-500">{settings.currency} {filaments.reduce((a,b)=>a+b.cost,0).toFixed(0)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFilaments.length > 0 ? (
                filteredFilaments.map(filament => (
                  <FilamentCard 
                    key={filament.id}
                    filament={filament}
                    darkMode={settings.darkMode}
                    onEdit={(f) => { setEditingFilament(f); setShowFilamentModal(true); }}
                    onUse={(f) => { setTargetFilament(f); setShowJobModal(true); }}
                    onWeigh={(f) => { setTargetFilament(f); setShowWeighModal(true); }}
                    onDelete={handleDeleteFilament}
                  />
                ))
              ) : (
                <div className="col-span-full py-20 text-center opacity-50">
                  <p>Nenhum filamento encontrado.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'statistics' && (
          <StatsDashboard 
            filaments={filaments} 
            jobs={jobs} 
            darkMode={settings.darkMode} 
            visibility={settings.dashboardVisibility}
            onExportPDF={handleExportPDF} 
            onExportExcel={handleExportExcel}
          />
        )}

        {activeView === 'history' && (
          <div className="space-y-4 animate-in fade-in duration-500">
             <h2 className="text-xl font-bold">Histórico de Impressões</h2>
             <div className={`rounded-2xl border overflow-hidden ${settings.darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-100'}`}>
                <table className="w-full text-left text-sm">
                   <thead className={`text-[10px] uppercase font-bold ${settings.darkMode ? 'bg-zinc-700' : 'bg-zinc-50'}`}>
                      <tr>
                         <th className="px-4 py-3">Data</th>
                         <th className="px-4 py-3">Peça / Job</th>
                         <th className="px-4 py-3">Filamento</th>
                         <th className="px-4 py-3 text-right">Consumo</th>
                         <th className="px-4 py-3 text-right">Custo</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                      {jobs.map(job => {
                         const fil = filaments.find(f => f.id === job.filamentId);
                         return (
                            <tr key={job.id}>
                               <td className="px-4 py-3 whitespace-nowrap opacity-60">{new Date(job.jobDate).toLocaleDateString()}</td>
                               <td className="px-4 py-3 font-medium">{job.title}</td>
                               <td className="px-4 py-3">{fil?.id} ({fil?.material})</td>
                               <td className="px-4 py-3 text-right font-bold">{job.usedGrams}g</td>
                               <td className="px-4 py-3 text-right text-zinc-500">{settings.currency} {job.cost.toFixed(2)}</td>
                            </tr>
                         );
                      })}
                      {jobs.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-10 text-center opacity-40">Nenhum registro de uso ainda.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeView === 'settings' && (
           <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
              <h2 className="text-xl font-bold">Configurações</h2>
              
              <div className={`p-6 rounded-2xl border space-y-6 ${settings.darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-100'}`}>
                 
                 <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider opacity-60">Link e Instalação</h3>
                    
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-700/50 border border-zinc-100 dark:border-zinc-700">
                        <label className="block text-[10px] font-bold opacity-60 uppercase mb-2">Endereço do seu App (Link)</label>
                        <div className="flex items-center gap-2 mb-4">
                            <input 
                                readOnly
                                value={window.location.href}
                                className={`flex-1 p-2 text-[10px] rounded-lg border font-mono truncate ${settings.darkMode ? 'bg-zinc-800 border-zinc-600' : 'bg-white'}`}
                            />
                            <button 
                                onClick={handleCopyLink}
                                className={`p-2 rounded-lg border flex items-center gap-2 text-[10px] font-bold transition-all ${copySuccess ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-[#1A9B9F] text-white border-[#1A9B9F]'}`}
                            >
                                {copySuccess ? 'COPIADO!' : 'COPIAR'}
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleShare}
                                    className="flex-1 py-3 rounded-xl border border-[#1A9B9F] text-[#1A9B9F] font-bold text-xs flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 100-2.684 3 3 0 000 2.684zm0 9.316a3 3 0 100-2.684 3 3 0 000 2.684z" /></svg>
                                    Compartilhar App
                                </button>
                                {installPrompt && (
                                    <button 
                                        onClick={handleInstall}
                                        className="flex-1 py-3 rounded-xl bg-[#1A9B9F] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Instalar App
                                    </button>
                                )}
                            </div>
                            <button 
                                onClick={() => setShowApkGuide(true)}
                                className="w-full py-3 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                Gerar Arquivo APK (Android)
                            </button>
                        </div>
                    </div>
                 </div>

                 <hr className="opacity-10" />

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase opacity-60 mb-1">Moeda Padrão</label>
                        <select 
                            value={settings.currency}
                            onChange={(e) => updateSettings({...settings, currency: e.target.value})}
                            className={`w-full p-2 rounded-lg border ${settings.darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white'}`}
                        >
                            <option value="R$">Real (R$)</option>
                            <option value="US$">Dólar (US$)</option>
                            <option value="€">Euro (€)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase opacity-60 mb-1">Limite p/ Alerta Crítico (g)</label>
                        <input 
                            type="number"
                            value={settings.lowStockThreshold}
                            onChange={(e) => updateSettings({...settings, lowStockThreshold: Number(e.target.value)})}
                            className={`w-full p-2 rounded-lg border ${settings.darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white'}`}
                        />
                    </div>
                 </div>

                 <hr className="opacity-10" />

                 <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider opacity-60">Integração com o Site</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[10px] font-bold opacity-60 uppercase mb-1">URL Base da API</label>
                            <input 
                                placeholder="https://meraki3d.com/wp-json/meraki3d/v1"
                                value={settings.apiConfig.baseUrl}
                                onChange={(e) => updateSettings({...settings, apiConfig: {...settings.apiConfig, baseUrl: e.target.value}})}
                                className={`w-full p-2 text-sm rounded-lg border ${settings.darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold opacity-60 uppercase mb-1">Chave de API (Secret Key)</label>
                            <input 
                                type="password"
                                value={settings.apiConfig.apiKey}
                                onChange={(e) => updateSettings({...settings, apiConfig: {...settings.apiConfig, apiKey: e.target.value}})}
                                className={`w-full p-2 text-sm rounded-lg border ${settings.darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white'}`}
                            />
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg border border-zinc-100 dark:border-zinc-700">
                            <span className="text-xs font-medium">Sincronização Automática</span>
                            <input 
                                type="checkbox"
                                checked={settings.apiConfig.autoSync}
                                onChange={(e) => updateSettings({...settings, apiConfig: {...settings.apiConfig, autoSync: e.target.checked}})}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={handlePush}
                                disabled={syncLoading}
                                className="flex-1 py-2 rounded-lg bg-[#1A9B9F] text-white text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center justify-center gap-2"
                            >
                                {syncLoading ? 'Subindo...' : 'Subir para Nuvem'}
                            </button>
                            <button 
                                onClick={handlePull}
                                disabled={syncLoading}
                                className="flex-1 py-2 rounded-lg border border-[#1A9B9F] text-[#1A9B9F] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                {syncLoading ? 'Baixando...' : 'Baixar do Site'}
                            </button>
                        </div>
                        {settings.apiConfig.lastSync && (
                          <p className="text-[9px] opacity-40 text-center uppercase tracking-tighter">Última sinc: {new Date(settings.apiConfig.lastSync).toLocaleString()}</p>
                        )}
                    </div>
                 </div>

                 <hr className="opacity-10" />

                 <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider opacity-60 mb-4">Personalização do Dashboard</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { key: 'showInvested', label: 'Custo Investido' },
                            { key: 'showAvailable', label: 'Estoque Disponível' },
                            { key: 'showUsage', label: 'Percentual de Uso' },
                            { key: 'showCritical', label: 'Itens Críticos' },
                            { key: 'showTotalJobs', label: 'Total de Impressões' },
                            { key: 'showEvolutionChart', label: 'Gráfico de Evolução' },
                            { key: 'showMaterialChart', label: 'Gráfico por Material' },
                            { key: 'showBrandChart', label: 'Gráfico por Marca' },
                        ].map((item) => (
                            <label key={item.key} className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 cursor-pointer transition-colors">
                                <span className="text-sm font-medium">{item.label}</span>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={settings.dashboardVisibility[item.key as keyof DashboardVisibility]}
                                        onChange={() => toggleDashboardElement(item.key as keyof DashboardVisibility)}
                                    />
                                    <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1A9B9F]"></div>
                                </div>
                            </label>
                        ))}
                    </div>
                 </div>

                 <div className="pt-4 flex flex-col gap-2">
                    <button onClick={handleExportPDF} className="w-full py-3 rounded-xl bg-[#1A9B9F] text-white font-bold text-sm shadow-md hover:brightness-110 flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Relatório em PDF
                    </button>
                    <button onClick={handleExportExcel} className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:brightness-110 flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6" /></svg>
                      Planilha em Excel
                    </button>
                    <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-3 rounded-xl border border-red-200 text-red-500 font-bold text-sm opacity-60">Resetar Sistema</button>
                 </div>
              </div>
           </div>
        )}
      </main>

      <button 
        onClick={() => { setEditingFilament(null); setShowFilamentModal(true); }}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-[#1A9B9F] text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
      </button>

      <nav className={`fixed bottom-0 inset-x-0 z-50 px-4 py-2 border-t backdrop-blur-lg ${settings.darkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-zinc-200'}`}>
        <div className="flex justify-around max-w-xl mx-auto">
          {[
            { id: 'inventory', label: 'Estoque', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 7v10c0 1.1.9 2 2 2h12a2 2 0 002-2V7M4 7l8-4 8 4M4 7l8 4 8-4m-8 4v10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
            { id: 'statistics', label: 'Stats', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
            { id: 'history', label: 'Logs', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
            { id: 'settings', label: 'Opções', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ViewMode)}
              className={`flex flex-col items-center gap-1 p-2 transition-all ${activeView === item.id ? 'text-[#1A9B9F] scale-110' : 'opacity-40'}`}
            >
              {item.icon}
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Modais */}
      {showApkGuide && (
        <ApkGuideModal 
          darkMode={settings.darkMode} 
          onClose={() => setShowApkGuide(false)} 
          appUrl={window.location.href} 
        />
      )}

      {showFilamentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 ${settings.darkMode ? 'bg-zinc-800' : 'bg-white'}`}>
            <h2 className="text-xl font-bold mb-4">{editingFilament ? 'Editar Filamento' : 'Novo Filamento'}</h2>
            <form onSubmit={handleSaveFilament} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold uppercase opacity-60 mb-1">Cód (Opcional)</label>
                  <input name="id" defaultValue={editingFilament?.id} placeholder="Ex: FIL-006" className={`w-full p-2 rounded-lg border text-sm ${settings.darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white'}`} />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold uppercase opacity-60 mb-1">Marca</label>
                  <input required name="brand" defaultValue={editingFilament?.brand} className={`w-full p-2 rounded-lg border text-sm ${settings.darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white'}`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="col-span-1">
                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-1">Material</label>
                    <select name="material" defaultValue={editingFilament?.material || 'PLA'} className={`w-full p-2 rounded-lg border text-sm ${settings.darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white'}`}>
                       {Object.values(MaterialType).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                 </div>
                 <div className="col-span-1">
                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-1">Diâmetro (mm)</label>
                    <input required type="number" step="0.01" name="diameterMm" defaultValue={editingFilament?.diameterMm || 1.75} className={`w-full p-2 rounded-lg border text-sm ${settings.darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white'}`} />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="col-span-1">
                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-1">Nome da Cor</label>
                    <input required name="colorName" defaultValue={editingFilament?.colorName} className={`w-full p-2 rounded-lg border text-sm ${settings.darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white'}`} />
                 </div>
                 <div className="col-span-1">
                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-1">Hex da Cor</label>
                    <input type="color" name="colorHex" defaultValue={editingFilament?.colorHex || '#1A9B9F'} className={`w-full h-9 p-1 rounded-lg border ${settings.darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white'}`} />
                 </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                 <div className="col-span-1">
                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-1">Peso Inicial (g)</label>
                    <input required type="number" name="purchasedGrams" defaultValue={editingFilament?.purchasedGrams || 1000} className={`w-full p-2 rounded-lg border text-sm ${settings.darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white'}`} />
                 </div>
                 <div className="col-span-1">
                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-1">Tara/Spool (g)</label>
                    <input required type="number" name="emptySpoolGrams" defaultValue={editingFilament?.emptySpoolGrams || 200} className={`w-full p-2 rounded-lg border text-sm ${settings.darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white'}`} />
                 </div>
                 <div className="col-span-1">
                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-1">Custo Total</label>
                    <input required type="number" step="0.01" name="cost" defaultValue={editingFilament?.cost} className={`w-full p-2 rounded-lg border text-sm ${settings.darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white'}`} />
                 </div>
              </div>
              <div>
                 <label className="block text-[10px] font-bold uppercase opacity-60 mb-1">Local de Armazenamento</label>
                 <input name="storageLocation" defaultValue={editingFilament?.storageLocation} className={`w-full p-2 rounded-lg border text-sm ${settings.darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white'}`} />
              </div>
              <div className="flex gap-2 pt-2">
                 <button type="button" onClick={() => setShowFilamentModal(false)} className="flex-1 py-3 font-bold opacity-60">Cancelar</button>
                 <button type="submit" className="flex-[2] py-3 rounded-xl bg-[#1A9B9F] text-white font-bold shadow-lg hover:brightness-110">Salvar Filamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJobModal && targetFilament && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 ${settings.darkMode ? 'bg-zinc-800' : 'bg-white'}`}>
               <h2 className="text-xl font-bold mb-1">Registrar Consumo</h2>
               <p className="text-xs opacity-60 mb-4">{targetFilament.id} - {targetFilament.colorName} ({targetFilament.remainingGrams}g restantes)</p>
               <form onSubmit={handleRegisterUsage} className="space-y-4">
                  <div>
                     <label className="block text-[10px] font-bold uppercase opacity-60 mb-1">Título do Trabalho</label>
                     <input required name="title" placeholder="Ex: Action Figure Batman" className={`w-full p-3 rounded-xl border text-sm ${settings.darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white'}`} />
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold uppercase opacity-60 mb-1">Peso Consumido (g)</label>
                     <input required type="number" name="usedGrams" max={targetFilament.remainingGrams} placeholder="Quantas gramas usou?" className={`w-full p-3 rounded-xl border text-sm font-bold ${settings.darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white'}`} />
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold uppercase opacity-60 mb-1">ID Impressora</label>
                     <input name="printerId" placeholder="Ex: Ender 3 v2" className={`w-full p-3 rounded-xl border text-sm ${settings.darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white'}`} />
                  </div>
                  <div className="flex gap-2 pt-2">
                     <button type="button" onClick={() => setShowJobModal(false)} className="flex-1 py-3 font-bold opacity-60">Voltar</button>
                     <button type="submit" className="flex-[2] py-3 rounded-xl bg-[#1A9B9F] text-white font-bold shadow-lg hover:brightness-110">Lançar Uso</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {showWeighModal && targetFilament && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 ${settings.darkMode ? 'bg-zinc-800' : 'bg-white'}`}>
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-2xl bg-blue-50 text-[#1A9B9F]">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                  </div>
                  <h2 className="text-xl font-bold">Ajuste por Pesagem</h2>
               </div>
               <p className="text-xs mb-6 opacity-60">Coloque o rolo na balança e informe o peso total exibido (filamento + carretel).</p>
               <form onSubmit={handleWeightAdjustment} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[10px] font-bold uppercase opacity-60 mb-1">Tara Salva</label>
                        <div className={`p-3 rounded-xl border opacity-50 ${settings.darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-zinc-50'}`}>{targetFilament.emptySpoolGrams}g</div>
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold uppercase opacity-60 mb-1">Peso Lido (g)</label>
                        <input required type="number" name="totalWeight" autoFocus className={`w-full p-3 rounded-xl border text-lg font-black text-center focus:ring-2 focus:ring-[#1A9B9F] outline-none ${settings.darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-zinc-200'}`} />
                     </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                     <button type="button" onClick={() => setShowWeighModal(false)} className="flex-1 py-3 font-bold opacity-60">Cancelar</button>
                     <button type="submit" className="flex-[2] py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg hover:brightness-110">Calcular Saldo</button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default App;
