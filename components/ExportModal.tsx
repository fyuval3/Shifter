'use client';

import { useState } from 'react';
import { Schedule, ExportFormat } from '@/types';
import { getAssignmentsForSlotAndPost, isPostActiveAtTime } from '@/lib/utils';

interface ExportModalProps {
  schedule: Schedule;
  onClose: () => void;
}

export default function ExportModal({ schedule, onClose }: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('time-first');
  const [includeHeaders, setIncludeHeaders] = useState(false);
  const [includeEmptySlots, setIncludeEmptySlots] = useState(false);
  const [shifterCredit, setShifterCredit] = useState(true);
  const [includeEndTime, setIncludeEndTime] = useState(false);
  const [exportText, setExportText] = useState('');

  const generateExport = () => {
    let text = '';
    
    if (includeHeaders) {
      text += `🛡️ לוח זמנים: ${schedule.name}\n`;
      text += `⏰ ${schedule.config.startTime} - ${schedule.config.endTime}\n\n`;
    }

    if (exportFormat === 'time-first') {
      // Time-first format: organize by time slots
      for (const timeSlot of schedule.timeSlots) {
        const hasAssignments = schedule.assignments.some(a => a.timeSlotId === timeSlot.id);
        
        if (!includeEmptySlots && !hasAssignments) continue;
        
        
        if (includeEndTime) {
          text += `🕐 ${timeSlot.startTime} - ${timeSlot.endTime}\n`;
        }
        else {
          text += `🕐 ${timeSlot.startTime}\n`;
        }
        
        for (const post of schedule.posts) {
          if (!isPostActiveAtTime(post, timeSlot.startTime)) continue;
          
          const assignments = getAssignmentsForSlotAndPost(
            schedule.assignments,
            timeSlot.id,
            post.id
          );
          
          const soldierNames = assignments.map(a => {
            const soldier = schedule.soldiers.find(s => s.id === a.soldierId);
            return soldier?.name || 'לא ידוע';
          });
          
          if (soldierNames.length > 0) {
            text += `  • ${post.name}: ${soldierNames.join(' + ')}\n`;
          } else if (includeEmptySlots) {
            text += `  • ${post.name}: ריק\n`;
          }
        }
        
        text += '\n';
      }
    } else {
      // Post-first format: organize by posts
      for (const post of schedule.posts) {
        text += `🎯 ${post.name}\n`;
        text += `└─ ${post.requiredGuards} שומרים נדרשים`;
        
        if (post.activeHours) {
          text += ` (${post.activeHours.start} - ${post.activeHours.end})`;
        }
        text += '\n\n';
        
        for (const timeSlot of schedule.timeSlots) {
          if (!isPostActiveAtTime(post, timeSlot.startTime)) continue;
          
          const assignments = getAssignmentsForSlotAndPost(
            schedule.assignments,
            timeSlot.id,
            post.id
          );
          
          const soldierNames = assignments.map(a => {
            const soldier = schedule.soldiers.find(s => s.id === a.soldierId);
            return soldier?.name || 'לא ידוע';
          });
          
          if (soldierNames.length > 0) {
            text += `  • ${timeSlot.startTime}: ${soldierNames.join(' + ')}\n`;
          } else if (includeEmptySlots) {
            text += `  • ${timeSlot.startTime}: ריק\n`;
          }
        }
        
        text += '\n';
      }
    }

    // Add summary
    const totalAssignments = schedule.assignments.length;
    const totalSoldiers = schedule.soldiers.filter(s => s.isAvailable).length;
    const totalSlots = schedule.timeSlots.length;
    const totalPosts = schedule.posts.length;

    if (includeHeaders) {
      text += '📊 סיכום:\n';
      text += `• סה"כ שיבוצים: ${totalAssignments}\n`;
      text += `• חיילים זמינים: ${totalSoldiers}\n`;
      text += `• משמרות: ${totalSlots}\n`;
      text += `• עמדות: ${totalPosts}\n\n`;
    }

    if (shifterCredit) {
      text += '*_🚀 נוצר ע"י Shifter_*';
    }

    setExportText(text);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
    } catch (err) {
      alert('שגיאה בהעתקה. נסה להעתיק ידנית.');
    }
  };

  const shareToWhatsApp = () => {
    const encodedText = encodeURIComponent(exportText);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">ייצוא לוואטסאפ</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Export Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">הגדרות ייצוא</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  פורמט ייצוא
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="time-first">לפי זמן (זמן ← עמדות)</option>
                  <option value="post-first">לפי עמדה (עמדה ← זמנים)</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={includeHeaders}
                    onChange={(e) => setIncludeHeaders(e.target.checked)}
                    className="rounded"
                  />
                  <span className='mx-2'>כלול כותרות וסיכום</span>
                </label>

                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={includeEmptySlots}
                    onChange={(e) => setIncludeEmptySlots(e.target.checked)}
                    className="rounded"
                  />
                  <span className='mx-2'>כלול משמרות ריקות</span>
                </label>

                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={includeEndTime}
                    onChange={(e) => setIncludeEndTime(e.target.checked)}
                    className="rounded"
                  />
                  <span className='mx-2'>כלול זמן סיום משמרת</span>
                </label>

                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={shifterCredit}
                    onChange={(e) => setShifterCredit(e.target.checked)}
                    className="rounded"
                  />
                  <span className='mx-2'>קרדיט ל- Shifter 😊</span>
                </label>

                
              </div>

              <div className="flex gap-3">
                <button
                  onClick={generateExport}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  צור ייצוא
                </button>
                
                {exportText && (
                  <>
                    <button
                      onClick={copyToClipboard}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      העתק
                    </button>
                    
                    <button
                      onClick={shareToWhatsApp}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                    >
                      שתף בוואטסאפ
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Export Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">תצוגה מקדימה</h3>
              
              {exportText ? (
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-600 max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap text-slate-200 font-mono">
                    {exportText}
                  </pre>
                </div>
              ) : (
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-600 text-center text-slate-400">
                  לחץ על &quot;צור ייצוא&quot; כדי לראות תצוגה מקדימה
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
            >
              סגור
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 