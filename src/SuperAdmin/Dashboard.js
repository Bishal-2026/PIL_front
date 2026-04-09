import React, { useEffect, useState, useRef } from "react";
import Sidebar from "../Dashboardsidebaarmenu/Dashboardmenu.js";
import Header from "./header.js";
import Footer from "./footer.js";
import { getData } from "../Helpers/api.js";
import { motion, AnimatePresence, useSpring, useTransform, animate } from "framer-motion";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, AreaChart, Area,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
// import "../../src/App.css ";
import { CheckCircle2, AlertTriangle, HardHat, Construction } from "lucide-react";

const domainpath = process.env.REACT_APP_API_DOMAIN_ENDPOINT;

const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(Math.floor(latest)),
    });
    return () => controls.stop();
  }, [value]);

  return <span>{displayValue}</span>;
};

const SuperAdminDashboard = () => {
  // console.log("SuperAdminDashboard");
  const [loading, setLoading] = useState(true);
  const [hoveredAnalytics, setHoveredAnalytics] = useState(null);
  const [summary, setSummary] = useState({
    employees: 0,
    visitors: 0,
    monthlyReports: 0,
    totalActivities: 0,
    todayActivities: 0,
    loggedIn: 0,
    loggedOut: 0,
    todayLoggedIn: 0,
    todayLoggedOut: 0,
    visitorStats: { total: 0, approved: 0, pending: 0 },
    recentVisitors: [],
    maintenance: { total: 0, pending: 0, activePermits: 0 },
    last7DaysAttendance: []
  });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const [summaryRes, visitorRes, mntRes, permitRes] = await Promise.all([
          getData("/dashboard/summary"),
          getData("/visitorlogs", { 
            limit: 10,
            status: ["Approved", "CheckedIn", "CheckedOut", "Rescheduled"]
          }),
          getData("/maintenance/tickets"),
          getData("/workpermit/all")
        ]);
        
        if (summaryRes?.status && summaryRes?.data) {
          setSummary({
            ...summaryRes.data,
            recentVisitors: visitorRes.status ? visitorRes.data : [],
            maintenance: {
                total: mntRes.status ? mntRes.data.length : 0,
                pending: mntRes.status ? mntRes.data.filter(t => t.status === 'Pending').length : 0,
                activePermits: permitRes.status ? permitRes.data.filter(p => p.status === 'Approved').length : 0
            }
          });
        }
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };
    fetchSummary();
  }, []);

  const VIOLATION_COLORS = ['#EF4444', '#F59E0B', '#FBBF24']; // Red, Orange, Yellow

  const violationsData = [
    { name: 'Historical', value: Math.max(0, summary.totalActivities - summary.todayActivities) },
    { name: 'Today', value: Math.max(0, summary.todayActivities) },
  ];

  const totalUsers = (summary.employees || 0) + (summary.visitors || 0);
  const employeePerc = totalUsers > 0 ? Math.round((summary.employees / totalUsers) * 100) : 0;
  const visitorPerc = totalUsers > 0 ? Math.round((summary.visitors / totalUsers) * 100) : 0;
  const displayedAnalytics = {
    loggedIn: summary.loggedIn || 0,
    loggedOut: summary.loggedOut || 0,
  };

  const SkeletonCard = () => (
    <div className="bg-white/40 backdrop-blur-md p-6 rounded-[14px] shadow-sm animate-pulse h-[440px]">
      <div className="h-3 w-20 bg-slate-100/50 rounded mb-4"></div>
      <div className="h-5 w-32 bg-slate-100/50 rounded mb-6"></div>
      <div className="h-12 w-24 bg-slate-100/50 rounded mb-10"></div>
      <div className="space-y-4">
        <div className="h-4 bg-slate-50/50 rounded w-full"></div>
        <div className="h-4 bg-slate-50/50 rounded w-full"></div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .dashboard-ui { 
          font-family: 'Inter', sans-serif; 
          -webkit-font-smoothing: antialiased;
          overflow: hidden;
        }
        .card-premium { 
          background: rgba(255, 255, 255, 0.7); 
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.5); 
          transition: border 0.3s ease, shadow 0.3s ease;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          position: relative;
        }
        .inner-glow {
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.03);
        }
        .bg-noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E");
        }
      `}</style>
      
      <div className="dashboard-ui min-h-screen relative bg-[#f8fafc] pb-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-100/20 blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -45, 0],
              x: [0, -50, 0],
              y: [0, 100, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[20%] -right-[5%] w-[35%] h-[35%] rounded-full bg-indigo-100/20 blur-[100px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -30, 0],
              y: [0, -80, 0],
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[10%] left-[20%] w-[45%] h-[45%] rounded-full bg-purple-100/10 blur-[150px]"
          />
          <div className="absolute inset-0 bg-noise opacity-30"></div>
        </div>

        <div className="relative z-10 w-full mx-auto px-6 lg:px-10 pt-8">
          
          {/* Header with Motion */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 p-6 rounded-[24px] bg-white/40 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex items-center justify-between gap-4 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500/50"></div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50/80 flex items-center justify-center border border-indigo-100/50 shadow-inner">
                <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  System Dashboard
                </h1>
                <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Real-time Command Center</p>
              </div>
            </div>

            <div className="flex gap-4">
                 <div onClick={() => window.location.href='/dashboard/maintenance'} className="bg-white/60 hover:bg-white/80 transition-all p-4 rounded-2xl shadow-sm border border-white/50 flex items-center gap-4 px-6 cursor-pointer">
                     <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <Construction size={20} />
                     </div>
                     <div className="hidden sm:block">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Maintenance</p>
                        <p className="text-sm font-black text-slate-700">{summary.maintenance?.pending} Pending</p>
                     </div>
                 </div>
                 <div onClick={() => window.location.href='/dashboard/permit-approvals'} className="bg-white/60 hover:bg-white/80 transition-all p-4 rounded-2xl shadow-sm border border-white/50 flex items-center gap-4 px-6 cursor-pointer">
                     <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <HardHat size={20} />
                     </div>
                     <div className="hidden sm:block">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Permits</p>
                        <p className="text-sm font-black text-slate-700">{summary.maintenance?.activePermits} Active</p>
                     </div>
                 </div>
            </div>
          </motion.header>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, staggerChildren: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
              >
                
                {/* 1. User Distribution Card */}
                <motion.div 
                  whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08)" }}
                  className="card-premium p-7 rounded-[24px] flex flex-col h-[480px]"
                >
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span> Assets
                      </p>
                      <h2 className="text-[20px] font-black text-slate-800 tracking-tight">Total Platform Users</h2>
                    </div>
                  </div>
                  
                  <div className="mb-10 relative">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[56px] font-black text-slate-900 leading-none tracking-tighter">
                        <AnimatedNumber value={totalUsers} />
                      </span>
                      <span className="text-[12px] font-bold text-emerald-500 bg-emerald-50/80 px-2 py-1 rounded-lg flex items-center gap-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                        12%
                      </span>
                    </div>
                    <p className="text-[14px] font-semibold text-slate-400 mt-2 tracking-wide uppercase text-[10px]">
                      Active Platform Access
                    </p>
                  </div>

                  <div className="mt-auto space-y-6">
                    <div className="bg-white/40 p-5 rounded-2xl border border-white/50 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                          <span className="text-[14px] font-bold text-slate-700 uppercase tracking-wider">Employees</span>
                        </div>
                        <span className="text-[14px] font-black text-slate-900">{employeePerc}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100/50 rounded-full overflow-hidden inner-glow">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${employeePerc}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                        ></motion.div>
                      </div>
                    </div>

                    <div className="bg-white/40 p-5 rounded-2xl border border-white/50 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                          <span className="text-[14px] font-bold text-slate-700 uppercase tracking-wider">Visitors</span>
                        </div>
                        <span className="text-[14px] font-black text-slate-900">{visitorPerc}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100/50 rounded-full overflow-hidden inner-glow">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${visitorPerc}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                        ></motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* 2. Violations Card */}
                <motion.div 
                  whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08)" }}
                  className="card-premium p-7 rounded-[24px] flex flex-col h-[480px] relative"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-full">
                      <p className="text-[11px] font-black text-rose-400 uppercase tracking-[0.2em] mb-2 leading-none flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span> Security
                      </p>
                      <h2 className="text-[20px] font-black text-slate-800 leading-tight tracking-tight">System Alerts</h2>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center justify-center relative">
                    <div className="relative w-[210px] h-[210px] flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-rose-100/20 blur-3xl animate-pulse"></div>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Reports', value: summary.totalActivities || 1 },
                              { name: 'Gap', value: Math.max(0, 100 - (summary.totalActivities || 0)) }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={82}
                            outerRadius={92}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={100}
                            animationDuration={2000}
                            animationBegin={200}
                          >
                            <Cell fill="url(#violationGrad)" />
                            <Cell fill="rgba(241, 245, 249, 0.6)" />
                          </Pie>
                          <defs>
                            <linearGradient id="violationGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f43f5e" />
                              <stop offset="100%" stopColor="#e11d48" />
                            </linearGradient>
                          </defs>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[52px] font-black text-slate-900 tracking-tighter leading-none">
                          <AnimatedNumber value={summary.totalActivities} />
                        </span>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 opacity-80">Flags</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full mt-6 pt-10 pb-4 border-t border-slate-100/50 flex items-center justify-between">
                    <div className="flex-1 flex flex-col items-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">Historical</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[32px] font-black text-slate-900 leading-none tracking-tighter">
                          <AnimatedNumber value={summary.totalActivities - summary.todayActivities} />
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">TOT</span>
                      </div>
                    </div>
                    
                    <div className="h-12 w-[1.5px] bg-slate-100/50"></div>
                    
                    <div className="flex-1 flex flex-col items-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">Real-time</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[32px] font-black text-rose-500 leading-none tracking-tighter">
                          <AnimatedNumber value={summary.todayActivities} />
                        </span>
                        <span className="text-[11px] font-bold text-rose-400">ACT</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* 3. Device Trends Card */}
                <motion.div 
                  whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08)" }}
                  className="card-premium p-7 rounded-[24px] flex flex-col h-[480px]"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span> Network
                      </p>
                      <h2 className="text-[20px] font-black text-slate-800 tracking-tight">Active Analytics</h2>
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full mt-4 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={summary.last7DaysAttendance}
                        margin={{ top: 20, right: 10, left: -20, bottom: 48 }}
                        onMouseMove={(state) => {
                          if (!state?.isTooltipActive || !state?.activePayload?.length) return;
                          const loggedInValue = state.activePayload.find((item) => item.dataKey === "loggedIn")?.value || 0;
                          const loggedOutValue = state.activePayload.find((item) => item.dataKey === "loggedOut")?.value || 0;
                          setHoveredAnalytics({
                            label: state.activeLabel || "",
                            loggedIn: loggedInValue,
                            loggedOut: loggedOutValue,
                          });
                        }}
                        onMouseLeave={() => setHoveredAnalytics(null)}
                      >
                        <defs>
                          <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="sGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" hide={true} />
                        <YAxis hide={true} />
                        <Tooltip 
                          cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '6 6' }}
                          wrapperStyle={{ zIndex: 30 }}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const loggedInValue = payload.find((item) => item.dataKey === "loggedIn")?.value || 0;
                              const loggedOutValue = payload.find((item) => item.dataKey === "loggedOut")?.value || 0;
                              return (
                                <div className="min-w-[190px] rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
                                  <p className="mb-3 border-b border-slate-100 pb-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                                    {label}
                                  </p>
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between gap-6 rounded-xl bg-indigo-50 px-3 py-2">
                                      <div className="flex items-center gap-2.5">
                                        <div className="h-2.5 w-2.5 rounded-full bg-indigo-500"></div>
                                        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-600">Logged In</span>
                                      </div>
                                      <span className="text-[15px] font-black text-indigo-600">{loggedInValue}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-6 rounded-xl bg-emerald-50 px-3 py-2">
                                      <div className="flex items-center gap-2.5">
                                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
                                        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-600">Logged Out</span>
                                      </div>
                                      <span className="text-[15px] font-black text-emerald-600">{loggedOutValue}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="loggedIn" 
                          stroke="#6366f1" 
                          strokeWidth={4} 
                          fillOpacity={1} 
                          fill="url(#pGrad)" 
                          dot={{ r: 5, fill: '#fff', stroke: '#6366f1', strokeWidth: 3 }}
                          activeDot={{ r: 8, fill: '#6366f1', stroke: '#fff', strokeWidth: 3 }}
                          animationDuration={2500}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="loggedOut" 
                          stroke="#10b981" 
                          strokeWidth={4} 
                          fillOpacity={1} 
                          fill="url(#sGrad)" 
                          dot={{ r: 5, fill: '#fff', stroke: '#10b981', strokeWidth: 3 }}
                          activeDot={{ r: 8, fill: '#10b981', stroke: '#fff', strokeWidth: 3 }}
                          animationDuration={2500}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          iconType="circle"
                          iconSize={10}
                          height={68}
                          wrapperStyle={{ paddingTop: 18 }}
                          formatter={(v) => <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{v}</span>}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100/70 grid grid-cols-2 gap-3">
                    <div className="m-0 rounded-2xl bg-indigo-50/60 border border-indigo-100/70 px-2 py-3">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.18em] mb-2 leading-tight">
                        Today Active Users
                      </p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[28px] font-black text-indigo-600 leading-none tracking-tighter">
                          <AnimatedNumber value={displayedAnalytics.loggedIn} />
                        </span>
                        <span className="text-[11px] font-bold text-indigo-300">USER</span>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100/70 px-4 py-3">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.18em] mb-2">
                        Today Logged Out
                      </p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[28px] font-black text-emerald-600 leading-none tracking-tighter">
                          <AnimatedNumber value={displayedAnalytics.loggedOut} />
                        </span>
                        <span className="text-[11px] font-bold text-emerald-300">USER</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* 4. Recent Visitors Card */}
                <motion.div 
                  whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08)" }}
                  className="card-premium p-7 rounded-[24px] flex flex-col h-[480px] col-span-1 md:col-span-3"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <p className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Visitors
                      </p>
                      <h2 className="text-[20px] font-black text-slate-800 tracking-tight">Recent Guest Activity</h2>
                    </div>
                    <button onClick={() => window.location.href='/dashboard/users/visitors'} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline px-4 py-2 bg-indigo-50 rounded-xl">View All</button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-hidden">
                    {(summary.recentVisitors || []).map((visitor, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        key={visitor._id} 
                        className="bg-white/60 border border-white/80 p-4 rounded-3xl flex flex-col items-center text-center shadow-sm"
                      >
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 mb-3 overflow-hidden border-2 border-white shadow-inner">
                          {visitor.visitorImage ? (
                            <img src={visitor.visitorImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-black">
                                {visitor.visitorName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <h4 className="text-sm font-black text-slate-800 line-clamp-1 truncate w-full">{visitor.visitorName}</h4>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase mt-1 line-clamp-1">
                          {visitor.status === "Rescheduled" ? `Later: ${visitor.rescheduleReason}` : visitor.reason}
                        </p>
                        <div className="mt-3 w-full pt-3 border-t border-slate-50 flex items-center justify-between">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                                visitor.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                                visitor.status === 'Rescheduled' ? 'bg-purple-100 text-purple-600' :
                                visitor.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                                'bg-slate-100 text-slate-500'
                            }`}>{visitor.status}</span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {visitor.status === "Rescheduled" ? (
                                <span className="flex flex-col items-end">
                                  <span>{new Date(visitor.rescheduleDate).toLocaleDateString()}</span>
                                  <span className="text-[8px] font-black text-indigo-500">{visitor.rescheduleTime}</span>
                                </span>
                              ) : new Date(visitor.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                      </motion.div>
                    ))}
                    {(summary.recentVisitors || []).length === 0 && (
                        <div className="col-span-full py-20 text-center text-slate-400">
                            <p className="text-sm font-bold italic">No visitor activity recorded today.</p>
                        </div>
                    )}
                  </div>
                </motion.div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </>
  );
};

export default SuperAdminDashboard;
