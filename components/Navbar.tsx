import React from 'react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
    user, 
    onLogout, 
    currentPage, 
    onNavigate,
    isDarkMode,
    toggleDarkMode,
    language,
    setLanguage
}) => {
  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-brand-100 dark:border-slate-800 sticky top-0 z-50 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="bg-brand-600 text-white p-2 rounded-lg shadow-md shadow-brand-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-serif font-bold text-2xl text-slate-800 dark:text-white tracking-tight">HabitSync</span>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex space-x-1">
                 <button 
                  onClick={() => onNavigate('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === 'dashboard' ? 'text-brand-700 bg-brand-50 dark:bg-brand-900 dark:text-brand-100' : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  {language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
                </button>
                <button 
                  onClick={() => onNavigate('social')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === 'social' ? 'text-brand-700 bg-brand-50 dark:bg-brand-900 dark:text-brand-100' : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  {language === 'hi' ? 'दोस्त' : 'Friends'}
                </button>
                <button 
                  onClick={() => onNavigate('leaderboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === 'leaderboard' ? 'text-brand-700 bg-brand-50 dark:bg-brand-900 dark:text-brand-100' : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  {language === 'hi' ? 'लीडरबोर्ड' : 'Leaderboard'}
                </button>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                  {/* Language Toggle */}
                  <button 
                    onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Switch Language"
                  >
                      {language === 'en' ? 'EN' : 'HI'}
                  </button>

                  {/* Dark Mode Toggle */}
                  <button 
                    onClick={toggleDarkMode}
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                      {isDarkMode ? '🌞' : '🌙'}
                  </button>
              </div>

              <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
                <div 
                    className="flex items-center gap-3 cursor-pointer group p-1 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 pr-3 transition-colors"
                    onClick={() => onNavigate('profile')}
                >
                    <div className="flex flex-col items-end hidden md:flex">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-700">{user.username}</span>
                    </div>
                    <img className="h-9 w-9 rounded-full bg-slate-100 border-2 border-white dark:border-slate-600 shadow-sm" src={user.avatarUrl} alt="" />
                </div>
                
                <button 
                  onClick={onLogout}
                  className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Logout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Mobile Nav */}
      {user && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 flex justify-around p-2 bg-white dark:bg-slate-900">
             <button 
                onClick={() => onNavigate('dashboard')}
                className={`flex-1 p-2 text-center text-xs font-medium ${currentPage === 'dashboard' ? 'text-brand-600' : 'text-slate-500 dark:text-slate-400'}`}
            >
                {language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
            </button>
            <button 
                onClick={() => onNavigate('social')}
                className={`flex-1 p-2 text-center text-xs font-medium ${currentPage === 'social' ? 'text-brand-600' : 'text-slate-500 dark:text-slate-400'}`}
            >
                {language === 'hi' ? 'दोस्त' : 'Social'}
            </button>
             <button 
                onClick={() => onNavigate('profile')}
                className={`flex-1 p-2 text-center text-xs font-medium ${currentPage === 'profile' ? 'text-brand-600' : 'text-slate-500 dark:text-slate-400'}`}
            >
                {language === 'hi' ? 'प्रोफ़ाइल' : 'Profile'}
            </button>
        </div>
      )}
    </nav>
  );
};