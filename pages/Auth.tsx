
import React, { useState } from 'react';
import { db } from '../services/mockDb';
import { User } from '../types';
import { Button } from '../components/Button';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Password Strength Logic
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++; // Has Uppercase
    if (/[0-9]/.test(pass)) score++; // Has Number
    if (/[^A-Za-z0-9]/.test(pass)) score++; // Has Special Char
    
    if (score > 4) score = 4;
    return score;
  };
  
  const passwordStrength = getPasswordStrength(password);

  // Fix: handle asynchronous database calls by making the function async and awaiting the results
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      let user: User;
      if (isRegistering) {
        if (!username) throw new Error("Username required");
        if (!password) throw new Error("Password required");
        if (password.length < 6) throw new Error("Password must be at least 6 characters");
        
        // Strong password enforcement
        if (passwordStrength < 3) {
            throw new Error("Password is too weak. Please use a mix of uppercase letters, numbers, or symbols.");
        }

        user = await db.register(username, email, password);
      } else {
        user = await db.login(email, password);
      }
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div>
          <div className="mx-auto h-12 w-12 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
            {isRegistering ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            {isRegistering ? 'Start building better habits today.' : 'Sign in to continue your streak.'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-xl shadow-sm -space-y-px">
            {isRegistering && (
              <div>
                <label htmlFor="username" className="sr-only">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 bg-white rounded-t-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            )}
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm ${isRegistering ? '' : 'rounded-t-lg'}`}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 bg-white rounded-b-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          {/* Password Strength Meter */}
          {isRegistering && password && (
              <div className="mt-2 transition-all duration-300 px-1">
                  <div className="flex gap-1 h-1.5 mb-1">
                      {[1, 2, 3, 4].map((level) => (
                          <div 
                              key={level} 
                              className={`flex-1 rounded-full transition-colors duration-300 ${
                                  passwordStrength >= level 
                                      ? (passwordStrength <= 2 ? 'bg-red-400' : passwordStrength === 3 ? 'bg-yellow-400' : 'bg-green-500')
                                      : 'bg-slate-200'
                              }`} 
                          />
                      ))}
                  </div>
                  <div className="text-xs text-slate-500 font-medium text-right flex justify-between">
                      <span className={`${passwordStrength < 3 ? 'text-red-500' : 'text-green-500'}`}>
                          {passwordStrength < 3 ? 'Requires at least "Good" strength' : 'Password accepted'}
                      </span>
                      <span>
                          {passwordStrength <= 1 && "Weak"}
                          {passwordStrength === 2 && "Fair"}
                          {passwordStrength === 3 && "Good"}
                          {passwordStrength === 4 && "Strong"}
                      </span>
                  </div>
              </div>
          )}

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-100 font-medium">
              {error}
            </div>
          )}

          <div>
            <Button type="submit" className="w-full py-3 text-base shadow-lg shadow-brand-500/20">
              {isRegistering ? 'Sign up' : 'Sign in'}
            </Button>
          </div>
        </form>
        <div className="text-center">
          <button 
            type="button"
            className="text-sm font-semibold text-brand-600 hover:text-brand-500 transition-colors"
            onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setPassword('');
            }}
          >
            {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
        {!isRegistering && (
           <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-center text-slate-400">
              <p>Demo: demo@example.com / password</p>
           </div>
        )}
      </div>
    </div>
  );
};
