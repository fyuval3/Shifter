'use client';

import { useState } from 'react';
import { Post, Role } from '@/types';
import { generateId } from '@/lib/utils';

interface PostsManagerProps {
  posts: Post[];
  roles: Role[];
  onUpdatePosts: (posts: Post[]) => void;
}

export default function PostsManager({ posts, roles, onUpdatePosts }: PostsManagerProps) {
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    requiredGuards: 1,
    eligibleRoleIds: [] as string[],
    hasActiveHours: false,
    startTime: '21:00',
    endTime: '05:00',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      requiredGuards: 1,
      eligibleRoleIds: [],
      hasActiveHours: false,
      startTime: '21:00',
      endTime: '05:00',
    });
    setIsAddingPost(false);
    setEditingPost(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const postData: Post = {
      id: editingPost?.id || generateId(),
      name: formData.name.trim(),
      requiredGuards: formData.requiredGuards,
      eligibleRoleIds: formData.eligibleRoleIds,
      activeHours: formData.hasActiveHours ? {
        start: formData.startTime,
        end: formData.endTime,
      } : undefined,
    };

    if (editingPost) {
      const updatedPosts = posts.map(p => p.id === editingPost.id ? postData : p);
      onUpdatePosts(updatedPosts);
    } else {
      onUpdatePosts([...posts, postData]);
    }

    resetForm();
  };

  const handleEdit = (post: Post) => {
    setFormData({
      name: post.name,
      requiredGuards: post.requiredGuards,
      eligibleRoleIds: post.eligibleRoleIds || [],
      hasActiveHours: !!post.activeHours,
      startTime: post.activeHours?.start || '21:00',
      endTime: post.activeHours?.end || '05:00',
    });
    setEditingPost(post);
    setIsAddingPost(true);
  };

  const handleDelete = (postId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק עמדה זו?')) {
      const updatedPosts = posts.filter(p => p.id !== postId);
      onUpdatePosts(updatedPosts);
    }
  };

  const toggleEligibleRole = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      eligibleRoleIds: prev.eligibleRoleIds.includes(roleId)
        ? prev.eligibleRoleIds.filter(id => id !== roleId)
        : [...prev.eligibleRoleIds, roleId],
    }));
  };

  const getRoleNames = (roleIds: string[]) =>
    roleIds.map(rid => roles.find(r => r.id === rid)?.name).filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ניהול עמדות</h2>
        <button
          onClick={() => setIsAddingPost(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          הוסף עמדה חדשה
        </button>
      </div>

      {/* Add/Edit Form */}
      {isAddingPost && (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h3 className="text-xl font-semibold mb-4">
            {editingPost ? 'ערוך עמדה' : 'הוסף עמדה חדשה'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">שם העמדה</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="לדוגמה: ש.ג., מגדל שמירה"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">מספר שומרים נדרש</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.requiredGuards}
                onChange={(e) => setFormData({ ...formData, requiredGuards: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Eligible Roles */}
            {roles.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">תפקידים מתאימים</label>
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleEligibleRole(role.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                        formData.eligibleRoleIds.includes(role.id)
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {role.name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {formData.eligibleRoleIds.length === 0
                    ? 'ללא הגבלת תפקיד - כל חייל יוכל לשמור'
                    : `רק חיילים עם התפקידים שנבחרו יוכלו לשמור`}
                </p>
              </div>
            )}

            <div>
              <label className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  checked={formData.hasActiveHours}
                  onChange={(e) => setFormData({ ...formData, hasActiveHours: e.target.checked })}
                  className="rounded"
                />
                <span>הגבל שעות פעילות</span>
              </label>
            </div>

            {formData.hasActiveHours && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">שעת התחלה</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">שעת סיום</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {editingPost ? 'עדכן' : 'הוסף'}
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

      {/* Posts List */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            אין עמדות. הוסף עמדה חדשה כדי להתחיל.
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold text-lg">{post.name}</h3>
                <p className="text-slate-400">
                  {post.requiredGuards} שומרים נדרשים
                </p>
                {post.eligibleRoleIds.length > 0 && (
                  <p className="text-slate-400 text-sm">
                    תפקידים: {getRoleNames(post.eligibleRoleIds)}
                  </p>
                )}
                {post.activeHours && (
                  <p className="text-slate-400 text-sm">
                    פעיל: {post.activeHours.start} - {post.activeHours.end}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(post)}
                  className="px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded transition-colors"
                >
                  ערוך
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                >
                  מחק
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
