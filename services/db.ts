
import { Filament, PrintJob, AppSettings } from '../types';
import { INITIAL_FILAMENTS, INITIAL_SETTINGS } from '../constants';

const KEYS = {
  FILAMENTS: 'meraki3d_filaments',
  JOBS: 'meraki3d_jobs',
  SETTINGS: 'meraki3d_settings',
};

export const db = {
  getFilaments: (): Filament[] => {
    const data = localStorage.getItem(KEYS.FILAMENTS);
    return data ? JSON.parse(data) : INITIAL_FILAMENTS;
  },
  saveFilaments: (filaments: Filament[]) => {
    localStorage.setItem(KEYS.FILAMENTS, JSON.stringify(filaments));
  },
  getJobs: (): PrintJob[] => {
    const data = localStorage.getItem(KEYS.JOBS);
    return data ? JSON.parse(data) : [];
  },
  saveJobs: (jobs: PrintJob[]) => {
    localStorage.setItem(KEYS.JOBS, JSON.stringify(jobs));
  },
  getSettings: (): AppSettings => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : INITIAL_SETTINGS;
  },
  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  }
};
