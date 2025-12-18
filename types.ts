export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  phone?: string;
  avatarUrl: string;
  joinedAt: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  wellnessPoints: number;
  emailNotifications?: boolean; // New
  vacationMode?: boolean;      // New
}

export enum HabitFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  category: string;
  frequency: HabitFrequency;
  createdAt: string;
  streak: number;
  freezeCount: number;
  reminderTime?: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  completedAt: string; 
  timestamp: string; 
  type?: 'COMPLETION' | 'FREEZE';
}

export interface Follow {
  followerId: string;
  followingId: string;
  status: 'PENDING' | 'ACCEPTED';
}

// Update this in your types file
export interface FeedItem {
  id: string;
  user: User;
  habitTitle: string;
  // Add "FREEZE" to the union type below
  type: 'COMPLETION' | 'STREAK_MILESTONE' | 'NEW_HABIT' | 'FREEZE'; 
  timestamp: string;
  details?: string;
}

export interface LeaderboardEntry {
  user: User;
  totalStreak: number;
  totalCompletions: number;
  wellnessPoints: number;
}