
import { Filament, PrintJob, ApiConfig } from '../types';

export const syncService = {
  testConnection: async (config: ApiConfig): Promise<boolean> => {
    if (!config.baseUrl) return false;
    try {
      const response = await fetch(`${config.baseUrl}/health`, {
        headers: { 'X-API-KEY': config.apiKey }
      });
      return response.ok;
    } catch (e) {
      console.error('Sync Test Failed', e);
      return false;
    }
  },

  pushData: async (config: ApiConfig, filaments: Filament[], jobs: PrintJob[]): Promise<boolean> => {
    if (!config.baseUrl) return false;
    try {
      const response = await fetch(`${config.baseUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': config.apiKey
        },
        body: JSON.stringify({ filaments, jobs, timestamp: Date.now() })
      });
      return response.ok;
    } catch (e) {
      console.error('Push Sync Failed', e);
      return false;
    }
  },

  pullData: async (config: ApiConfig): Promise<{ filaments: Filament[], jobs: PrintJob[] } | null> => {
    // Fixed: Changed return false to return null to match the function signature
    if (!config.baseUrl) return null;
    try {
      const response = await fetch(`${config.baseUrl}/data`, {
        headers: { 'X-API-KEY': config.apiKey }
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (e) {
      console.error('Pull Sync Failed', e);
      return null;
    }
  }
};