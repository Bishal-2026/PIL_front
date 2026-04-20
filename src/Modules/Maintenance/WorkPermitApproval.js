import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, XCircle, Clock, Eye, 
  Shield, MapPin, HardHat, Phone,
  AlertTriangle, ArrowRight, Filter,
  Menu, MoreVertical, LayoutGrid, List,
  Calendar, UserCheck, ShieldAlert,
  ChevronRight, RotateCcw, Layers
} from "lucide-react";
import { API } from "../../Helpers/api";
import { useUser } from "../../Helpers/Context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import "./workpermit.css"; // Reuse existing styles

const WorkPermitApproval = () => {
    const { user } = useUser();
    const [permits, setPermits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPermit, setSelectedPermit] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("Pending");

    const fetchPermits = async () => {
        setLoading(true);
        try {
            const userName = user?.name || user?.firstName;
            const userRole = user?.role?.toLowerCase();
            
            // Fetch ALL permits assigned or global (removed hardcoded status: "Pending")
            let queryParams = {};
            if (userRole !== "superadmin" && userRole !== "admin") {
                queryParams.assignedApprover = userName || "Rajesh Sharma";
            }

            const res = await API.workpermit.getAll(queryParams);
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
        if (user) fetchPermits();
    }, [user]);

    const handleAction = async (id, status) => {
        try {
            const res = await API.workpermit.updateStatus(id, { status });
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
                <header className="wp-approval-header">
                    <div className="wp-approval-title-section">
                        <div className="wp-approval-icon-bg">
                            <UserCheck size={28} />
                        </div>
                        <div>
                            <h1>Permit Authorization</h1>
                            <p>Review and validate operational safety permits.</p>
                        </div>
                    </div>

                    <div className="wp-approval-stats">
                         <div 
                            className={`wp-stat-card ${filterStatus === 'Pending' ? 'active pending' : ''}`}
                            onClick={() => setFilterStatus('Pending')}
                         >
                             <div className="wp-stat-number">{stats.pending}</div>
                             <div className="wp-stat-info">
                                <span className="wp-stat-label">Queue</span>
                                <span className="wp-stat-name">Pending</span>
                             </div>
                         </div>
                         <div 
                            className={`wp-stat-card ${filterStatus === 'Approved' ? 'active approved' : ''}`}
                            onClick={() => setFilterStatus('Approved')}
                         >
                             <div className="wp-stat-number">{stats.approved}</div>
                             <div className="wp-stat-info">
                                <span className="wp-stat-label">Cleared</span>
                                <span className="wp-stat-name">Approved</span>
                             </div>
                         </div>
                    </div>
                </header>

                <div className="wp-filter-bar">
                    <div className="wp-search-box" style={{ maxWidth: 'none' }}>
                        <span className="material-symbols-rounded">search</span>
                        <input 
                            className="wp-search-input" 
                            placeholder="Search pending permits by ID or title..." 
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
                                    className={`wp-permit-card-modern group ${p.riskLevel?.toLowerCase() || 'low'}`}
                                    onClick={() => setSelectedPermit(p)}
                                >
                                    <div className="wp-card-accent-bar" />
                                    <div className="wp-permit-card-main">
                                        <div className="wp-permit-card-left">
                                            <div className="wp-permit-card-index">
                                                {(idx + 1).toString().padStart(2, '0')}
                                            </div>
                                            
                                            <div className="wp-permit-card-content">
                                                <div className="wp-permit-card-badges">
                                                    <span className="wp-permit-id-tag">#{p.permitId}</span>
                                                    <span className={`wp-risk-tag ${p.riskLevel?.toLowerCase() === 'high' ? 'high' : 'low'}`}>
                                                        {p.riskLevel} Risk
                                                    </span>
                                                </div>
                                                <h3 className="wp-permit-card-title">
                                                    {p.title}
                                                </h3>
                                                <div className="wp-permit-card-meta">
                                                     <div className="wp-meta-item">
                                                        <span className="wp-meta-label">Location</span>
                                                        <span className="wp-meta-val">{p.plant} • {p.area}</span>
                                                     </div>
                                                     <div className="wp-meta-item">
                                                        <span className="wp-meta-label">Timeframe</span>
                                                        <span className="wp-meta-val">{new Date(p.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(p.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                     </div>
                                                     <div className="wp-meta-item">
                                                        <span className="wp-meta-label">Crew</span>
                                                        <span className="wp-meta-val">{p.workers?.length || 0} Members</span>
                                                     </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="wp-permit-card-actions">
                                            <div className="wp-permit-status-box">
                                                <p className="wp-status-label">Permit Status</p>
                                                <div className="wp-status-indicator-row">
                                                    <div className={`wp-status-dot ${p.status === 'Approved' ? 'approved' : 'pending'}`} />
                                                    <span className="wp-status-text">{p.status}</span>
                                                </div>
                                            </div>
                                            <div className="wp-permit-card-chevron">
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
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedPermit(null)}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            />
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                                animate={{ opacity: 1, scale: 1, y: 0 }} 
                                exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="relative w-full max-w-[900px] max-h-[90vh] bg-white rounded-[3rem] shadow-2xl flex flex-col overflow-hidden"
                            >
                                <div className="absolute top-8 right-8 z-10">
                                    <button onClick={() => setSelectedPermit(null)} className="p-2 hover:bg-red-50 hover:text-red-500 text-slate-300 rounded-full transition-all">
                                        <XCircle size={32} />
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
                                <div className="bg-white p-8 border-t border-slate-100 flex gap-4 px-12">
                                    <button 
                                        onClick={() => handleAction(selectedPermit._id, 'Rejected')}
                                        className="flex-1 py-5 rounded-[1.8rem] bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 font-black uppercase tracking-[0.2em] transition-all border border-slate-100 flex items-center justify-center gap-3"
                                    >
                                        <XCircle size={24} /> Deny Entry
                                    </button>
                                    <button 
                                        onClick={() => handleAction(selectedPermit._id, 'Approved')}
                                        className="flex-[2] py-5 rounded-[1.8rem] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
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
