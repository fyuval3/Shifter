'use client';

import { useState } from 'react';
import { Role, Soldier, Post } from '@/types';
import { generateId } from '@/lib/utils';

interface RolesManagerProps {
  roles: Role[];
  soldiers: Soldier[];
  posts: Post[];
  onUpdateRoles: (roles: Role[]) => void;
}

export default function RolesManager({ roles, soldiers, posts, onUpdateRoles }: RolesManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');

  const resetForm = () => {
    setRoleName('');
    setIsAdding(false);
    setEditingRole(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    const roleData: Role = {
      id: editingRole?.id || generateId(),
      name: roleName.trim(),
    };

    if (editingRole) {
      const updatedRoles = roles.map(r => r.id === editingRole.id ? roleData : r);
      onUpdateRoles(updatedRoles);
    } else {
      onUpdateRoles([...roles, roleData]);
    }

    resetForm();
  };

  const handleEdit = (role: Role) => {
    setRoleName(role.name);
    setEditingRole(role);
    setIsAdding(true);
  };

  const getRoleUsage = (roleId: string) => {
    const usedBySoldiers = soldiers.filter(s => s.roleIds.includes(roleId));
    const usedByPosts = posts.filter(p => p.eligibleRoleIds.includes(roleId));
    return { usedBySoldiers, usedByPosts };
  };

  const handleDelete = (roleId: string) => {
    const { usedBySoldiers, usedByPosts } = getRoleUsage(roleId);
    const role = roles.find(r => r.id === roleId);

    if (usedBySoldiers.length > 0 || usedByPosts.length > 0) {
      const parts: string[] = [];
      if (usedBySoldiers.length > 0) {
        parts.push(`${usedBySoldiers.length} חיילים (${usedBySoldiers.map(s => s.name).join(', ')})`);
      }
      if (usedByPosts.length > 0) {
        parts.push(`${usedByPosts.length} עמדות (${usedByPosts.map(p => p.name).join(', ')})`);
      }

      if (!window.confirm(
        `התפקיד "${role?.name}" בשימוש על ידי:\n${parts.join('\n')}\n\nהתפקיד יוסר מכל הישויות האלה. להמשיך?`
      )) {
        return;
      }
    } else {
      if (!window.confirm(`האם אתה בטוח שברצונך למחוק את התפקיד "${role?.name}"?`)) {
        return;
      }
    }

    onUpdateRoles(roles.filter(r => r.id !== roleId));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ניהול תפקידים</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          הוסף תפקיד חדש
        </button>
      </div>

      {isAdding && (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h3 className="text-xl font-semibold mb-4">
            {editingRole ? 'ערוך תפקיד' : 'הוסף תפקיד חדש'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">שם התפקיד</label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder='לדוגמה: חייל רגיל, מפקד, חובש'
                required
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {editingRole ? 'עדכן' : 'הוסף'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {roles.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            אין תפקידים. הוסף תפקיד חדש כדי להתחיל.
          </div>
        ) : (
          roles.map((role) => {
            const { usedBySoldiers, usedByPosts } = getRoleUsage(role.id);
            return (
              <div
                key={role.id}
                className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold text-lg">{role.name}</h3>
                  <p className="text-slate-400 text-sm">
                    {usedBySoldiers.length} חיילים &middot; {usedByPosts.length} עמדות
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(role)}
                    className="px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded transition-colors"
                  >
                    ערוך
                  </button>
                  <button
                    onClick={() => handleDelete(role.id)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                  >
                    מחק
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
