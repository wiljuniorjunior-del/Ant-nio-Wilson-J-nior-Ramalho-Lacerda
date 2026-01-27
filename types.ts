
export enum MaterialType {
  PLA = 'PLA',
  PETG = 'PETG',
  ABS = 'ABS',
  TPU = 'TPU',
  NYLON = 'NYLON',
  OTHER = 'Outro'
}

export enum FilamentStatus {
  NORMAL = 'normal',
  CRITICAL = 'critical',
  EMPTY = 'empty'
}

export interface Filament {
  id: string;
  brand: string;
  material: MaterialType;
  colorName: string;
  colorHex: string;
  purchasedGrams: number;
  remainingGrams: number;
  diameterMm: number;
  emptySpoolGrams: number;
  cost: number;
  currency: string;
  storageLocation: string;
  notes: string;
  status: FilamentStatus;
  createdAt: number;
  updatedAt: number;
}

export interface PrintJob {
  id: string;
  title: string;
  jobDate: number;
  printerId: string;
  filamentId: string;
  usedGrams: number;
  cost: number;
  notes: string;
  createdAt: number;
}

export interface DashboardVisibility {
  showInvested: boolean;
  showAvailable: boolean;
  showUsage: boolean;
  showCritical: boolean;
  showTotalJobs: boolean;
  showEvolutionChart: boolean;
  showMaterialChart: boolean;
  showBrandChart: boolean;
}

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  autoSync: boolean;
  lastSync: number | null;
}

export interface AppSettings {
  darkMode: boolean;
  currency: string;
  lowStockThreshold: number;
  dashboardVisibility: DashboardVisibility;
  apiConfig: ApiConfig;
}

export type ViewMode = 'inventory' | 'statistics' | 'settings' | 'history';
