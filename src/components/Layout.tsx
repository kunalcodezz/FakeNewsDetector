import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LayoutDashboard, History, LogOut, Menu, X, Activity, Sun, Moon } from 'lucide-react';
import { cn } from '../lib/utils';
import ChatWidget from './ChatWidget';

export default function Layout() {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check local storage first
    const stored = localStorage.getItem('theme');
    if (stored) {
      return stored === 'dark';
    }
    // Then check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    // Default to dark mode for the deep tech theme
    return true;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Analysis', path: '/', icon: ShieldAlert },
    { name: 'History', path: '/history', icon: History },
  ];

  return (
    <div className={cn(
      "min-h-screen flex flex-col md:flex-row transition-colors duration-300 font-sans selection:bg-cyan-500/30 selection:text-cyan-900 dark:selection:text-cyan-200"
    )}>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 glass-panel z-50">
        <div className="flex items-center gap-2 font-extrabold text-xl tracking-tight">
          <Activity className="text-cyan-600 dark:text-cyan-400" />
          <span className="text-slate-900 dark:text-white">Verity<span className="text-cyan-600 dark:text-cyan-400">AI</span></span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-900 dark:text-white">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar - Glassmorphic */}
      <aside className={cn(
        "fixed md:sticky top-0 left-0 z-40 w-[260px] h-screen transition-transform duration-300 flex-shrink-0 flex flex-col py-8 glass-panel border-r border-slate-200 dark:border-white/5",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="px-8 pb-10 font-extrabold text-2xl tracking-tighter flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-400 blur-lg opacity-40 rounded-full"></div>
            <Activity className="text-cyan-600 dark:text-cyan-400 relative z-10" size={28} />
          </div>
          <span className="text-slate-900 dark:text-white text-glow">Verity<span className="text-cyan-600 dark:text-cyan-400">AI</span></span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm cursor-pointer group",
                isActive 
                  ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 shadow-sm dark:shadow-[inset_0px_0px_20px_rgba(6,182,212,0.1)]"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent"
              )}
            >
              <item.icon size={18} className={cn("transition-transform group-hover:scale-110")} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto px-4">
          <button 
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-3 mb-4 rounded-xl transition-all duration-300 font-medium text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          {user && (
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white flex items-center justify-center text-sm font-bold shadow-lg">
                  {user.displayName?.substring(0, 2).toUpperCase() || 'U'}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-semibold truncate text-slate-900 dark:text-white">{user.displayName || 'User'}</span>
                  <span className="text-xs text-cyan-600 dark:text-cyan-400 truncate">Verified Analyst</span>
                </div>
              </div>
              <button 
                onClick={logout}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg transition-all duration-200 font-medium text-sm bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-500/20"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
          <div className="text-[10px] uppercase tracking-widest text-center text-slate-500 dark:text-slate-400 opacity-60 dark:opacity-40 pt-6 font-mono">
            System Online • Secure
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <header className="h-20 glass-panel border-b border-slate-200 dark:border-white/5 px-8 flex justify-between items-center shrink-0 z-30 sticky top-0">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Intelligence Dashboard</h2>
            <p className="text-xs font-mono text-cyan-600 dark:text-cyan-500 uppercase tracking-widest mt-1">Live Global Feed</p>
          </div>
          {user && (
            <div className="hidden md:flex items-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-200">
              <div className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-green-500/10 border border-emerald-200 dark:border-green-500/20 text-emerald-700 dark:text-green-400 text-xs flex items-center gap-2 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-green-400 animate-pulse"></div>
                Connected
              </div>
            </div>
          )}
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 xl:p-12 relative z-10 w-full h-full">
          <Outlet context={{ isDarkMode }} />
        </div>
      </main>

      {/* Chat Widget */}
      <ChatWidget isDarkMode={isDarkMode} />
    </div>
  );
}
