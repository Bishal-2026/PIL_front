import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, XCircle, Clock, Eye, 
  Shield, MapPin, HardHat, Phone,
  AlertTriangle, ArrowRight, Filter, Search,
  Menu, MoreVertical, LayoutGrid, List,
  Calendar, UserCheck, ShieldAlert,
  ChevronRight, RotateCcw, Layers
} from "lucide-react";
import { API } from "../../Helpers/api";
import { motion, AnimatePresence } from "framer-motion";
import "./workpermit.css"; // Reuse existing styles

const WorkPermitApproval = () => {
    const [permits, setPermits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPermit, setSelectedPermit] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("Pending");

    const fetchPermits = async () => {
        setLoading(true);
        try {
            const res = await API.workpermit.getAll();
            if (res.status) {
                setPermits(res.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermits();
    }, []);

    const handleAction = async (id, status) => {
        try {
            const res = await API.workpermit.update(id, { status });
            if (res.status) {
                fetchPermits();
                setSelectedPermit(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const filteredPermits = permits.filter(p => {
        const matchesSearch = p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             p.permitId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "All" || p.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        pending: permits.filter(p => p.status === "Pending").length,
        approved: permits.filter(p => p.status === "Approved").length,
        active: permits.filter(p => p.status === "Active").length,
    };

    return (
        <div className="wp-root wp-fade-in" style={{ padding: '20px', background: '#F8FAFC', minHeight: '100vh' }}>
            <div className="wp-container wp-full-width">
                
                {/* 🏰 HEADER SECTION */}
                <header className="wp-header-modern" style={{ marginBottom: '30px' }}>
                    <div className="wp-header-left">
                        <div className="wp-header-icon-box">
                            <UserCheck className="text-blue-600" size={28} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-1px' }}>Permit Authorization</h1>
                            <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>Review and validate operational safety permits.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                         <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 px-8">
                             <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 font-black">
                                {stats.pending}
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Queue</p>
                                <p className="text-sm font-black text-slate-700">Pending</p>
                             </div>
                         </div>
                         <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 px-8">
                             <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-black">
                                {stats.approved}
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Cleared</p>
                                <p className="text-sm font-black text-slate-700">Approved</p>
                             </div>
                         </div>
                    </div>
                </header>

                {/* 🔍 FILTER BAR */}
                <div className="wp-filter-bar" style={{ marginBottom: '24px', background: 'white', padding: '12px 24px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <div className="wp-search-box flex-1">
                        <Search size={18} className="text-slate-400" />
                        <input 
                            className="wp-search-input" 
                            placeholder="Search Pending Permits by ID or Title..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* 📋 LIST GRID */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-24 text-slate-300">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="font-black uppercase tracking-widest text-xs">Syncing Registry...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence>
                            {filteredPermits.map((p, idx) => (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    key={p._id}
                                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                                    onClick={() => setSelectedPermit(p)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-8 flex-1">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center font-mono font-black text-slate-300 text-xl tracking-tighter">
                                                {(idx + 1).toString().padStart(2, '0')}
                                            </div>
                                            
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-mono font-black text-xs tracking-tighter border border-blue-100">
                                                        #{p.permitId}
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border-2
                                                        ${p.riskLevel === 'High' ? 'text-red-500 border-red-100 bg-red-50' : 'text-emerald-500 border-emerald-100 bg-emerald-50'}`}>
                                                        {p.riskLevel} Risk
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors uppercase">
                                                    {p.title}
                                                </h3>
                                                <div className="flex items-center gap-6 mt-3">
                                                     <div className="flex items-center gap-2 text-slate-400">
                                                        <MapPin size={14} className="text-blue-400" />
                                                        <span className="text-[12px] font-bold">{p.plant} • {p.area}</span>
                                                     </div>
                                                     <div className="flex items-center gap-2 text-slate-400">
                                                        <Clock size={14} className="text-blue-400" />
                                                        <span className="text-[12px] font-bold">{new Date(p.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(p.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                     </div>
                                                     <div className="flex items-center gap-2 text-slate-400">
                                                        <HardHat size={14} className="text-blue-400" />
                                                        <span className="text-[12px] font-bold">Crew: {p.workers?.length || 0}</span>
                                                     </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Permit Status</p>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${p.status === 'Approved' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-orange-400 shadow-orange-100'}`} />
                                                    <span className="font-black text-sm uppercase tracking-wider text-slate-700">{p.status}</span>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                <ChevronRight size={24} />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* 🛡️ PERMIT DETAIL SIDEBAR / OVERLAY */}
                <AnimatePresence>
                    {selectedPermit && (
                        <div className="fixed inset-0 z-[100] flex justify-end">
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setSelectedPermit(null)}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            />
                            <motion.div 
                                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="relative w-full max-w-[800px] bg-white h-screen shadow-2xl flex flex-col pt-10"
                            >
                                <div className="absolute top-10 right-10 z-10">
                                    <button onClick={() => setSelectedPermit(null)} className="p-3 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all">
                                        <XCircle size={28} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-auto px-12 pb-32 no-scrollbar">
                                    <div className="mb-10">
                                        <p className="font-mono font-black text-blue-600 text-2xl border-b-4 border-blue-600 w-fit mb-4 tracking-tighter">#{selectedPermit.permitId}</p>
                                        <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-4 uppercase">{selectedPermit.title}</h2>
                                        <p className="text-lg text-slate-400 font-bold max-w-[600px] leading-relaxed italic">"{selectedPermit.description || "Routine operational entry to facilitate necessary site modifications."}"</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8 mb-12">
                                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] block mb-4">Location Matrix</label>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <MapPin className="text-blue-600" />
                                                    <span className="text-lg font-black text-slate-700">{selectedPermit.plant} / {selectedPermit.area}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <Layers className="text-blue-600" />
                                                    <span className="text-base font-bold text-slate-400">{selectedPermit.exactLocation || "Main Access Hub"}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] block mb-4">Time Assessment</label>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <Clock className="text-emerald-600" />
                                                    <span className="text-lg font-black text-slate-700">{new Date(selectedPermit.startTime).toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <RotateCcw className="text-red-500" />
                                                    <span className="text-lg font-black text-slate-400 tracking-tighter">{new Date(selectedPermit.endTime).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-12">
                                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] block mb-6">Safety Checklist Status</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {Object.entries(selectedPermit.safetyChecks || {}).map(([key, checked]) => (
                                                <div key={key} className={`flex items-center gap-4 p-4 rounded-2xl border ${checked ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                                                    <CheckCircle2 size={24} className={checked ? 'text-emerald-500' : 'text-slate-200'} />
                                                    <span className="text-xs font-black uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mb-12">
                                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] block mb-6">Execution Crew ({selectedPermit.workers?.length || 0})</label>
                                        <div className="flex flex-wrap gap-4">
                                            {(selectedPermit.workers || []).map((w, i) => (
                                                <div key={i} className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm pr-6">
                                                    <img src={w.image || "https://i.pravatar.cc/100"} className="w-12 h-12 rounded-xl object-cover" alt="" />
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 leading-tight">{w.name}</p>
                                                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{w.workerType || 'Technical Staff'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-red-50 p-8 rounded-3xl border border-red-100 mb-12">
                                        <div className="flex items-center gap-4 mb-4">
                                            <ShieldAlert size={32} className="text-red-500" />
                                            <h4 className="text-xl font-black text-red-600 uppercase tracking-tighter">Emergency Protocol Required</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm"><Phone className="text-red-500" size={18} /></div>
                                                <div>
                                                    <p className="text-[9px] font-black text-red-300 uppercase tracking-widest">SOS Number</p>
                                                    <p className="text-sm font-black text-slate-700">{selectedPermit.emergencyContact || '108'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm"><MapPin className="text-red-500" size={18} /></div>
                                                <div>
                                                    <p className="text-[9px] font-black text-red-300 uppercase tracking-widest">Medical Point</p>
                                                    <p className="text-sm font-black text-slate-700">{selectedPermit.emergencyPoint || 'Zone A Infirmary'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                {/* 🚀 ACTIONS FOOTER */}
                                <div className="absolute bottom-0 left-0 right-0 bg-white p-8 border-t border-slate-100 flex gap-4 px-12 shadow-[0_-20px_40px_rgba(0,0,0,0.03)]">
                                    <button 
                                        onClick={() => handleAction(selectedPermit._id, 'Rejected')}
                                        className="flex-1 py-5 rounded-[1.5rem] bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 font-black uppercase tracking-[0.2em] transition-all border border-slate-100 flex items-center justify-center gap-3"
                                    >
                                        <XCircle size={24} /> Deny Entry
                                    </button>
                                    <button 
                                        onClick={() => handleAction(selectedPermit._id, 'Approved')}
                                        className="flex-[2] py-5 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
                                    >
                                        <CheckCircle2 size={24} /> Authorize Permit
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default WorkPermitApproval;
