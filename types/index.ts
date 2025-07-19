// Time slot duration options
export type TimeSlotDuration = 30 | 60 | 120; // minutes

// Available group colors
export const GROUP_COLORS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#06B6D4', // cyan
  '#F97316', // orange
  '#EC4899', // pink
] as const;

export type GroupColor = typeof GROUP_COLORS[number];

// Group interface for organizing soldiers
export interface Group {
  id: string;
  name: string;
  color: GroupColor;
}

// Post (guard position) interface
export interface Post {
  id: string;
  name: string; // e.g., "ש.ג.", "מגדל שמירה"
  requiredGuards: number; // number of guards needed per time slot
  activeHours?: {
    start: string; // e.g., "21:00"
    end: string; // e.g., "05:00"
  };
}

// Soldier interface
export interface Soldier {
  id: string;
  name: string;
  isAvailable: boolean; // whether they're currently available for assignment
  groupId?: string; // optional group assignment
}

// Time slot interface
export interface TimeSlot {
  id: string;
  startTime: string; // e.g., "21:00"
  endTime: string; // e.g., "21:30"
}

// Assignment of a soldier to a specific post in a time slot
export interface Assignment {
  id: string;
  soldierId: string;
  postId: string;
  timeSlotId: string;
}

// Schedule configuration
export interface ScheduleConfig {
  timeSlotDuration: TimeSlotDuration;
  startTime: string; // e.g., "21:00"
  endTime: string; // e.g., "05:00"
}

// Main schedule interface
export interface Schedule {
  id: string;
  name: string;
  config: ScheduleConfig;
  posts: Post[];
  soldiers: Soldier[];
  groups: Group[];
  timeSlots: TimeSlot[];
  assignments: Assignment[];
  createdAt: string;
  updatedAt: string;
}

// Rest period warning levels
export type RestWarningLevel = 'none' | 'warning' | 'error';

// Validation result for assignments
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  soldierRestWarnings: {
    soldierId: string;
    timeSlotId: string;
    actualRestSlots: number;
    minExpectedRestSlots: number;
    maxExpectedRestSlots: number;
    level: RestWarningLevel;
  }[];
  unassignedSoldiers: string[]; // soldier IDs not assigned to any slot
}

// Export format options for WhatsApp
export type ExportFormat = 'time-first' | 'post-first';

export interface ExportOptions {
  format: ExportFormat;
  includeHeaders: boolean;
  includeEmptySlots: boolean;
}

// UI State interfaces
export interface UIState {
  selectedTimeSlot?: string;
  selectedPost?: string;
  draggedSoldier?: string;
  showSettings: boolean;
  showExport: boolean;
}

// Local storage data structure
export interface StorageData {
  schedules: Schedule[];
  currentScheduleId?: string;
  uiState: UIState;
  lastUpdated: string;
} 