import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserHistory, HistoryItem } from '../services/db';
import { format } from 'date-fns';
import { ShieldAlert, CheckCircle, AlertTriangle, ExternalLink, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function History() {
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card rounded-3xl p-8 relative overflow-hidden border border-slate-200 dark:border-white/10"
      >
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-full bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center border border-cyan-200 dark:border-cyan-500/20">
            <Activity className="text-cyan-600 dark:text-cyan-400" size={16} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">Analysis Log</h3>
        </div>
        
        {history.length === 0 ? (
          <div className="text-center py-20 border border-slate-200 dark:border-white/5 rounded-2xl bg-slate-50 dark:bg-white/[0.02]">
            <ShieldAlert className="mx-auto text-slate-400 dark:text-slate-600 mb-4" size={48} />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No telemetry recorded</h3>
            <p className="text-sm text-slate-500 mt-2">Initialize your first fact-check scan to populate this log.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10">
                  <th className="px-4 py-4 text-[11px] uppercase tracking-widest text-slate-500 font-mono font-semibold">Content Segment</th>
                  <th className="px-4 py-4 text-[11px] uppercase tracking-widest text-slate-500 font-mono font-semibold">Model Status</th>
                  <th className="px-4 py-4 text-[11px] uppercase tracking-widest text-slate-500 font-mono font-semibold">Confidence</th>
                  <th className="px-4 py-4 text-[11px] uppercase tracking-widest text-slate-500 font-mono font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {history.map((item, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    key={item.id} 
                    className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300 max-w-[350px] truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      {item.input}
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border shadow-sm dark:shadow-none",
                        item.isFake 
                          ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 dark:shadow-[0_0_10px_rgba(244,63,94,0.1)]" 
                          : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 dark:shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                      )}>
                        {item.isFake ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                        {item.isFake ? 'Suspicious' : 'Verified'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{item.confidence}%</span>
                        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full", item.isFake ? "bg-rose-500" : "bg-emerald-500")}
                            style={{ width: `${item.confidence}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-mono text-slate-500">
                      {item.timestamp ? format(item.timestamp.toDate(), 'yyyy.MM.dd HH:mm:ss') : 'LIVE'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
