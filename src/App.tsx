import React, { useState, useMemo, useEffect } from 'react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Plane, Scale, TrendingUp, AlertTriangle, Calculator, CalendarDays, Coins, ShieldCheck } from 'lucide-react';

const THEME = {
  navy: '#0B1121',
  navyLight: '#1E293B',
  maroon: '#8A1538',
  maroonHover: '#6D0F2B',
  gold: '#D4AF37',
  muted: '#94A3B8'
};

export default function App() {
  const [salaryStr, setSalaryStr] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [vacationDays, setVacationDays] = useState<number | ''>('');
  
  const [hasIncreasedDays, setHasIncreasedDays] = useState(false);
  const [increasedMultiplier, setIncreasedMultiplier] = useState(28);

  const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/QAR')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          setExchangeRates(data.rates);
        }
      })
      .catch(err => console.error('Failed to fetch exchange rates', err));
  }, []);

  // Logic Engine - Zero Token Math
  const calculations = useMemo(() => {
    const salary = Number(salaryStr.replace(/,/g, ''));
    const defaultRes = {
      days: 0,
      years: 0,
      gratuity: 0,
      vacationPayout: 0,
      total: 0,
      isEligible: true,
      fiveYearProjection: 0
    };

    if (!salary || !startDate || !endDate) return defaultRes;

    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return defaultRes;

    const days = differenceInDays(end, start);
    
    if (days < 0) return defaultRes;

    const years = days / 365;
    const isEligible = days >= 365;
    const dailyRate = Number(salary) / 30;

    // The 365-Day Lock
    let gratuity = 0;
    if (isEligible) {
      if (years > 5 && hasIncreasedDays) {
        gratuity = (dailyRate * 21 * 5) + (dailyRate * increasedMultiplier * (years - 5));
      } else {
        gratuity = dailyRate * 21 * years;
      }
    }

    const vacationVal = Number(vacationDays) || 0;
    const vacationPayout = dailyRate * vacationVal;

    const total = gratuity + vacationPayout;

    // Projected 5-Year Payout
    const fiveYearGratuity = (dailyRate * 21 * 5);
    const fiveYearTotal = fiveYearGratuity + vacationPayout;

    return {
      days,
      years,
      gratuity,
      vacationPayout,
      total,
      isEligible,
      fiveYearProjection: fiveYearTotal
    };
  }, [salaryStr, startDate, endDate, vacationDays, hasIncreasedDays, increasedMultiplier]);

  const chartData = useMemo(() => {
    if (calculations.total === 0) return [];
    
    const yearsDisplay = calculations.years.toFixed(1);
    
    return [
      {
        name: `Current (${yearsDisplay} yrs)`,
        value: Math.round(calculations.total),
        fill: THEME.maroon
      },
      {
        name: 'At 5 Years',
        value: Math.round(calculations.fiveYearProjection),
        fill: THEME.gold
      }
    ];
  }, [calculations]);

  return (
    <div className="min-h-screen bg-[#0B1121] text-[#F8FAFC] font-sans selection:bg-[#8A1538] selection:text-white pb-24">
      {/* Header */}
      <header className="h-16 flex items-center justify-between border-b border-white/10 px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#8A1538] flex items-center justify-center shadow-lg border border-[#D4AF37]/30">
            <Calculator className="text-white w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">QatarEOS <span className="font-light opacity-60">Pro</span></h1>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 lg:p-8 overflow-hidden max-w-[1200px] mx-auto w-full">
          
          {/* Left Column - Inputs */}
          <div className="col-span-1 lg:col-span-4 flex flex-col gap-4">
            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-slate-300 p-4 rounded-xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-[#D4AF37]" />
              <p className="text-xs leading-relaxed opacity-90">
                <strong className="font-medium inline text-[#D4AF37]">100% Private:</strong> All calculations happen securely on your device. We do not see or store your data.
              </p>
            </div>

            <div className="bg-[#1E293B]/50 border border-white/10 p-6 rounded-xl flex-1 flex flex-col">
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-6 text-slate-400">
                Contract Details
              </h2>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400">Basic Monthly Salary (QAR) *</label>
                  <input 
                    type="text" 
                    value={salaryStr}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9.]/g, '');
                      if (rawValue) {
                        const parts = rawValue.split('.');
                        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                        setSalaryStr(parts.join('.'));
                      } else {
                        setSalaryStr('');
                      }
                    }}
                    className="w-full bg-[#0F172A]/80 border border-white/20 rounded-lg px-4 py-2.5 text-white font-mono focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    placeholder="e.g. 15,000"
                  />
                  <span className="text-[10px] text-slate-500">Enter basic salary only, excluding allowances.</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400">Start Date *</label>
                    <input 
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-[#0F172A]/80 border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all color-scheme-dark"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400">End Date *</label>
                    <input 
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-[#0F172A]/80 border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all color-scheme-dark"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400">Unused Vacation Days</label>
                  <input 
                    type="number" 
                    value={vacationDays}
                    onChange={(e) => setVacationDays(Number(e.target.value))}
                    className="w-full bg-[#0F172A]/80 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    placeholder="e.g. 14"
                  />
                </div>

                <AnimatePresence>
                  {calculations.years > 5 && (
                    <motion.div 
                      key="fiveYearToggle"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="py-4 border-t border-white/5 mt-2">
                        <label className="flex items-center justify-between cursor-pointer group">
                          <span className="text-sm font-medium hover:text-[#D4AF37] transition-colors max-w-[200px] leading-snug">Does your contract increase gratuity days after 5 years?</span>
                          <div className={`relative inline-block w-10 h-5 rounded-full transition-colors duration-300 shrink-0 ${hasIncreasedDays ? 'bg-[#D4AF37]' : 'bg-[#0F172A] border border-white/20'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${hasIncreasedDays ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                          </div>
                          <input type="checkbox" className="sr-only" checked={hasIncreasedDays} onChange={(e) => setHasIncreasedDays(e.target.checked)} />
                        </label>
                        
                        <AnimatePresence>
                          {hasIncreasedDays && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              <div className="mt-4 flex flex-col gap-1.5">
                                <label className="text-xs text-[#94A3B8]">Days per year (after 5 years)</label>
                                <select 
                                  value={increasedMultiplier}
                                  onChange={(e) => setIncreasedMultiplier(Number(e.target.value))}
                                  className="w-full bg-[#0F172A]/80 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-all"
                                >
                                  <option value={21}>21 Days</option>
                                  <option value={28}>28 Days</option>
                                  <option value={30}>30 Days</option>
                                </select>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center border border-white/10 shadow-2xl relative overflow-hidden">
              {/* Background Accent */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37] opacity-5 blur-[100px] rounded-full pointer-events-none"></div>

              <div className="relative z-10 flex flex-col">
                <h2 className="text-slate-300 text-xs uppercase tracking-widest font-semibold mb-1">Total Final Payout</h2>
                
                <div className="flex items-baseline mb-2 md:mb-0">
                  <motion.div 
                    key={calculations.total}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-5xl lg:text-6xl font-bold tracking-tight text-[#D4AF37] tabular-nums"
                  >
                    {calculations.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </motion.div>
                  <span className="text-2xl font-light ml-2 text-[#D4AF37]">QAR</span>
                </div>
                
                {exchangeRates && (
                  <div className="flex items-center gap-2 mt-1 md:mt-2">
                    <span className="text-lg md:text-xl text-slate-300 font-medium">
                      ≈ {(calculations.total * (exchangeRates[selectedCurrency] || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <select 
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                      className="bg-[#0F172A]/80 border border-white/20 text-white text-xs rounded-md px-2 py-1 focus:outline-none focus:border-[#D4AF37] hover:border-[#D4AF37]/50 transition-colors cursor-pointer"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="INR">INR</option>
                      <option value="PHP">PHP</option>
                      <option value="CAD">CAD</option>
                      <option value="AUD">AUD</option>
                      <option value="AED">AED</option>
                      <option value="SAR">SAR</option>
                      <option value="BDT">BDT</option>
                      <option value="PKR">PKR</option>
                      <option value="LKR">LKR</option>
                      <option value="NGN">NGN</option>
                      <option value="ZAR">ZAR</option>
                    </select>
                  </div>
                )}
                
                <p className="text-sm text-green-400 mt-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span> 
                  {calculations.isEligible ? 'Eligible for Statutory Benefit' : 'Ineligible for Statutory Benefit'}
                </p>
              </div>

              {/* Breakdown */}
              <div className="mt-6 md:mt-0 md:text-right md:border-l md:border-white/10 md:pl-8 relative z-10">
                <p className="text-[10px] text-slate-500 uppercase mb-2">Service Breakdown</p>
                <p className="text-sm text-slate-300 mb-1">Base Gratuity: {calculations.gratuity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-sm text-slate-300">Vacation Pay: {calculations.vacationPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-slate-400 mt-2">{calculations.years.toFixed(2)} Years of Service</p>
              </div>
            </div>

            {/* Eligibility Warning */}
            <AnimatePresence>
              {!calculations.isEligible && startDate && endDate && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-start gap-3 bg-red-900/20 border border-red-500/30 text-red-200 p-4 rounded-xl"
                >
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-400 text-sm">Eligibility Warning</h4>
                    <p className="text-xs mt-1 leading-relaxed opacity-90">
                      Your tenure is less than 365 days. Under Qatar Labour Law, you are not entitled to end-of-service gratuity.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sub-grid: Chart & Lead Gen */}
            <div className="grid grid-cols-1 md:grid-cols-2 flex-1 gap-6 min-h-0">
              
              {/* The Stay vs. Go Chart */}
              <div className="bg-[#1E293B]/50 rounded-xl border border-white/10 p-6 flex flex-col shadow-xl">
                <h3 className="text-xs font-bold uppercase tracking-tighter mb-4">Stay vs. Go Projection</h3>
                <div className="text-[11px] text-slate-400 mb-4 italic text-center">💡 Compare your current payout vs reaching the 5-year loyalty mark.</div>
                
                <div className="h-48 w-full flex-1">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorMaroon" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="#8A1538" stopOpacity={1} />
                            <stop offset="100%" stopColor="#C41E4D" stopOpacity={1} />
                          </linearGradient>
                          <linearGradient id="colorGold" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="#D4AF37" stopOpacity={1} />
                            <stop offset="100%" stopColor="#F1D57F" stopOpacity={1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94A3B8" 
                          fontSize={10} 
                          axisLine={false} 
                          tickLine={false} 
                          dy={10} 
                        />
                        <YAxis 
                          tickFormatter={(val) => `${val / 1000}k`} 
                          stroke="#94A3B8" 
                          fontSize={10} 
                          axisLine={false} 
                          tickLine={false} 
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                          contentStyle={{ backgroundColor: '#0B1121', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                          itemStyle={{ color: '#D4AF37', fontWeight: 600 }}
                          formatter={(value: number) => [`QAR ${value.toLocaleString()}`, 'Payout']}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? "url(#colorMaroon)" : "url(#colorGold)"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl text-slate-500">
                      <CalendarDays className="w-8 h-8 mb-3 opacity-20" />
                      <span className="text-xs">Enter details to view</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lead Gen Cards Side Panel */}
              <div className="flex flex-col gap-4">
                <div className="bg-[#1E293B]/30 border border-white/5 border-l-4 border-l-[#8A1538]/50 p-4 rounded-xl flex items-center gap-4 transition-colors group cursor-not-allowed shadow-none relative overflow-hidden opacity-60">
                  <div className="absolute top-2 right-2 border border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full">
                    Coming Soon
                  </div>
                  <div className="w-10 h-10 bg-slate-800/50 rounded flex items-center justify-center shrink-0">
                    <Plane className="w-5 h-5 text-white/50" />
                  </div>
                  <div className="flex-1 pr-16">
                    <h4 className="text-xs font-bold text-white/50">Free Cargo Quotes</h4>
                    <p className="text-[10px] text-slate-400/70 mt-0.5">Relocating? Compare 3 best rates for Doha departures.</p>
                  </div>
                </div>

                <div className="bg-[#1E293B]/30 border border-white/5 border-l-4 border-l-blue-400/50 p-4 rounded-xl flex items-center gap-4 transition-colors group cursor-not-allowed shadow-none relative overflow-hidden opacity-60">
                  <div className="absolute top-2 right-2 border border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full">
                    Coming Soon
                  </div>
                  <div className="w-10 h-10 bg-slate-800/50 rounded flex items-center justify-center shrink-0">
                    <Scale className="w-5 h-5 text-white/50" />
                  </div>
                  <div className="flex-1 pr-16">
                    <h4 className="text-xs font-bold text-white/50">Labour Law Expert</h4>
                    <p className="text-[10px] text-slate-400/70 mt-0.5">Having HR issues? Talk to a specialist advisor today.</p>
                  </div>
                </div>

                <div className="bg-[#1E293B]/30 border border-white/5 border-l-4 border-l-[#D4AF37]/50 p-4 rounded-xl flex items-center gap-4 transition-colors group cursor-not-allowed shadow-none relative overflow-hidden opacity-60">
                  <div className="absolute top-2 right-2 border border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full">
                    Coming Soon
                  </div>
                  <div className="w-10 h-10 bg-slate-800/50 rounded flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5 text-white/50" />
                  </div>
                  <div className="flex-1 pr-16">
                    <h4 className="text-xs font-bold text-white/50">Invest Your Gratuity</h4>
                    <p className="text-[10px] text-slate-400/70 mt-0.5">See Qatar's top-performing savings rates & bonds.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </main>

      {/* Footer Bar */}
      <footer className="max-w-[1200px] mx-auto w-full px-6 lg:px-8 mt-4 flex flex-col md:flex-row items-center justify-between pb-8 gap-4">
        <div className="text-center md:text-left flex flex-col gap-1">
          <div className="text-[10px] text-slate-500">Qatar Labor Law (No. 14 of 2004) Compliance Engine</div>
          <div className="text-[9px] text-slate-600 max-w-lg">This tool provides estimates based on standard Qatar Labour Law and does not constitute legal or financial advice.</div>
        </div>
      </footer>
    </div>
  );
}
