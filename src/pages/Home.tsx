import React, { useState } from 'react';
import { Search, ShieldAlert, AlertTriangle, CheckCircle, Activity, FileText, Sparkles, Globe } from 'lucide-react';
import { analyzeNews, AnalysisResult } from '../services/ai';
import { saveAnalysis } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Home() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    setIsAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const analysis = await analyzeNews(input);
      setResult(analysis);
      await saveAnalysis(user.uid, input, analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero / Input Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card rounded-3xl p-8 md:p-10 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Globe size={180} />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles size={14} />
            <span>AI-Powered Fact Checking</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            Verify the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 dark:from-cyan-400 to-indigo-500 dark:to-indigo-400">Truth</span> Instantly.
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed mb-8">
            Paste an article URL or text snippet below. Our forensic AI will analyze linguistic patterns, cross-reference sources, and detect deceptive framing in real-time.
          </p>
          
          <form onSubmit={handleAnalyze} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-500"></div>
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="https://news-source.com/article/view or paste text here..."
                className="w-full h-[140px] bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none text-base shadow-inner"
              />
              
              <div className="absolute bottom-4 right-4">
                <button
                  type="submit"
                  disabled={isAnalyzing || !input.trim()}
                  className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-lg overflow-hidden group/btn"
                >
                  <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
                  {isAnalyzing ? (
                    <>
                      <Activity className="animate-pulse" size={18} />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Execute Scan
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              {error}
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Results Section */}
      {result && (
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card rounded-3xl p-8 border border-slate-200 dark:border-white/10"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-slate-200 dark:border-white/5 gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Scan Results</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Forensic breakdown of provided content</p>
            </div>
            <div className={cn(
              "px-4 py-2 rounded-full text-sm font-bold tracking-widest uppercase flex items-center gap-2 shadow-sm dark:shadow-lg",
              result.isFake 
                ? "bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 dark:shadow-[0_0_15px_rgba(244,63,94,0.3)]" 
                : "bg-emerald-50 dark:bg-green-500/20 text-emerald-600 dark:text-green-400 border border-emerald-200 dark:border-green-500/30 dark:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            )}>
              {result.isFake ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
              {result.isFake ? 'High Risk' : 'Verified'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Score Card */}
            <div className="bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-[10px] font-mono uppercase text-cyan-600 dark:text-cyan-500 tracking-widest mb-3">Model Confidence</div>
              <div className="text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tighter shadow-slate-300 dark:shadow-black drop-shadow-md">
                {result.confidence}<span className="text-2xl text-slate-500 tracking-normal">%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${result.confidence}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn("h-full relative", result.isFake ? "bg-red-500" : "bg-emerald-500")} 
                >
                  <div className="absolute inset-0 bg-white/30 w-full h-full"></div>
                </motion.div>
              </div>
            </div>

            {/* Explanation Card */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-slate-100/50 dark:bg-slate-950/30 rounded-2xl p-6 border border-slate-200 dark:border-slate-800/50">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Activity size={16} className="text-cyan-600 dark:text-cyan-400" />
                  Forensic Analysis
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {result.explanation}
                </p>
              </div>

              {result.suspiciousWords.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono uppercase text-slate-500 tracking-widest mb-3">Detected Flags</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.suspiciousWords.map((word, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {/* Features Grid */}
      {!result && !isAnalyzing && (
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          {[
            { icon: FileText, title: 'Deep Text Analysis', desc: 'Detect AI generation patterns and linguistic anomalies in real-time.', color: 'cyan' },
            { icon: Globe, title: 'Source Verification', desc: 'Cross-reference domains against trusted global intelligence databases.', color: 'indigo' },
            { icon: AlertTriangle, title: 'Bias Detection', desc: 'Highlight sentiment manipulation and deceptive structural framing.', color: 'rose' }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="glass-card rounded-2xl p-6 relative overflow-hidden group border border-slate-200 dark:border-white/5"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-${feature.color}-500/5 dark:bg-${feature.color}-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150`}></div>
              <div className={`w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-5 relative z-10 shadow-sm dark:shadow-none`}>
                <feature.icon className={`text-${feature.color}-500 dark:text-${feature.color}-400`} size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 relative z-10">{feature.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed relative z-10">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.section>
      )}
    </div>
  );
}
