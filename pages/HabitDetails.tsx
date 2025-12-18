import React, { useEffect, useState } from 'react';
import { Habit, HabitLog } from '../types';
import { db } from '../services/mockDb';
import { getHabitAdvice } from '../services/gemini';
import { Button } from '../components/Button';
import { supabase } from '../services/supabase'; //

interface HabitDetailsProps {
  habitId: string;
  onBack: () => void;
}

export const HabitDetails: React.FC<HabitDetailsProps> = ({ habitId, onBack }) => {
  const [habit, setHabit] = useState<Habit | null>(null);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHabitDetails = async () => {
      try {
        // 1. Get current session to find User ID
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error("No active session");

        // 2. Fetch the specific habit from Supabase instead of localStorage
        const userHabits = await db.getUserHabits(session.user.id);
        const found = userHabits.find((h: Habit) => h.id === habitId);
        
        if (!found) {
          setError("Habit not found");
          return;
        }
        
        setHabit(found);

        // 3. Fetch real habit logs from Supabase
        const habitLogs = await db.getHabitLogs(habitId);
        setLogs(habitLogs.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()));
        
        // 4. Fetch personalized AI coaching advice
        setIsAiLoading(true);
        const advice = await getHabitAdvice(found, found.streak);
        setAiAdvice(advice);
      } catch (err: any) {
        console.error("Failed to load details:", err);
        setError(err.message);
      } finally {
        setIsAiLoading(false);
      }
    };
    loadHabitDetails();
  }, [habitId]);

  if (error) return (
    <div className="p-8 text-center">
      <p className="text-red-500 font-bold mb-4">{error}</p>
      <Button onClick={onBack} variant="ghost">Go Back</Button>
    </div>
  );

  if (!habit) return <div className="p-8 text-center animate-pulse dark:text-white">Analyzing habit data...</div>;

  const calculateCompletionRate = () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const completions = logs.filter(l => new Date(l.completedAt) >= thirtyDaysAgo && l.type === 'COMPLETION').length;
      return Math.round((completions / 30) * 100);
  };

  const generateHeatmapDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 34; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const log = logs.find(l => l.completedAt === dateStr);
      days.push({ date: d, log, dateStr });
    }
    return days;
  };

  const heatmapDays = generateHeatmapDays();
  const completionRate = calculateCompletionRate();

  return (
    <div className="animate-fade-in space-y-8 max-w-4xl mx-auto pb-12 px-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">{habit.title}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
             <span className="bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">{habit.category}</span>
             <span>•</span>
             <span>Started {new Date(habit.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* AI Coach Card */}
      <div className="bg-gradient-to-br from-slate-900 to-brand-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:rotate-12 transition-transform">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/></svg>
          </div>
          <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                  <span className="bg-brand-500 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">AI Habit Coach</span>
              </div>
              {isAiLoading ? (
                  <div className="flex gap-2 items-center py-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  </div>
              ) : (
                  <p className="text-lg font-medium italic leading-relaxed">"{aiAdvice}"</p>
              )}
          </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
           <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Current Streak</div>
           <div className="text-3xl font-black text-brand-600 dark:text-brand-400 mt-2 relative z-10">{habit.streak} <span className="text-sm text-slate-400 font-medium lowercase">days</span></div>
           {habit.streak > 0 && <div className="absolute -bottom-2 -right-2 text-6xl opacity-10 grayscale">🔥</div>}
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
           <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">30-Day Rate</div>
           <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{completionRate}%</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
           <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Logs</div>
           <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{logs.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
           <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Freezes Left</div>
           <div className="text-3xl font-black text-blue-500 mt-2">{habit.freezeCount}</div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Activity Heatmap</h3>
        <div className="flex flex-wrap gap-2.5">
            {heatmapDays.map((day) => (
                <div 
                    key={day.dateStr}
                    title={`${day.dateStr}: ${day.log ? day.log.type : 'Missed'}`}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all relative
                        ${day.log?.type === 'COMPLETION' 
                            ? 'bg-brand-500 text-white shadow-md scale-105' 
                            : day.log?.type === 'FREEZE'
                                ? 'bg-blue-400 text-white'
                                : 'bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-700 border border-slate-100 dark:border-slate-800'}`}
                >
                    {day.date.getDate()}
                </div>
            ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-brand-500 rounded-md"></div> Completed</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-400 rounded-md"></div> Frozen</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md"></div> Missed</div>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-xs">Completion History</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {logs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-medium italic">No activity recorded for this habit yet.</div>
            ) : (
                logs.map(log => (
                    <div key={log.id} className="px-8 py-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <span className={`text-lg ${log.type === 'FREEZE' ? 'text-blue-500' : 'text-brand-500'}`}>
                                {log.type === 'FREEZE' ? '❄️' : '✅'}
                            </span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">
                                {new Date(log.completedAt).toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
                            </span>
                            {log.type === 'FREEZE' && (
                                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-black uppercase">Frozen</span>
                            )}
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};