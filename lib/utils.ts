import {
  Schedule,
  TimeSlot,
  Assignment,
  Post,
  Soldier,
  ValidationResult,
  TimeSlotDuration,
  RestWarningLevel
} from '@/types';

/**
 * Generate unique ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Format time string (24-hour format)
 */
export function formatTime(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Parse time string to hours and minutes
 */
export function parseTime(timeString: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Add minutes to a time string
 */
export function addMinutes(timeString: string, minutesToAdd: number): string {
  const { hours, minutes } = parseTime(timeString);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return formatTime(newHours, newMinutes);
}

/**
 * Calculate time difference in minutes
 */
export function getTimeDifferenceInMinutes(startTime: string, endTime: string): number {
  const start = parseTime(startTime);
  const end = parseTime(endTime);

  const startMinutes = start.hours * 60 + start.minutes;
  let endMinutes = end.hours * 60 + end.minutes;

  // Handle overnight shifts
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  return endMinutes - startMinutes;
}

/**
 * Generate time slots for a schedule
 */
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  duration: TimeSlotDuration
): TimeSlot[] {
  const timeSlots: TimeSlot[] = [];
  const totalMinutes = getTimeDifferenceInMinutes(startTime, endTime);
  const numSlots = Math.ceil(totalMinutes / duration);

  for (let i = 0; i < numSlots; i++) {
    const slotStartTime = addMinutes(startTime, i * duration);
    const slotEndTime = addMinutes(startTime, (i + 1) * duration);

    timeSlots.push({
      id: generateId(),
      startTime: slotStartTime,
      endTime: slotEndTime,
    });
  }

  return timeSlots;
}

/**
 * Check if a post is active during a specific time
 */
export function isPostActiveAtTime(post: Post, timeString: string): boolean {
  if (!post.activeHours) return true;

  const { hours } = parseTime(timeString);
  const startHours = parseTime(post.activeHours.start).hours;
  const endHours = parseTime(post.activeHours.end).hours;

  // Handle overnight shifts
  if (startHours > endHours) {
    return hours >= startHours || hours < endHours;
  }

  return hours >= startHours && hours < endHours;
}

/**
 * Get assignments for a specific time slot and post
 */
export function getAssignmentsForSlotAndPost(
  assignments: Assignment[],
  timeSlotId: string,
  postId: string
): Assignment[] {
  return assignments.filter(
    a => a.timeSlotId === timeSlotId && a.postId === postId
  );
}

/**
 * Get all assignments for a soldier
 */
export function getAssignmentsForSoldier(
  assignments: Assignment[],
  soldierId: string
): Assignment[] {
  return assignments.filter(a => a.soldierId === soldierId);
}

/**
 * Check if a soldier is assigned to a specific time slot
 */
export function isSoldierAssignedToSlot(
  assignments: Assignment[],
  soldierId: string,
  timeSlotId: string
): boolean {
  return assignments.some(
    a => a.soldierId === soldierId && a.timeSlotId === timeSlotId
  );
}

function calculateExpectedRestSlots(posts: Post[], soldiers: Soldier[]): [number, number] {
  const availableSoldiers = soldiers.filter(s => s.isAvailable).length;
  const soldiersNeededPerSlot = posts.reduce((sum, post) => sum + post.requiredGuards, 0);

  const unroundedRestSlots = availableSoldiers / soldiersNeededPerSlot - 1;
  const minExpectedRestSlots = Math.floor(unroundedRestSlots);
  const maxExpectedRestSlots = Math.ceil(unroundedRestSlots);

  return [minExpectedRestSlots, maxExpectedRestSlots];
}

/**
 * Calculate ideal rest slots between assignments
 */
export function calculateIdealRestSlots(
  posts: Post[],
  soldiers: Soldier[],
  timeSlots: TimeSlot[]
): number {
  const availableSoldiers = soldiers.filter(s => s.isAvailable);
  const totalSoldiersNeeded = posts.reduce((sum, post) => {
    return sum + timeSlots.filter(slot =>
      isPostActiveAtTime(post, slot.startTime)
    ).length * post.requiredGuards;
  }, 0);

  const soldiersNeededPerSlot = totalSoldiersNeeded / timeSlots.length;

  if (soldiersNeededPerSlot === 0) return 0;

  return Math.floor(availableSoldiers.length / soldiersNeededPerSlot) - 1;
}

/**
 * Get rest slots between two assignments for a soldier
 */
export function getRestSlotsBetweenAssignments(
  timeSlots: TimeSlot[],
  assignment1: Assignment,
  assignment2: Assignment
): number {
  const slot1Index = timeSlots.findIndex(s => s.id === assignment1.timeSlotId);
  const slot2Index = timeSlots.findIndex(s => s.id === assignment2.timeSlotId);

  if (slot1Index === -1 || slot2Index === -1) return 0;

  return Math.abs(slot2Index - slot1Index) - 1;
}

/**
 * Remove soldier from all assignments
 */
export function removeSoldierFromAllAssignments(
  assignments: Assignment[],
  soldierId: string
): Assignment[] {
  return assignments.filter(a => a.soldierId !== soldierId);
}

/**
 * Remove soldier from specific time slot
 */
export function removeSoldierFromTimeSlot(
  assignments: Assignment[],
  soldierId: string,
  timeSlotId: string
): Assignment[] {
  return assignments.filter(
    a => !(a.soldierId === soldierId && a.timeSlotId === timeSlotId)
  );
}

/**
 * Swap soldiers between assignments
 */
export function swapSoldierAssignments(
  assignments: Assignment[],
  assignment1Id: string,
  assignment2Id: string
): Assignment[] {
  const newAssignments = [...assignments];
  const index1 = newAssignments.findIndex(a => a.id === assignment1Id);
  const index2 = newAssignments.findIndex(a => a.id === assignment2Id);

  if (index1 !== -1 && index2 !== -1) {
    const soldier1 = newAssignments[index1].soldierId;
    const soldier2 = newAssignments[index2].soldierId;

    newAssignments[index1] = { ...newAssignments[index1], soldierId: soldier2 };
    newAssignments[index2] = { ...newAssignments[index2], soldierId: soldier1 };
  }

  return newAssignments;
}

export const filterIrrelevantAssignments = (assignments: Assignment[], timeSlots: TimeSlot[], soldiers: Soldier[], posts: Post[]): Assignment[] => {
  const existingTimeSlotIds = timeSlots.map(t => t.id);
  const existingSoldierIds = soldiers.filter(s => s.isAvailable).map(s => s.id);
  const existingPostIds = posts.map(p => p.id);

  return assignments.filter(a =>
    existingSoldierIds.includes(a.soldierId) &&
    existingTimeSlotIds.includes(a.timeSlotId) &&
    existingPostIds.includes(a.postId) &&
    isPostActiveAtTime(getPostById(posts, a.postId), getTimeSlotById(timeSlots, a.timeSlotId).startTime)
  );
}

const getPostById = (posts: Post[], postId: string) => posts.find(p => p.id === postId)!

const getTimeSlotById = (timeSlots: TimeSlot[], timeSlotId: string) => timeSlots.find(t => t.id === timeSlotId)!

/**
 * Validate schedule assignments
 */
export function validateSchedule(schedule: Schedule): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const soldierRestWarnings: ValidationResult['soldierRestWarnings'] = [];
  const unassignedSoldiers: string[] = [];

  const availableSoldiers = schedule.soldiers.filter(s => s.isAvailable);
  const [minExpectedRestSlots, maxExpectedRestSlots] = calculateExpectedRestSlots(schedule.posts, availableSoldiers);

  // Check each time slot and post combination
  for (const timeSlot of schedule.timeSlots) {
    for (const post of schedule.posts) {
      if (!isPostActiveAtTime(post, timeSlot.startTime)) continue;

      const assignments = getAssignmentsForSlotAndPost(
        schedule.assignments,
        timeSlot.id,
        post.id
      );

      // Check if correct number of guards are assigned
      if (assignments.length !== post.requiredGuards) {
        if (assignments.length < post.requiredGuards) {
          errors.push(
            `חסרים ${post.requiredGuards - assignments.length} שומרים ב${post.name} בזמן ${timeSlot.startTime}`
          );
        } else {
          errors.push(
            `יותר מדי שומרים ב${post.name} בזמן ${timeSlot.startTime} (${assignments.length}/${post.requiredGuards})`
          );
        }
      }
    }
  }

  // Check for double-booking
  for (const timeSlot of schedule.timeSlots) {
    const slotAssignments = schedule.assignments.filter(
      a => a.timeSlotId === timeSlot.id
    );

    const soldierCounts = new Map<string, number>();
    for (const assignment of slotAssignments) {
      const count = soldierCounts.get(assignment.soldierId) || 0;
      soldierCounts.set(assignment.soldierId, count + 1);
    }

    for (const [soldierId, count] of soldierCounts) {
      if (count > 1) {
        const soldier = schedule.soldiers.find(s => s.id === soldierId);
        errors.push(
          `${soldier?.name || 'חייל לא ידוע'} משובץ למספר עמדות בו-זמנית בזמן ${timeSlot.startTime}`
        );
      }
    }
  }

  // Check rest periods and unassigned soldiers
  for (const soldier of availableSoldiers) {
    const soldierAssignments = getAssignmentsForSoldier(schedule.assignments, soldier.id)
      .sort((a, b) => {
        const aIndex = schedule.timeSlots.findIndex(s => s.id === a.timeSlotId);
        const bIndex = schedule.timeSlots.findIndex(s => s.id === b.timeSlotId);
        return aIndex - bIndex;
      });

    if (soldierAssignments.length === 0) {
      unassignedSoldiers.push(soldier.id);
    } else {
      // Check rest periods between consecutive assignments
      for (let i = 0; i < soldierAssignments.length - 1; i++) {
        const current = soldierAssignments[i];
        const next = soldierAssignments[i + 1];
        const restSlots = getRestSlotsBetweenAssignments(
          schedule.timeSlots,
          current,
          next
        );

        if (minExpectedRestSlots > 0 && (restSlots < minExpectedRestSlots || restSlots > maxExpectedRestSlots)) {
          soldierRestWarnings.push({
            soldierId: soldier.id,
            timeSlotId: next.timeSlotId,
            actualRestSlots: restSlots,
            minExpectedRestSlots,
            maxExpectedRestSlots,
            level: 'warning',
          });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    soldierRestWarnings,
    unassignedSoldiers,
  };
}

export function calculateCurrentRestSlotsForSoldier(soldierId: string, timeSlotIndex: number, schedule: Schedule): number {
  const assignments = schedule.assignments.filter(a => a.soldierId === soldierId);

  for (let i = timeSlotIndex - 1; i >= 0; i--) {
    if (assignments.some(a => a.timeSlotId === schedule.timeSlots[i].id)) {
      return timeSlotIndex - i - 1;
    }
  }

  return -1;
}