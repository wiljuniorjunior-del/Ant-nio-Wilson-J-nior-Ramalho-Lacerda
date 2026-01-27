
import React from 'react';
import { Filament, MaterialType, FilamentStatus, AppSettings } from './types';

export const COLORS = {
  primary: '#1A9B9F',
  secondary: '#2CB5B0',
  accent: '#156A6D',
  dark: '#0D4F52',
  light: '#E0F7F7',
};

export const INITIAL_FILAMENTS: Filament[] = [
  {
    id: 'FIL-001',
    brand: 'Wfil',
    material: MaterialType.PLA,
    colorName: 'Preto',
    colorHex: '#000000',
    purchasedGrams: 1000,
    remainingGrams: 1000,
    diameterMm: 1.75,
    emptySpoolGrams: 200,
    cost: 85,
    currency: 'R$',
    storageLocation: 'Prateleira A',
    notes: 'Básico',
    status: FilamentStatus.NORMAL,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'FIL-002',
    brand: 'Wfil',
    material: MaterialType.PLA,
    colorName: 'Branco',
    colorHex: '#FFFFFF',
    purchasedGrams: 1000,
    remainingGrams: 1000,
    diameterMm: 1.75,
    emptySpoolGrams: 200,
    cost: 85,
    currency: 'R$',
    storageLocation: 'Prateleira A',
    notes: '',
    status: FilamentStatus.NORMAL,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'FIL-003',
    brand: 'Wfil',
    material: MaterialType.ABS,
    colorName: 'Vermelho',
    colorHex: '#FF0000',
    purchasedGrams: 1000,
    remainingGrams: 1000,
    diameterMm: 1.75,
    emptySpoolGrams: 200,
    cost: 95,
    currency: 'R$',
    storageLocation: 'Estufa 1',
    notes: '',
    status: FilamentStatus.NORMAL,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'FIL-004',
    brand: 'Wfil',
    material: MaterialType.PETG,
    colorName: 'Azul',
    colorHex: '#0000FF',
    purchasedGrams: 1000,
    remainingGrams: 1000,
    diameterMm: 1.75,
    emptySpoolGrams: 200,
    cost: 110,
    currency: 'R$',
    storageLocation: 'Gaveta B',
    notes: '',
    status: FilamentStatus.NORMAL,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'FIL-005',
    brand: 'Wfil',
    material: MaterialType.TPU,
    colorName: 'Transparente',
    colorHex: '#E0F7F7',
    purchasedGrams: 500,
    remainingGrams: 500,
    diameterMm: 1.75,
    emptySpoolGrams: 150,
    cost: 75,
    currency: 'R$',
    storageLocation: 'Estufa 2',
    notes: 'Flexível',
    status: FilamentStatus.NORMAL,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
];

export const INITIAL_SETTINGS: AppSettings = {
  darkMode: false,
  currency: 'R$',
  lowStockThreshold: 150,
  dashboardVisibility: {
    showInvested: true,
    showAvailable: true,
    showUsage: true,
    showCritical: true,
    showTotalJobs: true,
    showEvolutionChart: true,
    showMaterialChart: true,
    showBrandChart: true,
  },
  apiConfig: {
    baseUrl: '',
    apiKey: '',
    autoSync: false,
    lastSync: null
  }
};

export const LogoRhombus: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`relative ${className}`}>
    <div className="meraki-rhombus bg-[#1A9B9F] w-full h-full opacity-30 absolute top-0 left-0"></div>
    <div className="meraki-rhombus bg-gradient-to-br from-[#1A9B9F] to-[#2CB5B0] w-5/6 h-5/6 m-auto absolute inset-0 shadow-lg flex items-center justify-center">
       <span className="text-white font-bold text-[8px] sm:text-xs">M3D</span>
    </div>
  </div>
);
