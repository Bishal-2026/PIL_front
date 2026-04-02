import React, { useState, useEffect } from "react";
import "./maintenance.css";

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
    // Standard data from localStorage or seed
    const [tickets, setTickets] = useState(() => {
        const saved = localStorage.getItem("mnt_tickets");
        if (saved) return JSON.parse(saved);
        
        // Dummy data for testing flow
        return [
            {
                id: "MNT-9241",
                machine: "M3-R1",
                machineName: "Machine 3 - Row 1",
                reason: "Mechanical Breakdown",
                description: "Belt snapped during night shift.",
                raisedBy: "john",
                raisedAt: new Date(Date.now() - 86400000).toISOString(),
                status: "Resolved",
                assignedTo: "T001",
                assignedName: "Rajesh Kumar",
                otp: "123456",
                otpVerified: false,
                priority: "High",
                downtime: "14h 22m",
                remark: "Replaced primary drive belt."
            },
            {
                id: "MNT-5415",
                machine: "M1-R1",
                machineName: "Machine 1 - Row 1",
                reason: "Electrical Fault",
                description: "Test run error.",
                raisedBy: "john",
                raisedAt: new Date().toISOString(),
                status: "In Progress",
                assignedTo: "T002",
                assignedName: "Priya Sharma",
                otp: "654321",
                otpVerified: false,
                priority: "Medium",
                downtime: "Running...",
                remark: ""
            }
        ];
    });

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

    // SYNC WITH LOCALSTORAGE
    useEffect(() => {
        localStorage.setItem("mnt_tickets", JSON.stringify(tickets));
    }, [tickets]);

    const handleRegister = () => {
        if (!reporterName) return alert("Please enter your name.");
        localStorage.setItem("reporter_name", reporterName);
        setIsRegistered(true);
        setTicketForm(prev => ({ ...prev, raisedBy: reporterName }));
    };

    const handleReport = (e) => {
        e.preventDefault();
        if (!ticketForm.machine || !ticketForm.reason) return alert("Please fill mandatory fields.");

        const machineName = INITIAL_MACHINES.find(m => m.id === ticketForm.machine)?.name || "Unknown Machine";
        const newTicket = {
            id: `MNT-${Math.floor(1000 + Math.random() * 9000)}`,
            machine: ticketForm.machine,
            machineName: machineName,
            reason: ticketForm.reason,
            description: ticketForm.description,
            raisedBy: reporterName,
            raisedAt: ticketForm.incidentTime,
            status: "Pending",
            assignedTo: null,
            assignedName: null,
            otp: Math.floor(100000 + Math.random() * 900000).toString(),
            otpVerified: false,
            priority: "Medium",
            downtime: "Running...",
            remark: ""
        };

        setTickets([newTicket, ...tickets]);
        setFormSuccess(true);
        setTimeout(() => {
            setFormSuccess(false);
            setActiveTab("history");
        }, 2000);

        setTicketForm({
            machine: "",
            reason: "",
            description: "",
            raisedBy: reporterName,
            incidentTime: new Date().toISOString().slice(0, 16)
        });
    };

    const handleCloseRequest = (ticket) => {
        setSelectedTicket(ticket);
        setShowOtpModal(true);
        setOtpError("");
        setOtpInput("");
    };

    const handleVerifyOtp = () => {
        if (otpInput === selectedTicket.otp) {
            setTickets(tickets.map(t => 
                t.id === selectedTicket.id ? { ...t, status: "OTP Verified", otpVerified: true, resolvedAt: new Date().toISOString() } : t
            ));
            setShowOtpModal(false);
            alert("Ticket closed successfully!");
        } else {
            setOtpError("Invalid OTP. Please check with your supervisor.");
        }
    };

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
                            <label>Machine ID</label>
                            <select value={ticketForm.machine} onChange={e => setTicketForm({...ticketForm, machine: e.target.value})}>
                                <option value="">Select Machine</option>
                                {INITIAL_MACHINES.map(m => <option key={m.id} value={m.id}>{m.id} - {m.name}</option>)}
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
                        <div key={t.id} className="mnt-ticket-card">
                            <div className="mnt-ticket-card-header">
                                <span className="mnt-ticket-id">{t.id}</span>
                                <span className={`mnt-status-badge ${t.status === "OTP Verified" ? "mnt-kpi-green" : "mnt-kpi-orange"}`} 
                                      style={{ background: t.otpVerified ? "#f0fdf4" : "#fff7ed", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "800" }}>
                                    {t.status}
                                </span>
                            </div>
                            <div className="mnt-ticket-machine" style={{ margin: "12px 0" }}>
                                <span className="material-symbols-rounded">precision_manufacturing</span>
                                <div><p className="mnt-ticket-machine-id">{t.machine}</p><p className="mnt-ticket-machine-name">{t.machineName}</p></div>
                            </div>
                            <div className="mnt-ticket-reason"><span>{t.reason}</span></div>
                            <p className="mnt-ticket-desc" style={{ fontSize: "12px" }}>{t.description || "No description provided."}</p>
                            
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
                            <p style={{ fontSize: "13px", color: "#64748b" }}>Ask technician for the closing OTP code for <strong>{selectedTicket.id}</strong></p>
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
