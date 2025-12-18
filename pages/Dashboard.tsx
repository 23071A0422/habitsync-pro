import React, { useState, useEffect, useMemo } from 'react';
import { User, Habit, HabitFrequency, HabitLog } from '../types';
import { db } from '../services/mockDb';
import { Button } from '../components/Button';
import { notifications } from '../services/notificationService';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface DashboardProps {
  user: User;
  onHabitSelect: (habitId: string) => void;
  language: 'en' | 'hi';
}

const CATEGORIES = ['All', 'Health', 'Work', 'Finance', 'Social', 'Personal', 'Spirituality'];

const COMMUNITY_CHALLENGES = [
  { id: 'c1', title: 'Hydration Hero', participants: 1240, category: 'Health', goal: 'Drink 3L water daily' },
  { id: 'c2', title: 'Deep Work Sprint', participants: 850, category: 'Work', goal: '2 hours focus session' },
  { id: 'c3', title: 'Gratitude Journal', participants: 3200, category: 'Personal', goal: 'Write 3 things daily' }
];

export const Dashboard: React.FC<DashboardProps> = ({ user, onHabitSelect, language }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [newHabit, setNewHabit] = useState({ title: '', category: 'Health', frequency: HabitFrequency.DAILY });
  const [completedStatus, setCompletedStatus] = useState<Record<string, boolean>>({});
  const [weeklyLogs, setWeeklyLogs] = useState<Record<string, HabitLog[]>>({});
  const [activeToast, setActiveToast] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const userHabits = await db.getUserHabits(user.id);
      const status: Record<string, boolean> = {};
      const logsMap: Record<string, HabitLog[]> = {};
      
      for (const h of userHabits) {
        status[h.id] = await db.isHabitCompletedToday(h.id);
        logsMap[h.id] = await db.getHabitLogs(h.id);
      }
      
      setHabits(userHabits);
      setCompletedStatus(status);
      setWeeklyLogs(logsMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.title.trim()) {
        setActiveToast("Title is required!");
        return;
    }
    
    try {
      if (editingHabit) {
        await db.updateHabit(editingHabit.id, { 
            title: newHabit.title, 
            category: newHabit.category, 
            frequency: newHabit.frequency 
        });
        setActiveToast("Habit updated! ✨");
      } else {
        await db.createHabit(user.id, newHabit.title, newHabit.category, newHabit.frequency);
        setActiveToast("Habit created! 🚀");
      }
      
      setShowForm(false);
      setEditingHabit(null);
      setNewHabit({ title: '', category: 'Health', frequency: HabitFrequency.DAILY });
      await loadData();
      setTimeout(() => setActiveToast(null), 3000);
    } catch (err: any) {
      setActiveToast(err.message);
      setTimeout(() => setActiveToast(null), 3000);
    }
  };

  const handleJoinChallenge = async (challenge: typeof COMMUNITY_CHALLENGES[0]) => {
      try {
          await db.createHabit(user.id, challenge.title, challenge.category, HabitFrequency.DAILY);
          setActiveToast(`Joined ${challenge.title}! 🏆`);
          await loadData();
          setTimeout(() => setActiveToast(null), 3000);
      } catch (err: any) {
          setActiveToast(err.message);
          setTimeout(() => setActiveToast(null), 3000);
      }
  };

  const handleCheckIn = async (e: React.MouseEvent, habitId: string, type: 'COMPLETION' | 'FREEZE' = 'COMPLETION') => {
    e.stopPropagation();
    try {
      const points = await db.checkIn(user.id, habitId, type);
      setCompletedStatus(prev => ({ ...prev, [habitId]: true }));
      await loadData();
      setActiveToast(type === 'FREEZE' ? "Streak Frozen! ❄️" : `Check-in successful! +${points} Points ✨`);
      setTimeout(() => setActiveToast(null), 3000);
    } catch (err: any) {
      setActiveToast(err.message);
      setTimeout(() => setActiveToast(null), 3000);
    }
  };

  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        
        let completionsCount = 0;
        // Fix for 'some' on type unknown error
        (Object.values(weeklyLogs) as HabitLog[][]).forEach(logs => {
          if (logs.some(l => l.completedAt === dStr && l.type === 'COMPLETION')) {
              completionsCount++;
          }
      });

        data.push({
            name: d.toLocaleDateString(undefined, { weekday: 'short' }),
            completions: completionsCount,
            points: completionsCount * 10
        });
    }
    return data;
  }, [weeklyLogs]);

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  };

  const filteredHabits = selectedCategory === 'All' 
    ? habits 
    : habits.filter(h => h.category === selectedCategory);

  const pendingCount = habits.filter(h => !completedStatus[h.id]).length;

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
      <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-medium italic">Syncing your journey...</p>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-10 animate-fade-in pb-16 px-2 md:px-0">
      {activeToast && (
        <div className="fixed bottom-8 right-4 left-4 md:left-auto bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-pop-in border border-white/10 text-center md:text-left">
          {activeToast}
        </div>
      )}

      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'hi' ? 'नमस्ते,' : 'Namaste,'} {user.username} 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                Keep your momentum alive and build your legacy!
            </p>
          </div>
          <Button onClick={() => { setEditingHabit(null); setShowForm(!showForm); }} className="w-full md:w-auto rounded-2xl h-14 px-8 text-lg font-bold shadow-xl shadow-brand-500/30 hover:scale-105 transition-transform">
            {showForm ? 'Close Form' : (language === 'hi' ? '+ नई आदत' : '+ New Habit')}
        </Button>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-[10px] md:text-xs">Performance Trend</h3>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                    <span className="w-2 h-2 rounded-full bg-brand-500"></span> Wellness Points
                </div>
            </div>
            <div className="h-[200px] md:h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: '#0f172a', color: '#fff' }}
                            itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="points" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorPoints)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
             <div className="bg-brand-600 p-6 rounded-2xl md:rounded-[2rem] text-white shadow-lg relative overflow-hidden group">
                 <div className="absolute -right-4 -bottom-4 text-8xl opacity-10 rotate-12 group-hover:rotate-0 transition-transform">💎</div>
                 <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Total Points</h4>
                 <div className="text-4xl md:text-5xl font-black mb-4">{user.wellnessPoints}</div>
                 <p className="text-xs font-medium text-brand-100">Consistency is your superpower!</p>
             </div>
             
             {pendingCount > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-2xl md:rounded-[2rem] border border-orange-100 dark:border-orange-800">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-orange-100 dark:bg-orange-800 p-2 rounded-xl">📧</div>
                        <h4 className="font-bold text-orange-900 dark:text-orange-200">Gmail Alert</h4>
                    </div>
                    <p className="text-xs text-orange-700 dark:text-orange-300 mb-4 font-medium">You still have {pendingCount} habits to complete today.</p>
                    <Button variant="secondary" size="sm" className="w-full rounded-xl border-orange-200 text-orange-700 font-bold" onClick={() => notifications.sendEmailNotification(user, pendingCount)}>
                        Preview Reminder
                    </Button>
                </div>
             )}
          </div>
      </div>

      {/* Habit Form Block */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-pop-in ring-4 ring-brand-500/10">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-black dark:text-white flex items-center gap-3">
              <span className="bg-brand-100 dark:bg-brand-900 p-2 rounded-xl text-lg">🛠️</span>
              {editingHabit ? 'Modify Habit' : 'New Habit'}
            </h2>
          </div>
          <form onSubmit={handleCreateOrUpdateHabit} className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-end">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Habit Title</label>
              <input 
                type="text" 
                autoFocus
                className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white h-12 px-4 font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                value={newHabit.title}
                onChange={e => setNewHabit({...newHabit, title: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Category</label>
              <select 
                className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white h-12 px-4 font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                value={newHabit.category}
                onChange={e => setNewHabit({...newHabit, category: e.target.value})}
              >
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Frequency</label>
              <select 
                className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white h-12 px-4 font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                value={newHabit.frequency}
                onChange={e => setNewHabit({...newHabit, frequency: e.target.value as HabitFrequency})}
              >
                <option value={HabitFrequency.DAILY}>Every Day</option>
                <option value={HabitFrequency.WEEKLY}>Once a Week</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" className="h-12 flex-1 rounded-xl" onClick={() => { setShowForm(false); setEditingHabit(null); }}>Cancel</Button>
              <Button type="submit" className="h-12 flex-1 rounded-xl shadow-lg">{editingHabit ? 'Update' : 'Launch'}</Button>
            </div>
          </form>
        </div>
      )}

      {/* Habit Grid Section */}
      <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <h2 className="text-2xl font-black dark:text-white">Active Habits</h2>
            <div className="flex gap-2 overflow-x-auto custom-scrollbar max-w-full pb-2 md:pb-0">
                {CATEGORIES.map(cat => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-[10px] md:text-xs font-bold whitespace-nowrap transition-all border-2 ${
                    selectedCategory === cat 
                        ? 'bg-brand-600 border-brand-600 text-white shadow-lg' 
                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700'
                    }`}
                >
                    {cat}
                </button>
                ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredHabits.map(habit => (
              <div 
                key={habit.id} 
                onClick={() => onHabitSelect(habit.id)}
                className="group bg-white dark:bg-slate-800 p-5 md:p-6 rounded-2xl md:rounded-[2rem] shadow-sm hover:shadow-xl border border-slate-100 dark:border-slate-700 cursor-pointer transition-all hover:-translate-y-1 relative"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                      {habit.frequency}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingHabit(habit); setNewHabit({title: habit.title, category: habit.category, frequency: habit.frequency}); setShowForm(true); }}
                    className="p-2 text-slate-300 hover:text-brand-600 transition-colors bg-slate-50 dark:bg-slate-900 rounded-xl"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                </div>
                
                <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mb-2 group-hover:text-brand-600 transition-colors truncate">
                    {habit.title}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-6 tracking-wide">{habit.category}</p>

                <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 px-3 py-1.5 rounded-xl border border-orange-100 dark:border-orange-800">
                        <span className="text-orange-500 text-sm">🔥</span>
                        <span className="text-orange-700 dark:text-orange-400 font-black text-sm">{habit.streak}d</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {completedStatus[habit.id] ? (
                        <div className="flex items-center gap-2 text-green-600 font-black bg-green-50 dark:bg-green-900/30 px-4 py-3 rounded-xl border border-green-100 dark:border-green-800 w-full justify-center animate-pop-in text-xs">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            DONE
                        </div>
                    ) : (
                        <div className="flex gap-2 w-full">
                          <Button className="flex-1 py-3 rounded-xl font-black shadow-lg text-xs" onClick={(e) => handleCheckIn(e, habit.id)}>
                              CHECK IN
                          </Button>
                          {habit.freezeCount > 0 && (
                            <Button variant="secondary" className="px-4 rounded-xl border-blue-200 text-blue-600 bg-blue-50/50" onClick={(e) => handleCheckIn(e, habit.id, 'FREEZE')}>
                                ❄️
                            </Button>
                          )}
                        </div>
                    )}
                </div>
              </div>
            ))}
          </div>
      </div>

      {/* Weekly Grid Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 md:px-8 py-5 md:py-6 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[10px] md:text-xs">Weekly Progress</h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                    <tr className="bg-slate-50/20 dark:bg-slate-900/20">
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Habit Details</th>
                        {getLast7Days().map((date, i) => (
                            <th key={i} className="px-4 py-4 text-center">
                                <div className="text-[10px] font-black text-slate-400 uppercase mb-1">{date.toLocaleDateString(undefined, {weekday: 'short'})}</div>
                                <div className="text-xs md:text-sm font-black text-slate-900 dark:text-slate-100">{date.getDate()}</div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                    {habits.map(habit => (
                        <tr key={habit.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-8 py-5">
                                <div className="font-black text-slate-800 dark:text-slate-200 text-xs md:text-sm truncate max-w-[150px]">{habit.title}</div>
                                <div className="text-[8px] md:text-[9px] font-bold text-brand-500 uppercase tracking-tighter">{habit.category}</div>
                            </td>
                            {getLast7Days().map((date, i) => {
                                const dateStr = date.toISOString().split('T')[0];
                                const log = weeklyLogs[habit.id]?.find(l => l.completedAt === dateStr);
                                return (
                                    <td key={i} className="px-4 py-5 text-center">
                                        <div className={`w-6 h-6 md:w-8 md:h-8 mx-auto rounded-lg md:rounded-xl flex items-center justify-center text-[10px] md:text-xs font-bold transition-all
                                            ${log?.type === 'COMPLETION' ? 'bg-green-500 text-white shadow-md' : 
                                              log?.type === 'FREEZE' ? 'bg-blue-400 text-white' : 
                                              'bg-slate-100 dark:bg-slate-900 text-slate-300 dark:text-slate-700 border border-slate-50 dark:border-slate-800'}`}>
                                            {log?.type === 'COMPLETION' ? '✓' : log?.type === 'FREEZE' ? '❄' : '—'}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};