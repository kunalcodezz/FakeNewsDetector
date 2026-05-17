import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserHistory, HistoryItem } from '../services/db';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ShieldAlert, Activity, FileText, AlertTriangle } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getUserHistory(user.uid).then(data => {
        setHistory(data);
        setIsLoading(false);
      });
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
      </div>
    );
  }

  // Calculate stats
  const totalScans = history.length;
  const fakeCount = history.filter(h => h.isFake).length;
  const realCount = totalScans - fakeCount;
  const avgConfidence = totalScans > 0 
    ? Math.round(history.reduce((acc, curr) => acc + curr.confidence, 0) / totalScans)
    : 0;

  // Prepare Pie Chart Data
  const pieData = [
    { name: 'Suspicious', value: fakeCount, color: '#F43F5E' },
    { name: 'Verified', value: realCount, color: '#10B981' },
  ];

  // Prepare Bar Chart Data (Last 7 days)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), i);
    return {
      date: d,
      name: format(d, 'EEE'),
      fake: 0,
      real: 0,
    };
  }).reverse();

  history.forEach(item => {
    if (!item.timestamp) return;
    const itemDate = item.timestamp.toDate();
    const dayData = last7Days.find(d => 
      itemDate >= startOfDay(d.date) && itemDate <= endOfDay(d.date)
    );
    
    if (dayData) {
      if (item.isFake) dayData.fake++;
      else dayData.real++;
    }
  });

  const stats = [
    { label: 'Total Analyses', value: totalScans, icon: Activity, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
    { label: 'Suspicious', value: fakeCount, icon: AlertTriangle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10' },
    { label: 'Verified', value: realCount, icon: ShieldAlert, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Avg Confidence', value: `${avgConfidence}%`, icon: FileText, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10' }
  ];

  // Get current theme from document class
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="glass-card rounded-2xl p-6 relative overflow-hidden group border border-slate-200 dark:border-white/5"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full blur-2xl -mr-6 -mt-6 transition-transform group-hover:scale-150`}></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none`}>
                <stat.icon size={20} />
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">{stat.value}</div>
              <h3 className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Distribution Chart */}
        <div className="glass-card rounded-3xl p-8 relative overflow-hidden border border-slate-200 dark:border-white/5">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400"></span>
            Content Distribution
          </h3>
          <div className="h-[280px]">
            {totalScans > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    stroke={isDark ? "rgba(15, 23, 42, 0.6)" : "rgba(255, 255, 255, 0.8)"}
                    strokeWidth={4}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', 
                      borderRadius: '12px', 
                      fontSize: '13px', 
                      backdropFilter: 'blur(10px)', 
                      color: isDark ? '#fff' : '#0f172a' 
                    }}
                    itemStyle={{ color: isDark ? '#F8FAFC' : '#334155' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '20px', color: isDark ? '#94A3B8' : '#64748b' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-mono text-xs uppercase tracking-widest">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Activity Chart */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-8 relative overflow-hidden border border-slate-200 dark:border-white/5">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400"></span>
            Activity Overview <span className="text-slate-500 font-mono text-[10px] ml-2 tracking-widest">(LAST 7 DAYS)</span>
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? '#94A3B8' : '#64748b', fontSize: 12, fontFamily: 'JetBrains Mono' }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? '#94A3B8' : '#64748b', fontSize: 12, fontFamily: 'JetBrains Mono' }}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', 
                    borderRadius: '12px', 
                    fontSize: '13px', 
                    backdropFilter: 'blur(10px)', 
                    color: isDark ? '#fff' : '#0f172a' 
                  }}
                  cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }}
                />
                <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '20px', color: isDark ? '#94A3B8' : '#64748b' }} />
                <Bar dataKey="fake" name="Suspicious" stackId="a" fill="#F43F5E" radius={[0, 0, 6, 6]} barSize={32} />
                <Bar dataKey="real" name="Verified" stackId="a" fill="#10B981" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
