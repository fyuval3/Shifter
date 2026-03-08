import { Schedule, Soldier, Post, StorageData, UIState } from '@/types';

const STORAGE_KEY = 'shifter-app-data';

// Default UI state
const defaultUIState: UIState = {
  showSettings: false,
  showExport: false,
};

// Default storage data
const defaultStorageData: StorageData = {
  schedules: [],
  uiState: defaultUIState,
  lastUpdated: new Date().toISOString(),
};

/**
 * Get all data from localStorage
 */
export function getStorageData(): StorageData {
  if (typeof window === 'undefined') return defaultStorageData;
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return defaultStorageData;
    
    const parsed = JSON.parse(data);
    return {
      ...defaultStorageData,
      ...parsed,
      uiState: { ...defaultUIState, ...parsed.uiState },
    };
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
    return defaultStorageData;
  }
}

/**
 * Save all data to localStorage
 */
export function setStorageData(data: Partial<StorageData>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const currentData = getStorageData();
    const newData = {
      ...currentData,
      ...data,
      lastUpdated: new Date().toISOString(),
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
  }
}

/**
 * Get all schedules
 */
export function getSchedules(): Schedule[] {
  return getStorageData().schedules;
}

/**
 * Get a specific schedule by ID
 */
export function getSchedule(id: string): Schedule | undefined {
  return getSchedules().find(schedule => schedule.id === id);
}

/**
 * Get the current active schedule
 */
export function getCurrentSchedule(): Schedule | undefined {
  const data = getStorageData();
  let schedule: Schedule | undefined;

  if (data.currentScheduleId) {
    schedule = getSchedule(data.currentScheduleId);
  } else {
    const schedules = data.schedules;
    if (schedules.length > 0) {
      schedule = schedules.reduce((latest, current) =>
        new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest
      );
    }
  }

  if (schedule) {
    migrateSchedule(schedule);
  }

  return schedule;
}

/**
 * Migrate a schedule from older data formats to the current schema.
 * Mutates the schedule in place.
 */
function migrateSchedule(schedule: Schedule): void {
  if (!schedule.groups) {
    schedule.groups = [];
  }
  if (!schedule.roles) {
    schedule.roles = [];
  }
  schedule.soldiers = schedule.soldiers.map(migrateSoldier);
  schedule.posts = schedule.posts.map(migratePost);
}

function migrateSoldier(s: Soldier): Soldier {
  return {
    ...s,
    roleIds: s.roleIds ?? [],
    unavailability: s.unavailability ?? [],
    isAvailable: s.isAvailable ?? true,
  };
}

function migratePost(p: Post): Post {
  return {
    ...p,
    eligibleRoleIds: p.eligibleRoleIds ?? [],
  };
}

/**
 * Save a schedule (create or update)
 */
export function saveSchedule(schedule: Schedule): void {
  const data = getStorageData();
  const existingIndex = data.schedules.findIndex(s => s.id === schedule.id);
  
  const updatedSchedule = {
    ...schedule,
    updatedAt: new Date().toISOString(),
  };
  
  if (existingIndex >= 0) {
    data.schedules[existingIndex] = updatedSchedule;
  } else {
    data.schedules.push(updatedSchedule);
  }
  
  setStorageData(data);
}

/**
 * Delete a schedule
 */
export function deleteSchedule(id: string): void {
  const data = getStorageData();
  data.schedules = data.schedules.filter(s => s.id !== id);
  
  // If the deleted schedule was the current one, clear it
  if (data.currentScheduleId === id) {
    data.currentScheduleId = undefined;
  }
  
  setStorageData(data);
}

/**
 * Set the current active schedule
 */
export function setCurrentSchedule(id: string): void {
  setStorageData({ currentScheduleId: id });
}

/**
 * Get UI state
 */
export function getUIState(): UIState {
  return getStorageData().uiState;
}

/**
 * Update UI state
 */
export function setUIState(uiState: Partial<UIState>): void {
  const data = getStorageData();
  data.uiState = { ...data.uiState, ...uiState };
  setStorageData(data);
}

/**
 * Export all data as JSON (for backup)
 */
export function exportData(): string {
  return JSON.stringify(getStorageData(), null, 2);
}

/**
 * Import data from JSON (for restore)
 */
export function importData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);
    
    // Validate the data structure
    if (!data.schedules || !Array.isArray(data.schedules)) {
      throw new Error('Invalid data format: schedules must be an array');
    }
    
    setStorageData(data);
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}

/**
 * Clear all data (reset app)
 */
export function clearAllData(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
} 