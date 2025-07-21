'use client';

import { useState } from 'react';
import { Schedule, Assignment, Group, Soldier, TimeSlot } from '@/types';
import {
  generateId,
  getAssignmentsForSlotAndPost,
  isPostActiveAtTime,
  validateSchedule,
  removeSoldierFromTimeSlot,
  removeSoldierFromAllAssignments,
  calculateCurrentRestSlotsForSoldier,
  addMinutes
} from '@/lib/utils';
import SwapModal from './SwapModal';

interface ScheduleTableProps {
  schedule: Schedule;
  onUpdateSchedule: (updates: Partial<Schedule>) => void;
}

interface DragState {
  draggedSoldierId: string | null;
  draggedFromAssignmentId: string | null;
  dropTargetPostId: string | null;
  dropTargetTimeSlotId: string | null;
  dropTargetAssignmentId: string | null;
  dropTargetSoldierId: string | null;
}

export default function ScheduleTable({ schedule, onUpdateSchedule }: ScheduleTableProps) {
  const [dragState, setDragState] = useState<DragState>({
    draggedSoldierId: null,
    draggedFromAssignmentId: null,
    dropTargetPostId: null,
    dropTargetTimeSlotId: null,
    dropTargetAssignmentId: null,
    dropTargetSoldierId: null,
  });
  const [highlightedSoldierId, setHighlightedSoldierId] = useState<string | null>(null);
  const [assignmentContextMenu, setAssignmentContextMenu] = useState<{
    x: number;
    y: number;
    assignmentId: string;
  } | null>(null);
  const [timeSlotContextMenu, setTimeSlotContextMenu] = useState<{
    x: number;
    y: number;
    timeSlotId: string;
  } | null>(null);

  const [swapModal, setSwapModal] = useState<{
    isOpen: boolean;
    draggedSoldierId: string;
    targetSoldierId: string;
    draggedAssignmentId: string;
    targetAssignmentId: string;
  }>({
    isOpen: false,
    draggedSoldierId: '',
    targetSoldierId: '',
    draggedAssignmentId: '',
    targetAssignmentId: '',
  });

  const validation = validateSchedule(schedule);

  // Helper function to organize soldiers by groups (same order as in soldiers management tab)
  const getOrderedSoldiers = () => {
    const orderedSoldiers: Soldier[] = [];

    // First, add soldiers from each group in groups order
    for (const group of schedule.groups) {
      const groupSoldiers = schedule.soldiers.filter(s => s.groupId === group.id);
      orderedSoldiers.push(...groupSoldiers);
    }

    // Then add unassigned soldiers
    const unassignedSoldiers = schedule.soldiers.filter(s => !s.groupId);
    orderedSoldiers.push(...unassignedSoldiers);

    return orderedSoldiers;
  };

  const availableSoldiers = getOrderedSoldiers().filter(s => s.isAvailable);

  // Helper function to get soldier's group color
  const getSoldierGroupColor = (soldierId: string): string | undefined => {
    const soldier = schedule.soldiers.find(s => s.id === soldierId);
    if (!soldier?.groupId) return undefined;
    const group = schedule.groups.find(g => g.id === soldier.groupId);
    return group?.color;
  };

  const handleDragStart = (e: React.DragEvent, soldierId: string, assignmentId?: string) => {
    setDragState({
      draggedSoldierId: soldierId,
      draggedFromAssignmentId: assignmentId || null,
      dropTargetPostId: null,
      dropTargetTimeSlotId: null,
      dropTargetAssignmentId: null,
      dropTargetSoldierId: null,
    });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, postId: string, timeSlotId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    setDragState(prev => ({
      ...prev,
      dropTargetPostId: postId,
      dropTargetTimeSlotId: timeSlotId,
    }));
  };

  const handleDragLeave = () => {
    setDragState(prev => ({
      ...prev,
      dropTargetPostId: null,
      dropTargetTimeSlotId: null,
    }));
  };

  const handleDrop = (e: React.DragEvent, postId: string, timeSlotId: string) => {
    e.preventDefault();

    if (!dragState.draggedSoldierId) return;

    const post = schedule.posts.find(p => p.id === postId);
    const timeSlot = schedule.timeSlots.find(t => t.id === timeSlotId);

    if (!post || !timeSlot || !isPostActiveAtTime(post, timeSlot.startTime)) {
      setDragState({
        draggedSoldierId: null,
        draggedFromAssignmentId: null,
        dropTargetPostId: null,
        dropTargetTimeSlotId: null,
        dropTargetAssignmentId: null,
        dropTargetSoldierId: null,
      });
      return;
    }

    // Check if dropping on same position
    if (dragState.draggedFromAssignmentId) {
      const fromAssignment = schedule.assignments.find(a => a.id === dragState.draggedFromAssignmentId);
      if (fromAssignment && fromAssignment.postId === postId && fromAssignment.timeSlotId === timeSlotId) {
        setDragState({
          draggedSoldierId: null,
          draggedFromAssignmentId: null,
          dropTargetPostId: null,
          dropTargetTimeSlotId: null,
          dropTargetAssignmentId: null,
          dropTargetSoldierId: null,
        });
        return;
      }
    }

    let newAssignments = [...schedule.assignments];

    // Remove from previous position if it was a move operation
    if (dragState.draggedFromAssignmentId) {
      newAssignments = newAssignments.filter(a => a.id !== dragState.draggedFromAssignmentId);
    }

    // Check if soldier is already assigned to this time slot (to another post)
    const conflictingAssignment = newAssignments.find(
      a => a.soldierId === dragState.draggedSoldierId && a.timeSlotId === timeSlotId
    );

    if (conflictingAssignment) {
      // If dropping on an occupied cell, try to swap
      const existingAssignments = getAssignmentsForSlotAndPost(newAssignments, timeSlotId, postId);
      if (existingAssignments.length > 0) {
        // Swap soldiers
        const targetAssignment = existingAssignments[0];

        // Update the conflicting assignment to point to the target soldier's previous post
        if (dragState.draggedFromAssignmentId) {
          const fromAssignment = schedule.assignments.find(a => a.id === dragState.draggedFromAssignmentId);
          if (fromAssignment) {
            newAssignments = newAssignments.map(a =>
              a.id === conflictingAssignment.id
                ? { ...a, postId: fromAssignment.postId }
                : a
            );
          }
        } else {
          // Remove the conflicting assignment if it's a new assignment
          newAssignments = newAssignments.filter(a => a.id !== conflictingAssignment.id);
        }

        // Update the target assignment with the dragged soldier
        if (dragState.draggedSoldierId) {
          newAssignments = newAssignments.map(a =>
            a.id === targetAssignment.id
              ? { ...a, soldierId: dragState.draggedSoldierId! }
              : a
          );
        }
      } else {
        // No one at target position, just move the conflicting assignment
        newAssignments = newAssignments.map(a =>
          a.id === conflictingAssignment.id
            ? { ...a, postId }
            : a
        );
      }
    } else {
      // Check if target cell is full
      const currentAssignments = getAssignmentsForSlotAndPost(newAssignments, timeSlotId, postId);

      if (currentAssignments.length >= post.requiredGuards) {
        // Try to swap with the first soldier in the target cell
        if (currentAssignments.length > 0) {
          const targetAssignment = currentAssignments[0];

          if (dragState.draggedFromAssignmentId) {
            const fromAssignment = schedule.assignments.find(a => a.id === dragState.draggedFromAssignmentId);
            if (fromAssignment) {
              // Swap the soldiers
              if (dragState.draggedSoldierId) {
                newAssignments = newAssignments.map(a => {
                  if (a.id === targetAssignment.id) {
                    return { ...a, soldierId: dragState.draggedSoldierId! };
                  }
                  return a;
                });
              }

              // Create new assignment for the displaced soldier
              newAssignments.push({
                id: generateId(),
                soldierId: targetAssignment.soldierId,
                postId: fromAssignment.postId,
                timeSlotId: fromAssignment.timeSlotId,
              });
            }
          }
        }
      } else {
        // Create new assignment
        if (dragState.draggedSoldierId) {
          newAssignments.push({
            id: generateId(),
            soldierId: dragState.draggedSoldierId,
            postId,
            timeSlotId,
          });
        }
      }
    }

    onUpdateSchedule({ assignments: newAssignments });

    setDragState({
      draggedSoldierId: null,
      draggedFromAssignmentId: null,
      dropTargetPostId: null,
      dropTargetTimeSlotId: null,
      dropTargetAssignmentId: null,
      dropTargetSoldierId: null,
    });
  };

  const handleAssignmentRightClick = (e: React.MouseEvent, assignmentId: string) => {
    e.preventDefault();
    setAssignmentContextMenu({
      x: e.clientX,
      y: e.clientY,
      assignmentId,
    });
  };

  const handleTimeSlotRightClick = (e: React.MouseEvent, timeSlotId: string) => {
    e.preventDefault();
    setTimeSlotContextMenu({
      x: e.clientX,
      y: e.clientY,
      timeSlotId,
    });
  }

  const handleAddTimeSlotAbove = () => {
    if (!timeSlotContextMenu) return;
    addTimeSlotBeforeOrAfter(timeSlotContextMenu.timeSlotId, true);
  }

  const handleAddTimeSlotBelow = () => {
    if (!timeSlotContextMenu) return;
    addTimeSlotBeforeOrAfter(timeSlotContextMenu.timeSlotId, false);
  }

  const addTimeSlotBeforeOrAfter = (timeSlotId: string, before: boolean) => {
    const timeSlotIndex = schedule.timeSlots.findIndex(t => t.id === timeSlotId);
    if (timeSlotIndex === -1) {
      return;
    }
    const timeSlot = schedule.timeSlots[timeSlotIndex];

    let updatedTimeSlots = schedule.timeSlots.slice(0, before? timeSlotIndex : timeSlotIndex + 1);
    updatedTimeSlots.push({
      id: generateId(),
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime
    });

    updatedTimeSlots = updatedTimeSlots.concat(schedule.timeSlots.slice(before? timeSlotIndex : timeSlotIndex + 1))
    
    fixTimeSlotTimes(updatedTimeSlots);
    onUpdateSchedule({ timeSlots: updatedTimeSlots });
    setTimeSlotContextMenu(null);
  }

  const handleClearTimeSlot = () => {
    if (!timeSlotContextMenu) return;

    const timeSlot = schedule.timeSlots.find(t => t.id === timeSlotContextMenu.timeSlotId);
    if (!timeSlot) return;

    const newAssignments = schedule.assignments.filter(a => a.timeSlotId !== timeSlot.id);
    onUpdateSchedule({ assignments: newAssignments });
    setTimeSlotContextMenu(null);
  }

  const handleRemoveTimeSlot = () => {
    if (!timeSlotContextMenu || schedule.timeSlots.length === 1) return;
    const newTimeSlots = schedule.timeSlots.filter(t => t.id !== timeSlotContextMenu.timeSlotId);
    fixTimeSlotTimes(newTimeSlots);
    const newAssignments = schedule.assignments.filter(a => a.timeSlotId !== timeSlotContextMenu.timeSlotId);
    onUpdateSchedule({ timeSlots: newTimeSlots, assignments: newAssignments });
    setTimeSlotContextMenu(null);
  }

  const fixTimeSlotTimes = (timeSlots: TimeSlot[]) => {
    let currentEndTime = timeSlots[0].endTime;
    for (let i = 1; i < timeSlots.length; i++) {
      const timeSlot = timeSlots[i];
      timeSlot.startTime = currentEndTime;
      timeSlot.endTime = addMinutes(currentEndTime, schedule.config.timeSlotDuration);
      currentEndTime = timeSlot.endTime;
    }
  }

  const handleRemoveFromSlot = () => {
    if (!assignmentContextMenu) return;

    const assignment = schedule.assignments.find(a => a.id === assignmentContextMenu.assignmentId);
    if (!assignment) return;

    const newAssignments = removeSoldierFromTimeSlot(
      schedule.assignments,
      assignment.soldierId,
      assignment.timeSlotId
    );

    onUpdateSchedule({ assignments: newAssignments });
    setAssignmentContextMenu(null);
  };

  const handleRemoveFromAll = () => {
    if (!assignmentContextMenu) return;

    const assignment = schedule.assignments.find(a => a.id === assignmentContextMenu.assignmentId);
    if (!assignment) return;

    const newAssignments = removeSoldierFromAllAssignments(
      schedule.assignments,
      assignment.soldierId
    );

    onUpdateSchedule({ assignments: newAssignments });
    setAssignmentContextMenu(null);
  };

  const handleAssignmentClick = (soldierId: string) => {
    if (highlightedSoldierId === soldierId) {
      // If this soldier is already highlighted, unhighlight
      setHighlightedSoldierId(null);
    } else {
      // Highlight all assignments for this soldier
      setHighlightedSoldierId(soldierId);
    }
  };

  // Close context menu and clear highlighting when clicking elsewhere
  const handleClick = () => {
    if (assignmentContextMenu) {
      setAssignmentContextMenu(null);
    }
    if (timeSlotContextMenu) {
      setTimeSlotContextMenu(null);
    }
    // Clear highlighting when clicking elsewhere
    if (highlightedSoldierId) {
      setHighlightedSoldierId(null);
    }
  };

  if (schedule.posts.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <h3 className="text-xl font-semibold mb-2">אין עמדות</h3>
        <p>הוסף עמדות כדי להתחיל ליצור לוח זמנים</p>
      </div>
    );
  }

  if (availableSoldiers.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <h3 className="text-xl font-semibold mb-2">אין חיילים זמינים</h3>
        <p>הוסף חיילים כדי להתחיל ליצור לוח זמנים</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" onClick={handleClick}>
      {/* Available Soldiers */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
        <h3 className="text-lg font-semibold mb-3">חיילים זמינים (לחץ לבחירה או גרור למשמרת)</h3>
        <div className="flex flex-wrap gap-2">
          {availableSoldiers.map((soldier) => {
            const isUnassigned = !schedule.assignments.some(a => a.soldierId === soldier.id);
            const isHighlighted = highlightedSoldierId === soldier.id;
            const groupColor = getSoldierGroupColor(soldier.id);

            return (
              <button
                key={soldier.id}
                draggable
                onDragStart={(e) => handleDragStart(e, soldier.id)}
                onClick={() => setHighlightedSoldierId(isHighlighted ? null : soldier.id)}
                className={`px-3 py-2 rounded-lg transition-all cursor-pointer border-2 ${isHighlighted
                  ? 'bg-yellow-500 text-black font-bold shadow-lg border-yellow-300'
                  : groupColor
                    ? 'text-white border-current'
                    : 'bg-slate-600 hover:bg-slate-500 text-slate-200 border-slate-500'
                  }`}
                style={{
                  backgroundColor: !isHighlighted && groupColor ? groupColor : undefined,
                  borderColor: !isHighlighted && groupColor ? groupColor : undefined
                }}
                title={
                  isHighlighted
                    ? 'החייל מודגש בלוח הזמנים'
                    : isUnassigned
                      ? 'חייל לא משובץ'
                      : 'לחץ לבחירה או גרור למשמרת'
                }
              >
                {soldier.name}
                {isUnassigned && ' ⚠️'}
                {isHighlighted && ' ★'}
              </button>
            );
          })}
        </div>
        {highlightedSoldierId && (
          <p className="text-yellow-300 text-sm mt-2">
            מודגש: {schedule.soldiers.find(s => s.id === highlightedSoldierId)?.name} - כל השיבוצים של החייל מודגשים בצהוב
          </p>
        )}
      </div>

      {/* Schedule Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-right font-semibold sticky right-0 bg-slate-700 z-10">
                  זמן
                </th>
                {schedule.posts.map((post) => (
                  <th key={post.id} className="px-4 py-3 text-right font-semibold min-w-[120px]">
                    <div>{post.name}</div>
                    <div className="text-xs text-slate-400">
                      {post.requiredGuards} שומרים
                    </div>
                    {post.activeHours && (
                      <div className="text-xs text-slate-400">
                        {post.activeHours.start} - {post.activeHours.end}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedule.timeSlots.map((timeSlot, rowIndex) => {
                const hasRestWarnings = validation.soldierRestWarnings.some(
                  w => w.timeSlotId === timeSlot.id
                );

                return (
                  <tr
                    key={timeSlot.id}
                    className={`border-t border-slate-600 ${rowIndex % 2 === 0 ? 'bg-slate-800' : 'bg-slate-900'
                      } ${hasRestWarnings ? 'bg-purple-900/20' : ''}`}
                  >
                    <td
                      className="px-4 py-3 font-medium sticky right-0 bg-inherit z-10 border-l border-slate-600"
                      onContextMenu={(e) => handleTimeSlotRightClick(e, timeSlot.id)}
                      draggable
                    >
                      <div>{timeSlot.startTime}</div>
                      <div className="text-xs text-slate-400">{timeSlot.endTime}</div>
                    </td>

                    {schedule.posts.map((post) => {
                      const isPostActive = isPostActiveAtTime(post, timeSlot.startTime);
                      const assignments = getAssignmentsForSlotAndPost(
                        schedule.assignments,
                        timeSlot.id,
                        post.id
                      );

                      const isDropTarget =
                        dragState.dropTargetPostId === post.id &&
                        dragState.dropTargetTimeSlotId === timeSlot.id;

                      const isComplete = assignments.length === post.requiredGuards;
                      const isOverfilled = assignments.length > post.requiredGuards;

                      return (
                        <td
                          key={post.id}
                          className={`px-2 py-3 border-l border-slate-600 min-h-[60px] ${!isPostActive
                            ? 'bg-slate-700 opacity-50'
                            : isDropTarget
                              ? 'bg-blue-600/30'
                              : isOverfilled
                                ? 'bg-red-900/30'
                                : isComplete
                                  ? 'bg-green-900/30'
                                  : assignments.length > 0
                                    ? 'bg-yellow-900/30'
                                    : 'hover:bg-slate-700/50 cursor-pointer'
                            }`}
                          onDragOver={isPostActive ? (e) => handleDragOver(e, post.id, timeSlot.id) : undefined}
                          onDragLeave={handleDragLeave}
                          onDrop={isPostActive ? (e) => handleDrop(e, post.id, timeSlot.id) : undefined}
                        >
                          {isPostActive ? (
                            <div className="space-y-1">
                              {assignments.map((assignment) => {
                                const soldier = schedule.soldiers.find(s => s.id === assignment.soldierId);
                                const restSlots = calculateCurrentRestSlotsForSoldier(soldier!.id, rowIndex, schedule);
                                const hasWarning = validation.soldierRestWarnings.some(
                                  w => w.soldierId === assignment.soldierId && w.timeSlotId === timeSlot.id
                                );
                                const isHighlighted = highlightedSoldierId === assignment.soldierId;

                                const isDropTarget =
                                  dragState.dropTargetAssignmentId === assignment.id;

                                return (
                                  <div
                                    key={assignment.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, assignment.soldierId, assignment.id)}
                                    onContextMenu={(e) => handleAssignmentRightClick(e, assignment.id)}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAssignmentClick(assignment.soldierId);
                                    }}
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setDragState(prev => ({
                                        ...prev,
                                        dropTargetAssignmentId: assignment.id,
                                        dropTargetSoldierId: assignment.soldierId,
                                      }));
                                    }}
                                    onDragLeave={(e) => {
                                      e.stopPropagation();
                                      setDragState(prev => ({
                                        ...prev,
                                        dropTargetAssignmentId: null,
                                        dropTargetSoldierId: null,
                                      }));
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();

                                      if (dragState.draggedSoldierId &&
                                        dragState.draggedFromAssignmentId &&
                                        dragState.draggedSoldierId !== assignment.soldierId) {

                                        // Show swap modal
                                        setSwapModal({
                                          isOpen: true,
                                          draggedSoldierId: dragState.draggedSoldierId,
                                          targetSoldierId: assignment.soldierId,
                                          draggedAssignmentId: dragState.draggedFromAssignmentId,
                                          targetAssignmentId: assignment.id,
                                        });
                                      }

                                      setDragState({
                                        draggedSoldierId: null,
                                        draggedFromAssignmentId: null,
                                        dropTargetPostId: null,
                                        dropTargetTimeSlotId: null,
                                        dropTargetAssignmentId: null,
                                        dropTargetSoldierId: null,
                                      });
                                    }}
                                    className={`px-2 py-1 rounded text-xs cursor-pointer select-none transition-all ${isDropTarget
                                      ? 'ring-2 ring-green-400 bg-green-600 text-white'
                                      : isHighlighted
                                        ? 'bg-yellow-500 text-black font-bold shadow-lg transform'
                                        : hasWarning
                                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                                          : getSoldierGroupColor(assignment.soldierId)
                                            ? 'text-white'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                      }`}
                                    style={{
                                      backgroundColor: !isDropTarget && !isHighlighted && !hasWarning && getSoldierGroupColor(assignment.soldierId)
                                        ? getSoldierGroupColor(assignment.soldierId)
                                        : undefined
                                    }}
                                    title={
                                      isDropTarget
                                        ? 'שחרר כאן כדי להחליף עם חייל זה'
                                        : isHighlighted
                                          ? 'לחץ לביטול הדגשה'
                                          : hasWarning
                                            ? 'התראת מנוחה - לחץ להדגשת כל השיבוצים'
                                            : 'לחץ להדגשת כל השיבוצים של החייל'
                                    }
                                  >
                                    {soldier?.name || 'לא ידוע'}
                                    {hasWarning && ' ⚠️'}
                                    {isHighlighted && ' ★'}
                                    {isHighlighted && restSlots > 0 && ` (${(restSlots * schedule.config.timeSlotDuration) / 60} שעות מנוחה)`}
                                  </div>
                                );
                              })}

                              {/* Empty slots indicators */}
                              {Array.from({ length: Math.max(0, post.requiredGuards - assignments.length) }).map((_, index) => (
                                <div
                                  key={`empty-${index}`}
                                  className="px-2 py-1 rounded text-xs border border-dashed border-slate-500 text-slate-400"
                                >
                                  ריק
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 text-center">לא פעיל</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Context Menu */}
      {assignmentContextMenu && (
        <div
          className="fixed bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-50 py-2"
          style={{ left: assignmentContextMenu.x, top: assignmentContextMenu.y }}
        >
          <button
            onClick={handleRemoveFromSlot}
            className="block w-full px-4 py-2 text-right text-sm hover:bg-slate-600 transition-colors"
          >
            הסר ממשמרת זו
          </button>
          <button
            onClick={handleRemoveFromAll}
            className="block w-full px-4 py-2 text-right text-sm text-red-400 hover:bg-slate-600 transition-colors"
          >
            הסר מכל המשמרות
          </button>
        </div>
      )}

      {/* Time Slot Context Menu */}
      {timeSlotContextMenu && (
        <div
          className="fixed bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-50 py-2"
          style={{ left: timeSlotContextMenu.x, top: timeSlotContextMenu.y }}
        >

          <button
            onClick={handleAddTimeSlotAbove}
            className="block w-full px-4 py-2 text-right text-sm hover:bg-slate-600 transition-colors"
          >
            הוסף משמרת מעל
          </button>

          <button
            onClick={handleAddTimeSlotBelow}
            className="block w-full px-4 py-2 text-right text-sm hover:bg-slate-600 transition-colors"
          >
            הוסף משמרת מתחת
          </button>

          <button
            onClick={handleClearTimeSlot}
            className="block w-full px-4 py-2 text-right text-sm hover:bg-slate-600 transition-colors"
          >
            נקה משמרת
          </button>

          <button
            onClick={handleRemoveTimeSlot}
            className="block w-full px-4 py-2 text-right text-sm text-red-400 hover:bg-slate-600 transition-colors"
          >
            מחק משמרת
          </button>

        </div>
      )
      }

      {/* Swap Modal */}
      <SwapModal
        isOpen={swapModal.isOpen}
        onClose={() => setSwapModal({ ...swapModal, isOpen: false })}
        schedule={schedule}
        draggedSoldierId={swapModal.draggedSoldierId}
        targetSoldierId={swapModal.targetSoldierId}
        draggedAssignmentId={swapModal.draggedAssignmentId}
        targetAssignmentId={swapModal.targetAssignmentId}
        onUpdateSchedule={onUpdateSchedule}
      />
    </div>
  );
} 