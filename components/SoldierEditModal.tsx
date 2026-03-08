'use client';

import { useState, useEffect } from 'react';
import { Soldier, Group, Role, UnavailabilityPeriod } from '@/types';
import { generateId } from '@/lib/utils';

interface SoldierEditModalProps {
  isOpen: boolean;
  soldier?: Soldier | null;
  groups: Group[];
  roles: Role[];
  onClose: () => void;
  onSave: (soldier: Soldier) => void;
}

export default function SoldierEditModal({
  isOpen,
  soldier,
  groups,
  roles,
  onClose,
  onSave
}: SoldierEditModalProps) {
  const [soldierName, setSoldierName] = useState('');
  const [soldierGroupId, setSoldierGroupId] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [unavailability, setUnavailability] = useState<UnavailabilityPeriod[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (soldier) {
        setSoldierName(soldier.name);
        setSoldierGroupId(soldier.groupId || '');
        setIsAvailable(soldier.isAvailable);
        setSelectedRoleIds(soldier.roleIds || []);
        setUnavailability(soldier.unavailability || []);
      } else {
        setSoldierName('');
        setSoldierGroupId('');
        setIsAvailable(true);
        setSelectedRoleIds([]);
        setUnavailability([]);
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
      roleIds: selectedRoleIds,
      groupId: soldierGroupId || undefined,
      unavailability,
    };

    onSave(soldierData);
    onClose();
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const addUnavailabilityPeriod = () => {
    setUnavailability(prev => [
      ...prev,
      { id: generateId(), startTime: '00:00', endTime: '06:00', reason: '' },
    ]);
  };

  const updateUnavailabilityPeriod = (id: string, updates: Partial<UnavailabilityPeriod>) => {
    setUnavailability(prev =>
      prev.map(p => p.id === id ? { ...p, ...updates } : p)
    );
  };

  const removeUnavailabilityPeriod = (id: string) => {
    setUnavailability(prev => prev.filter(p => p.id !== id));
  };

  const getGroupById = (groupId?: string) => groups.find(g => g.id === groupId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-6 text-center">
          {soldier ? 'ערוך חייל' : 'הוסף חייל חדש'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Soldier Name */}
          <div>
            <label className="block text-sm font-medium mb-2">שם החייל</label>
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

          {/* Role Selection */}
          {roles.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">תפקידים</label>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                      selectedRoleIds.includes(role.id)
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {role.name}
                  </button>
                ))}
              </div>
              {selectedRoleIds.length === 0 && (
                <p className="text-xs text-yellow-400 mt-1">מומלץ לבחור לפחות תפקיד אחד</p>
              )}
            </div>
          )}

          {/* Group Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">קבוצה (אופציונלי)</label>
            <select
              value={soldierGroupId}
              onChange={(e) => setSoldierGroupId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">ללא קבוצה</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
            {soldierGroupId && (
              <div className="mt-2 flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getGroupById(soldierGroupId)?.color }}
                />
                <span className="text-sm text-slate-400">
                  {getGroupById(soldierGroupId)?.name}
                </span>
              </div>
            )}
          </div>

          {/* Availability */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm font-medium">החייל זמין לשיבוץ</span>
            </label>
            <p className="text-xs text-slate-400 mt-1 mr-7">
              חיילים לא זמינים לא יופיעו באפשרויות השיבוץ
            </p>
          </div>

          {/* Unavailability Periods */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">תקופות אי-זמינות</label>
              <button
                type="button"
                onClick={addUnavailabilityPeriod}
                className="px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs transition-colors"
              >
                + הוסף תקופה
              </button>
            </div>

            {unavailability.length === 0 ? (
              <p className="text-xs text-slate-400">אין תקופות אי-זמינות מוגדרות</p>
            ) : (
              <div className="space-y-3">
                {unavailability.map((period) => (
                  <div key={period.id} className="bg-slate-700 p-3 rounded-lg border border-slate-600 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">משעה</label>
                        <input
                          type="time"
                          value={period.startTime}
                          onChange={(e) => updateUnavailabilityPeriod(period.id, { startTime: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">עד שעה</label>
                        <input
                          type="time"
                          value={period.endTime}
                          onChange={(e) => updateUnavailabilityPeriod(period.id, { endTime: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={period.reason || ''}
                        onChange={(e) => updateUnavailabilityPeriod(period.id, { reason: e.target.value })}
                        className="flex-1 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="סיבה (אופציונלי)"
                      />
                      <button
                        type="button"
                        onClick={() => removeUnavailabilityPeriod(period.id)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors"
                      >
                        הסר
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
