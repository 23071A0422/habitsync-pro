import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, User } from '../types';
import { db } from '../services/mockDb';
import { UserProfileModal } from '../components/UserProfileModal';

interface LeaderboardProps {
    currentUser?: User;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentUser }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [view, setView] = useState<'global' | 'friends'>('global'); // State for toggle
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Pass the currentUser ID and the 'onlyFriends' boolean to the database service
        const data = await db.getLeaderboard(currentUser?.id, view === 'friends');
        setEntries(data);
      } catch (err) {
        console.error("Leaderboard load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [view, currentUser?.wellnessPoints]); // Re-load when switching view or points change

  if (loading) return (
    <div className="py-20 flex justify-center items-center flex-col animate-pulse">
       <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
       <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Rankings...</p>
    </div>
  );

  return (
    <>
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto px-4 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
            {view === 'global' ? 'Global' : 'Friends'} Leaderboard
          </h1>
          <p className="text-slate-500 font-medium">
            {view === 'global' 
              ? 'Competition breeds consistency. Where do you stand?' 
              : 'Keep up with your inner circle!'}
          </p>
        </div>

        {/* --- FRIENDS / GLOBAL TOGGLE --- */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
          <button 
            onClick={() => setView('global')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${
              view === 'global' 
                ? 'bg-white dark:bg-slate-800 text-brand-600 shadow-lg scale-100' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 scale-95'
            }`}
          >
            Global
          </button>
          <button 
            onClick={() => setView('friends')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${
              view === 'friends' 
                ? 'bg-white dark:bg-slate-800 text-brand-600 shadow-lg scale-100' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 scale-95'
            }`}
          >
            Friends
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-8 py-5 bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <div className="col-span-2">Rank</div>
          <div className="col-span-6">Sync-er</div>
          <div className="col-span-2 text-right">Points</div>
          <div className="col-span-2 text-right">Total Streak</div>
        </div>

        <div className="divide-y divide-slate-50 dark:divide-slate-700">
          {entries.length === 0 ? (
            <div className="px-8 py-12 text-center text-slate-400 italic font-medium">
              No Sync-ers found in this view.
            </div>
          ) : (
            entries.map((entry, index) => (
              <div 
                key={entry.user.id} 
                onClick={() => setSelectedUser(entry.user)}
                className={`grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-all duration-200 ${
                  currentUser?.id === entry.user.id ? 'bg-brand-50/40 dark:bg-brand-900/20' : ''
                }`}
              >
                <div className="col-span-2 flex items-center gap-1 font-black text-slate-400">
                  {index < 3 && view === 'global' && <span>{['🥇', '🥈', '🥉'][index]}</span>}
                  #{index + 1}
                </div>
                <div className="col-span-6 flex items-center gap-3">
                  <img src={entry.user.avatarUrl} className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-600 shadow-sm" alt=""/>
                  <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">{entry.user.username}</div>
                      {currentUser?.id === entry.user.id && (
                        <span className="text-[8px] font-black text-brand-500 uppercase tracking-tighter">You</span>
                      )}
                  </div>
                </div>
                <div className="col-span-2 text-right font-black text-brand-600 dark:text-brand-400 text-lg">
                  {entry.wellnessPoints}
                </div>
                <div className="col-span-2 text-right font-bold text-slate-600 dark:text-slate-400">
                  {entry.totalStreak}d
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
    {selectedUser && <UserProfileModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </>
  );
};