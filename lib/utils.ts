import {
  Schedule,
  TimeSlot,
  Assignment,
  Post,
  Soldier,
  ValidationResult,
  UnfairAssignment,
  TimeSlotDuration,
} from '@/types';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatTime(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function parseTime(timeString: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
}

export function addMinutes(timeString: string, minutesToAdd: number): string {
  const { hours, minutes } = parseTime(timeString);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return formatTime(newHours, newMinutes);
}

export function getTimeDifferenceInMinutes(startTime: string, endTime: string): number {
  const start = parseTime(startTime);
  const end = parseTime(endTime);

  const startMinutes = start.hours * 60 + start.minutes;
  let endMinutes = end.hours * 60 + end.minutes;

  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  return endMinutes - startMinutes;
}

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

export function isPostActiveAtTime(post: Post, timeString: string): boolean {
  if (!post.activeHours) return true;

  const { hours } = parseTime(timeString);
  const startHours = parseTime(post.activeHours.start).hours;
  const endHours = parseTime(post.activeHours.end).hours;

  if (startHours > endHours) {
    return hours >= startHours || hours < endHours;
  }

  return hours >= startHours && hours < endHours;
}

export function getAssignmentsForSlotAndPost(
  assignments: Assignment[],
  timeSlotId: string,
  postId: string
): Assignment[] {
  return assignments.filter(
    a => a.timeSlotId === timeSlotId && a.postId === postId
  );
}

export function getAssignmentsForSoldier(
  assignments: Assignment[],
  soldierId: string
): Assignment[] {
  return assignments.filter(a => a.soldierId === soldierId);
}

export function isSoldierAssignedToSlot(
  assignments: Assignment[],
  soldierId: string,
  timeSlotId: string
): boolean {
  return assignments.some(
    a => a.soldierId === soldierId && a.timeSlotId === timeSlotId
  );
}

export function removeSoldierFromAllAssignments(
  assignments: Assignment[],
  soldierId: string
): Assignment[] {
  return assignments.filter(a => a.soldierId !== soldierId);
}

export function removeSoldierFromTimeSlot(
  assignments: Assignment[],
  soldierId: string,
  timeSlotId: string
): Assignment[] {
  return assignments.filter(
    a => !(a.soldierId === soldierId && a.timeSlotId === timeSlotId)
  );
}

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

export const filterIrrelevantAssignments = (
  assignments: Assignment[],
  timeSlots: TimeSlot[],
  soldiers: Soldier[],
  posts: Post[]
): Assignment[] => {
  const existingTimeSlotIds = new Set(timeSlots.map(t => t.id));
  const existingSoldierIds = new Set(soldiers.filter(s => s.isAvailable).map(s => s.id));
  const existingPostIds = new Set(posts.map(p => p.id));
  const postMap = new Map(posts.map(p => [p.id, p]));
  const slotMap = new Map(timeSlots.map(t => [t.id, t]));

  return assignments.filter(a =>
    existingSoldierIds.has(a.soldierId) &&
    existingTimeSlotIds.has(a.timeSlotId) &&
    existingPostIds.has(a.postId) &&
    isPostActiveAtTime(postMap.get(a.postId)!, slotMap.get(a.timeSlotId)!.startTime)
  );
};

// ---------------------------------------------------------------------------
// Fairness system
// ---------------------------------------------------------------------------

function isTimeInRange(timeString: string, rangeStart: string, rangeEnd: string): boolean {
  const t = parseTime(timeString);
  const s = parseTime(rangeStart);
  const e = parseTime(rangeEnd);

  const tMin = t.hours * 60 + t.minutes;
  const sMin = s.hours * 60 + s.minutes;
  const eMin = e.hours * 60 + e.minutes;

  if (sMin <= eMin) {
    return tMin >= sMin && tMin < eMin;
  }
  // Overnight range
  return tMin >= sMin || tMin < eMin;
}

export function isSoldierAvailableAtTime(soldier: Soldier, timeSlotStartTime: string): boolean {
  if (!soldier.isAvailable) return false;

  for (const period of soldier.unavailability) {
    if (isTimeInRange(timeSlotStartTime, period.startTime, period.endTime)) {
      return false;
    }
  }

  return true;
}

export function isSoldierEligibleForPost(soldier: Soldier, post: Post): boolean {
  if (post.eligibleRoleIds.length === 0) return true;
  if (soldier.roleIds.length === 0 && post.eligibleRoleIds.length > 0) return false;
  return soldier.roleIds.some(rid => post.eligibleRoleIds.includes(rid));
}

export function getEligibleSoldiersForPost(
  post: Post,
  allSoldiers: Soldier[],
  assignments: Assignment[],
  timeSlotId: string,
  timeSlotStartTime: string
): Soldier[] {
  return allSoldiers.filter(soldier => {
    if (!isSoldierAvailableAtTime(soldier, timeSlotStartTime)) return false;
    if (!isSoldierEligibleForPost(soldier, post)) return false;
    // Not already assigned to another post in this slot
    const assignedInSlot = assignments.some(
      a => a.soldierId === soldier.id && a.timeSlotId === timeSlotId
    );
    if (assignedInSlot) return false;
    return true;
  });
}

/**
 * Calculate rest since last shift in minutes.
 * Returns the time between the end of the soldier's most recent prior shift
 * and the start of the given time slot. If no prior shift, returns time from
 * schedule start to slot start.
 */
export function calculateRestSinceLastShift(
  soldierId: string,
  currentTimeSlotIndex: number,
  schedule: Schedule
): number {
  const soldierAssignmentSlots = new Set(
    schedule.assignments
      .filter(a => a.soldierId === soldierId)
      .map(a => a.timeSlotId)
  );

  for (let i = currentTimeSlotIndex - 1; i >= 0; i--) {
    if (soldierAssignmentSlots.has(schedule.timeSlots[i].id)) {
      const lastShiftEnd = schedule.timeSlots[i].endTime;
      const currentSlotStart = schedule.timeSlots[currentTimeSlotIndex].startTime;
      return getTimeDifferenceInMinutes(lastShiftEnd, currentSlotStart);
    }
  }

  // No prior assignment — rest is from schedule start to current slot start
  const currentSlotStart = schedule.timeSlots[currentTimeSlotIndex].startTime;
  return getTimeDifferenceInMinutes(schedule.config.startTime, currentSlotStart);
}

export function findUnfairAssignments(schedule: Schedule): UnfairAssignment[] {
  const results: UnfairAssignment[] = [];
  const slotIndexMap = new Map(schedule.timeSlots.map((s, i) => [s.id, i]));

  for (const assignment of schedule.assignments) {
    const slotIndex = slotIndexMap.get(assignment.timeSlotId);
    if (slotIndex === undefined) continue;

    const post = schedule.posts.find(p => p.id === assignment.postId);
    const soldier = schedule.soldiers.find(s => s.id === assignment.soldierId);
    if (!post || !soldier) continue;

    const timeSlot = schedule.timeSlots[slotIndex];
    const soldierRest = calculateRestSinceLastShift(soldier.id, slotIndex, schedule);

    // Get soldiers eligible for this post at this time (excluding those already assigned to this slot)
    const eligible = getEligibleSoldiersForPost(
      post,
      schedule.soldiers,
      schedule.assignments,
      timeSlot.id,
      timeSlot.startTime
    );

    // Also include soldiers assigned to OTHER posts in this slot who are role-eligible,
    // since we need the full picture. But the spec says "eligible" = matching role,
    // available, and not assigned elsewhere. The assigned soldier themselves is already
    // assigned, so they won't appear in eligible. We need to compare against soldiers
    // who COULD have been chosen instead — those who are eligible but not assigned.
    const moreRested: UnfairAssignment['moreRestedSoldiers'] = [];

    for (const candidate of eligible) {
      if (candidate.id === soldier.id) continue;
      const candidateRest = calculateRestSinceLastShift(candidate.id, slotIndex, schedule);
      if (candidateRest > soldierRest) {
        moreRested.push({
          soldierId: candidate.id,
          soldierName: candidate.name,
          restMinutes: candidateRest,
          extraRestMinutes: candidateRest - soldierRest,
        });
      }
    }

    if (moreRested.length > 0) {
      moreRested.sort((a, b) => b.extraRestMinutes - a.extraRestMinutes);
      results.push({
        assignmentId: assignment.id,
        soldierId: assignment.soldierId,
        postId: assignment.postId,
        timeSlotId: assignment.timeSlotId,
        soldierRestMinutes: soldierRest,
        moreRestedSoldiers: moreRested,
      });
    }
  }

  return results;
}

export function validateSchedule(schedule: Schedule): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const unassignedSoldiers: string[] = [];

  // Check each time slot and post combination for staffing
  for (const timeSlot of schedule.timeSlots) {
    for (const post of schedule.posts) {
      if (!isPostActiveAtTime(post, timeSlot.startTime)) continue;

      const assignments = getAssignmentsForSlotAndPost(
        schedule.assignments,
        timeSlot.id,
        post.id
      );

      if (assignments.length < post.requiredGuards) {
        errors.push(
          `חסרים ${post.requiredGuards - assignments.length} שומרים ב${post.name} בזמן ${timeSlot.startTime}`
        );
      } else if (assignments.length > post.requiredGuards) {
        errors.push(
          `יותר מדי שומרים ב${post.name} בזמן ${timeSlot.startTime} (${assignments.length}/${post.requiredGuards})`
        );
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
      soldierCounts.set(assignment.soldierId, (soldierCounts.get(assignment.soldierId) || 0) + 1);
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

  // Find unassigned soldiers
  const availableSoldiers = schedule.soldiers.filter(s => s.isAvailable);
  for (const soldier of availableSoldiers) {
    const hasAssignment = schedule.assignments.some(a => a.soldierId === soldier.id);
    if (!hasAssignment) {
      unassignedSoldiers.push(soldier.id);
    }
  }

  // Compute fairness flags
  const unfairAssignments = findUnfairAssignments(schedule);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    unfairAssignments,
    unassignedSoldiers,
  };
}
