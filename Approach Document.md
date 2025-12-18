Technical Approach & Problem-Solving Document
1. Architecture & Approach
The application was built as a full-stack product using React (Vite), Tailwind CSS, and Supabase (PostgreSQL). The architecture follows a modular service-oriented pattern, where a central DatabaseService (mockDb.ts) handles all interactions with Supabase to keep the UI components clean and focused on user experience.

2. Key Challenges & Overcoming Roadblocks
A. Supabase Row Level Security (RLS) & 403 Errors
The Problem: Initial attempts to "Check In" or view "Friends Activity" resulted in 403 Forbidden errors.

The Solution: I diagnosed that while the tables existed, Supabase blocks all "write" actions by default. I implemented granular SQL policies to allow users to INSERT their own logs while allowing SELECT access for the Social Feed.

B. Relational Schema Cache & 400 Errors
The Problem: The "Friends Activity" and "Leaderboard" were failing with 400 Bad Request errors because the API couldn't find relationships between habit_logs, profiles, and habits.

The Solution: I resolved this by manually defining Foreign Key constraints in the PostgreSQL editor and using the NOTIFY pgrst, 'reload schema'; command to force the PostgREST API to refresh its relationship cache.

C. Data Flow & Feed Synchronization
The Problem: The activity feed was initially blank because "Habit Creation" wasn't being treated as an "event."

The Solution: I modified the createHabit function to perform a dual action: inserting the habit into the habits table and simultaneously creating a NEW_HABIT entry in habit_logs. This ensured that the Social Feed had data to fetch the moment a habit was started.

D. Account Deletion vs. Authentication
The Problem: Deleting a user "completely" is restricted on the client-side to prevent security exploits.

The Solution: I implemented a two-tier "Danger Zone." Tier 1 is a Data Reset that wipes habits but keeps the login. Tier 2 is Complete Deletion, which wipes the public profile and all relational data before signing the user out, effectively removing their presence from the app.

3. Edge Case Handling
Duplicate Check-ins: The checkIn function was coded to verify if a log with type: 'COMPLETION' already exists for the current date before allowing a new entry.

Relational Integrity: Used ON DELETE CASCADE in SQL so that deleting a habit automatically cleans up all associated history logs, preventing "orphaned" data.

4. Bonus Features Implemented
AI Habit Coach: Integrated the Gemini API to provide real-time, personalized advice based on a user's current streak.

Dual Leaderboard: Coded a toggle system to switch between "Global" and "Friends-only" rankings using PostgreSQL filters.

Automated Notifications: Used the Browser Notification API to confirm data resets and habit milestones.