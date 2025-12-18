import React, { useState, useEffect } from 'react';
import { User, FeedItem } from '../types';
import { db } from '../services/mockDb';
import { Button } from '../components/Button';

interface SocialProps {
  currentUser: User;
}

export const Social: React.FC<SocialProps> = ({ currentUser }) => {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [followStatuses, setFollowStatuses] = useState<Record<string, 'PENDING' | 'ACCEPTED' | 'NONE'>>({});
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    refreshAll();
    // Refresh feed every 60 seconds to see new friend activity
    const timer = setInterval(refreshFeed, 60000);
    return () => clearInterval(timer);
  }, [currentUser]);

  const refreshAll = async () => {
    setLoading(true);
    try {
        const [activity, requests, users] = await Promise.all([
          db.getActivityFeed(currentUser.id),
          db.getIncomingRequests(currentUser.id),
          db.getAllUsers(currentUser.id)
        ]);

        setFeed(activity);
        setFriendRequests(requests);
        setAllUsers(users);

        const statuses: Record<string, 'PENDING' | 'ACCEPTED' | 'NONE'> = {};
        for (const u of users) {
          statuses[u.id] = await db.getFollowStatus(currentUser.id, u.id);
        }
        setFollowStatuses(statuses);
        setSuggestedUsers(users.filter(u => statuses[u.id] === 'NONE'));
    } catch (e) {
        console.error("Refresh error:", e);
    } finally {
        setLoading(false);
    }
  };

  const refreshFeed = async () => {
    const activity = await db.getActivityFeed(currentUser.id);
    setFeed(activity);
  };

  const handleFollow = async (targetId: string) => {
    try {
      await db.followUser(currentUser.id, targetId);
      await refreshAll(); // Immediately update the UI to show they are added
    } catch (e) { console.error(e); }
  };

  const handleAccept = async (requesterId: string) => {
      await db.acceptFollowRequest(requesterId, currentUser.id);
      await refreshAll();
  };

  const handleDecline = async (requesterId: string) => {
      await db.declineFollowRequest(requesterId, currentUser.id);
      await refreshAll();
  };

  const handleCopyId = () => {
      navigator.clipboard.writeText(currentUser.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const renderFeedItemText = (item: FeedItem) => {
      switch (item.type) {
          case 'NEW_HABIT':
              return (
                  <div className="mt-1">
                      <p className="text-slate-700 dark:text-slate-300">
                          Started a new journey: <span className="font-bold text-brand-600 italic">"{item.habitTitle}"</span>
                      </p>
                      <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest mt-1 block">
                          New Beginning ✨
                      </span>
                  </div>
              );
          case 'FREEZE':
              return (
                  <p className="text-slate-700 mt-1 dark:text-slate-300">
                      Used a Streak Freeze for: <span className="font-bold text-blue-600">{item.habitTitle}</span>
                      <span className="ml-2">❄️</span>
                  </p>
              );
          case 'COMPLETION':
          default:
              return (
                  <p className="text-slate-700 mt-1 dark:text-slate-300">
                      Daily Check-in: <span className="font-bold text-brand-600">{item.habitTitle}</span>
                      <span className="ml-2">✅</span>
                  </p>
              );
      }
  };

  const displayUsers = searchTerm.trim() 
    ? allUsers.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.includes(searchTerm))
    : suggestedUsers;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      <div className="lg:col-span-2 space-y-8">
        {friendRequests.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gold-200 p-6 shadow-lg">
                <h2 className="text-lg font-bold mb-4 dark:text-white">🔔 Pending Requests</h2>
                <div className="space-y-4">
                    {friendRequests.map(req => (
                        <div key={req.id} className="flex items-center justify-between bg-gold-50/30 dark:bg-gold-900/10 p-3 rounded-lg border border-gold-100">
                            <div className="flex items-center gap-3">
                                <img src={req.avatarUrl} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt=""/>
                                <span className="font-bold dark:text-slate-200">{req.username}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="secondary" onClick={() => handleDecline(req.id)}>Decline</Button>
                                <Button size="sm" onClick={() => handleAccept(req.id)}>Accept</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Friends Activity</h2>
            {feed.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 p-12 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-slate-400">No activity yet. Follow people to see their habit journey!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {feed.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex gap-4 transition-all">
                            <img src={item.user.avatarUrl} className="w-12 h-12 rounded-full border-2 border-brand-100" alt=""/>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-black text-slate-900 dark:text-white">{item.user.username}</span>
                                    <span className="text-slate-400 text-[10px] font-bold uppercase">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                {renderFeedItemText(item)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-brand-600 p-6 rounded-2xl shadow-lg text-white">
            <h3 className="font-black text-lg mb-2">Sync Your Squad</h3>
            <p className="text-brand-100 text-xs mb-4">Friends can find you using this unique ID:</p>
            <div className="bg-white/10 p-3 rounded-xl flex items-center justify-between border border-white/20">
                <code className="font-mono text-[10px] tracking-widest truncate mr-2">{currentUser.id}</code>
                <button onClick={handleCopyId} className="flex-shrink-0 p-1.5 hover:bg-white/20 rounded-md transition-all">
                    {copied ? '✅' : '📋'}
                </button>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-xl font-black mb-4 dark:text-white">Find Friends</h2>
            <input 
                type="text" 
                placeholder="Search name or ID..." 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white mb-6" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="space-y-4">
                {displayUsers.slice(0, 5).map(user => (
                    <div key={user.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <img src={user.avatarUrl} className="w-10 h-10 rounded-full bg-slate-100" alt=""/>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold dark:text-slate-200">{user.username}</span>
                                <span className="text-[10px] text-slate-400">{user.wellnessPoints} Points</span>
                            </div>
                        </div>
                        {followStatuses[user.id] === 'ACCEPTED' ? (
                            <span className="text-[10px] font-black text-green-500 uppercase">Friends</span>
                        ) : (
                            <Button size="sm" variant="secondary" className="rounded-lg h-8 px-4" onClick={() => handleFollow(user.id)}>Follow</Button>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};