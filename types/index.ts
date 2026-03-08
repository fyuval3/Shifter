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

// Role interface for eligibility constraints
export interface Role {
  id: string;
  name: string;
}

// Unavailability period for a soldier
export interface UnavailabilityPeriod {
  id: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  reason?: string;
}

// Post (guard position) interface
export interface Post {
  id: string;
  name: string;
  requiredGuards: number;
  eligibleRoleIds: string[];
  activeHours?: {
    start: string;
    end: string;
  };
}

// Soldier interface
export interface Soldier {
  id: string;
  name: string;
  isAvailable: boolean;
  roleIds: string[];
  groupId?: string;
  unavailability: UnavailabilityPeriod[];
}

export interface Shift {
  id: string;
  assignments: NewAssignment[];
}

export interface NewAssignment {
  id: string;
  soldierId: string;
  postId: string;
}

// Time slot interface
export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
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
  startTime: string;
  endTime: string;
}

// Main schedule interface
export interface Schedule {
  id: string;
  name: string;
  config: ScheduleConfig;
  posts: Post[];
  soldiers: Soldier[];
  groups: Group[];
  roles: Role[];
  timeSlots: TimeSlot[];
  assignments: Assignment[];
  createdAt: string;
  updatedAt: string;
}

// Unfair assignment detected by the fairness system
export interface UnfairAssignment {
  assignmentId: string;
  soldierId: string;
  postId: string;
  timeSlotId: string;
  soldierRestMinutes: number;
  moreRestedSoldiers: {
    soldierId: string;
    soldierName: string;
    restMinutes: number;
    extraRestMinutes: number;
  }[];
}

// Validation result for assignments
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  unfairAssignments: UnfairAssignment[];
  unassignedSoldiers: string[];
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
