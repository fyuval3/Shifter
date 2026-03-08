'use client';

import { useState } from 'react';
import { Schedule, Assignment, Soldier, TimeSlot } from '@/types';
import {
  generateId,
  validateSchedule,
  isPostActiveAtTime,
  addMinutes,
  getEligibleSoldiersForPost,
  calculateRestSinceLastShift,
  isSoldierAvailableAtTime,
  isSoldierEligibleForPost,
} from '@/lib/utils';

interface ScheduleControlsProps {
  schedule: Schedule;
  onUpdateSchedule: (updates: Partial<Schedule>) => void;
}

export default function ScheduleControls({ schedule, onUpdateSchedule }: ScheduleControlsProps) {
  const [isValidationExpanded, setIsValidationExpanded] = useState(true);
  const [continueHours, setContinueHours] = useState(2);

  const validation = validateSchedule(schedule);

  const hasAvailableSoldiers = schedule.soldiers.some(s => s.isAvailable);
  const hasPosts = schedule.posts.length > 0;
  const canAutoFill = hasPosts && hasAvailableSoldiers;

  /**
   * Fairness-aware auto-fill: for each slot+post, pick the most-rested eligible
   * soldiers, with rotation preference for soldiers not recently on that post.
   */
  const fairnessAutoFill = (
    existingAssignments: Assignment[],
    timeSlots: TimeSlot[],
    startIndex: number
  ): Assignment[] => {
    const newAssignments = [...existingAssignments];

    // Build a temporary schedule-like object for rest calculation
    const tempSchedule = { ...schedule, assignments: newAssignments, timeSlots };

    for (let i = startIndex; i < timeSlots.length; i++) {
      const timeSlot = timeSlots[i];

      for (const post of schedule.posts) {
        if (!isPostActiveAtTime(post, timeSlot.startTime)) continue;

        // Get eligible soldiers not already assigned in this slot
        const eligible = schedule.soldiers.filter(soldier => {
          if (!isSoldierAvailableAtTime(soldier, timeSlot.startTime)) return false;
          if (!isSoldierEligibleForPost(soldier, post)) return false;
          const alreadyInSlot = newAssignments.some(
            a => a.soldierId === soldier.id && a.timeSlotId === timeSlot.id
          );
          return !alreadyInSlot;
        });

        // Sort by rest descending (most rested first)
        const scored = eligible.map(soldier => {
          const rest = calculateRestSinceLastShift(soldier.id, i, tempSchedule);
          // Rotation preference: penalize soldiers recently on this specific post
          const recentOnPost = wasRecentlyOnPost(soldier.id, post.id, i, newAssignments, timeSlots);
          return { soldier, rest, recentOnPost };
        });

        scored.sort((a, b) => {
          if (b.rest !== a.rest) return b.rest - a.rest;
          // Among equally rested, prefer those NOT recently on this post
          if (a.recentOnPost !== b.recentOnPost) return a.recentOnPost ? 1 : -1;
          return 0;
        });

        const toAssign = scored.slice(0, post.requiredGuards);
        for (const { soldier } of toAssign) {
          const assignment: Assignment = {
            id: generateId(),
            soldierId: soldier.id,
            postId: post.id,
            timeSlotId: timeSlot.id,
          };
          newAssignments.push(assignment);
          // Keep tempSchedule in sync
          tempSchedule.assignments = newAssignments;
        }
      }
    }

    return newAssignments;
  };

  const wasRecentlyOnPost = (
    soldierId: string,
    postId: string,
    currentSlotIndex: number,
    assignments: Assignment[],
    timeSlots: TimeSlot[]
  ): boolean => {
    // Check the 2 previous slots
    for (let i = Math.max(0, currentSlotIndex - 2); i < currentSlotIndex; i++) {
      if (assignments.some(a => a.soldierId === soldierId && a.postId === postId && a.timeSlotId === timeSlots[i].id)) {
        return true;
      }
    }
    return false;
  };

  const handleAutoFill = () => {
    if (!canAutoFill) {
      alert('נדרשות עמדות וחיילים זמינים כדי למלא את הלוח אוטומטית');
      return;
    }
    const newAssignments = fairnessAutoFill([], schedule.timeSlots, 0);
    onUpdateSchedule({ assignments: newAssignments });
  };

  const handleContinueSchedule = () => {
    if (!canAutoFill) {
      alert('נדרשות עמדות וחיילים זמינים כדי להמשיך את הלוח');
      return;
    }

    const numSlots = Math.max(1, Math.round(continueHours * 60 / schedule.config.timeSlotDuration));
    const newTimeSlots = createNewTimeSlots(numSlots);
    const startIndex = schedule.timeSlots.length;
    const newAssignments = fairnessAutoFill(schedule.assignments, newTimeSlots, startIndex);

    onUpdateSchedule({
      assignments: newAssignments,
      timeSlots: newTimeSlots,
      config: {
        ...schedule.config,
        endTime: newTimeSlots[newTimeSlots.length - 1].endTime,
      },
    });
  };

  const createNewTimeSlots = (numberOfSlots: number): TimeSlot[] => {
    if (numberOfSlots <= 0) return schedule.timeSlots;
    const lastTimeSlot = schedule.timeSlots[schedule.timeSlots.length - 1];
    if (!lastTimeSlot) return schedule.timeSlots;

    const newTimeSlots = [...schedule.timeSlots];
    let currentEndTime = lastTimeSlot.endTime;

    for (let i = 0; i < numberOfSlots; i++) {
      const newStartTime = currentEndTime;
      const newEndTime = addMinutes(currentEndTime, schedule.config.timeSlotDuration);
      newTimeSlots.push({ id: generateId(), startTime: newStartTime, endTime: newEndTime });
      currentEndTime = newEndTime;
    }

    return newTimeSlots;
  };

  const handleClearAll = () => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את כל השיבוצים?')) {
      onUpdateSchedule({ assignments: [] });
    }
  };

  const handleAddTimeSlots = (numberOfSlots: number) => {
    const newTimeSlots = createNewTimeSlots(numberOfSlots);
    onUpdateSchedule({
      timeSlots: newTimeSlots,
      config: { ...schedule.config, endTime: newTimeSlots[newTimeSlots.length - 1].endTime },
    });
  };

  const handleRemoveLastTimeSlot = () => {
    if (schedule.timeSlots.length <= 1) { alert('לא ניתן להסיר את משמרת הזמן האחרונה'); return; }
    const lastTimeSlot = schedule.timeSlots[schedule.timeSlots.length - 1];
    const newTimeSlots = schedule.timeSlots.slice(0, -1);
    const newAssignments = schedule.assignments.filter(a => a.timeSlotId !== lastTimeSlot.id);
    const newLastTimeSlot = newTimeSlots[newTimeSlots.length - 1];
    onUpdateSchedule({
      timeSlots: newTimeSlots,
      assignments: newAssignments,
      config: { ...schedule.config, endTime: newLastTimeSlot ? newLastTimeSlot.endTime : schedule.config.startTime },
    });
  };

  const handleRemoveFirstTimeSlot = () => {
    if (schedule.timeSlots.length <= 1) { alert('לא ניתן להסיר את משמרת הזמן האחרונה'); return; }
    const firstTimeSlot = schedule.timeSlots[0];
    const newTimeSlots = schedule.timeSlots.slice(1);
    const newAssignments = schedule.assignments.filter(a => a.timeSlotId !== firstTimeSlot.id);
    const newFirstTimeSlot = newTimeSlots[0];
    onUpdateSchedule({
      timeSlots: newTimeSlots,
      assignments: newAssignments,
      config: { ...schedule.config, startTime: newFirstTimeSlot ? newFirstTimeSlot.startTime : schedule.config.startTime },
    });
  };

  const showValidation = validation.errors.length > 0 || validation.warnings.length > 0 ||
    validation.unfairAssignments.length > 0 || validation.unassignedSoldiers.length > 0;

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 space-y-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <button
              onClick={handleAutoFill}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
              disabled={!canAutoFill}
            >
              שבץ הכל אוטומטית
            </button>

            <div className="flex items-end gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">שעות להמשך</label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={continueHours}
                  onChange={(e) => setContinueHours(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 px-2 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleContinueSchedule}
                className="px-3 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors text-sm"
                disabled={!canAutoFill}
              >
                המשך לוח זמנים
              </button>
            </div>

            <button
              onClick={() => handleAddTimeSlots(1)}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm"
            >
              הוסף משמרת
            </button>

            <button
              onClick={handleRemoveFirstTimeSlot}
              className="px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors text-sm"
              disabled={schedule.timeSlots.length <= 1}
            >
              הסר משמרת ראשונה
            </button>

            <button
              onClick={handleRemoveLastTimeSlot}
              className="px-3 py-2 bg-orange-400 hover:bg-orange-500 rounded-lg transition-colors text-sm"
              disabled={schedule.timeSlots.length <= 1}
            >
              הסר משמרת אחרונה
            </button>

            <button
              onClick={handleClearAll}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
              disabled={schedule.assignments.length === 0}
            >
              נקה הכל
            </button>
          </div>
        </div>
      </div>

      {/* Validation Status */}
      {showValidation && (
        <div className="space-y-3">
          <button
            onClick={() => setIsValidationExpanded(!isValidationExpanded)}
            className="w-full flex items-center justify-between p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">בעיות ואזהרות</span>
              <div className="flex gap-1">
                {validation.errors.length > 0 && (
                  <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                    {validation.errors.length} שגיאות
                  </span>
                )}
                {validation.warnings.length > 0 && (
                  <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded-full">
                    {validation.warnings.length} אזהרות
                  </span>
                )}
                {validation.unassignedSoldiers.length > 0 && (
                  <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded-full">
                    {validation.unassignedSoldiers.length} לא משובצים
                  </span>
                )}
                {validation.unfairAssignments.length > 0 && (
                  <span className="px-2 py-1 bg-amber-600 text-white text-xs rounded-full">
                    {validation.unfairAssignments.length} שיבוצים לא הוגנים
                  </span>
                )}
              </div>
            </div>
            <div className={`transform transition-transform ${isValidationExpanded ? '-rotate-90' : ''}`}>
              ◀
            </div>
          </button>

          {isValidationExpanded && (
            <div className="space-y-3">
              {validation.errors.length > 0 && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                  <h4 className="font-semibold text-red-400 mb-2">שגיאות:</h4>
                  <ul className="space-y-1">
                    {validation.errors.map((error, index) => (
                      <li key={index} className="text-red-300 text-sm">• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-400 mb-2">אזהרות:</h4>
                  <ul className="space-y-1">
                    {validation.warnings.map((warning, index) => (
                      <li key={index} className="text-yellow-300 text-sm">• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.unassignedSoldiers.length > 0 && (
                <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-400 mb-2">חיילים לא משובצים:</h4>
                  <p className="text-orange-300 text-sm">
                    {validation.unassignedSoldiers.map(soldierId => {
                      const soldier = schedule.soldiers.find(s => s.id === soldierId);
                      return soldier?.name || 'חייל לא ידוע';
                    }).join(', ')}
                  </p>
                </div>
              )}

              {validation.unfairAssignments.length > 0 && (
                <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-400 mb-2">שיבוצים לא הוגנים:</h4>
                  <ul className="space-y-1">
                    {validation.unfairAssignments.slice(0, 20).map((unfair, index) => {
                      const soldier = schedule.soldiers.find(s => s.id === unfair.soldierId);
                      const post = schedule.posts.find(p => p.id === unfair.postId);
                      const timeSlot = schedule.timeSlots.find(t => t.id === unfair.timeSlotId);
                      const topAlternative = unfair.moreRestedSoldiers[0];

                      return (
                        <li key={index} className="text-amber-300 text-sm">
                          • {soldier?.name} ב{post?.name} ({timeSlot?.startTime}):
                          {' '}{topAlternative.soldierName} נח {(topAlternative.extraRestMinutes / 60).toFixed(1)} שעות יותר
                        </li>
                      );
                    })}
                    {validation.unfairAssignments.length > 20 && (
                      <li className="text-amber-300 text-sm">ועוד {validation.unfairAssignments.length - 20} שיבוצים...</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Success Status */}
      {validation.isValid && validation.unassignedSoldiers.length === 0 && validation.unfairAssignments.length === 0 && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <p className="text-green-400 font-semibold">✓ לוח הזמנים תקין ומלא</p>
        </div>
      )}

      {/* Schedule Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-slate-700 p-3 rounded">
          <div className="text-2xl font-bold text-blue-300">{schedule.timeSlots.length}</div>
          <div className="text-sm text-slate-400">משמרות</div>
        </div>
        <div className="bg-slate-700 p-3 rounded">
          <div className="text-2xl font-bold text-green-300">{schedule.posts.length}</div>
          <div className="text-sm text-slate-400">עמדות</div>
        </div>
        <div className="bg-slate-700 p-3 rounded">
          <div className="text-2xl font-bold text-yellow-300">{schedule.soldiers.filter(s => s.isAvailable).length}</div>
          <div className="text-sm text-slate-400">חיילים זמינים</div>
        </div>
        <div className="bg-slate-700 p-3 rounded">
          <div className="text-2xl font-bold text-purple-300">{schedule.assignments.length}</div>
          <div className="text-sm text-slate-400">שיבוצים</div>
        </div>
      </div>
    </div>
  );
}
