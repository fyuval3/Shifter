'use client';

import { useState, useEffect } from 'react';
import { Soldier, Group, GROUP_COLORS } from '@/types';
import { generateId } from '@/lib/utils';

interface SoldierEditModalProps {
  isOpen: boolean;
  soldier?: Soldier | null; // null for adding new soldier, Soldier for editing
  groups: Group[];
  onClose: () => void;
  onSave: (soldier: Soldier) => void;
}

export default function SoldierEditModal({ 
  isOpen, 
  soldier, 
  groups, 
  onClose, 
  onSave 
}: SoldierEditModalProps) {
  const [soldierName, setSoldierName] = useState('');
  const [soldierGroupId, setSoldierGroupId] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState(true);

  // Reset form when modal opens/closes or soldier changes
  useEffect(() => {
    if (isOpen) {
      if (soldier) {
        // Editing existing soldier
        setSoldierName(soldier.name);
        setSoldierGroupId(soldier.groupId || '');
        setIsAvailable(soldier.isAvailable);
      } else {
        // Adding new soldier
        setSoldierName('');
        setSoldierGroupId('');
        setIsAvailable(true);
      }
    }
  }, [isOpen, soldier]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!soldierName.trim()) return;

    const soldierData: Soldier = {
      id: soldier?.id || generateId(),
      name: soldierName.trim(),
      isAvailable,
      groupId: soldierGroupId || undefined,
    };

    onSave(soldierData);
    onClose();
  };

  const getGroupById = (groupId?: string) => groups.find(g => g.id === groupId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 w-full max-w-md mx-4">
        <h3 className="text-xl font-semibold mb-6 text-center">
          {soldier ? 'ערוך חייל' : 'הוסף חייל חדש'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Soldier Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              שם החייל
            </label>
            <input
              type="text"
              value={soldierName}
              onChange={(e) => setSoldierName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="הכנס שם חייל"
              required
              autoFocus
            />
          </div>

          {/* Group Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              קבוצה (אופציונלי)
            </label>
            <select
              value={soldierGroupId}
              onChange={(e) => setSoldierGroupId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">ללא קבוצה</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            {soldierGroupId && (
              <div className="mt-2 flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: getGroupById(soldierGroupId)?.color }}
                ></div>
                <span className="text-sm text-slate-400">
                  {getGroupById(soldierGroupId)?.name}
                </span>
              </div>
            )}
          </div>

          {/* Availability Checkbox */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm font-medium">
                החייל זמין לשיבוץ
              </span>
            </label>
            <p className="text-xs text-slate-400 mt-1 mr-7">
              חיילים לא זמינים לא יופיעו באפשרויות השיבוץ
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
            >
              {soldier ? 'עדכן' : 'הוסף'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors font-medium"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 