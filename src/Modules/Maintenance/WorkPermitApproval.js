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

    // 🔒 Background Scroll Lock (Popup open hone pe background scroll lock krne k liye)
    useEffect(() => {
        if (selectedPermit) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedPermit]);

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
                        <div className="wp-auth-modal-overlay">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedPermit(null)}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="wp-auth-modal-container"
                            >
                                <div className="wp-modal-header">
                                    <div className="wp-modal-id-badge">#{selectedPermit.permitId}</div>
                                    <h2 className="wp-modal-title">{selectedPermit.title}</h2>
                                    <p className="wp-modal-desc">
                                        {selectedPermit.description || "Routine operational entry to facilitate necessary site modifications."}
                                    </p>
                                    <button onClick={() => setSelectedPermit(null)} className="wp-modal-close">
                                        <XCircle size={24} />
                                    </button>
                                </div>

                                <div className="wp-modal-body no-scrollbar">
                                    <div className="wp-modal-grid">
                                        <div className="wp-modal-card">
                                            <span className="wp-modal-section-label">Location Matrix</span>
                                            <div className="wp-modal-info-item">
                                                <div className="wp-modal-icon-box"><MapPin size={18} /></div>
                                                <div className="wp-modal-info-text">
                                                    <span className="wp-modal-info-label">Plant / Area</span>
                                                    <span className="wp-modal-info-val">{selectedPermit.plant} • {selectedPermit.area}</span>
                                                </div>
                                            </div>
                                            <div className="wp-modal-info-item">
                                                <div className="wp-modal-icon-box"><Layers size={18} /></div>
                                                <div className="wp-modal-info-text">
                                                    <span className="wp-modal-info-label">Exact Point</span>
                                                    <span className="wp-modal-info-val">{selectedPermit.exactLocation || "Main Access Hub"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="wp-modal-card">
                                            <span className="wp-modal-section-label">Time Assessment</span>
                                            <div className="wp-modal-info-item">
                                                <div className="wp-modal-icon-box"><Clock size={18} /></div>
                                                <div className="wp-modal-info-text">
                                                    <span className="wp-modal-info-label">Start Timing</span>
                                                    <span className="wp-modal-info-val">{new Date(selectedPermit.startTime).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="wp-modal-info-item">
                                                <div className="wp-modal-icon-box"><RotateCcw size={18} /></div>
                                                <div className="wp-modal-info-text">
                                                    <span className="wp-modal-info-label">Expiry / Return</span>
                                                    <span className="wp-modal-info-val">{new Date(selectedPermit.endTime).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-8">
                                        <span className="wp-modal-section-label">Safety Readiness Checklist</span>
                                        <div className="wp-modal-check-grid">
                                            {Object.entries(selectedPermit.safetyChecks || {}).map(([key, checked]) => (
                                                <div key={key} className={`wp-modal-check-item ${checked ? 'checked' : 'unchecked'}`}>
                                                    <CheckCircle2 size={16} />
                                                    <span className="text-[11px] font-bold uppercase tracking-tight">{key.replace(/([A-Z])/g, ' $1')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mb-8">
                                        <span className="wp-modal-section-label">Execution Crew ({selectedPermit.workers?.length || 0})</span>
                                        <div className="flex flex-wrap gap-3">
                                            {(selectedPermit.workers || []).map((w, i) => (
                                                <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-100 rounded-xl pr-4">
                                                    <img src={w.image || "https://i.pravatar.cc/100"} className="w-10 h-10 rounded-lg object-cover" alt="" />
                                                    <div>
                                                        <p className="text-xs font-black text-slate-800 leading-tight">{w.name}</p>
                                                        <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{w.workerType || 'Technical Staff'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-center justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <ShieldAlert size={28} className="text-red-500" />
                                            <div>
                                                <h4 className="text-sm font-black text-red-600 uppercase tracking-tight">Emergency Protocol</h4>
                                                <p className="text-[11px] font-bold text-red-400">Response coordinates active</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-6">
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-red-300 uppercase tracking-widest">SOS Number</p>
                                                <p className="text-xs font-black text-slate-700">{selectedPermit.emergencyContact || '108'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-red-300 uppercase tracking-widest">Infirmary</p>
                                                <p className="text-xs font-black text-slate-700">{selectedPermit.emergencyPoint || 'Sector A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="wp-modal-footer">
                                    {selectedPermit.status !== 'Stopped' && (
                                        <button 
                                            onClick={() => handleAction(selectedPermit._id, 'Stopped')}
                                            className="wp-modal-btn wp-modal-btn-reject"
                                        >
                                            <XCircle size={18} /> Stop Work
                                        </button>
                                    )}
                                    {(selectedPermit.status !== 'In Progress' && selectedPermit.status !== 'Approved') && (
                                        <button 
                                            onClick={() => handleAction(selectedPermit._id, 'In Progress')}
                                            className="wp-modal-btn wp-modal-btn-approve"
                                        >
                                            <CheckCircle2 size={18} /> Start Work (In Progress)
                                        </button>
                                    )}
                                    {(selectedPermit.status === 'In Progress' || selectedPermit.status === 'Approved') && (
                                        <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 font-black text-xs uppercase tracking-widest border border-emerald-100">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                            Currently In Progress
                                        </div>
                                    )}
                                    {selectedPermit.status === 'Stopped' && (
                                        <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-50 text-red-600 font-black text-xs uppercase tracking-widest border border-red-100">
                                            <XCircle size={20} /> Currently Stopped
                                        </div>
                                    )}
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
