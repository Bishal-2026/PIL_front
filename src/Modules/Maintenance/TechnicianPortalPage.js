import React, { useState, useEffect } from "react";
import "./maintenance.css";
import { API } from "../../Helpers/api";

const TechnicianPortalPage = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("tech_id"));
    const [techId, setTechId] = useState(localStorage.getItem("tech_id") || "");
    const [techName, setTechName] = useState(localStorage.getItem("tech_name") || "");
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [allTechs, setAllTechs] = useState([]);
    const [activeTechTab, setActiveTechTab] = useState("active");

    useEffect(() => {
        fetchAllTechs();
        if (isLoggedIn) {
            fetchTasks();
            const interval = setInterval(() => fetchTasks(true), 15000); // 15s refresh
            return () => clearInterval(interval);
        }
    }, [isLoggedIn]);

    const fetchAllTechs = async () => {
        try {
            const res = await API.maintenance.getTechnicians();
            if (res.status) setAllTechs(res.data);
        } catch (error) {
            console.error("Error fetching techs:", error);
        }
    };

    const fetchTasks = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            const res = await API.maintenance.getTechnicianTasks(techId);
            if (res.status) setTasks(res.data);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    const handleLogin = (tech) => {
        setTechId(tech._id);
        setTechName(tech.name);
        localStorage.setItem("tech_id", tech._id);
        localStorage.setItem("tech_name", tech.name);
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        localStorage.removeItem("tech_id");
        localStorage.removeItem("tech_name");
        setTechId("");
        setTechName("");
        setIsLoggedIn(false);
        setTasks([]);
    };

    const [remarks, setRemarks] = useState({});

    const handleMarkResolved = async (ticketId) => {
        try {
            const res = await API.maintenance.updateTicket(ticketId, { 
                status: "Resolved", 
                resolvedAt: new Date().toISOString(),
                remark: remarks[ticketId] || "Repair completed by technician." 
            });
            if (res.status) {
                setTasks(tasks.map(t => t._id === ticketId ? res.data : t));
                fetchTasks();
            }
        } catch (error) {
            console.error("Error updating ticket:", error);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="mnt-root mnt-anim-in mnt-reporting-root">
                <div className="mnt-modal mnt-reporting-login-card">
                    <div className="mnt-page-header">
                        <div className="mnt-page-icon"><span className="material-symbols-rounded">engineering</span></div>
                        <div><h2 className="mnt-page-title">Technician Login</h2><p className="mnt-page-subtitle">Expert Response Portal</p></div>
                    </div>
                    <div className="mnt-form-group">
                        <label>Select Your Profile</label>
                        <div className="mnt-assign-list" style={{ maxHeight: "300px", overflowY: "auto" }}>
                            {allTechs.map(tech => (
                                <div key={tech._id} className="mnt-assign-item" onClick={() => handleLogin(tech)}>
                                    <div className="mnt-assign-avatar" style={{ background: "#3b82f6" }}>{tech.name.split(" ").map(n => n[0]).join("")}</div>
                                    <div className="mnt-assign-info">
                                        <p className="mnt-assign-name" style={{ marginBottom: 0 }}>{tech.name}</p>
                                        <p className="mnt-assign-role">{tech.designation || "Technician"}</p>
                                    </div>
                                    <span className="material-symbols-rounded" style={{ color: "#3b82f6" }}>login</span>
                                </div>
                            ))}
                            {allTechs.length === 0 && <p style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>Loading technicians...</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mnt-root mnt-anim-in">
            <div className="mnt-page-header">
                <div className="mnt-page-header-left">
                    <div className="mnt-page-icon"><span className="material-symbols-rounded">construction</span></div>
                    <div>
                        <h2 className="mnt-page-title">Task Center</h2>
                        <p className="mnt-page-subtitle">Welcome, {techName}</p>
                    </div>
                </div>
                <button className="mnt-back-btn" onClick={handleLogout} title="Logout">
                    <span className="material-symbols-rounded">logout</span>
                </button>
            </div>

            <div className="mnt-tabs">
                <button className={`mnt-tab ${activeTechTab === "active" ? "mnt-tab-active" : ""}`} onClick={() => setActiveTechTab("active")}>
                    Active ({tasks.filter(t => !["Resolved", "OTP Verified"].includes(t.status)).length})
                </button>
                <button className={`mnt-tab ${activeTechTab === "resolved" ? "mnt-tab-active" : ""}`} onClick={() => setActiveTechTab("resolved")}>
                    Resolved ({tasks.filter(t => t.status === "Resolved").length})
                </button>
                <button className={`mnt-tab ${activeTechTab === "verified" ? "mnt-tab-active" : ""}`} onClick={() => setActiveTechTab("verified")}>
                    OTP Verified ({tasks.filter(t => t.status === "OTP Verified").length})
                </button>
            </div>

            {loading ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading tasks...</div>
            ) : (
                <div className="mnt-ticket-grid">
                    {tasks.filter(t => {
                        if (activeTechTab === "active") return !["Resolved", "OTP Verified"].includes(t.status);
                        if (activeTechTab === "resolved") return t.status === "Resolved";
                        if (activeTechTab === "verified") return t.status === "OTP Verified";
                        return true;
                    }).map(t => (
                        <div key={t._id} className="mnt-ticket-card">
                            <div className="mnt-ticket-card-header">
                                <span className="mnt-ticket-id">{t.ticketId}</span>
                                <span className={`mnt-status-badge ${t.status === "OTP Verified" ? "mnt-kpi-green" : "mnt-kpi-orange"}`} 
                                      style={{ background: t.status === "OTP Verified" ? "#f0fdf4" : "#fff7ed", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "800" }}>
                                    {t.status}
                                </span>
                            </div>
                            <div className="mnt-ticket-machine" style={{ margin: "12px 0" }}>
                                <span className="material-symbols-rounded">precision_manufacturing</span>
                                <div><p className="mnt-ticket-machine-id">{t.machine?.machineId || t.machine}</p><p className="mnt-ticket-machine-name">{t.machineName}</p></div>
                            </div>
                            <div className="mnt-ticket-reason"><span>{t.reason}</span></div>
                            <p className="mnt-ticket-desc" style={{ fontSize: "12.5px", color: "#475569", lineHeight: "1.5" }}>{t.description || "No description provided."}</p>
                            
                            <div className="mnt-ticket-actions">
                                {t.status === "In Progress" || t.status === "Assigned" ? (
                                    <>
                                        <div className="mnt-form-group" style={{ width: "100%", marginBottom: "15px" }}>
                                            <label style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>ACTION TAKEN / REMARKS</label>
                                            <textarea 
                                                className="mnt-textarea"
                                                placeholder="What was fixed? (e.g. Cleared jam, replaced sensor)" 
                                                value={remarks[t._id] || ""} 
                                                onChange={e => setRemarks({...remarks, [t._id]: e.target.value})}
                                                style={{ minHeight: "80px", fontSize: "13px", padding: "12px", border: "1.5px solid #e2e8f0" }}
                                            />
                                        </div>
                                        <button className="mnt-action-btn mnt-btn-resolve" style={{ width: "100%", justifyContent: "center" }} onClick={() => handleMarkResolved(t._id)}>
                                            <span className="material-symbols-rounded">check_circle</span> Mark Point Resolved
                                        </button>
                                    </>
                                ) : t.status === "Resolved" && !t.otpVerified ? (
                                    <div className="mnt-otp-display-card" style={{ width: "100%", textAlign: "center", background: "#fdf4ff", border: "1px dashed #d946ef", padding: "15px", borderRadius: "12px" }}>
                                        <p style={{ margin: "0 0 5px", fontSize: "11px", color: "#d946ef", fontWeight: "bold", textTransform: "uppercase" }}>Repair OTP</p>
                                        <h2 style={{ margin: 0, fontSize: "28px", color: "#22374e", letterSpacing: "5px" }}>{t.otp}</h2>
                                        <p style={{ margin: "5px 0 0", fontSize: "10px", color: "#64748b" }}>Share this with the operator to close ticket</p>
                                    </div>
                                ) : (
                                    <div className="mnt-verified-badge" style={{ width: "100%", justifyContent: "center" }}>
                                        <span className="material-symbols-rounded">verified</span> Task Successfully Closed
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {tasks.length === 0 && (
                        <div className="mnt-no-records" style={{ width: "100%", padding: "60px 40px" }}>
                            <span className="material-symbols-rounded">assignment_turned_in</span>
                            <h3>All Clear!</h3>
                            <p>You have no pending maintenance tasks assigned.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TechnicianPortalPage;
