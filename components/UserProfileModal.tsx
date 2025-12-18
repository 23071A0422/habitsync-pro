
import React, { useState, useEffect } from 'react';
import { User, Habit } from '../types';
import { db } from '../services/mockDb';

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  // Fix: Fetch habits asynchronously in useEffect
  useEffect(() => {
    const fetchHabits = async () => {
      setLoading(true);
      try {
        const userHabits = await db.getUserHabits(user.id);
        setHabits(userHabits);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHabits();
  }, [user.id]);

  const totalStreaks = habits.reduce((acc, h) => acc + h.streak, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-slate-50 p-6 border-b border-slate-200 flex flex-col items-center">
          <img 
            src={user.avatarUrl} 
            alt={user.username} 
            className="w-20 h-20 rounded-full border-4 border-white shadow-md mb-3"
          />
          <h2 className="text-xl font-bold text-slate-900">{user.username}</h2>
          <p className="text-sm text-slate-500">Member since {new Date(user.joinedAt).getFullYear()}</p>
          
          <div className="flex gap-4 mt-4 w-full justify-center">
             <div className="text-center">
                 <div className="text-lg font-bold text-brand-600">{loading ? '...' : totalStreaks}</div>
                 <div className="text-xs text-slate-500 uppercase tracking-wide">Total Streak</div>
             </div>
             <div className="text-center">
                 <div className="text-lg font-bold text-slate-700">{loading ? '...' : habits.length}</div>
                 <div className="text-xs text-slate-500 uppercase tracking-wide">Habits</div>
             </div>
          </div>
        </div>

        {/* Habits List */}
        <div className="p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide">Active Habits</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {loading ? (
                    <p className="text-slate-500 text-sm">Loading habits...</p>
                ) : habits.length === 0 ? (
                    <p className="text-slate-500 text-sm">No active habits.</p>
                ) : (
                    habits.map(habit => (
                        <div key={habit.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div>
                                <div className="font-medium text-slate-800">{habit.title}</div>
                                <div className="text-xs text-slate-500">{habit.category}</div>
                            </div>
                            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                                <span className="text-orange-500 text-xs">🔥</span>
                                <span className="font-bold text-sm">{habit.streak}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-center">
            <button 
                onClick={onClose}
                className="text-slate-500 hover:text-slate-700 text-sm font-medium"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};
