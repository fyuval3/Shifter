'use client';

import { Schedule, Assignment } from '@/types';
import { generateId, removeSoldierFromAllAssignments } from '@/lib/utils';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule;
  draggedSoldierId: string;
  targetSoldierId: string;
  draggedAssignmentId: string;
  targetAssignmentId: string;
  onUpdateSchedule: (updates: Partial<Schedule>) => void;
}

export default function SwapModal({
  isOpen,
  onClose,
  schedule,
  draggedSoldierId,
  targetSoldierId,
  draggedAssignmentId,
  targetAssignmentId,
  onUpdateSchedule,
}: SwapModalProps) {
  if (!isOpen) return null;

  const draggedSoldier = schedule.soldiers.find(s => s.id === draggedSoldierId);
  const targetSoldier = schedule.soldiers.find(s => s.id === targetSoldierId);
  const draggedAssignment = schedule.assignments.find(a => a.id === draggedAssignmentId);
  const targetAssignment = schedule.assignments.find(a => a.id === targetAssignmentId);

  const handleSingleSwap = () => {
    if (!draggedAssignment || !targetAssignment) return;

    const newAssignments = schedule.assignments.map(assignment => {
      if (assignment.id === draggedAssignmentId) {
        return { ...assignment, soldierId: targetSoldierId };
      }
      if (assignment.id === targetAssignmentId) {
        return { ...assignment, soldierId: draggedSoldierId };
      }
      return assignment;
    });

    onUpdateSchedule({ assignments: newAssignments });
    onClose();
  };

  const handleFullSwap = () => {
    // Replace all occurrences of draggedSoldierId with targetSoldierId and vice versa
    const newAssignments = schedule.assignments.map(assignment => {
      if (assignment.soldierId === draggedSoldierId) {
        return { ...assignment, soldierId: targetSoldierId };
      }
      if (assignment.soldierId === targetSoldierId) {
        return { ...assignment, soldierId: draggedSoldierId };
      }
      return assignment;
    });

    onUpdateSchedule({ assignments: newAssignments });
    onClose();
  };

  const draggedPost = schedule.posts.find(p => p.id === draggedAssignment?.postId);
  const targetPost = schedule.posts.find(p => p.id === targetAssignment?.postId);
  const draggedTimeSlot = schedule.timeSlots.find(t => t.id === draggedAssignment?.timeSlotId);
  const targetTimeSlot = schedule.timeSlots.find(t => t.id === targetAssignment?.timeSlotId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-md w-full border border-slate-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-blue-300">החלפת חיילים</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-slate-900 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-400 mb-2">חיילים המעורבים:</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-300">{draggedSoldier?.name}</span>
                  <span className="text-slate-400">
                    {draggedPost?.name} - {draggedTimeSlot?.startTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-300">{targetSoldier?.name}</span>
                  <span className="text-slate-400">
                    {targetPost?.name} - {targetTimeSlot?.startTime}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-slate-300 text-sm">
              בחר את סוג ההחלפה שברצונך לבצע:
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSingleSwap}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-right"
            >
              <div className="font-semibold">החלפה חלקית</div>
              <div className="text-sm text-blue-200">
                החלף רק את השיבוצים הספציפיים הללו
              </div>
            </button>

            <button
              onClick={handleFullSwap}
              className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-right"
            >
              <div className="font-semibold">החלפה מלאה</div>
              <div className="text-sm text-purple-200">
                החלף את כל השיבוצים בין שני החיילים
              </div>
            </button>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 