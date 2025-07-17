'use client';

import { useState } from 'react';
import { Schedule, TimeSlotDuration, Assignment, Soldier } from '@/types';
import { generateId, validateSchedule, getAssignmentsForSlotAndPost, isPostActiveAtTime, addMinutes } from '@/lib/utils';

interface ScheduleControlsProps {
  schedule: Schedule;
  onUpdateSchedule: (updates: Partial<Schedule>) => void;
  onUpdateTimeSlotDuration: (duration: TimeSlotDuration) => void;
}

export default function ScheduleControls({ 
  schedule, 
  onUpdateSchedule, 
  onUpdateTimeSlotDuration 
}: ScheduleControlsProps) {
  
  const [isValidationExpanded, setIsValidationExpanded] = useState(true);
  const validation = validateSchedule(schedule);
  
  // Helper function to organize soldiers by groups
  const getOrderedSoldiersForAutoFill = () => {
    const orderedSoldiers: Soldier[] = [];
    
    // First add soldiers from each group
    for (const group of schedule.groups) {
      const groupSoldiers = schedule.soldiers.filter(s => s.groupId === group.id);
      orderedSoldiers.push(...groupSoldiers);
    }
    
    // Then add unassigned soldiers
    const unassignedSoldiers = schedule.soldiers.filter(s => !s.groupId);
    orderedSoldiers.push(...unassignedSoldiers);
    
    return orderedSoldiers;
  };
  
  const handleAutoFill = (shuffle = false) => {
    if (schedule.posts.length === 0 || schedule.soldiers.filter(s => s.isAvailable).length === 0) {
      alert('נדרשות עמדות וחיילים זמינים כדי למלא את הלוח אוטומטית');
      return;
    }

    const newAssignments: Assignment[] = [];
    let availableSoldiers = getOrderedSoldiersForAutoFill().filter(s => s.isAvailable);
    
    // Shuffle soldiers if requested
    if (shuffle) {
      availableSoldiers = [...availableSoldiers].sort(() => Math.random() - 0.5);
    }
    
    let soldierIndex = 0;

    // For each time slot, fill all required positions
    for (const timeSlot of schedule.timeSlots) {
      for (const post of schedule.posts) {
        if (!isPostActiveAtTime(post, timeSlot.startTime)) continue;

        // Create assignments for this post in this time slot
        for (let i = 0; i < post.requiredGuards; i++) {
          if (availableSoldiers.length === 0) break;
          
          const soldier = availableSoldiers[soldierIndex % availableSoldiers.length];
          
          newAssignments.push({
            id: generateId(),
            soldierId: soldier.id,
            postId: post.id,
            timeSlotId: timeSlot.id,
          });
          
          soldierIndex++;
        }
      }
    }

    onUpdateSchedule({ assignments: newAssignments });
  };

  const handleClearAll = () => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את כל השיבוצים?')) {
      onUpdateSchedule({ assignments: [] });
    }
  };

  const handleAddTimeSlots = (numberOfSlots: number) => {
    if (numberOfSlots <= 0) return;

    const lastTimeSlot = schedule.timeSlots[schedule.timeSlots.length - 1];
    if (!lastTimeSlot) return;

    const newTimeSlots = [...schedule.timeSlots];
    let currentEndTime = lastTimeSlot.endTime;

    for (let i = 0; i < numberOfSlots; i++) {
      const newStartTime = currentEndTime;
      const newEndTime = addMinutes(currentEndTime, schedule.config.timeSlotDuration);
      
      newTimeSlots.push({
        id: generateId(),
        startTime: newStartTime,
        endTime: newEndTime,
        date: lastTimeSlot.date,
      });

      currentEndTime = newEndTime;
    }

    // Update both time slots and config end time
    onUpdateSchedule({ 
      timeSlots: newTimeSlots,
      config: {
        ...schedule.config,
        endTime: currentEndTime
      }
    });
  };

  const handleRemoveLastTimeSlot = () => {
    if (schedule.timeSlots.length <= 1) {
      alert('לא ניתן להסיר את משמרת הזמן האחרונה');
      return;
    }

    const lastTimeSlot = schedule.timeSlots[schedule.timeSlots.length - 1];
    
    // Check if the last time slot has any assignments
    const hasAssignments = schedule.assignments.some(a => a.timeSlotId === lastTimeSlot.id);
    
    if (hasAssignments) {
      if (!window.confirm('משמרת הזמן האחרונה מכילה שיבוצים. האם אתה בטוח שברצונך להסיר אותה?')) {
        return;
      }
    }

    // Remove the last time slot and any assignments in it
    const newTimeSlots = schedule.timeSlots.slice(0, -1);
    const newAssignments = schedule.assignments.filter(a => a.timeSlotId !== lastTimeSlot.id);
    
    // Update config end time to match the new last time slot
    const newLastTimeSlot = newTimeSlots[newTimeSlots.length - 1];
    const newEndTime = newLastTimeSlot ? newLastTimeSlot.endTime : schedule.config.startTime;

    onUpdateSchedule({ 
      timeSlots: newTimeSlots,
      assignments: newAssignments,
      config: {
        ...schedule.config,
        endTime: newEndTime
      }
    });
  };

  const durations: { value: TimeSlotDuration; label: string }[] = [
    { value: 30, label: '30 דקות' },
    { value: 60, label: 'שעה' },
    { value: 120, label: 'שעתיים' },
  ];

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 space-y-6">
      <div className="flex flex-wrap gap-4 justify-between items-start">
        {/* Time Slot Duration */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">אורך משמרת:</label>
          <select
            value={schedule.config.timeSlotDuration}
            onChange={(e) => onUpdateTimeSlotDuration(parseInt(e.target.value) as TimeSlotDuration)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {durations.map(duration => (
              <option key={duration.value} value={duration.value}>
                {duration.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleAutoFill(false)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              disabled={schedule.posts.length === 0 || schedule.soldiers.filter(s => s.isAvailable).length === 0}
            >
              שבץ אוטומטית
            </button>
            
            <button
              onClick={() => handleAutoFill(true)}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
              disabled={schedule.posts.length === 0 || schedule.soldiers.filter(s => s.isAvailable).length === 0}
            >
              ערבב ושבץ אוטומטית
            </button>
            
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              disabled={schedule.assignments.length === 0}
            >
              נקה הכל
            </button>
          </div>
        </div>

        {/* Schedule Extension Controls */}
        <div className="flex flex-wrap gap-3 items-center">          
          <button
            onClick={() => handleAddTimeSlots(1)}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm"
          >
            הוסף משמרת
          </button>
          
          <button
            onClick={handleRemoveLastTimeSlot}
            className="px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors text-sm"
            disabled={schedule.timeSlots.length <= 1}
          >
            הסר משמרת אחרונה
          </button>
        </div>
      </div>

      {/* Validation Status */}
      {(validation.errors.length > 0 || validation.warnings.length > 0 || validation.soldierRestWarnings.length > 0 || validation.unassignedSoldiers.length > 0) && (
        <div className="space-y-3">
          {/* Collapsible Header */}
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
                {validation.soldierRestWarnings.length > 0 && (
                  <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                    {validation.soldierRestWarnings.length} התראות מנוחה
                  </span>
                )}
              </div>
            </div>
            <div className={`transform transition-transform ${isValidationExpanded ? '-rotate-90' : ''}`}>
              ◀
            </div>
          </button>

          {/* Collapsible Content */}
          {isValidationExpanded && (
            <div className="space-y-3">
              {/* Errors */}
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

              {/* Warnings */}
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

              {/* Unassigned Soldiers */}
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

              {/* Rest Period Warnings */}
              {validation.soldierRestWarnings.length > 0 && (
                <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-400 mb-2">התראות מנוחה:</h4>
                  <ul className="space-y-1">
                    {validation.soldierRestWarnings.map((warning, index) => {
                      const soldier = schedule.soldiers.find(s => s.id === warning.soldierId);
                      const timeSlot = schedule.timeSlots.find(t => t.id === warning.timeSlotId);

                      const restSlots = warning.actualRestSlots;
                      const minExpectedRestSlots = warning.minExpectedRestSlots;
                      const maxExpectedRestSlots = warning.maxExpectedRestSlots;

                      if (restSlots < minExpectedRestSlots) {
                        return (
                          <li key={index} className="text-purple-300 text-sm">
                            • {soldier?.name || 'חייל לא ידוע'} - {timeSlot?.startTime || 'זמן לא ידוע'}: 
                            מנוחה של {warning.actualRestSlots * schedule.config.timeSlotDuration / 60} שעות במקום מינימום מצופה של {warning.minExpectedRestSlots * schedule.config.timeSlotDuration / 60} שעות
                          </li>
                        );
                      }
                      
                      return (
                        <li key={index} className="text-purple-300 text-sm">
                          • {soldier?.name || 'חייל לא ידוע'} - {timeSlot?.startTime || 'זמן לא ידוע'}: 
                          מנוחה של {warning.actualRestSlots * schedule.config.timeSlotDuration / 60} שעות במקום מקסימום מצופה של {warning.maxExpectedRestSlots * schedule.config.timeSlotDuration / 60} שעות
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Success Status */}
      {validation.isValid && validation.unassignedSoldiers.length === 0 && validation.soldierRestWarnings.length === 0 && (
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