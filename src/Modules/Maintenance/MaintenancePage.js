import React, { useState, useEffect, useMemo } from "react";
import { 
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import "./maintenance.css";
import { API } from "../../Helpers/api";

// ─── Static Data ──────────────────────────────────────────────────────────────
const INITIAL_MACHINES = [
  { id: "M1-R1", name: "Machine 1 - Row 1", zone: "Zone A", line: "Production Line 1" },
  { id: "M2-R1", name: "Machine 2 - Row 1", zone: "Zone A", line: "Production Line 1" },
  { id: "M3-R1", name: "Machine 3 - Row 1", zone: "Zone A", line: "Production Line 1" },
  { id: "M4-R1", name: "Machine 4 - Row 1", zone: "Zone A", line: "Production Line 1" },
  { id: "M5-R1", name: "Machine 5 - Row 1", zone: "Zone B", line: "Production Line 2" },
  { id: "M1-R2", name: "Machine 1 - Row 2", zone: "Zone B", line: "Production Line 2" },
  { id: "M2-R2", name: "Machine 2 - Row 2", zone: "Zone B", line: "Production Line 2" },
  { id: "M3-R2", name: "Machine 3 - Row 2", zone: "Zone C", line: "Production Line 3" },
  { id: "M4-R2", name: "Machine 4 - Row 2", zone: "Zone C", line: "Production Line 3" },
  { id: "M5-R2", name: "Machine 5 - Row 2", zone: "Zone C", line: "Production Line 3" },
];

const INITIAL_ZONES = [
  { id: "Zone A", availability: 94, color: "#22c55e" },
  { id: "Zone B", availability: 80, color: "#f59e0b" },
  { id: "Zone C", availability: 87, color: "#3b82f6" },
];

const STATUS_COLORS = {
  Pending: { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa", dot: "#f97316" },
  Assigned: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", dot: "#3b82f6" },
  "In Progress": { bg: "#fef9c3", text: "#92400e", border: "#fde68a", dot: "#f59e0b" },
  Resolved: { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0", dot: "#22c55e" },
  "OTP Verified": { bg: "#faf5ff", text: "#6b21a8", border: "#e9d5ff", dot: "#a855f7" },
};

const SEED_TICKETS = [
  { id: "MNT-001", machine: "M4-R1", machineName: "Machine 4 - Row 1", zone: "Zone A", line: "Production Line 1", reason: "Hydraulic Leak", description: "Hydraulic oil leaking from the main cylinder joint.", raisedBy: "Arjun Mehta", raisedAt: "2026-03-28T08:45:00", status: "OTP Verified", assignedTo: "T005", assignedName: "Vikram Rao", resolvedAt: "2026-03-28T13:20:00", otp: "582904", otpVerified: true, priority: "High", downtime: "4h 35m", remark: "Replaced cylinder O-ring and tightened joints. Tested for 30 min — no leak." },
  { id: "MNT-002", machine: "M2-R2", machineName: "Machine 2 - Row 2", zone: "Zone B", line: "Production Line 2", reason: "Electrical Fault", description: "Panel tripping repeatedly due to short circuit.", raisedBy: "Deepa Nair", raisedAt: "2026-03-29T10:10:00", status: "OTP Verified", assignedTo: "T002", assignedName: "Priya Sharma", resolvedAt: "2026-03-29T14:50:00", otp: "734621", otpVerified: true, priority: "Critical", downtime: "4h 40m", remark: "Faulty contactor replaced. Rewired panel section B2." },
  { id: "MNT-003", machine: "M5-R1", machineName: "Machine 5 - Row 1", zone: "Zone B", line: "Production Line 2", reason: "Belt / Chain Snap", description: "Drive belt snapped causing complete stoppage.", raisedBy: "Sanjay Gupta", raisedAt: "2026-03-30T07:20:00", status: "In Progress", assignedTo: "T003", assignedName: "Amit Singh", resolvedAt: null, otp: "194837", otpVerified: false, priority: "High", downtime: "Running…", remark: "" },
  { id: "MNT-004", machine: "M1-R2", machineName: "Machine 1 - Row 2", zone: "Zone B", line: "Production Line 2", reason: "Software / PLC Error", description: "PLC program throwing fault code E-44.", raisedBy: "Ritu Verma", raisedAt: "2026-03-31T09:00:00", status: "Assigned", assignedTo: "T004", assignedName: "Neha Patel", resolvedAt: null, otp: "367512", otpVerified: false, priority: "Medium", downtime: "Running…", remark: "" },
  { id: "MNT-005", machine: "M3-R1", machineName: "Machine 3 - Row 1", zone: "Zone A", line: "Production Line 1", reason: "Overheating", description: "Motor temperature exceeds 85°C during peak load.", raisedBy: "Ankit Yadav", raisedAt: "2026-04-01T06:30:00", status: "Pending", assignedTo: null, assignedName: null, resolvedAt: null, otp: "821045", otpVerified: false, priority: "Medium", downtime: "Running…", remark: "" },
];

// ─── Sparkline Mini‑Chart ─────────────────────────────────────────────────────
const Sparkline = ({ data, color, height = 40, width = 100 }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,${height} ${pts} ${width},${height}`} fill={color} fillOpacity="0.12" stroke="none" />
    </svg>
  );
};

// ─── Custom Breakdown Bar Chart with Detailed Hover Tooltips ─────────────────
const BreakdownBarChart = ({ data, labels, colors, details }) => {
  const max = Math.max(...data) || 1;
  const [hoverIndex, setHoverIndex] = useState(null);

  return (
    <div className="mnt-bar-chart">
      {data.map((val, i) => (
        <div key={i} className="mnt-bar-col" onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
          <div className="mnt-bar-track">
            <div className="mnt-bar-fill" style={{ height: `${(val / max) * 100}%`, background: colors[i % colors.length] }} />
          </div>
          <span className="mnt-bar-label">{labels[i]}</span>
          <span className="mnt-bar-val">{val}</span>

          {hoverIndex === i && details && details[i] && details[i].length > 0 && (
            <div className="mnt-bar-tooltip">
              <p className="mnt-tooltip-header">{labels[i]} Breakdown Details</p>
              <div className="mnt-tooltip-list">
                {details[i].map((inc, idx) => (
                  <div key={idx} className="mnt-tooltip-item">
                    <span className="mnt-tooltip-dot" style={{ background: colors[i % colors.length] }} />
                    <p><strong>{inc.machine?.machineId || inc.machine}</strong>: {inc.reason}</p>
                    <span className="mnt-tooltip-time">{new Date(inc.raisedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
              <p className="mnt-tooltip-footer">Total Incidents: {val}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Donut Chart (status distribution) ───────────────────────────────────────
const DonutChart = ({ segments }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let cumulative = 0;
  const r = 50, cx = 60, cy = 60, strokeW = 16, circum = 2 * Math.PI * r;
  return (
    <div className="mnt-donut-wrap">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeW} />
        {segments.map((seg, i) => {
          const pct = seg.value / total, dash = pct * circum, offset = -(cumulative / total) * circum;
          cumulative += seg.value;
          return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={strokeW} strokeDasharray={`${dash} ${circum - dash}`} strokeDashoffset={offset} strokeLinecap="round" style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dasharray 0.8s ease" }} />;
        })}
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="#22374e">{total}</text>
      </svg>
      <div className="mnt-donut-legend">
        {segments.map((seg, i) => (
          <div key={i} className="mnt-legend-item">
            <span className="mnt-legend-dot" style={{ background: seg.color }} />
            <span className="mnt-legend-label">{seg.label}</span>
            <span className="mnt-legend-val">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Gauge (availability %) ───────────────────────────────────────────────────
const GaugeChart = ({ value, label, color }) => {
  const r = 45, circum = Math.PI * r, pct = Math.min(Math.max(value, 0), 100) / 100, dash = pct * circum;
  return (
    <div className="mnt-gauge-wrap">
      <svg width="120" height="70" viewBox="0 0 120 70">
        <path d={`M 15,60 A ${r},${r} 0 0,1 105,60`} fill="none" stroke="#f1f5f9" strokeWidth="12" strokeLinecap="round" />
        <path d={`M 15,60 A ${r},${r} 0 0,1 105,60`} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${dash} ${circum}`} style={{ transition: "stroke-dasharray 1s ease" }} />
        <text x="60" y="58" textAnchor="middle" fontSize="15" fontWeight="700" fill="#22374e">{value}%</text>
      </svg>
      <p className="mnt-gauge-label">{label}</p>
    </div>
  );
};

// ─── Priority Badge ───────────────────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  const map = { Critical: "#dc2626", High: "#f97316", Medium: "#f59e0b", Low: "#22c55e" };
  return <span className="mnt-priority-badge" style={{ background: map[priority] + "20", color: map[priority], border: `1px solid ${map[priority]}40` }}>{priority}</span>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const MaintenancePage = () => {
  const [tickets, setTickets] = useState(() => {
    const saved = localStorage.getItem("mnt_tickets");
    return saved ? JSON.parse(saved) : SEED_TICKETS;
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [machines, setMachines] = useState(INITIAL_MACHINES);
  const [zones, setZones] = useState(INITIAL_ZONES);
  const [showAddMachineModal, setShowAddMachineModal] = useState(false);
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remarkInput, setRemarkInput] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [animIn, setAnimIn] = useState(false);

  // Tech & Machine Log State
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [showTechLogModal, setShowTechLogModal] = useState(false);
  const [selectedMachineDetail, setSelectedMachineDetail] = useState(null);
  const [showMachineDetail, setShowMachineDetail] = useState(false);

  // Advanced Chart State
  const [chartView, setChartView] = useState("Monthly"); // Weekly, Monthly, Yearly
  const [chartRange, setChartRange] = useState({ start: "2026-01-01", end: "2026-12-31" });

  // Management Forms State
  const [form, setForm] = useState({ machine: "", reason: "", raisedBy: "", incidentTime: new Date().toISOString().slice(0, 16), description: "" });
  const [machineForm, setMachineForm] = useState({ id: "", name: "", zone: "Zone A", line: "Production Line 1" });
  const [zoneForm, setZoneForm] = useState({ id: "", color: "#3b82f6" });
  const [formError, setFormError] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [assignee, setAssignee] = useState("");
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000); // 30s auto-refresh (silent)
    setTimeout(() => setAnimIn(true), 100);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [ticketsRes, machinesRes, techsRes] = await Promise.all([
        API.maintenance.getTickets(),
        API.maintenance.getMachines(),
        API.maintenance.getTechnicians()
      ]);
      
      if (ticketsRes.status) {
        // Sort tickets by date (latest first)
        const sortedTickets = ticketsRes.data.sort((a, b) => new Date(b.raisedAt) - new Date(a.raisedAt));
        setTickets(sortedTickets);
      }
      if (machinesRes.status) setMachines(machinesRes.data.length > 0 ? machinesRes.data : INITIAL_MACHINES);
      if (techsRes.status) setTechnicians(techsRes.data);
    } catch (error) {
      console.error("Error fetching maintenance data:", error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Update localStorage whenever tickets change
  useEffect(() => {
    localStorage.setItem("mnt_tickets", JSON.stringify(tickets));
  }, [tickets]);

  // ── KPI Stats & Filtering ──
  const total = tickets.length;
  const pending = tickets.filter(t => t.status === "Pending").length;
  const inProgress = tickets.filter(t => ["Assigned", "In Progress"].includes(t.status)).length;
  const resolved = tickets.filter(t => ["Resolved", "OTP Verified"].includes(t.status)).length;
  const criticalCount = tickets.filter(t => t.priority === "Critical").length;
  const avgResolutionHours = 4.6;

  const filteredTickets = useMemo(() => {
    let list = [...tickets];
    
    // Safety check for tickets format and explicit sort
    list.sort((a, b) => new Date(b.raisedAt) - new Date(a.raisedAt));

    return list.filter(t => {
      const matchStatus = filterStatus === "All" || t.status === filterStatus;
      
      // Safe string matching for search
      const machineId = (t.machine?.machineId || t.machine || "").toString().toLowerCase();
      const machineNameSearch = (t.machineName || "").toLowerCase();
      const reasonSearch = (t.reason || "").toLowerCase();
      const raisedBySearch = (t.raisedBy || "").toLowerCase();
      const ticketIdSearch = (t.ticketId || t.id || "").toLowerCase();
      const search = searchText.toLowerCase();

      const matchSearch = !searchText ||
        machineId.includes(search) ||
        machineNameSearch.includes(search) ||
        reasonSearch.includes(search) ||
        raisedBySearch.includes(search) ||
        ticketIdSearch.includes(search);
        
      return matchStatus && matchSearch;
    });
  }, [tickets, filterStatus, searchText]);

  // ── Chart Logic ──
  const getChartData = () => {
    const filteredByRange = tickets.filter(t => {
      const d = new Date(t.raisedAt).toISOString().split("T")[0];
      return d >= chartRange.start && d <= chartRange.end;
    });

    let labels = [], counts = [], details = [];
    const colors = ["#3b82f6", "#6366f1", "#8b5cf6", "#d946ef", "#f43f5e", "#f97316", "#f59e0b", "#22c55e", "#14b8a6", "#06b6d4", "#0ea5e9", "#22374e"];

    if (chartView === "Yearly") {
      labels = ["2024", "2025", "2026"];
      counts = labels.map(y => filteredByRange.filter(t => t.raisedAt.startsWith(y)).length);
      details = labels.map(y => filteredByRange.filter(t => t.raisedAt.startsWith(y)));
    } else if (chartView === "Monthly") {
      labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      counts = labels.map((_, i) => filteredByRange.filter(t => new Date(t.raisedAt).getMonth() === i).length);
      details = labels.map((_, i) => filteredByRange.filter(t => new Date(t.raisedAt).getMonth() === i));
    } else {
      // Weekly view (last 12 weeks for better UI display)
      labels = ["W-11", "W-10", "W-09", "W-08", "W-07", "W-06", "W-05", "W-04", "W-03", "W-02", "W-01", "Current"];
      counts = labels.map((_, i) => {
        const d = new Date();
        const start = new Date(d.setDate(d.getDate() - (11 - i) * 7));
        const end = new Date(d.setDate(d.getDate() + 7));
        return filteredByRange.filter(t => {
          const td = new Date(t.raisedAt);
          return td >= start && td <= end;
        }).length;
      });
      details = labels.map((_, i) => {
        const d = new Date();
        const start = new Date(d.setDate(d.getDate() - (11 - i) * 7));
        const end = new Date(d.setDate(d.getDate() + 7));
        return filteredByRange.filter(t => {
          const td = new Date(t.raisedAt);
          return td >= start && td <= end;
        });
      });
    }
    return { labels, counts, colors, details };
  };

  const chartInfo = getChartData();

  // ── Action Handlers ──
  const handleRaise = async () => {
    if (!form.machine || !form.reason || !form.raisedBy || !form.incidentTime) {
      setFormError("Please fill all required fields."); return;
    }
    try {
      const res = await API.maintenance.createTicket({
        machine: form.machine,
        reason: form.reason,
        description: form.description,
        raisedBy: form.raisedBy,
        raisedAt: form.incidentTime,
        priority: "Medium"
      });
      if (res.status) {
        setTickets(prev => [res.data, ...prev]);
        setShowRaiseModal(false); 
        setForm({ machine: "", reason: "", description: "", raisedBy: "", incidentTime: "" }); 
        setFormError("");
        fetchData(); // Refresh to get populated data
      }
    } catch (error) {
      setFormError("Failed to report breakdown.");
    }
  };

  const handleAssign = async () => {
    if (!assignee) return;
    try {
      const res = await API.maintenance.assignTicket({
        ticketId: selectedTicket._id,
        assignedTo: assignee
      });
      if (res.status) {
        setTickets(prev => prev.map(t => t._id === selectedTicket._id ? res.data : t));
        setShowAssignModal(false); setAssignee("");
        fetchData();
      }
    } catch (error) {
      console.error("Error assigning ticket:", error);
    }
  };

  const handleOtpVerify = async () => {
    try {
      const res = await API.maintenance.verifyOTP({
        ticketId: selectedTicket._id,
        otp: otpInput
      });
      if (res.status) {
        setOtpSuccess(true);
        setTickets(prev => prev.map(t => t._id === selectedTicket._id ? res.data : t));
        setTimeout(() => { setShowOtpModal(false); setOtpSuccess(false); setOtpInput(""); setOtpError(""); }, 1500);
        fetchData();
      } else {
        setOtpError("Invalid OTP. Verification failed.");
      }
    } catch (error) {
      setOtpError("Verification failed.");
    }
  };

  const handleMarkResolved = async (ticket) => {
    try {
      const res = await API.maintenance.updateTicket(ticket._id, { status: "Resolved", resolvedAt: new Date().toISOString() });
      if (res.status) {
        setTickets(prev => prev.map(t => t._id === ticket._id ? res.data : t));
        fetchData();
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
    }
  };

  const handleSaveRemark = async () => {
    if (!remarkInput.trim()) return;
    try {
      const res = await API.maintenance.updateTicket(selectedTicket._id, { remark: remarkInput });
      if (res.status) {
        setTickets(prev => prev.map(t => t._id === selectedTicket._id ? res.data : t));
        setShowRemarkModal(false);
        setRemarkInput("");
        fetchData();
      }
    } catch (error) {
      console.error("Error saving remark:", error);
    }
  };

  const handleAddMachine = async () => {
    if (!machineForm.id || !machineForm.name || !machineForm.zone || !machineForm.line) {
      setFormError("Please fill all required fields."); return;
    }
    try {
      const res = await API.maintenance.addMachine({
        machineId: machineForm.id,
        name: machineForm.name,
        zone: machineForm.zone,
        line: machineForm.line
      });
      if (res.status) {
        setMachines(prev => [...prev, res.data]);
        setShowAddMachineModal(false);
        setMachineForm({ id: "", name: "", zone: zones[0]?.id || "Zone A", line: "Production Line 1" });
        setFormError("");
        fetchData();
      }
    } catch (error) {
      setFormError("Failed to add machine.");
    }
  };

  const handleAddZone = () => {
    if (!zoneForm.id) {
      setFormError("Please enter a Zone ID."); return;
    }
    if (zones.find(z => z.id === zoneForm.id)) {
      setFormError("Zone ID already exists."); return;
    }
    setZones(prev => [...prev, { ...zoneForm, availability: 100 }]);
    setShowAddZoneModal(false);
    setZoneForm({ id: "", color: "#3b82f6" });
    setFormError("");
  };

  if (loading) {
    return <div className="mnt-loader">Loading maintenance data...</div>;
  }

  return (
    <div className={`mnt-root ${animIn ? "mnt-anim-in" : ""}`}>
      {/* ── Page Header ── */}
      <div className="mnt-page-header">
        <div className="mnt-page-header-left">
          <div className="mnt-page-icon"><span className="material-symbols-rounded">build_circle</span></div>
          <div>
            <div className="mnt-title-area-wrap">
              <h1 className="mnt-page-title">Maintenance Dashboard</h1>
              <div className="mnt-area-tag">
                <span className="material-symbols-rounded">location_on</span>
                Area Zone: Baddi
              </div>
            </div>
            <p className="mnt-page-subtitle">Real-Time Machine Breakdown Analytics</p>
          </div>
        </div>
        <button className="mnt-raise-btn" onClick={() => setShowRaiseModal(true)}><span className="material-symbols-rounded">add_circle</span>Report Breakdown</button>
      </div>

      {/* ── KPI Grid ── */}
      <div className="mnt-kpi-grid">
        <div className="mnt-kpi-card mnt-kpi-blue"><div className="mnt-kpi-top"><div><p className="mnt-kpi-label">Total Tickets</p><h2 className="mnt-kpi-value">{total}</h2><p className="mnt-kpi-sub">+3 this week</p></div><span className="material-symbols-rounded mnt-kpi-icon">assignment</span></div><Sparkline data={[4, 7, 5, 9, 6, 8, 7, 10, 8, 11, 9, 12]} color="#3b82f6" /></div>
        <div className="mnt-kpi-card mnt-kpi-orange"><div className="mnt-kpi-top"><div><p className="mnt-kpi-label">Pending</p><h2 className="mnt-kpi-value">{pending}</h2><p className="mnt-kpi-sub">Awaiting assignment</p></div><span className="material-symbols-rounded mnt-kpi-icon">pending_actions</span></div><Sparkline data={[1, 2, 1, 3, 2, 1, 2, 3, 2, 1, 2, pending || 1]} color="#f97316" /></div>
        <div className="mnt-kpi-card mnt-kpi-yellow"><div className="mnt-kpi-top"><div><p className="mnt-kpi-label">In Progress</p><h2 className="mnt-kpi-value">{inProgress}</h2><p className="mnt-kpi-sub">Under repair</p></div><span className="material-symbols-rounded mnt-kpi-icon">construction</span></div><Sparkline data={[2, 1, 3, 2, 4, 3, 2, 3, 4, 3, 2, inProgress || 1]} color="#f59e0b" /></div>
        <div className="mnt-kpi-card mnt-kpi-green"><div className="mnt-kpi-top"><div><p className="mnt-kpi-label">Resolved</p><h2 className="mnt-kpi-value">{resolved}</h2><p className="mnt-kpi-sub">Verified closed</p></div><span className="material-symbols-rounded mnt-kpi-icon">check_circle</span></div><Sparkline data={[2, 3, 2, 4, 3, 5, 4, 6, 5, 4, 3, resolved || 1]} color="#22c55e" /></div>
        <div className="mnt-kpi-card mnt-kpi-red"><div className="mnt-kpi-top"><div><p className="mnt-kpi-label">Critical</p><h2 className="mnt-kpi-value">{criticalCount}</h2><p className="mnt-kpi-sub">Urgent attention</p></div><span className="material-symbols-rounded mnt-kpi-icon">warning</span></div><Sparkline data={[0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, criticalCount || 0]} color="#dc2626" /></div>
        <div className="mnt-kpi-card mnt-kpi-purple"><div className="mnt-kpi-top"><div><p className="mnt-kpi-label">Resolution</p><h2 className="mnt-kpi-value">{avgResolutionHours}h</h2><p className="mnt-kpi-sub">Avg MTTR</p></div><span className="material-symbols-rounded mnt-kpi-icon">timer</span></div><Sparkline data={[6, 5, 7, 4, 5, 6, 4, 5, 4, 4, 5, 5]} color="#8b5cf6" /></div>
      </div>

      {/* ══════ TECHNICIAN DETAIL VIEW (FULL PAGE) ══════ */}
      {showTechLogModal && selectedTechnician && (
        <div className="mnt-detail-view">
          <div className="mnt-detail-header">
            <button className="mnt-back-btn" onClick={() => setShowTechLogModal(false)}>
              <span className="material-symbols-rounded">arrow_back</span> Back to Dashboard
            </button>
            <div className="mnt-detail-title-wrap">
              <div className="mnt-tech-modal-avatar" style={{ background: selectedTechnician.color }}>
                {selectedTechnician.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="mnt-modal-header-info">
                <h2>{selectedTechnician.name}</h2>
                <p className="mnt-modal-subtitle">{selectedTechnician.role} • Profile Details</p>
              </div>
            </div>
          </div>

          <div className="mnt-detail-grid">
            <div className="mnt-tech-stats-row">
              <div className="mnt-tech-stat-card">
                <span className="material-symbols-rounded mnt-stat-icon-blue">task_alt</span>
                <div><h3>{selectedTechnician.resolved}</h3><p>Total Resolved</p></div>
              </div>
              <div className="mnt-tech-stat-card">
                <span className="material-symbols-rounded mnt-stat-icon-orange">timer</span>
                <div><h3>{selectedTechnician.mttr}</h3><p>Avg. MTTR</p></div>
              </div>
              <div className="mnt-tech-stat-card">
                <span className="material-symbols-rounded mnt-stat-icon-green">stars</span>
                <div><h3>{selectedTechnician.score}/10</h3><p>Perf. Score</p></div>
              </div>
              <div className="mnt-tech-stat-card">
                <span className="material-symbols-rounded mnt-stat-icon-purple">id_card</span>
                <div><h3>{selectedTechnician.id}</h3><p>Employee ID</p></div>
              </div>
            </div>

            <div className="mnt-tech-charts">
              <div className="mnt-chart-card">
                <div className="mnt-card-header"><h3>Monthly Performance Trend</h3></div>
                <div style={{ width: "100%", height: "250px" }}>
                  <ResponsiveContainer>
                    <ReBarChart data={[
                      { name: "Jan", tickets: 12 }, { name: "Feb", tickets: 18 }, { name: "Mar", tickets: 24 }, { name: "Apr", tickets: 15 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} />
                      <Bar dataKey="tickets" fill={selectedTechnician.color} radius={[4, 4, 0, 0]} />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mnt-chart-card">
                <div className="mnt-card-header"><h3>Resolution Quality</h3></div>
                <div style={{ width: "100%", height: "250px" }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={[
                        { name: "First Time Fix", value: 85 }, { name: "Rework", value: 15 }
                      ]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        <Cell fill="#22c55e" /><Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="mnt-chart-card">
              <div className="mnt-card-header"><h3>Activity Records</h3></div>
              <div className="mnt-log-table-wrap">
                <table className="mnt-log-table">
                  <thead>
                    <tr>
                      <th><span className="mnt-th-content"><span className="material-symbols-rounded">tag</span>TICKET ID</span></th>
                      <th><span className="mnt-th-content"><span className="material-symbols-rounded">precision_manufacturing</span>MACHINE</span></th>
                      <th><span className="mnt-th-content"><span className="material-symbols-rounded">report_problem</span>REASON</span></th>
                      <th><span className="mnt-th-content"><span className="material-symbols-rounded">person</span>RAISED BY</span></th>
                      <th><span className="mnt-th-content"><span className="material-symbols-rounded">schedule</span>LOGGED AT</span></th>
                      <th><span className="mnt-th-content"><span className="material-symbols-rounded">task_alt</span>RESOLVED AT</span></th>
                      <th><span className="mnt-th-content"><span className="material-symbols-rounded">timer</span>DOWNTIME</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.filter(t => (t.assignedTo?._id || t.assignedTo) === selectedTechnician._id || t.assignedName === selectedTechnician.name).map(t => (
                      <tr key={t._id}>
                        <td><span className="mnt-ticket-id">{t.ticketId}</span></td>
                        <td>{t.machine?.machineId || t.machine}</td>
                        <td>{t.reason}</td>
                        <td>{t.raisedBy}</td>
                        <td className="mnt-time-cell">{new Date(t.raisedAt).toLocaleString()}</td>
                        <td className="mnt-time-cell">{t.resolvedAt ? new Date(t.resolvedAt).toLocaleString() : "..."}</td>
                        <td><span className="mnt-downtime-pill">{t.downtime}</span></td>
                      </tr>
                    ))}
                    {tickets.filter(t => t.assignedTo === selectedTechnician.id || t.assignedName === selectedTechnician.name).length === 0 && (
                      <tr>
                        <td colSpan="7" className="mnt-no-records">
                          <span className="material-symbols-rounded">folder_open</span>
                          <p>No activity records found for this technician.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════ MACHINE DETAIL VIEW (FULL PAGE) ══════ */}
      {showMachineDetail && selectedMachineDetail && (
        <div className="mnt-detail-view mnt-anim-in">
          <div className="mnt-detail-header">
            <button className="mnt-back-btn" onClick={() => setShowMachineDetail(false)}>
              <span className="material-symbols-rounded">arrow_back</span> Back to Dashboard
            </button>
            <div className="mnt-detail-title-wrap">
              <div className="mnt-tech-modal-avatar" style={{ background: "#3b82f6" }}>
                <span className="material-symbols-rounded">precision_manufacturing</span>
              </div>
              <div className="mnt-modal-header-info">
                <h2>{selectedMachineDetail.machineId} - {selectedMachineDetail.name}</h2>
                <p>{selectedMachineDetail.zone} | {selectedMachineDetail.line}</p>
              </div>
            </div>
          </div>

          <div className="mnt-tech-stats-row">
            <div className="mnt-tech-stat-card">
              <span className="material-symbols-rounded mnt-stat-icon-blue">analytics</span>
              <div><h3>{tickets.filter(t => (t.machine?._id || t.machine) === selectedMachineDetail._id).length}</h3><p>Total Failures</p></div>
            </div>
            <div className="mnt-tech-stat-card">
              <span className="material-symbols-rounded mnt-stat-icon-orange">timer</span>
              <div><h3>4.2h</h3><p>Avg. MTTR</p></div>
            </div>
            <div className="mnt-tech-stat-card">
              <span className="material-symbols-rounded mnt-stat-icon-green">history</span>
              <div><h3>Active</h3><p>Status</p></div>
            </div>
            <div className="mnt-tech-stat-card">
              <span className="material-symbols-rounded mnt-stat-icon-purple">verified</span>
              <div><h3>92%</h3><p>OEE Score</p></div>
            </div>
          </div>

          <div className="mnt-tech-charts">
            <div className="mnt-chart-card">
              <div className="mnt-card-header"><h3>Breakdown Root Causes</h3></div>
              <div style={{ width: "100%", height: "250px" }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={[
                      { name: "Mechanical", value: 45 }, { name: "Electrical", value: 30 }, { name: "Software", value: 25 }
                    ]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      <Cell fill="#3b82f6" /><Cell fill="#f97316" /><Cell fill="#8b5cf6" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mnt-chart-card">
              <div className="mnt-card-header"><h3>Resolution Time Trend</h3></div>
              <div style={{ width: "100%", height: "250px" }}>
                <ResponsiveContainer>
                  <ReBarChart data={[
                    { name: "Jan", hrs: 3.5 }, { name: "Feb", hrs: 4.8 }, { name: "Mar", hrs: 3.2 }, { name: "Apr", hrs: 4.1 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="hrs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mnt-chart-card">
            <div className="mnt-card-header"><h3>Machine Activity Log</h3></div>
            <div className="mnt-log-table-wrap">
              <table className="mnt-log-table">
                <thead>
                  <tr>
                    <th><span className="mnt-th-content"><span className="material-symbols-rounded">tag</span>ID</span></th>
                    <th><span className="material-symbols-rounded">report_problem</span>REASON</th>
                    <th><span className="material-symbols-rounded">person</span>RAISED BY</th>
                    <th><span className="material-symbols-rounded">engineering</span>TECH</th>
                    <th><span className="material-symbols-rounded">timer</span>DOWNTIME</th>
                    <th><span className="material-symbols-rounded">task_alt</span>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.filter(t => (t.machine?._id || t.machine) === selectedMachineDetail._id).map(t => (
                    <tr key={t._id}>
                      <td><span className="mnt-log-id">{t.ticketId}</span></td>
                      <td>{t.reason}</td>
                      <td>{t.raisedBy}</td>
                      <td>{t.assignedName || "..."}</td>
                      <td><span className="mnt-status-pill" style={{ background: "#f8fafc", color: "#64748b" }}>{t.downtime}</span></td>
                      <td><span className="mnt-status-pill" style={{ background: STATUS_COLORS[t.status]?.bg, color: STATUS_COLORS[t.status]?.text }}>{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════ MAIN DASHBOARD VIEW ══════ */}
      {!showTechLogModal && !showMachineDetail && (
        <>
          {/* ── Tabs ── */}
          <div className="mnt-tabs">
            {["overview", "tickets", "machines", "performance"].map(tab => (
              <button key={tab} className={`mnt-tab ${activeTab === tab ? "mnt-tab-active" : ""}`} onClick={() => setActiveTab(tab)}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
            ))}
          </div>

          {/* ══════ OVERVIEW TAB ══════ */}
          {activeTab === "overview" && (
            <div className="mnt-tab-content">
              <div className="mnt-charts-row">
                <div className="mnt-chart-card mnt-chart-wide">
                  <div className="mnt-chart-card-header-flex">
                    <h3 className="mnt-chart-title"><span className="material-symbols-rounded">bar_chart</span> Breakdown Incidents Analysis</h3>
                    <div className="mnt-chart-filters">
                      <div className="mnt-chart-toggle">
                        {["Weekly", "Monthly", "Yearly"].map(v => (
                          <button key={v} className={`mnt-toggle-btn ${chartView === v ? "active" : ""}`} onClick={() => setChartView(v)}>{v}</button>
                        ))}
                      </div>
                      <div className="mnt-chart-dates">
                        <input type="date" value={chartRange.start} onChange={e => setChartRange({...chartRange, start: e.target.value})} />
                        <span>to</span>
                        <input type="date" value={chartRange.end} onChange={e => setChartRange({...chartRange, end: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  <BreakdownBarChart data={chartInfo.counts} labels={chartInfo.labels} colors={chartInfo.colors} details={chartInfo.details} />
                </div>
                <div className="mnt-chart-card">
                  <h3 className="mnt-chart-title"><span className="material-symbols-rounded">donut_large</span> Status Distribution</h3>
                  <DonutChart segments={[
                    { label: "Pending", value: pending, color: "#f97316" },
                    { label: "In Progress", value: inProgress, color: "#f59e0b" },
                    { label: "Resolved", value: resolved, color: "#22c55e" },
                    { label: "Critical", value: criticalCount, color: "#dc2626" },
                  ]} />
                </div>
              </div>

              <div className="mnt-charts-row">
                <div className="mnt-chart-card mnt-gauges-card">
                  <h3 className="mnt-chart-title"><span className="material-symbols-rounded">speed</span> Machine Availability</h3>
                  <div className="mnt-gauges-row">
                    {zones.map(zone => (
                      <GaugeChart key={zone.id} value={zone.availability} label={zone.id} color={zone.color} />
                    ))}
                    <GaugeChart value={90} label="Overall" color="#8b5cf6" />
                    <button className="mnt-add-zone-inline-btn" onClick={() => setShowAddZoneModal(true)}>
                      <span className="material-symbols-rounded">add_circle</span>
                      Add Zone
                    </button>
                  </div>
                </div>
                <div className="mnt-chart-card">
                  <h3 className="mnt-chart-title"><span className="material-symbols-rounded">troubleshoot</span> Breakdown Reasons</h3>
                  <div className="mnt-reason-list">
                    {[{r: "Mechanical", p: 32, c: "#3b82f6"}, {r: "Electrical", p: 24, c: "#f97316"}, {r: "Hydraulic", p: 18, c: "#dc2626"}, {r: "Overheating", p: 14, c: "#f59e0b"}, {r: "PLC Error", p: 12, c: "#8b5cf6"}].map((item, i) => (
                      <div key={i} className="mnt-reason-row"><p className="mnt-reason-label">{item.r}</p><div className="mnt-reason-bar-track"><div className="mnt-reason-bar-fill" style={{ width: `${item.p}%`, background: item.c }} /></div><span className="mnt-reason-pct">{item.p}%</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════ TICKETS TAB ══════ */}
          {activeTab === "tickets" && (
            <div className="mnt-tab-content">
              <div className="mnt-filters">
                <input className="mnt-search" placeholder="🔍 Search tickets, machines, or staff..." value={searchText} onChange={e => setSearchText(e.target.value)} />
                <div className="mnt-filter-btns">
                  {["All", "Pending", "Assigned", "In Progress", "Resolved", "OTP Verified"].map(s => (
                    <button key={s} className={`mnt-filter-btn ${filterStatus === s ? "active" : ""}`} onClick={() => setFilterStatus(s)}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="mnt-ticket-grid">
                {filteredTickets.map(ticket => {
                  const sc = STATUS_COLORS[ticket.status] || STATUS_COLORS["Pending"];
                  return (
                    <div key={ticket._id} className="mnt-ticket-card">
                      <div className="mnt-ticket-card-header">
                        <span className="mnt-ticket-id">{ticket.ticketId}</span>
                        <div className="mnt-ticket-header-right">
                          <PriorityBadge priority={ticket.priority} />
                          <span className="mnt-status-badge" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                            <span className="mnt-status-dot" style={{ background: sc.dot }} />{ticket.status}
                          </span>
                        </div>
                      </div>
                      <div className="mnt-ticket-machine"><span className="material-symbols-rounded">precision_manufacturing</span><div><p className="mnt-ticket-machine-id">{ticket.machine?.machineId || ticket.machine}</p><p className="mnt-ticket-machine-name">{ticket.machineName}</p></div></div>
                      <div className="mnt-ticket-reason"><span className="material-symbols-rounded">report_problem</span><span>{ticket.reason}</span></div>
                      {ticket.description && <div className="mnt-ticket-desc"><span className="material-symbols-rounded">description</span><span>{ticket.description}</span></div>}
                      <div className="mnt-ticket-meta">
                        <div className="mnt-ticket-meta-item"><span className="material-symbols-rounded">person</span><span>Raised by: {ticket.raisedBy}</span></div>
                        <div className="mnt-ticket-meta-item"><span className="material-symbols-rounded">schedule</span><span>{new Date(ticket.raisedAt).toLocaleString()}</span></div>
                        {ticket.assignedName && <div className="mnt-ticket-meta-item"><span className="material-symbols-rounded">engineering</span><span>Assigned to: {ticket.assignedName}</span></div>}
                      </div>
                      {ticket.remark && (
                        <div className="mnt-ticket-remark">
                          <div className="mnt-remark-header"><span className="material-symbols-rounded">rate_review</span><span>Technician Remark</span></div>
                          <p className="mnt-remark-text">{ticket.remark}</p>
                        </div>
                      )}
                      <div className="mnt-ticket-actions">
                        <div className="mnt-action-btn-group">
                          {ticket.status === "Pending" && <button className="mnt-action-btn mnt-btn-assign" onClick={() => { setSelectedTicket(ticket); setShowAssignModal(true); }}><span className="material-symbols-rounded">person_add</span>Assign</button>}
                          {["In Progress", "Assigned"].includes(ticket.status) && <button className="mnt-action-btn mnt-btn-remark" onClick={() => { setSelectedTicket(ticket); setRemarkInput(ticket.remark || ""); setShowRemarkModal(true); }}><span className="material-symbols-rounded">edit_note</span>Add Remark</button>}
                          {ticket.status === "In Progress" && <button className="mnt-action-btn mnt-btn-resolve" onClick={() => handleMarkResolved(ticket)}><span className="material-symbols-rounded">task_alt</span>Resolve</button>}
                          {ticket.status === "Resolved" && !ticket.otpVerified && <button className="mnt-action-btn mnt-btn-otp" onClick={() => { setSelectedTicket(ticket); setShowOtpModal(true); }}><span className="material-symbols-rounded">lock_open</span>Verify OTP</button>}
                          {ticket.status === "OTP Verified" && <div className="mnt-verified-badge"><span className="material-symbols-rounded">verified</span>Closed</div>}
                        </div>
                        {ticket.downtime !== "Running…" && (
                          <div className="mnt-downtime-tag"><span className="material-symbols-rounded">timer</span>{ticket.downtime}</div>
                        )}
                        {ticket.downtime === "Running…" && !["Resolved", "OTP Verified"].includes(ticket.status) && (
                          <div className="mnt-downtime-tag"><span className="material-symbols-rounded">timer</span>Running…</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════ MACHINES TAB ══════ */}
          {activeTab === "machines" && (
            <div className="mnt-tab-content">
              <div className="mnt-machine-grid">
                <div className="mnt-machine-card mnt-add-machine-card" onClick={() => setShowAddMachineModal(true)}>
                  <span className="material-symbols-rounded mnt-add-icon">add_circle</span>
                  <p className="mnt-add-label">Add New Machine</p>
                </div>
                {machines.map(m => {
                  const mt = tickets.filter(t => (t.machine?._id || t.machine) === m._id); const act = mt.some(t => !["OTP Verified", "Resolved"].includes(t.status));
                  const sc = act ? "#f97316" : "#22c55e";
                  return (
                    <div key={m._id} className={`mnt-machine-card ${act ? "mnt-machine-issue" : ""}`} onClick={() => { setSelectedMachineDetail(m); setShowMachineDetail(true); }}>
                      <div className="mnt-machine-card-header"><span className="material-symbols-rounded mnt-machine-big-icon" style={{ color: sc }}>precision_manufacturing</span><div className="mnt-machine-status-dot" style={{ background: sc }} /></div>
                      <p className="mnt-machine-card-id">{m.machineId}</p><p className="mnt-machine-card-name">{m.name}</p><p className="mnt-machine-card-zone">{m.zone}</p>
                      <div className="mnt-machine-card-status" style={{ color: sc }}><span className="material-symbols-rounded" style={{ fontSize: 16 }}>{act ? "warning" : "check_circle"}</span><span>{act ? "Issue Active" : "Operational"}</span></div>
                      <div className="mnt-machine-stats"><div className="mnt-machine-stat"><span className="mnt-machine-stat-val">{mt.length}</span><span className="mnt-machine-stat-label">Tickets</span></div><div className="mnt-machine-stat"><span className="mnt-machine-stat-val">{mt.filter(t => t.status === "OTP Verified").length}</span><span className="mnt-machine-stat-label">Resolved</span></div></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════ PERFORMANCE TAB ══════ */}
          {activeTab === "performance" && (
            <div className="mnt-tab-content">
              <div className="mnt-charts-row">
                <div className="mnt-chart-card mnt-chart-wide">
                  <h3 className="mnt-chart-title">
                    <span className="material-symbols-rounded">trending_up</span>
                    Technician Performance Scorecard
                  </h3>
                  <div className="mnt-tech-performance">
                    {technicians.map((tech, i) => {
                      const stats = { resolved: 0, avg: "0h", score: 100, color: "#3b82f6" };
                      return (
                        <div key={tech._id} className="mnt-tech-row clickable" onClick={() => { setSelectedTechnician(tech); setShowTechLogModal(true); }}>
                          <div className="mnt-tech-avatar" style={{ background: stats.color + "20", color: stats.color }}>
                            {tech.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div className="mnt-tech-info">
                            <p className="mnt-tech-name">{tech.name}</p>
                            <p className="mnt-tech-meta">{tech.designation || "Technician"}</p>
                          </div>
                          <div className="mnt-tech-score-wrap">
                            <div className="mnt-tech-score-bar-track">
                              <div className="mnt-tech-score-bar" style={{ width: `${stats.score}%`, background: stats.color }} />
                            </div>
                            <span className="mnt-tech-score-val" style={{ color: stats.color }}>{stats.score}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mnt-metric-summary-card">
                  <div className="mnt-metric-item">
                    <p className="mnt-metric-label">MTBF</p>
                    <div className="mnt-metric-main">
                      <span className="mnt-metric-val">312</span>
                      <span className="mnt-metric-unit">hrs</span>
                    </div>
                    <p className="mnt-metric-desc">Mean Time Between Failures</p>
                  </div>
                  <div className="mnt-metric-item">
                    <p className="mnt-metric-label">MTTR</p>
                    <div className="mnt-metric-main">
                      <span className="mnt-metric-val">4.6</span>
                      <span className="mnt-metric-unit">hrs</span>
                    </div>
                    <p className="mnt-metric-desc">Mean Time To Repair</p>
                  </div>
                  <div className="mnt-metric-item">
                    <p className="mnt-metric-label">OEE</p>
                    <div className="mnt-metric-main">
                      <span className="mnt-metric-val">84.2</span>
                      <span className="mnt-metric-unit">%</span>
                    </div>
                    <p className="mnt-metric-desc">Equipment Effectiveness</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════ WORKFLOW TAB ══════ */}
          {/* {activeTab === "workflow" && (
            <div className="mnt-tab-content">
              <div className="mnt-workflow-card">
                <h3 className="mnt-chart-title">
                  <span className="material-symbols-rounded">account_tree</span>
                  Standard Breakdown Resolution Workflow
                </h3>
                <div className="mnt-flow-steps">
                  {[
                    { icon: "report_problem", title: "1. Breakdown Reported", desc: "Operator logs machine ID, incident reason & time via portal.", color: "#f97316" },
                    { icon: "supervisor_account", title: "2. Superior Reviews", desc: "Manager reviews ticket and assigns best-fit technician.", color: "#3b82f6" },
                    { icon: "person_add", title: "3. Task Assigned", desc: "Technician receives push notification with machine location.", color: "#8b5cf6" },
                    { icon: "construction", title: "4. Repair Progress", desc: "Technician fixes machine; status updates in real-time.", color: "#14b8a6" },
                    { icon: "lock_open", title: "5. OTP Generation", desc: "Technician generates unique 6-digit OTP after repair.", color: "#22c55e" },
                    { icon: "verified", title: "6. Closure Verified", desc: "Reporter enters OTP in app. Ticket closes on verification match.", color: "#6366f1" },
                  ].map((step, i) => (
                    <div key={i} className="mnt-flow-item">
                      <div className="mnt-flow-icon" style={{ background: step.color + "15", color: step.color }}>
                        <span className="material-symbols-rounded">{step.icon}</span>
                      </div>
                      <div className="mnt-flow-info">
                        <p className="mnt-flow-title" style={{ color: step.color }}>{step.title}</p>
                        <p className="mnt-flow-desc">{step.desc}</p>
                      </div>
                      {i < 5 && <div className="mnt-flow-arrow"><span className="material-symbols-rounded">arrow_forward</span></div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )} */}
        </>
      )}

      {/* Modals restored below */}
      {showRaiseModal && (
        <div className="mnt-modal-overlay" onClick={() => setShowRaiseModal(false)}>
          <div className="mnt-modal" onClick={e => e.stopPropagation()}>
            <div className="mnt-modal-header"><h2>Report Breakdown</h2><button onClick={() => setShowRaiseModal(false)}>×</button></div>
            <div className="mnt-modal-body">
              {formError && <div className="mnt-form-error">{formError}</div>}
              <div className="mnt-form-group"><label>Machine</label><select value={form.machine} onChange={e => setForm({...form, machine: e.target.value})}><option value="">Select Machine</option>{machines.map(m => <option key={m._id} value={m._id}>{m.machineId} - {m.name}</option>)}</select></div>
              <div className="mnt-form-group">
                <label>Description (Optional)</label>
                <textarea rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} 
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }} placeholder="Provide more details about the fault..." />
              </div>
              <div className="mnt-form-row">
                <div className="mnt-form-group"><label>By</label><input value={form.raisedBy} onChange={e => setForm({...form, raisedBy: e.target.value})} /></div>
                <div className="mnt-form-group"><label>Time</label><input type="datetime-local" value={form.incidentTime} onChange={e => setForm({...form, incidentTime: e.target.value})} /></div>
              </div>
            </div>
            <div className="mnt-modal-footer"><button onClick={handleRaise}>Submit</button></div>
          </div>
        </div>
      )}

      {showAssignModal && selectedTicket && (
        <div className="mnt-modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="mnt-modal mnt-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="mnt-modal-header">
              <div>
                <h2>Assign Team Member</h2>
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Select an expert to handle this ticket</p>
              </div>
              <button onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <div className="mnt-modal-body mnt-assign-list">
              {technicians.map(m => (
                <div 
                  key={m._id} 
                  className={`mnt-assign-item ${assignee === m._id ? "mnt-assign-item-selected" : ""} ${m.isBusy ? "mnt-assign-item-disabled" : ""}`} 
                  onClick={() => !m.isBusy && setAssignee(m._id)}
                >
                  <div className="mnt-assign-avatar-wrap">
                    <div className="mnt-assign-avatar" style={{ background: "#3b82f6" }}>{m.name.split(" ").map(n => n[0]).join("")}</div>
                    <span className="mnt-assign-status-dot" style={{ background: m.isBusy ? "#ef4444" : "#22c55e" }} />
                  </div>
                  <div className="mnt-assign-info">
                    <p className="mnt-assign-name">{m.name}</p>
                    <p className="mnt-assign-role">{m.designation || "Technician"}</p>
                  </div>
                  <div className="mnt-assign-status-pill" style={{ color: m.isBusy ? "#dc2626" : "#16a34a", background: m.isBusy ? "#fef2f2" : "#f0fdf4" }}>
                    {m.isBusy ? "Busy" : "Available"}
                  </div>
                  {assignee === m._id && <span className="material-symbols-rounded mnt-assign-check">check_circle</span>}
                </div>
              ))}
            </div>
            <div className="mnt-modal-footer">
              <button className="mnt-cancel-btn" onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button className="mnt-primary-btn" onClick={handleAssign} disabled={!assignee}>Assign Expert</button>
            </div>
          </div>
        </div>
      )}

      {showOtpModal && selectedTicket && (
        <div className="mnt-modal-overlay" onClick={() => setShowOtpModal(false)}>
          <div className="mnt-modal mnt-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="mnt-modal-header"><h2>Verify OTP</h2><button onClick={() => setShowOtpModal(false)}>×</button></div>
            <div className="mnt-modal-body mnt-otp-body">
              {otpSuccess ? <p>Success!</p> : <><p>OTP Source Reference: {selectedTicket.otp}</p><input className="mnt-otp-input" value={otpInput} onChange={e => setOtpInput(e.target.value)} /></>}
            </div>
            {!otpSuccess && <div className="mnt-modal-footer"><button onClick={handleOtpVerify}>Verify</button></div>}
          </div>
        </div>
      )}

      {showRemarkModal && selectedTicket && (
        <div className="mnt-modal-overlay" onClick={() => setShowRemarkModal(false)}>
          <div className="mnt-modal" onClick={e => e.stopPropagation()}>
            <div className="mnt-modal-header">
              <h2>Add Remark</h2><button onClick={() => setShowRemarkModal(false)}>×</button>
            </div>
            <div className="mnt-modal-body">
              <div className="mnt-form-group">
                <label>Remark</label>
                <textarea rows="4" value={remarkInput} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                  onChange={e => setRemarkInput(e.target.value)} />
              </div>
            </div>
            <div className="mnt-modal-footer">
              <button onClick={handleSaveRemark}>Save Remark</button>
            </div>
          </div>
        </div>
      )}

      {showAddMachineModal && (
        <div className="mnt-modal-overlay" onClick={() => setShowAddMachineModal(false)}>
          <div className="mnt-modal" onClick={e => e.stopPropagation()}>
            <div className="mnt-modal-header"><h2>Add New Machine</h2><button onClick={() => setShowAddMachineModal(false)}>×</button></div>
            <div className="mnt-modal-body">
              {formError && <div className="mnt-form-error">{formError}</div>}
              <div className="mnt-form-row">
                <div className="mnt-form-group"><label>Machine ID</label><input placeholder="e.g. M6-R1" value={machineForm.id} onChange={e => setMachineForm({...machineForm, id: e.target.value})} /></div>
                <div className="mnt-form-group"><label>Name</label><input placeholder="e.g. Machine 6 - Row 1" value={machineForm.name} onChange={e => setMachineForm({...machineForm, name: e.target.value})} /></div>
              </div>
              <div className="mnt-form-row">
                <div className="mnt-form-group"><label>Zone</label><select value={machineForm.zone} onChange={e => setMachineForm({...machineForm, zone: e.target.value})}>{zones.map(z => <option key={z.id} value={z.id}>{z.id}</option>)}</select></div>
                <div className="mnt-form-group"><label>Line</label><select value={machineForm.line} onChange={e => setMachineForm({...machineForm, line: e.target.value})}><option value="Production Line 1">Production Line 1</option><option value="Production Line 2">Production Line 2</option><option value="Production Line 3">Production Line 3</option><option value="Production Line 4">Production Line 4</option></select></div>
              </div>
            </div>
            <div className="mnt-modal-footer"><button onClick={handleAddMachine}>Add Machine</button></div>
          </div>
        </div>
      )}

      {showAddZoneModal && (
        <div className="mnt-modal-overlay" onClick={() => setShowAddZoneModal(false)}>
          <div className="mnt-modal" onClick={e => e.stopPropagation()}>
            <div className="mnt-modal-header"><h2>Add New Zone</h2><button onClick={() => setShowAddZoneModal(false)}>×</button></div>
            <div className="mnt-modal-body">
              {formError && <div className="mnt-form-error">{formError}</div>}
              <div className="mnt-form-group"><label>Zone ID / Name</label><input placeholder="e.g. Zone D" value={zoneForm.id} onChange={e => setZoneForm({...zoneForm, id: e.target.value})} /></div>
              <div className="mnt-form-group"><label>Theme Color</label><div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>{["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#06b6d4"].map(c => (<div key={c} onClick={() => setZoneForm({...zoneForm, color: c})} style={{ width: "30px", height: "30px", borderRadius: "50%", background: c, cursor: "pointer", border: zoneForm.color === c ? "3px solid #22374e" : "none" }} />))}</div></div>
            </div>
            <div className="mnt-modal-footer"><button onClick={handleAddZone}>Add Zone</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenancePage;
