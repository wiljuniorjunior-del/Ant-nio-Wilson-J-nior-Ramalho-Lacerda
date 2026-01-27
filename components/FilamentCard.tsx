
import React from 'react';
import { Filament, FilamentStatus } from '../types';
import { COLORS } from '../constants';

interface FilamentCardProps {
  filament: Filament;
  onEdit: (f: Filament) => void;
  onUse: (f: Filament) => void;
  onWeigh: (f: Filament) => void;
  onDelete: (id: string) => void;
  darkMode: boolean;
}

export const FilamentCard: React.FC<FilamentCardProps> = ({ filament, onEdit, onUse, onWeigh, onDelete, darkMode }) => {
  const percentage = (filament.remainingGrams / filament.purchasedGrams) * 100;
  
  const getStatusConfig = () => {
    switch (filament.status) {
      case FilamentStatus.EMPTY:
        return {
          label: 'ESGOTADO',
          colorClass: 'bg-red-500',
          borderClass: 'border-t-red-500',
          dotClass: 'bg-red-500 animate-pulse',
          textClass: 'text-red-500'
        };
      case FilamentStatus.CRITICAL:
        return {
          label: 'CRÍTICO',
          colorClass: 'bg-yellow-500',
          borderClass: 'border-t-yellow-500',
          dotClass: 'bg-yellow-500 animate-pulse',
          textClass: 'text-yellow-600 dark:text-yellow-400'
        };
      default:
        return {
          label: 'NORMAL',
          colorClass: 'bg-emerald-500',
          borderClass: 'border-t-emerald-500',
          dotClass: 'bg-emerald-500',
          textClass: 'text-emerald-500'
        };
    }
  };

  const status = getStatusConfig();

  return (
    <div className={`p-4 rounded-2xl shadow-sm transition-all border-t-4 border-x border-b ${status.borderClass} ${darkMode ? 'bg-zinc-800 border-x-zinc-700 border-b-zinc-700 text-zinc-100' : 'bg-white border-x-zinc-100 border-b-zinc-100'}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${status.dotClass}`} title={status.label}></span>
            <h3 className="font-bold text-lg leading-tight">{filament.id}</h3>
            <span className={`${status.colorClass} text-white text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider`}>
              {status.label}
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
            <span className="font-semibold">{filament.brand}</span> • {filament.material}
          </p>
        </div>
        <div 
          className="w-8 h-8 rounded-xl border-2 border-white dark:border-zinc-700 shadow-sm" 
          style={{ backgroundColor: filament.colorHex }}
          title={filament.colorName}
        />
      </div>

      <div className="space-y-1 mb-4">
        <div className="flex justify-between text-xs font-bold">
          <span className={percentage <= 15 ? status.textClass : ''}>
            {filament.remainingGrams}g
          </span>
          <span className={darkMode ? 'text-zinc-400' : 'text-zinc-500'}>{Math.round(percentage)}%</span>
        </div>
        <div className={`w-full h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-zinc-700' : 'bg-zinc-100'}`}>
          <div 
            className={`h-full transition-all duration-700 ease-out ${status.colorClass}`}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          <p className={`text-[10px] ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Inicial: {filament.purchasedGrams}g
          </p>
          <p className={`text-[10px] font-medium ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {filament.storageLocation || 'Sem local'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-700">
        <button 
          onClick={() => onUse(filament)}
          className="flex flex-col items-center gap-1 group"
          disabled={filament.status === FilamentStatus.EMPTY}
          title="Registrar Uso"
        >
          <div className={`p-2 rounded-xl transition-colors ${darkMode ? 'bg-zinc-700 group-hover:bg-zinc-600' : 'bg-emerald-50 group-hover:bg-emerald-100'} ${filament.status === FilamentStatus.EMPTY ? 'opacity-30' : ''}`}>
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
          </div>
          <span className="text-[10px] font-bold opacity-60 group-hover:opacity-100">Uso</span>
        </button>
        <button 
          onClick={() => onWeigh(filament)}
          className="flex flex-col items-center gap-1 group"
          title="Ajustar por Pesagem"
        >
          <div className={`p-2 rounded-xl transition-colors ${darkMode ? 'bg-zinc-700 group-hover:bg-zinc-600' : 'bg-blue-50 group-hover:bg-blue-100'}`}>
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
          </div>
          <span className="text-[10px] font-bold opacity-60 group-hover:opacity-100">Peso</span>
        </button>
        <button 
          onClick={() => onEdit(filament)}
          className="flex flex-col items-center gap-1 group"
          title="Editar"
        >
          <div className={`p-2 rounded-xl transition-colors ${darkMode ? 'bg-zinc-700 group-hover:bg-zinc-600' : 'bg-orange-50 group-hover:bg-orange-100'}`}>
            <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </div>
          <span className="text-[10px] font-bold opacity-60 group-hover:opacity-100">Edit</span>
        </button>
        <button 
          onClick={() => onDelete(filament.id)}
          className="flex flex-col items-center gap-1 group"
          title="Excluir"
        >
          <div className={`p-2 rounded-xl transition-colors ${darkMode ? 'bg-zinc-700 group-hover:bg-zinc-600' : 'bg-red-50 group-hover:bg-red-100'}`}>
            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </div>
          <span className="text-[10px] font-bold opacity-60 group-hover:opacity-100 text-red-600">Del</span>
        </button>
      </div>
    </div>
  );
};
