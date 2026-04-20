import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
   Clock, Shield, Activity, Users, MapPin,
   Flame, AlertTriangle, CheckCircle2,
   Construction, Timer, Calendar, Info,
   Hash, User, Navigation, Layers, ShieldAlert,
   ArrowRightCircle, History, RotateCcw, ChevronRight, Briefcase, FileText, Phone, Award,
   Users2, HardHat, Link as LinkIcon, MapPin as MapPinIcon, Timer as TimerIcon
} from "lucide-react";
import { API } from "../../Helpers/api";

const TIMER_SUMMARY = 15000; // 15 sec
const TIMER_DETAIL = 12000;  // 12 sec per permit
const REFRESH_INTERVAL = 5000;



const WorkPermitTV = () => {
   const [permits, setPermits] = useState([]);
   const [currentScreen, setCurrentScreen] = useState("summary");
   const [activePermitIndex, setActivePermitIndex] = useState(0);
   const [currentTime, setCurrentTime] = useState(new Date());

   useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
   }, []);

   const fetchData = async () => {
      try {
         const res = await API.workpermit.getPublic();
         if (res.status) {
            const liveData = res.data.map(p => ({
               ...p,
               permitId: p.permitId || p.id,
               startTimeDisplay: new Date(p.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
               endTimeDisplay: new Date(p.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
               risk: p.riskLevel || "Low",
               safetyChecks: p.safetyChecks || {}
            }));
            setPermits(liveData);
         } else { setPermits([]); }
      } catch (e) { setPermits([]); }
   };

   useEffect(() => {
      fetchData();
      const interval = setInterval(fetchData, REFRESH_INTERVAL);
      return () => clearInterval(interval);
   }, []);

   useEffect(() => {
      if (permits.length === 0) return;
      let timer;
      if (currentScreen === "summary") {
         timer = setTimeout(() => { setCurrentScreen("detail"); setActivePermitIndex(0); }, TIMER_SUMMARY);
      } else {
         timer = setTimeout(() => {
            if (activePermitIndex < permits.length - 1) { setActivePermitIndex(i => i + 1); }
            else { setCurrentScreen("summary"); }
         }, TIMER_DETAIL);
      }
      return () => clearTimeout(timer);
   }, [currentScreen, activePermitIndex, permits.length]);

   const currentPermit = useMemo(() => permits[activePermitIndex] || {}, [permits, activePermitIndex]);

   const getRiskStyles = (risk) => {
      switch (risk?.toLowerCase()) {
         case 'high': return { bg: 'bg-red-500', text: 'text-white', light: 'bg-red-50', border: 'border-red-200', shadow: 'shadow-red-200', textPlain: 'text-red-500' };
         case 'medium': return { bg: 'bg-amber-500', text: 'text-white', light: 'bg-amber-50', border: 'border-amber-200', shadow: 'shadow-amber-100', textPlain: 'text-amber-500' };
         default: return { bg: 'bg-emerald-500', text: 'text-white', light: 'bg-emerald-50', border: 'border-emerald-200', shadow: 'shadow-emerald-100', textPlain: 'text-emerald-500' };
      }
   };

   const getStatusStyles = (status) => {
      switch (status?.toLowerCase()) {
         case 'active': return { bg: 'bg-emerald-500', text: 'text-white', light: 'bg-emerald-50', textPlain: 'text-emerald-600', icon: '✅' };
         case 'pending': return { bg: 'bg-orange-500', text: 'text-white', light: 'bg-orange-50', textPlain: 'text-orange-500', icon: '⏳' };
         case 'closed': return { bg: 'bg-slate-400', text: 'text-white', light: 'bg-slate-50', textPlain: 'text-slate-500', icon: '📁' };
         default: return { bg: 'bg-slate-500', text: 'text-white', light: 'bg-slate-50', textPlain: 'text-slate-500', icon: 'ℹ️' };
      }
   }

   return (
      <div className="fixed inset-0 bg-[#F1F5F9] text-slate-800 font-['Outfit'] overflow-hidden flex flex-col h-screen w-screen">

         {/* 🏙️ GLOBAL TOP HEADER */}
         <header className="bg-white border-b border-slate-200 py-3 px-12 flex justify-between items-center h-[80px] shadow-sm relative z-20">
            <div className="flex items-center gap-4">
               <div className="p-2 bg-blue-600 rounded-xl shadow-md ring-2 ring-blue-50">
                  <Shield className="w-6 h-6 text-white" />
               </div>
               <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">PIL <span className="text-blue-600 uppercase">Safety</span></h1>
                  <p className="text-[8px] font-bold text-slate-400 tracking-[0.2em] mt-0.5 uppercase">Mission Control Center</p>
               </div>
            </div>

            <div className="flex flex-col items-center">
               <h2 className="text-4xl font-mono font-black tracking-tighter text-slate-800">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
               </h2>
               <div className="flex items-center gap-2 text-slate-400 font-black uppercase mt-0.5 tracking-[0.2em] text-[8px]">
                  <Calendar className="w-2.5 h-2.5 text-blue-600" />
                  {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
               </div>
            </div>

            <div className="flex items-center gap-6">
               <div className="text-right">
                  <label className="text-[8px] font-black text-slate-300 tracking-[0.2em] block mb-0.5 uppercase">TOTAL ENTRIES</label>
                  <div className="text-3xl font-mono font-black text-blue-600 leading-none">
                     {permits.length.toString().padStart(2, '0')}
                  </div>
               </div>
               <div className="h-10 w-px bg-slate-200" />
               <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 flex flex-col items-end">
                  <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none mb-0.5">DATA SYNC</span>
                  <span className="text-xs font-black text-blue-600 uppercase">
                     {currentScreen === 'summary' ? 'Operational Registry' : `Entry ${activePermitIndex + 1}/${permits.length}`}
                  </span>
               </div>
            </div>
         </header>

         {/* 📊 CONTENT VIEWPORT */}
         <main className="flex-1 p-6 flex flex-col overflow-hidden relative">
            <AnimatePresence mode="wait">

               {currentScreen === "summary" ? (
                  /* --- SCREEN 1: MODERN PREMIUM TABLE (RE-IMAGINED) --- */
                  <motion.div
                     key="summary" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.6 }}
                     className="flex flex-col flex-1"
                  >
                     <div className="flex justify-between items-center mb-8 px-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                              <RotateCcw className="w-6 h-6 text-white" />
                           </div>
                           <div>
                              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Site Activity Overview</h2>
                              <div className="h-1.5 w-24 bg-blue-600 rounded-full mt-1" />
                           </div>
                        </div>

                        <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 flex items-center gap-3 shadow-md">
                           <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                           <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full absolute" />
                           <span className="text-emerald-600 font-black text-xs uppercase tracking-[0.2em] ml-1">Live Streaming</span>
                        </div>
                     </div>

                     <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-200 p-8 flex-1 flex flex-col overflow-hidden mb-4">
                        <div className="overflow-auto no-scrollbar scroll-smooth">
                           <table className="w-full text-left border-separate border-spacing-y-4">
                              <thead>
                                 <tr className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 overflow-hidden" style={{ boxShadow: '0 8px 32px rgba(15,23,42,0.25)' }}>
                                    <th className="py-6 px-8 rounded-l-2xl text-white font-black text-[11px] uppercase tracking-[0.2em]">
                                       <div className="flex items-center gap-2.5"><Hash className="w-4 h-4 text-sky-400" /> S.No</div>
                                    </th>
                                    <th className="py-6 px-6 text-white font-black text-[11px] uppercase tracking-[0.2em]">
                                       <div className="flex items-center gap-2.5"><LinkIcon className="w-4 h-4 text-sky-400" /> Permit ID</div>
                                    </th>
                                    <th className="py-6 px-6 text-white font-black text-[11px] uppercase tracking-[0.2em]">
                                       <div className="flex items-center gap-2.5"><Briefcase className="w-4 h-4 text-sky-400" /> Operation Title</div>
                                    </th>
                                    <th className="py-6 px-6 text-white font-black text-[11px] uppercase tracking-[0.2em]">
                                       <div className="flex items-center gap-2.5"><Users2 className="w-4 h-4 text-sky-400" /> Workforce</div>
                                    </th>
                                    <th className="py-6 px-6 text-white font-black text-[11px] uppercase tracking-[0.2em]">
                                       <div className="flex items-center gap-2.5"><MapPinIcon className="w-4 h-4 text-sky-400" /> Zone</div>
                                    </th>
                                    <th className="py-6 px-6 text-white font-black text-[11px] uppercase tracking-[0.2em]">
                                       <div className="flex items-center gap-2.5"><TimerIcon className="w-4 h-4 text-sky-400" /> Time Window</div>
                                    </th>
                                    <th className="py-6 px-6 text-white font-black text-[11px] uppercase tracking-[0.2em]">
                                       <div className="flex items-center gap-2.5"><ShieldAlert className="w-4 h-4 text-sky-400" /> Risk</div>
                                    </th>
                                    <th className="py-6 px-8 rounded-r-2xl text-white font-black text-[11px] uppercase tracking-[0.2em] text-center">
                                       <div className="flex items-center gap-2.5 justify-center"><Activity className="w-4 h-4 text-sky-400" /> Status</div>
                                    </th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {permits.map((p, idx) => (
                                    <motion.tr
                                       initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08, type: 'spring', stiffness: 120 }}
                                       key={p.permitId}
                                       className="group cursor-pointer hover:bg-slate-50 transition-colors duration-300"
                                       style={{
                                          background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                                       }}
                                    >
                                       {/* S.NO */}
                                       <td className="py-7 px-8 rounded-l-3xl" style={{ borderLeft: '4px solid #3b82f6' }}>
                                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-lg" style={{ background: '#eef2ff', color: '#4f46e5' }}>
                                             {(idx + 1).toString().padStart(2, '0')}
                                          </div>
                                       </td>
                                       {/* PERMIT ID */}
                                       <td className="py-7 px-6">
                                          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono font-black text-lg tracking-tight" style={{ background: 'linear-gradient(135deg, #eff6ff, #eef2ff)', border: '1.5px solid #bfdbfe', color: '#1d4ed8' }}>
                                             <LinkIcon className="w-4 h-4" style={{ color: '#60a5fa' }} />
                                             #{p.permitId}
                                          </div>
                                       </td>
                                       {/* OPERATION */}
                                       <td className="py-7 px-6">
                                          <div className="flex flex-col">
                                             <span className="text-[17px] font-black text-slate-900 leading-snug">{p.title}</span>
                                             <span className="text-[10px] font-bold uppercase tracking-[0.15em] mt-0.5" style={{ color: p.workType?.toLowerCase().includes('hot') ? '#dc2626' : '#6366f1' }}>{p.workType}</span>
                                          </div>
                                       </td>
                                       {/* WORKFORCE */}
                                       <td className="py-7 px-6">
                                          <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                                             <HardHat className="w-5 h-5" style={{ color: '#64748b' }} />
                                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Crew:</span>
                                             <span className="text-2xl font-black leading-none" style={{ color: '#1e293b' }}>{(p.workers || []).length}</span>
                                          </div>
                                       </td>
                                       {/* ZONE */}
                                       <td className="py-7 px-6">
                                          <div className="flex flex-col">
                                             <span className="font-black text-slate-900 text-[16px] leading-snug">{p.plant}</span>
                                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{p.area || "Technical Wing"}</span>
                                          </div>
                                       </td>
                                       {/* TIME */}
                                       <td className="py-7 px-6">
                                          <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                             <span className="text-[15px] font-mono font-black" style={{ color: '#1e293b' }}>{p.startTimeDisplay || p.startTime}</span>
                                             <ArrowRightCircle className="w-4 h-4" style={{ color: '#94a3b8' }} />
                                             <span className="text-[15px] font-mono font-black" style={{ color: '#1e293b' }}>{p.endTimeDisplay || p.endTime}</span>
                                          </div>
                                       </td>
                                       {/* RISK */}
                                       <td className="py-7 px-6">
                                          <div
                                             className="font-black text-[12px] uppercase tracking-[0.2em] text-center"
                                             style={{
                                                color: (p.risk || '').toLowerCase() === 'high' ? '#ef4444' : (p.risk || '').toLowerCase() === 'medium' ? '#f59e0b' : '#10b981',
                                             }}
                                          >
                                             {(p.risk || 'Low').toUpperCase()}
                                          </div>
                                       </td>
                                       {/* STATUS */}
                                       <td className="py-7 px-8 rounded-r-3xl">
                                          <div
                                             className="font-black text-[12px] uppercase tracking-[0.2em] text-center"
                                             style={{
                                                color: (p.status === 'In Progress' || p.status === 'Approved') ? '#10b981' : '#ef4444',
                                             }}
                                          >
                                             {(p.status === 'In Progress' || p.status === 'Approved') ? 'In Progress' : 'Stopped'}
                                          </div>
                                       </td>
                                    </motion.tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </motion.div>
               ) : (
                  /* --- SCREEN 2: DETAIL PAGE --- */
                  <motion.div
                     key={`detail-${activePermitIndex}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.6 }}
                     className="flex-1 flex gap-6"
                  >
                     {/* 🛡️ MAIN DATA PANEL */}
                     <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 flex flex-col relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                           <div>
                              <p className="text-blue-600 font-mono font-black text-lg mb-2 border-b-2 border-blue-600 w-fit">#{currentPermit.permitId}</p>
                              <h2 className="text-4xl font-black text-slate-900 leading-[1.1] tracking-tighter">{currentPermit.title}</h2>
                           </div>
                        </div>

                        {/* CORE GRID */}
                        <div className="grid grid-cols-4 gap-6 mb-6">
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block opacity-70">Category</label>
                              <div className="flex items-center gap-3 text-slate-700 font-black text-base">
                                 <Shield className="w-5 h-5 text-blue-500" /> {currentPermit.workType}
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block opacity-70">Window</label>
                              <div className="flex items-center gap-3 text-slate-700 font-black text-base">
                                 <Clock className="w-5 h-5 text-blue-500" /> {currentPermit.startTimeDisplay || currentPermit.startTime} — {currentPermit.endTimeDisplay || currentPermit.endTime}
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block opacity-70">Authorizer</label>
                              <div className="flex items-center gap-3 text-slate-700 font-black text-base">
                                 <Award className="w-5 h-5 text-emerald-500" /> {currentPermit.authorizedBy || currentPermit.requestedBy}
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block opacity-70">Location</label>
                              <div className="flex items-center gap-3 text-slate-700 font-black text-base">
                                 <MapPin className="w-5 h-5 text-blue-500" /> {currentPermit.plant}
                              </div>
                           </div>
                        </div>

                        {/* MORE DATA SECTION (CHECKLIST & OFFICIALS) */}
                        <div className="grid grid-cols-12 gap-6 mb-6">
                           <div className="col-span-12 bg-slate-50/50 p-4 rounded-3xl border border-slate-100 grid grid-cols-4 gap-3">
                              {Object.keys(currentPermit.safetyChecks || {}).map((key, i) => (
                                 <div key={i} className="flex items-center gap-2">
                                    <CheckCircle2 className={`w-4 h-4 ${currentPermit.safetyChecks[key] ? 'text-emerald-500' : 'text-slate-200'}`} />
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</span>
                                 </div>
                              ))}
                           </div>

                           <div className="col-span-8 space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block opacity-70">Execution Strategy</label>
                              <div className="p-4 bg-white border border-slate-100 rounded-3xl min-h-[60px] shadow-sm text-base font-bold text-slate-500 italic">
                                 "{currentPermit.description || "Routine maintenance and safety intervention as per site SOP."}"
                              </div>
                           </div>

                           <div className="col-span-4 space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block opacity-70">Personnel in Command</label>
                              <div className="space-y-2">
                                 <div className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-2xl">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">Supervisor</span>
                                    <span className="text-xs font-black text-slate-700">{currentPermit.supervisor || "---"}</span>
                                 </div>
                                 <div className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-2xl">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">Safety Officer</span>
                                    <span className="text-xs font-black text-slate-700">{currentPermit.safetyOfficer || "---"}</span>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* CREW GRID */}
                        <div className="mb-4">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 opacity-70">On-Site Execution Crew</label>
                           <div className="flex flex-wrap gap-3">
                              {(currentPermit.workers || []).map((w, i) => (
                                 <div key={i} className="flex items-center gap-3 border border-slate-100 p-2 rounded-2xl bg-white shadow-sm pr-4 min-w-[180px]">
                                    <img src={typeof w.image === 'string' ? w.image : "https://i.pravatar.cc/100"} className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-50" alt="" />
                                    <div>
                                       <p className="text-sm font-black text-slate-800 leading-tight">{w.name}</p>
                                       <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{w.workerType || 'Staff'}</p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* PPE & HAZARDS */}
                        <div className="mt-auto grid grid-cols-2 gap-6 border-t border-slate-100 pt-4">
                           <div className="flex flex-wrap gap-2">
                              {currentPermit.ppe?.map(p => (
                                 <span key={p} className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-xl border border-blue-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle2 className="w-3 h-3" /> {p}
                                 </span>
                              ))}
                           </div>
                           <div className="flex flex-wrap gap-2 justify-end">
                              {currentPermit.hazards?.map(h => (
                                 <span key={h} className="bg-red-50 text-red-600 px-4 py-1.5 rounded-xl border border-red-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <AlertTriangle className="w-3 h-3" /> {h}
                                 </span>
                              ))}
                           </div>
                        </div>
                     </div>

                     {/* 📊 COMPACT SIDEBAR */}
                     <div className="w-[380px] flex flex-col gap-6 h-full">
                        <div className={`p-8 rounded-[3rem] shadow-xl flex flex-col items-center justify-center text-center h-[200px] border-b-8 shadow-slate-100 ${(currentPermit.status === 'In Progress' || currentPermit.status === 'Approved') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} border-current`}>
                           {(currentPermit.status === 'In Progress' || currentPermit.status === 'Approved') ? <CheckCircle2 className="w-12 h-12 mb-4 opacity-50" /> : <ShieldAlert className="w-12 h-12 mb-4 opacity-50" />}
                           <h3 className="text-4xl font-black uppercase tracking-tighter leading-none mb-1">{(currentPermit.status === 'In Progress' || currentPermit.status === 'Approved') ? 'In Progress' : 'Stopped'}</h3>
                           <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-60">Status Analysis</p>
                        </div>

                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8 flex flex-col flex-1 relative">
                           <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest text-center block mb-6">Execution Risk</label>
                           <div className="flex-1 flex flex-col items-center justify-center">
                              <div className="p-6 rounded-full border-4 border-slate-50 mb-6 shadow-inner">
                                 <h3 className={`text-6xl font-black tracking-tighter ${getRiskStyles(currentPermit.risk).textPlain}`}>{currentPermit.risk}</h3>
                              </div>
                              <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden p-1">
                                 <motion.div
                                    initial={{ width: 0 }} animate={{ width: currentPermit.risk === 'High' ? '100%' : currentPermit.risk === 'Medium' ? '66%' : '33%' }}
                                    className={`h-full rounded-full ${getRiskStyles(currentPermit.risk).bg}`}
                                 />
                              </div>
                           </div>

                           <div className="mt-8 border-t border-slate-50 pt-6 space-y-3">
                              <div className="flex items-center gap-3">
                                 <Phone className="w-4 h-4 text-red-500" />
                                 <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-300 uppercase">Emergency SOS</span>
                                    <span className="text-xs font-black text-slate-600">{currentPermit.emergencyContact || "+91 99887-76655"}</span>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3">
                                 <MapPin className="w-4 h-4 text-emerald-500" />
                                 <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-300 uppercase">Nearest Point</span>
                                    <span className="text-xs font-black text-slate-600 truncate max-w-[200px]">{currentPermit.emergencyPoint || "Medical Center"}</span>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Progress Pill */}
                        <div className="flex justify-center h-[90px]">
                           <div className="bg-white w-full rounded-[2rem] border border-slate-200 flex items-center justify-center gap-4 text-4xl font-mono font-black shadow-lg shadow-slate-100">
                              <span className="text-blue-600">{activePermitIndex + 1}</span>
                              <span className="text-slate-100">/</span>
                              <span className="text-slate-400">{permits.length}</span>
                           </div>
                        </div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>
         </main>

         {/* 🛑 GLOBAL BOTTOM TICKER */}
         <footer className="bg-slate-900 h-[50px] flex items-center overflow-hidden shrink-0 border-t-2 border-blue-600 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
            <div className="bg-blue-600 h-full px-6 flex items-center shrink-0 shadow-2xl relative z-10">
               <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
               <span className="text-sm font-black text-white uppercase italic ml-3 tracking-tight">Safety Bulletin</span>
            </div>
            <div className="flex-1 flex items-center whitespace-nowrap overflow-hidden">
               <motion.div
                  initial={{ x: "0%" }} animate={{ x: "-50%" }} transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
                  className="flex gap-24 whitespace-nowrap"
               >
                  {[1, 2].map(i => (
                     <div key={i} className="flex gap-24 items-center text-white font-black text-sm uppercase tracking-tighter">
                        <span>⚠ SAFETY FIRST: ENSURE ALL LOTO PROCEDURES ARE STRICTLY FOLLOWED BEFORE CORE INTERVENTION</span>
                        <span className="text-white/30 italic">Report any unsafe condition or near-miss regardless of severity</span>
                        <span>VERIFY ALL GAS SENSORS AND VENTILATION SYSTEMS PRIOR TO HOT WORK COMMENCEMENT</span>
                     </div>
                  ))}
               </motion.div>
            </div>
         </footer>

         <style dangerouslySetInnerHTML={{
            __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        body { background: #F1F5F9 !important; }
      `}} />
      </div>
   );
};

export default WorkPermitTV;
