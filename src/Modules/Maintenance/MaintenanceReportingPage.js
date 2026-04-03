import React, { useState, useEffect } from "react";
import "./maintenance.css";
import { API } from "../../Helpers/api";

const REASONS = [
  "Mechanical Breakdown",
  "Electrical Fault",
  "Hydraulic Leak",
  "Overheating",
  "Belt / Chain Snap",
  "Software / PLC Error",
  "Preventive Maintenance",
  "Other",
];

const INITIAL_MACHINES = [
  { id: "M1-R1", name: "Machine 1 - Row 1" },
  { id: "M2-R1", name: "Machine 2 - Row 1" },
  { id: "M3-R1", name: "Machine 3 - Row 1" },
  { id: "M4-R1", name: "Machine 4 - Row 1" },
  { id: "M5-R1", name: "Machine 5 - Row 1" },
];

const MaintenanceReportingPage = () => {
    const [tickets, setTickets] = useState([]);
    const [machines, setMachines] = useState(INITIAL_MACHINES);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 20000); // 20s update (silent)
        return () => clearInterval(interval);
    }, []);

    const fetchData = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            const [ticketsRes, machinesRes] = await Promise.all([
                API.maintenance.getTickets(),
                API.maintenance.getMachines()
            ]);
            if (ticketsRes.status) {
                const sorted = ticketsRes.data.sort((a, b) => new Date(b.raisedAt) - new Date(a.raisedAt));
                setTickets(sorted);
            }
            if (machinesRes.status && machinesRes.data.length > 0) setMachines(machinesRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    const [reporterName, setReporterName] = useState(localStorage.getItem("reporter_name") || "");
    const [isRegistered, setIsRegistered] = useState(!!localStorage.getItem("reporter_name"));

    const [ticketForm, setTicketForm] = useState({
        machine: "",
        reason: "",
        description: "",
        raisedBy: reporterName,
        incidentTime: new Date().toISOString().slice(0, 16)
    });

    const [activeTab, setActiveTab] = useState("report");
    const [formSuccess, setFormSuccess] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [otpInput, setOtpInput] = useState("");
    const [otpError, setOtpError] = useState("");

    // Removed local storage sync

    const handleRegister = () => {
        if (!reporterName) return alert("Please enter your name.");
        localStorage.setItem("reporter_name", reporterName);
        setIsRegistered(true);
        setTicketForm(prev => ({ ...prev, raisedBy: reporterName }));
    };

    const handleReport = async (e) => {
        e.preventDefault();
        if (!ticketForm.machine || !ticketForm.reason) return alert("Please fill mandatory fields.");

        try {
            const res = await API.maintenance.createTicket({
                machine: ticketForm.machine,
                reason: ticketForm.reason,
                description: ticketForm.description,
                raisedBy: reporterName,
                raisedAt: ticketForm.incidentTime,
                priority: "Medium"
            });

            if (res.status) {
                setTickets([res.data, ...tickets]);
                setFormSuccess(true);
                setTimeout(() => {
                    setFormSuccess(false);
                    setActiveTab("history");
                    fetchData();
                }, 2000);

                setTicketForm({
                    machine: "",
                    reason: "",
                    description: "",
                    raisedBy: reporterName,
                    incidentTime: new Date().toISOString().slice(0, 16)
                });
            }
        } catch (error) {
            alert("Failed to report breakdown.");
        }
    };

    const handleCloseRequest = (ticket) => {
        setSelectedTicket(ticket);
        setShowOtpModal(true);
        setOtpError("");
        setOtpInput("");
    };

    const handleVerifyOtp = async () => {
        try {
            const res = await API.maintenance.verifyOTP({
                ticketId: selectedTicket._id,
                otp: otpInput
            });
            if (res.status) {
                setTickets(tickets.map(t => 
                    t._id === selectedTicket._id ? res.data : t
                ));
                setShowOtpModal(false);
                alert("Ticket closed successfully!");
                fetchData();
            } else {
                setOtpError("Invalid OTP. Please check with your supervisor.");
            }
        } catch (error) {
            setOtpError("Verification failed.");
        }
    };

    if (loading) {
        return <div className="mnt-loader">Loading portal...</div>;
    }

    if (!isRegistered) {
        return (
            <div className="mnt-root mnt-anim-in mnt-reporting-root">
                <div className="mnt-modal mnt-reporting-login-card">
                    <div className="mnt-page-header">
                        <div className="mnt-page-icon"><span className="material-symbols-rounded">engineering</span></div>
                        <div><h2 className="mnt-page-title">Operator Link</h2><p className="mnt-page-subtitle">Maintenance Reporting Portal</p></div>
                    </div>
                    <div className="mnt-form-group">
                        <label>Enter your Name / ID</label>
                        <input value={reporterName} onChange={e => setReporterName(e.target.value)} placeholder="e.g. John Doe" />
                    </div>
                    <button className="mnt-raise-btn mnt-btn-full" onClick={handleRegister}>Continue to Portal</button>
                </div>
            </div>
        );
    }

    const myTickets = tickets.filter(t => t.raisedBy === reporterName);

    return (
        <div className="mnt-root mnt-anim-in">
            <div className="mnt-page-header">
                <div className="mnt-page-header-left">
                    <div className="mnt-page-icon"><span className="material-symbols-rounded">report_problem</span></div>
                    <div>
                        <h2 className="mnt-page-title">Breakdown Center</h2>
                        <p className="mnt-page-subtitle">Welcome back, {reporterName}</p>
                    </div>
                </div>
                <button className="mnt-back-btn" onClick={() => { localStorage.removeItem("reporter_name"); setIsRegistered(false); }}>
                    <span className="material-symbols-rounded">logout</span>
                </button>
            </div>

            <div className="mnt-tabs">
                <button className={`mnt-tab ${activeTab === "report" ? "mnt-tab-active" : ""}`} onClick={() => setActiveTab("report")}>Report Issue</button>
                <button className={`mnt-tab ${activeTab === "history" ? "mnt-tab-active" : ""}`} onClick={() => setActiveTab("history")}>My Reported Issues ({myTickets.filter(t => !t.otpVerified).length})</button>
            </div>

            {activeTab === "report" && (
                <div className="mnt-chart-card mnt-reporting-card">
                    <h3 className="mnt-chart-title"><span className="material-symbols-rounded">add_circle</span> Report Machine Breakdown</h3>
                    {formSuccess && <div className="mnt-verified-badge" style={{ marginBottom: "20px" }}><span className="material-symbols-rounded">check_circle</span> Ticket Raised Successfully!</div>}
                    
                    <form onSubmit={handleReport}>
                        <div className="mnt-form-group">
                            <label>Machine</label>
                            <select value={ticketForm.machine} onChange={e => setTicketForm({...ticketForm, machine: e.target.value})}>
                                <option value="">Select Machine</option>
                                {machines.map(m => <option key={m._id} value={m._id}>{m.machineId} - {m.name}</option>)}
                            </select>
                        </div>
                        <div className="mnt-form-group">
                            <label>Reason for Breakdown</label>
                            <select value={ticketForm.reason} onChange={e => setTicketForm({...ticketForm, reason: e.target.value})}>
                                <option value="">Select Reason</option>
                                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div className="mnt-form-group">
                            <label>Description (Optional)</label>
                            <textarea rows="3" value={ticketForm.description} onChange={e => setTicketForm({...ticketForm, description: e.target.value})} 
                                style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }} placeholder="Provide more details about the fault..." />
                        </div>
                        <div className="mnt-form-row">
                             <div className="mnt-form-group"><label>Reported By</label><input value={reporterName} readOnly style={{ background: "#f1f5f9" }} /></div>
                             <div className="mnt-form-group"><label>Incident Time</label><input type="datetime-local" value={ticketForm.incidentTime} onChange={e => setTicketForm({...ticketForm, incidentTime: e.target.value})} /></div>
                        </div>
                        <button type="submit" className="mnt-raise-btn" style={{ width: "100%", justifyContent: "center", marginTop: "10px" }}>Submit Report</button>
                    </form>
                </div>
            )}

            {activeTab === "history" && (
                <div className="mnt-ticket-grid">
                    {myTickets.map(t => (
                        <div key={t._id} className="mnt-ticket-card">
                            <div className="mnt-ticket-card-header">
                                <span className="mnt-ticket-id">{t.ticketId}</span>
                                <span className={`mnt-status-badge ${t.status === "OTP Verified" ? "mnt-kpi-green" : "mnt-kpi-orange"}`} 
                                      style={{ background: t.otpVerified ? "#f0fdf4" : "#fff7ed", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "800" }}>
                                    {t.status}
                                </span>
                            </div>
                            <div className="mnt-ticket-machine" style={{ margin: "12px 0" }}>
                                <span className="material-symbols-rounded">precision_manufacturing</span>
                                <div><p className="mnt-ticket-machine-id">{t.machine?.machineId || t.machine}</p><p className="mnt-ticket-machine-name">{t.machineName}</p></div>
                            </div>
                            <div className="mnt-ticket-reason"><span>{t.reason}</span></div>
                            <p className="mnt-ticket-desc" style={{ fontSize: "12px" }}>{t.description || "No description provided."}</p>

                            {t.assignedName && (
                                <div className="mnt-ticket-tech-info" style={{ display: "flex", alignItems: "center", gap: "8px", margin: "10px 0", padding: "8px", background: "#f8fafc", borderRadius: "8px" }}>
                                    <span className="material-symbols-rounded" style={{ fontSize: "18px", color: "#64748b" }}>engineering</span>
                                    <div>
                                        <p style={{ fontSize: "11px", color: "#64748b", margin: 0, lineHeight: 1 }}>Assigned Technician</p>
                                        <p style={{ fontSize: "13px", color: "#334155", margin: 0, fontWeight: "600" }}>{t.assignedName}</p>
                                    </div>
                                </div>
                            )}

                            <div className="mnt-ticket-actions">
                                {t.status === "Resolved" && !t.otpVerified && (
                                    <button className="mnt-action-btn mnt-btn-otp" style={{ width: "100%", justifyContent: "center" }} onClick={() => handleCloseRequest(t)}>
                                        <span className="material-symbols-rounded">lock_open</span> Verify & Close Issue
                                    </button>
                                )}
                                {t.otpVerified && (
                                    <div className="mnt-verified-badge" style={{ width: "100%", justifyContent: "center" }}>
                                        <span className="material-symbols-rounded">verified</span> Issue Closed
                                    </div>
                                )}
                                {!t.otpVerified && t.status !== "Resolved" && (
                                    <div className="mnt-downtime-tag" style={{ width: "100%", justifyContent: "center" }}>
                                        <span className="material-symbols-rounded">schedule</span> {t.status}...
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {myTickets.length === 0 && (
                        <div className="mnt-no-records" style={{ width: "100%", padding: "40px" }}>
                            <span className="material-symbols-rounded">history</span>
                            <p>You haven't reported any issues yet.</p>
                        </div>
                    )}
                </div>
            )}

            {showOtpModal && selectedTicket && (
                <div className="mnt-modal-overlay" onClick={() => setShowOtpModal(false)}>
                    <div className="mnt-modal mnt-modal-sm" onClick={e => e.stopPropagation()} style={{ padding: "30px" }}>
                        <div className="mnt-modal-header" style={{ padding: "0 0 20px" }}><h2>Verify Repair OTP</h2><button onClick={() => setShowOtpModal(false)}>×</button></div>
                        <div className="mnt-otp-body">
                            <p style={{ fontSize: "13px", color: "#64748b" }}>Ask technician for the closing OTP code for <strong>{selectedTicket.ticketId}</strong></p>
                            <input className="mnt-otp-input" value={otpInput} onChange={e => setOtpInput(e.target.value)} maxLength="6" />
                            {otpError && <p className="mnt-form-error">{otpError}</p>}
                        </div>
                        <div className="mnt-modal-footer" style={{ padding: "20px 0 0" }}><button onClick={handleVerifyOtp} style={{ width: "100%" }}>Verify & Close</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaintenanceReportingPage;
