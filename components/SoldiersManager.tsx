'use client';

import { useState } from 'react';
import { Soldier, Group, Role, GROUP_COLORS, GroupColor } from '@/types';
import { generateId } from '@/lib/utils';
import SoldierEditModal from './SoldierEditModal';

interface SoldiersManagerProps {
  soldiers: Soldier[];
  groups: Group[];
  roles: Role[];
  onUpdateSoldiersOrGroups: (soldiers: Soldier[], groups: Group[]) => void;
}

interface DragState {
  draggedSoldierId: string | null;
  dropTargetSoldierId: string | null;
  dropTargetGroupId: string | null;
  draggedGroupId: string | null;
  dropTargetGroupForReorder: string | null;
}

export default function SoldiersManager({ soldiers, groups, roles, onUpdateSoldiersOrGroups }: SoldiersManagerProps) {
  // Soldier modal state
  const [soldierModal, setSoldierModal] = useState<{
    isOpen: boolean;
    soldier: Soldier | null;
  }>({
    isOpen: false,
    soldier: null,
  });
  
  // Group management state
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupColor, setGroupColor] = useState<GroupColor>(GROUP_COLORS[0]);
  const [dragState, setDragState] = useState<DragState>({
    draggedSoldierId: null,
    dropTargetSoldierId: null,
    dropTargetGroupId: null,
    draggedGroupId: null,
    dropTargetGroupForReorder: null,
  });

  const resetGroupForm = () => {
    setGroupName('');
    setGroupColor(GROUP_COLORS[0]);
    setIsAddingGroup(false);
    setEditingGroup(null);
  };

  // Soldier modal handlers
  const openAddSoldierModal = () => {
    setSoldierModal({
      isOpen: true,
      soldier: null,
    });
  };

  const openEditSoldierModal = (soldier: Soldier) => {
    setSoldierModal({
      isOpen: true,
      soldier,
    });
  };

  const closeSoldierModal = () => {
    setSoldierModal({
      isOpen: false,
      soldier: null,
    });
  };

  const handleSaveSoldier = (soldierData: Soldier) => {
    if (soldierModal.soldier) {
      // Update existing soldier
      const updatedSoldiers = soldiers.map(s => s.id === soldierModal.soldier!.id ? soldierData : s);
      onUpdateSoldiersOrGroups(updatedSoldiers, groups);
    } else {
      // Add new soldier
      onUpdateSoldiersOrGroups([...soldiers, soldierData], groups);
    }
  };

  const handleDelete = (soldierId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק חייל זה?')) {
      const updatedSoldiers = soldiers.filter(s => s.id !== soldierId);

      onUpdateSoldiersOrGroups(updatedSoldiers, groups);
    }
  };

  const toggleAvailability = (soldierId: string) => {
    const updatedSoldiers = soldiers.map(s => 
      s.id === soldierId ? { ...s, isAvailable: !s.isAvailable } : s
    );
    onUpdateSoldiersOrGroups(updatedSoldiers, groups);
  };

  // Group management functions
  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) return;

    const groupData: Group = {
      id: editingGroup?.id || generateId(),
      name: groupName.trim(),
      color: groupColor,
    };

    if (editingGroup) {
      // Update existing group
      const updatedGroups = groups.map(g => g.id === editingGroup.id ? groupData : g);
      onUpdateSoldiersOrGroups(soldiers, updatedGroups);
    } else {
      // Add new group
      onUpdateSoldiersOrGroups(soldiers, [...groups, groupData]);
    }

    resetGroupForm();
  };

  const handleEditGroup = (group: Group) => {
    setGroupName(group.name);
    setGroupColor(group.color);
    setEditingGroup(group);
    setIsAddingGroup(true);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק קבוצה זו? חיילים בקבוצה יישארו ללא קבוצה.')) {
      // Remove group
      const updatedGroups = groups.filter(g => g.id !== groupId);
      
      // Remove group assignment from soldiers
      const updatedSoldiers = soldiers.map(s => 
        s.groupId === groupId ? { ...s, groupId: undefined } : s
      );

      onUpdateSoldiersOrGroups(updatedSoldiers, updatedGroups);
    }
  };

  const availableSoldiers = soldiers.filter(s => s.isAvailable);
  const unavailableSoldiers = soldiers.filter(s => !s.isAvailable);

  // Helper functions for group display
  const getGroupById = (groupId?: string) => groups.find(g => g.id === groupId);
  const getSoldiersByGroup = (groupId?: string) => soldiers.filter(s => s.groupId === groupId);
  const getUnassignedSoldiers = () => soldiers.filter(s => !s.groupId);
  const getRoleNames = (roleIds: string[]) =>
    roleIds.map(rid => roles.find(r => r.id === rid)?.name).filter(Boolean).join(', ');

  // Helper function to reset drag state
  const resetDragState = () => {
    setDragState({
      draggedSoldierId: null,
      dropTargetSoldierId: null,
      dropTargetGroupId: null,
      draggedGroupId: null,
      dropTargetGroupForReorder: null,
    });
  };

  // Drag and drop handlers for reordering
  const handleDragStart = (e: React.DragEvent, soldierId: string) => {
    setDragState({
      draggedSoldierId: soldierId,
      dropTargetSoldierId: null,
      dropTargetGroupId: null,
      draggedGroupId: null,
      dropTargetGroupForReorder: null,
    });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetSoldierId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (dragState.draggedSoldierId !== targetSoldierId) {
      setDragState(prev => ({
        ...prev,
        dropTargetSoldierId: targetSoldierId,
      }));
    }
  };

  const handleDragLeave = () => {
    setDragState(prev => ({
      ...prev,
      dropTargetSoldierId: null,
    }));
  };

  const handleDrop = (e: React.DragEvent, targetSoldierId: string) => {
    e.preventDefault();
    
    if (!dragState.draggedSoldierId || dragState.draggedSoldierId === targetSoldierId) {
      resetDragState();
      return;
    }

    // Find the indices of the soldiers to swap
    const draggedIndex = soldiers.findIndex(s => s.id === dragState.draggedSoldierId);
    const targetIndex = soldiers.findIndex(s => s.id === targetSoldierId);

    if (draggedIndex === -1 || targetIndex === -1) {
      resetDragState();
      return;
    }

    // Create new array with swapped positions
    const newSoldiers = [...soldiers];
    [newSoldiers[draggedIndex], newSoldiers[targetIndex]] = [newSoldiers[targetIndex], newSoldiers[draggedIndex]];

    onUpdateSoldiersOrGroups(newSoldiers, groups);
    
    resetDragState();
  };

  const handleDragEnd = () => {
    resetDragState();
  };

  // Group drag handlers
  const handleGroupDragOver = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (dragState.draggedSoldierId && dragState.dropTargetGroupId !== groupId) {
      setDragState(prev => ({
        ...prev,
        dropTargetGroupId: groupId,
      }));
    }
  };

  const handleGroupDragLeave = () => {
    setDragState(prev => ({
      ...prev,
      dropTargetGroupId: null,
    }));
  };

  const handleGroupDrop = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    
    if (!dragState.draggedSoldierId) {
      resetDragState();
      return;
    }

    // Update soldier's group assignment
    const updatedSoldiers = soldiers.map(s => 
      s.id === dragState.draggedSoldierId 
        ? { ...s, groupId } 
        : s
    );

    onUpdateSoldiersOrGroups(updatedSoldiers, groups);
    
    resetDragState();
  };

  // Group reordering handlers
  const handleGroupReorderDragStart = (e: React.DragEvent, groupId: string) => {
    setDragState(prev => ({
      ...prev,
      draggedGroupId: groupId,
      dropTargetGroupForReorder: null,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleGroupReorderDragOver = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (dragState.draggedGroupId && dragState.draggedGroupId !== targetGroupId) {
      setDragState(prev => ({
        ...prev,
        dropTargetGroupForReorder: targetGroupId,
      }));
    }
  };

  const handleGroupReorderDragLeave = () => {
    setDragState(prev => ({
      ...prev,
      dropTargetGroupForReorder: null,
    }));
  };

  const handleGroupReorderDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    
    if (!dragState.draggedGroupId || dragState.draggedGroupId === targetGroupId) {
      resetDragState();
      return;
    }

    // Find indices of groups to swap
    const draggedIndex = groups.findIndex(g => g.id === dragState.draggedGroupId);
    const targetIndex = groups.findIndex(g => g.id === targetGroupId);

    if (draggedIndex === -1 || targetIndex === -1) {
      resetDragState();
      return;
    }

    // Create new array with swapped positions
    const newGroups = [...groups];
    [newGroups[draggedIndex], newGroups[targetIndex]] = [newGroups[targetIndex], newGroups[draggedIndex]];

    onUpdateSoldiersOrGroups(soldiers, newGroups);
    resetDragState();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ניהול חיילים</h2>
        <button
          onClick={openAddSoldierModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          הוסף חייל חדש
        </button>
      </div>



      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="font-semibold text-lg text-blue-300">סה&quot;כ חיילים</h3>
          <p className="text-2xl font-bold">{soldiers.length}</p>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="font-semibold text-lg text-green-400">זמינים</h3>
          <p className="text-2xl font-bold">{availableSoldiers.length}</p>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="font-semibold text-lg text-red-400">לא זמינים</h3>
          <p className="text-2xl font-bold">{unavailableSoldiers.length}</p>
        </div>
      </div>

      {/* Group Management */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">ניהול קבוצות</h3>
          <button
            onClick={() => setIsAddingGroup(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            הוסף קבוצה חדשה
          </button>
        </div>

        {/* Add/Edit Group Form */}
        {isAddingGroup && (
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="text-xl font-semibold mb-4">
              {editingGroup ? 'ערוך קבוצה' : 'הוסף קבוצה חדשה'}
            </h3>
            
            <form onSubmit={handleGroupSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  שם הקבוצה
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="הכנס שם קבוצה"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  צבע הקבוצה
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {GROUP_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setGroupColor(color)}
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        groupColor === color ? 'border-white ring-2 ring-blue-500' : 'border-slate-600'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>



              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  {editingGroup ? 'עדכן' : 'הוסף'}
                </button>
                <button
                  type="button"
                  onClick={resetGroupForm}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Groups List */}
        {groups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => {
              const groupSoldiers = getSoldiersByGroup(group.id);
              const isDropTarget = dragState.dropTargetGroupId === group.id;
              const isReorderDropTarget = dragState.dropTargetGroupForReorder === group.id;
              const isDragging = dragState.draggedGroupId === group.id;
              
              return (
                <div
                  key={group.id}
                  draggable
                  onDragStart={(e) => handleGroupReorderDragStart(e, group.id)}
                  onDragOver={(e) => {
                    // Handle both soldier assignment and group reordering
                    if (dragState.draggedSoldierId) {
                      handleGroupDragOver(e, group.id);
                    } else if (dragState.draggedGroupId) {
                      handleGroupReorderDragOver(e, group.id);
                    }
                  }}
                  onDragLeave={() => {
                    handleGroupDragLeave();
                    handleGroupReorderDragLeave();
                  }}
                  onDrop={(e) => {
                    if (dragState.draggedSoldierId) {
                      handleGroupDrop(e, group.id);
                    } else if (dragState.draggedGroupId) {
                      handleGroupReorderDrop(e, group.id);
                    }
                  }}
                  onDragEnd={resetDragState}
                  className={`bg-slate-800 p-4 rounded-lg border-2 transition-all cursor-move ${
                    isDragging 
                      ? 'opacity-50 scale-105'
                      : isReorderDropTarget
                      ? 'border-blue-500 bg-blue-900/20 shadow-lg'
                      : isDropTarget 
                      ? 'border-yellow-500 bg-yellow-900/20 shadow-lg' 
                      : 'border-slate-700'
                  }`}
                  title={
                    dragState.draggedSoldierId 
                      ? 'גרור חייל לכאן כדי להקצותו לקבוצה' 
                      : dragState.draggedGroupId
                      ? 'גרור קבוצה לכאן כדי להחליף מקומות'
                      : 'גרור כדי לשנות סדר קבוצות או גרור חייל לכאן'
                  }
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      className="w-6 h-6 rounded-full" 
                      style={{ backgroundColor: group.color }}
                    ></div>
                    <h4 className="font-semibold">{group.name}</h4>
                    {isDropTarget && (
                      <span className="text-yellow-400 text-sm">← הקצה חייל</span>
                    )}
                    {isReorderDropTarget && (
                      <span className="text-blue-400 text-sm">↔ החלף מקומות</span>
                    )}
                  </div>
                  
                  <p className="text-sm text-slate-300 mb-3">
                    {groupSoldiers.length} חיילים בקבוצה
                  </p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditGroup(group)}
                      className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm transition-colors"
                    >
                      ערוך
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                    >
                      מחק
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Soldiers Grouped by Groups */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">ניהול חיילים לפי קבוצות</h3>
          <p className="text-sm text-slate-400">גרור חייל על אחר כדי להחליף מקומות | גרור חייל על קבוצה להקצאה</p>
        </div>

        {/* Soldiers by Groups */}
        {groups.map((group) => {
          const groupSoldiers = getSoldiersByGroup(group.id);
          if (groupSoldiers.length === 0) return null;
          
          return (
            <div key={group.id} className="space-y-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-5 h-5 rounded-full" 
                  style={{ backgroundColor: group.color }}
                ></div>
                <h4 className="text-lg font-semibold">{group.name}</h4>
                <span className="text-sm text-slate-400">({groupSoldiers.length} חיילים)</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupSoldiers.map((soldier) => {
                  const isDragTarget = dragState.dropTargetSoldierId === soldier.id;
                  const isDragging = dragState.draggedSoldierId === soldier.id;
                  
                  return (
                    <div
                      key={soldier.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, soldier.id)}
                      onDragOver={(e) => handleDragOver(e, soldier.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, soldier.id)}
                      onDragEnd={handleDragEnd}
                      className={`bg-slate-800 p-4 rounded-lg border-2 flex justify-between items-center cursor-move transition-all ${
                        isDragging ? 'opacity-50 scale-105' : ''
                      } ${isDragTarget ? 'border-blue-500 bg-blue-900/20' : ''} ${
                        !soldier.isAvailable ? 'opacity-60' : ''
                      }`}
                      style={{
                        borderColor: !isDragTarget ? group.color : undefined
                      }}
                      title="גרור כדי לשנות סדר או על קבוצה להעברה"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: group.color }}
                          ></div>
                          <h4 className="font-semibold">{soldier.name}</h4>
                        </div>
                        {soldier.roleIds.length > 0 && (
                          <p className="text-xs text-slate-400 mb-1">{getRoleNames(soldier.roleIds)}</p>
                        )}
                        <span className={`text-sm ${soldier.isAvailable ? 'text-green-400' : 'text-red-400'}`}>
                          {soldier.isAvailable ? 'זמין' : 'לא זמין'}
                        </span>
                        {soldier.unavailability?.length > 0 && (
                          <p className="text-xs text-orange-400 mt-0.5">
                            {soldier.unavailability.length} תקופות אי-זמינות
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => openEditSoldierModal(soldier)}
                          className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm transition-colors"
                        >
                          ערוך
                        </button>
                        <button
                          onClick={() => handleDelete(soldier.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                        >
                          מחק
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Unassigned Soldiers */}
        {getUnassignedSoldiers().length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-slate-500"></div>
              <h4 className="text-lg font-semibold text-slate-400">ללא קבוצה</h4>
              <span className="text-sm text-slate-400">({getUnassignedSoldiers().length} חיילים)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getUnassignedSoldiers().map((soldier) => {
                const isDragTarget = dragState.dropTargetSoldierId === soldier.id;
                const isDragging = dragState.draggedSoldierId === soldier.id;

                return (
                  <div
                    key={soldier.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, soldier.id)}
                    onDragOver={(e) => handleDragOver(e, soldier.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, soldier.id)}
                    onDragEnd={handleDragEnd}
                    className={`bg-slate-800 p-4 rounded-lg border-2 border-slate-600 flex justify-between items-center cursor-move transition-all ${
                      isDragging ? 'opacity-50 scale-105' : ''
                    } ${isDragTarget ? 'border-blue-500 bg-blue-900/20' : ''} ${
                      !soldier.isAvailable ? 'opacity-60' : ''
                    }`}
                    title="גרור כדי לשנות סדר או על קבוצה להעברה"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-full bg-slate-500 flex-shrink-0"></div>
                        <h4 className="font-semibold">{soldier.name}</h4>
                      </div>
                      {soldier.roleIds.length > 0 && (
                        <p className="text-xs text-slate-400 mb-1">{getRoleNames(soldier.roleIds)}</p>
                      )}
                      <span className={`text-sm ${soldier.isAvailable ? 'text-green-400' : 'text-red-400'}`}>
                        {soldier.isAvailable ? 'זמין' : 'לא זמין'}
                      </span>
                      {soldier.unavailability?.length > 0 && (
                        <p className="text-xs text-orange-400 mt-0.5">
                          {soldier.unavailability.length} תקופות אי-זמינות
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEditSoldierModal(soldier)}
                        className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm transition-colors"
                      >
                        ערוך
                      </button>
                      <button
                        onClick={() => handleDelete(soldier.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                      >
                        מחק
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {soldiers.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <h3 className="text-xl font-semibold mb-2">אין חיילים</h3>
            <p>הוסף חיילים כדי להתחיל לנהל את הלוח זמנים</p>
          </div>
        )}
      </div>

      {/* Soldier Edit Modal */}
      <SoldierEditModal
        isOpen={soldierModal.isOpen}
        soldier={soldierModal.soldier}
        groups={groups}
        roles={roles}
        onClose={closeSoldierModal}
        onSave={handleSaveSoldier}
      />
    </div>
  );
} 