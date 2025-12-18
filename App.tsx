import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Social } from './pages/Social';
import { Leaderboard } from './pages/Leaderboard';
import { HabitDetails } from './pages/HabitDetails';
import { Profile } from './pages/Profile';
import { User } from './types';
import { db } from './services/mockDb';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Settings
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  // Load persistence & Auth
  useEffect(() => {
    // 1. Check active session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        db.login(session.user.email!).then(setUser);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
          setUser(null);
          localStorage.removeItem('hs_current_user');
      }
    });

    // 3. Theme Preference
    const savedTheme = localStorage.getItem('hs_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
    } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
    }

    setLoading(false);

    return () => subscription.unsubscribe();
  }, []);

  const toggleDarkMode = () => {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      if (newMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('hs_theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('hs_theme', 'light');
      }
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('hs_current_user', JSON.stringify(loggedInUser));
    setCurrentPage('dashboard');
  };

  const handleUpdateUser = (updatedUser: User) => {
      setUser(updatedUser);
      localStorage.setItem('hs_current_user', JSON.stringify(updatedUser));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('hs_current_user');
    setCurrentPage('dashboard');
    setSelectedHabitId(null);
  };

  const navigateToHabit = (habitId: string) => {
    setSelectedHabitId(habitId);
    setCurrentPage('habit-detail');
  };

  const handleBackToDashboard = () => {
    setSelectedHabitId(null);
    setCurrentPage('dashboard');
  };

  if (loading) return null;

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 text-slate-900 dark:text-slate-100">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        currentPage={currentPage === 'habit-detail' ? 'dashboard' : currentPage}
        onNavigate={(page) => {
            setCurrentPage(page);
            setSelectedHabitId(null);
        }}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        language={language}
        setLanguage={setLanguage}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'dashboard' && <Dashboard user={user} onHabitSelect={navigateToHabit} language={language} />}
        {currentPage === 'social' && <Social currentUser={user} />}
        {currentPage === 'leaderboard' && <Leaderboard currentUser={user} />}
        {currentPage === 'profile' && <Profile user={user} onUpdateUser={handleUpdateUser} />}
        {currentPage === 'habit-detail' && selectedHabitId && (
            <HabitDetails habitId={selectedHabitId} onBack={handleBackToDashboard} />
        )}
      </main>
    </div>
  );
};

export default App;