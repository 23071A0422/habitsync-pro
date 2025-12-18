
import React from 'react';
import { Navbar } from './Navbar';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  // Fix: Added missing properties required by Navbar component
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
}

// Fix: Destructure the new props and pass them to Navbar
export const Layout: React.FC<LayoutProps> = ({ 
  children, 
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 text-slate-900 dark:text-slate-100">
      {/* Pass all required props to Navbar */}
      <Navbar 
        user={user} 
        onLogout={onLogout} 
        currentPage={currentPage} 
        onNavigate={onNavigate}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        language={language}
        setLanguage={setLanguage}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
