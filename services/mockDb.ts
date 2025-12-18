import { supabase } from './supabase';
import { User, Habit, HabitLog, Follow, HabitFrequency, LeaderboardEntry, FeedItem } from '../types';

class DatabaseService {
  // --- Auth & User ---
  async register(username: string, email: string, password?: string): Promise<User> {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: password || 'password',
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Registration failed");

    const newUser = {
      id: authData.user.id,
      username,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      wellness_points: 50,
      email_notifications: false,
      vacation_mode: false
    };

    const { error: profileError } = await supabase.from('profiles').insert(newUser);
    if (profileError) throw profileError;

    return {
      id: newUser.id,
      username: newUser.username,
      email,
      avatarUrl: newUser.avatar_url,
      wellnessPoints: newUser.wellness_points,
      joinedAt: new Date().toISOString(),
      emailNotifications: false,
      vacationMode: false
    } as User;
  }

  async login(email: string, password?: string): Promise<User> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: password || 'password',
    });

    if (authError) throw authError;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) throw profileError;

    return {
      id: profile.id,
      username: profile.username,
      email: authData.user.email,
      avatarUrl: profile.avatar_url,
      wellnessPoints: profile.wellness_points,
      joinedAt: profile.joined_at,
      emailNotifications: profile.email_notifications,
      vacationMode: profile.vacation_mode
    } as User;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const dbUpdates: any = {};
    if (updates.username) dbUpdates.username = updates.username;
    if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.emailNotifications !== undefined) dbUpdates.email_notifications = updates.emailNotifications;
    if (updates.vacationMode !== undefined) dbUpdates.vacation_mode = updates.vacationMode;

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      ...updates,
      id: data.id,
      wellnessPoints: data.wellness_points,
      joinedAt: data.joined_at,
      emailNotifications: data.email_notifications,
      vacationMode: data.vacation_mode
    } as User;
  }

  async getAllUsers(excludeId?: string): Promise<User[]> {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      
      const users: User[] = data.map(p => ({
          id: p.id,
          username: p.username,
          avatarUrl: p.avatar_url,
          wellnessPoints: p.wellness_points,
          joinedAt: p.joined_at,
          email: `${p.username}@example.com` 
      }));

      return excludeId ? users.filter(u => u.id !== excludeId) : users;
  }

  // --- Habits ---
  async getUserHabits(userId: string): Promise<Habit[]> {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data.map(h => ({
      id: h.id,
      userId: h.user_id,
      title: h.title,
      category: h.category,
      frequency: h.frequency as HabitFrequency,
      streak: h.streak,
      freezeCount: h.freeze_count,
      createdAt: h.created_at
    }));
  }

  async createHabit(userId: string, title: string, category: string, frequency: HabitFrequency): Promise<void> {
  const { data: habit, error: habitError } = await supabase
    .from('habits')
    .insert({ user_id: userId, title, category, frequency })
    .select()
    .single();

  if (habitError) throw habitError;

  // Create the 'NEW_HABIT' log specifically for the Social Feed
  await supabase.from('habit_logs').insert({
    habit_id: habit.id,
    user_id: userId,
    type: 'NEW_HABIT',
    completed_at: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString()
  });
}

  async updateHabit(habitId: string, updates: Partial<Habit>): Promise<void> {
      const { error } = await supabase.from('habits').update(updates).eq('id', habitId);
      if (error) throw error;
  }

  // --- Check-ins ---
  async checkIn(userId: string, habitId: string, type: 'COMPLETION' | 'FREEZE' = 'COMPLETION'): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Verify if already logged
    const { data: existing } = await supabase
      .from('habit_logs')
      .select('id')
      .eq('habit_id', habitId)
      .eq('completed_at', today)
      .eq('type', 'COMPLETION') // Specifically check for completion
      .maybeSingle();

    if (existing) throw new Error('Already checked in today');

    // 2. Insert the log with a forced timestamp
    const { error: logError } = await supabase.from('habit_logs').insert({
      habit_id: habitId,
      user_id: userId,
      completed_at: today,
      type: type,
      timestamp: new Date().toISOString() // Manually set for the feed
    });
    
    if (logError) throw logError;

    // 3. Update stats
    let pointsEarned = type === 'COMPLETION' ? 10 : -5;
    const { data: habit } = await supabase.from('habits').select('streak, freeze_count').eq('id', habitId).single();
    
    if (type === 'COMPLETION') {
        await supabase.from('habits').update({ streak: (habit?.streak || 0) + 1 }).eq('id', habitId);
    } else if (type === 'FREEZE') {
        await supabase.from('habits').update({ freeze_count: (habit?.freeze_count || 0) - 1 }).eq('id', habitId);
    }

    await supabase.rpc('increment_points', { user_id: userId, amount: pointsEarned });
    return pointsEarned;
  }

  async isHabitCompletedToday(habitId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('habit_logs')
    .select('id')
    .eq('habit_id', habitId)
    .eq('completed_at', today)
    .eq('type', 'COMPLETION') // CRITICAL: Only filter by completion logs
    .maybeSingle();
  return !!data;
}

  async getHabitLogs(habitId: string): Promise<HabitLog[]> {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .order('completed_at', { ascending: false });
    
    if (error) throw error;
    return data.map(l => ({
        id: l.id,
        habitId: l.habit_id,
        userId: l.user_id,
        completedAt: l.completed_at,
        timestamp: l.timestamp,
        type: l.type
    }));
  }

  // --- SOCIAL & LEADERBOARD (FIXED) ---
  

  async getFollowStatus(followerId: string, followingId: string): Promise<'NONE' | 'PENDING' | 'ACCEPTED'> {
      const { data, error } = await supabase
        .from('follows')
        .select('status')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle();
      
      if (error || !data) return 'NONE';
      return data.status as any;
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) throw new Error("Cannot follow self");
    const { error } = await supabase.from('follows').insert({
      follower_id: followerId,
      following_id: followingId,
      status: 'ACCEPTED' // Using auto-accept for demo; change to PENDING for logic
    });
    if (error) throw error;
  }

  // --- FIXED FRIENDS ACTIVITY FEED ---
  async getActivityFeed(userId: string): Promise<FeedItem[]> {
  try {
    // 1. Fetch ALL logs for now to see if data is actually flowing
    // Later you can re-add the filter for friendIds
    const { data, error } = await supabase
      .from('habit_logs')
      .select(`
        id, 
        type, 
        timestamp, 
        user_id,
        habits (title),
        profiles (username, avatar_url)
      `)
      .order('timestamp', { ascending: false })
      .limit(30);
    
    if (error) {
      console.error("Supabase Feed Error:", error.message);
      return [];
    }

    if (!data || data.length === 0) {
      console.log("No logs found in habit_logs table.");
      return [];
    }

    return data.map(item => {
      // Handle the nested join data carefully
      const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
      const habit = Array.isArray(item.habits) ? item.habits[0] : item.habits;

      return {
        id: item.id,
        user: { 
          id: item.user_id, 
          username: profile?.username || 'User', 
          avatarUrl: profile?.avatar_url || '' 
        } as User, 
        habitTitle: habit?.title || 'a habit',
        type: (item.type as any) || 'COMPLETION',
        timestamp: item.timestamp
      };
    }) as FeedItem[];
  } catch (err) {
    console.error("Global Feed Error:", err);
    return [];
  }
}

  // --- FIXED DUAL LEADERBOARD ---
  // --- FIXED DUAL LEADERBOARD ---
  async getLeaderboard(userId?: string, onlyFriends: boolean = false): Promise<LeaderboardEntry[]> {
    try {
      // 1. Initialize the base query
      let query = supabase
        .from('profiles')
        .select('id, username, avatar_url, wellness_points, habits(streak)');

      // 2. If "Friends" mode is on, we MUST filter by the following list
      if (onlyFriends && userId) {
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId)
          .eq('status', 'ACCEPTED');
        
        const friendIds = follows?.map(f => f.following_id) || [];
        // Filter the query to only include friends + the current user
        query = query.in('id', [...friendIds, userId]);
      }

      // 3. Apply ordering and execute the query ONCE
      const { data, error } = await query.order('wellness_points', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map(p => ({
        user: { 
          id: p.id, 
          username: p.username || 'Anonymous', 
          avatarUrl: p.avatar_url, 
          wellnessPoints: p.wellness_points || 0 
        } as User,
        wellnessPoints: p.wellness_points || 0,
        totalStreak: (p.habits as any[])?.reduce((acc, h) => acc + (h.streak || 0), 0) || 0,
        totalCompletions: 0 
      })) as LeaderboardEntry[];
    } catch (err: any) {
      console.error("Leaderboard Filter Error:", err.message);
      return [];
    }
  }

  async getIncomingRequests(userId: string): Promise<User[]> {
      const { data, error } = await supabase
          .from('follows')
          .select('follower_id, profiles!follows_follower_id_fkey(id, username, avatar_url)')
          .eq('following_id', userId)
          .eq('status', 'PENDING');
      
      if (error) return [];
      return data.map(d => (d.profiles as any));
  }

  // Inside mockDb.ts -> DatabaseService class
// Inside mockDb.ts -> DatabaseService class

// OPTION 1: RESET ACCOUNT (Keep the user, delete the progress)
async resetAccount(userId: string): Promise<void> {
  try {
    // Delete all habits (logs will cascade delete if SQL is set up)
    const { error: habitsError } = await supabase
      .from('habits')
      .delete()
      .eq('user_id', userId);
    if (habitsError) throw habitsError;

    // Reset points in profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ wellness_points: 0 })
      .eq('id', userId);
    if (profileError) throw profileError;
    
  } catch (err: any) {
    console.error("Reset Error:", err.message);
    throw err;
  }
}

// OPTION 2: DELETE ACCOUNT COMPLETELY (Wipe everything + Auth)
async deleteAccountCompletely(userId: string): Promise<void> {
  try {
    // 1. Delete all relational data (Habits, Logs, Follows)
    await this.resetAccount(userId);
    
    const { error: followsError } = await supabase
      .from('follows')
      .delete()
      .or(`follower_id.eq.${userId},following_id.eq.${userId}`);
    if (followsError) throw followsError;

    // 2. Delete the Public Profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profileError) throw profileError;

    /** * NOTE: Users cannot delete themselves from auth.users via the client SDK 
     * for security reasons. We sign them out and they are effectively "deleted" 
     * from your app's database. To fully remove them from the Supabase Auth list, 
     * you would typically use a Supabase Edge Function or delete them manually 
     * in the Supabase Auth Dashboard.
     */
    await supabase.auth.signOut();
  } catch (err: any) {
    console.error("Complete Deletion Error:", err.message);
    throw err;
  }
}

  async acceptFollowRequest(followerId: string, followingId: string): Promise<void> {
      await supabase.from('follows').update({ status: 'ACCEPTED' }).eq('follower_id', followerId).eq('following_id', followingId);
  }

  async declineFollowRequest(followerId: string, followingId: string): Promise<void> {
      await supabase.from('follows').delete().eq('follower_id', followerId).eq('following_id', followingId);
  }
}

export const db = new DatabaseService();