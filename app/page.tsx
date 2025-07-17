'use client';

import { useState, useEffect } from 'react';
import { Schedule, Post, Soldier, TimeSlotDuration } from '@/types';
import { getCurrentSchedule, saveSchedule, setCurrentSchedule } from '@/lib/storage';
import { generateId, generateTimeSlots } from '@/lib/utils';
import PostsManager from '../components/PostsManager';
import SoldiersManager from '../components/SoldiersManager';
import ScheduleTable from '../components/ScheduleTable';
import ScheduleControls from '../components/ScheduleControls';
import ExportModal from '../components/ExportModal';
import SettingsModal from '../components/SettingsModal';

export default function Home() {
  const [currentSchedule, setCurrentScheduleState] = useState<Schedule | null>(null);
  const [activeTab, setActiveTab] = useState<'schedule' | 'posts' | 'soldiers'>('schedule');
  const [showExport, setShowExport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load current schedule on mount
  useEffect(() => {
    const schedule = getCurrentSchedule();
    if (schedule) {
      setCurrentScheduleState(schedule);
    } else {
      // Create a default schedule
      createDefaultSchedule();
    }
  }, []);

  const createDefaultSchedule = () => {
    const today = new Date().toISOString().split('T')[0];
    const schedule: Schedule = {
      id: generateId(),
      name: 'לוח זמנים חדש',
      config: {
        timeSlotDuration: 120, // 2 hours
        startDate: today,
        endDate: today,
        startTime: '21:00',
        endTime: '05:00',
      },
      posts: [],
      soldiers: [],
      groups: [],
      timeSlots: generateTimeSlots('21:00', '05:00', today, 120),
      assignments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveSchedule(schedule);
    setCurrentSchedule(schedule.id);
    setCurrentScheduleState(schedule);
  };

  const updateSchedule = (updates: Partial<Schedule>) => {
    if (!currentSchedule) return;

    const updatedSchedule = {
      ...currentSchedule,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    saveSchedule(updatedSchedule);
    setCurrentScheduleState(updatedSchedule);
  };

  const updateTimeSlotDuration = (duration: TimeSlotDuration) => {
    if (!currentSchedule) return;

    const newTimeSlots = generateTimeSlots(
      currentSchedule.config.startTime,
      currentSchedule.config.endTime,
      currentSchedule.config.startDate,
      duration
    );

    updateSchedule({
      config: { ...currentSchedule.config, timeSlotDuration: duration },
      timeSlots: newTimeSlots,
      assignments: [], // Clear assignments when changing time slots
    });
  };

  if (!currentSchedule) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">טוען...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-orbitron font-black bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent drop-shadow-lg tracking-wider animate-pulse">
            SHIFTER שיפטר
          </h1>
          
          <div className="flex gap-4">
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              הגדרות
            </button>
            
            <button
              onClick={() => setShowExport(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              ייצוא לוואטסאפ
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex gap-1 mt-4">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'schedule'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            לוח זמנים
          </button>
          
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'posts'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            ניהול עמדות
          </button>
          
          <button
            onClick={() => setActiveTab('soldiers')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'soldiers'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            ניהול חיילים
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <ScheduleControls
              schedule={currentSchedule}
              onUpdateSchedule={updateSchedule}
              onUpdateTimeSlotDuration={updateTimeSlotDuration}
            />
            
            <ScheduleTable
              schedule={currentSchedule}
              onUpdateSchedule={updateSchedule}
            />
          </div>
        )}

        {activeTab === 'posts' && (
          <PostsManager
            posts={currentSchedule.posts}
            onUpdatePosts={(posts) => updateSchedule({ posts })}
          />
        )}

        {activeTab === 'soldiers' && (
          <SoldiersManager
            soldiers={currentSchedule.soldiers}
            groups={currentSchedule.groups}
            onUpdateSoldiers={(soldiers) => updateSchedule({ soldiers })}
            onUpdateGroups={(groups) => updateSchedule({ groups })}
          />
        )}
      </main>

      {/* Modals */}
      {showSettings && (
        <SettingsModal
          schedule={currentSchedule}
          onClose={() => setShowSettings(false)}
          onUpdateSchedule={updateSchedule}
        />
      )}

      {showExport && (
        <ExportModal
          schedule={currentSchedule}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
