'use client';

import { useState } from 'react';
import { Schedule, TimeSlotDuration } from '@/types';
import { generateTimeSlots } from '@/lib/utils';

interface SettingsModalProps {
  schedule: Schedule;
  onClose: () => void;
  onUpdateSchedule: (updates: Partial<Schedule>) => void;
  onUpdateTimeSlotDuration: (duration: TimeSlotDuration) => void;
}

export default function SettingsModal({ schedule, onClose, onUpdateSchedule, onUpdateTimeSlotDuration }: SettingsModalProps) {
  const [formData, setFormData] = useState({
    name: schedule.name,
    timeSlotDuration: schedule.config.timeSlotDuration,
    startTime: schedule.config.startTime,
    endTime: schedule.config.endTime
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newTimeSlots = generateTimeSlots(
      formData.startTime,
      formData.endTime,
      schedule.config.timeSlotDuration
    );

    onUpdateSchedule({
      config: {
        ...schedule.config,
        timeSlotDuration: formData.timeSlotDuration,
        startTime: formData.startTime,
        endTime: formData.endTime,
      },
      timeSlots: newTimeSlots,
      assignments: [], // Clear assignments when changing schedule times
    });

    if (formData.timeSlotDuration !== schedule.config.timeSlotDuration) {
      onUpdateTimeSlotDuration(formData.timeSlotDuration);
    }

    onClose();
  };

  const durations: { value: TimeSlotDuration; label: string }[] = [
    { value: 30, label: 'חצי שעה' },
    { value: 60, label: 'שעה' },
    { value: 120, label: 'שעתיים' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">הגדרות לוח זמנים</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                אורך משמרת
              </label>
              <select
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                value={formData.timeSlotDuration}
                onChange={(e) => setFormData({ ...formData, timeSlotDuration: +e.target.value as TimeSlotDuration })}
              >
                {durations.map(duration => (
                  <option key={duration.value} value={duration.value}>
                    {duration.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  שעת התחלה
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  שעת סיום
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <p className="text-yellow-300 text-sm">
                <strong>אזהרה:</strong> שינוי הגדרות הזמן ימחק את כל השיבוצים הקיימים.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                שמור שינויים
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 