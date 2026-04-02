import React, { useState, useEffect, useMemo } from "react";
import "./workpermit_tv.css";

const ROTATION_TIME = 15; // seconds

const MOCK_DATA = [
  { 
    id: "WP-791354", title: "Boiler B-04 Annual Maintenance & Pressure Test", type: "Hot Work", 
    icon: "local_fire_department", location: "Refinery A, Floor 3", start: "08:00 AM", end: "04:00 PM", 
    supervisor: "Rajesh Sharma", supervisorImg: "https://x-sg.xyz/v1/ai-faces/male/1", 
    workers: 4, risk: "High", status: "Approved", hazards: ["fire", "gas"], ppe: ["Helmet", "Gloves"] 
  },
  { 
    id: "WP-401012", title: "Main Gas Pipeline Safety Valve Replacement", type: "Cold Work", 
    icon: "filter_alt", location: "Unit 3 Distribution Hub", start: "10:30 AM", end: "02:30 PM", 
    supervisor: "Amit Varma", supervisorImg: "https://x-sg.xyz/v1/ai-faces/male/2", 
    workers: 2, risk: "Medium", status: "Pending", hazards: ["gas"], ppe: ["Helmet", "Goggles"] 
  },
  { 
    id: "WP-128492", title: "Electrical Sub-Station Transformer Wiring", type: "Electrical", 
    icon: "bolt", location: "North Grid, Sector 7", start: "09:00 AM", end: "05:00 PM", 
    supervisor: "Sandeep Kumar", supervisorImg: "https://x-sg.xyz/v1/ai-faces/male/3", 
    workers: 3, risk: "High", status: "Approved", hazards: ["elec"], ppe: ["Gloves", "Boots"] 
  },
  { 
    id: "WP-821903", title: "Chemical Tank-V2 Interior Coating Removal", type: "Confined Space", 
    icon: "masks", location: "Tank Farm C, Bay 12", start: "07:00 AM", end: "11:00 AM", 
    supervisor: "Sanjay Gupta", supervisorImg: "https://x-sg.xyz/v1/ai-faces/male/4", 
    workers: 5, risk: "High", status: "Expired", hazards: ["gas", "confined"], ppe: ["Full Mask", "Harness"] 
  },
];

const WorkPermitTV = () => {
  const [permits] = useState(MOCK_DATA);
  const [activeIndex, setActiveIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROTATION_TIME);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isExiting, setIsExiting] = useState(false);

  // 🕒 Clock Timer
  useEffect(() => {
    const clock = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  // 🔄 Rotation Logic
  useEffect(() => {
    if (permits.length === 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExiting(true);
          setTimeout(() => {
            setActiveIndex((idx) => (idx + 1) % permits.length);
            setIsExiting(false);
          }, 800); // Wait for fade exit animation
          return ROTATION_TIME;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [permits]);

  const currentPermit = useMemo(() => permits[activeIndex], [permits, activeIndex]);
  const progressWidth = (timeLeft / ROTATION_TIME) * 100;

  if (permits.length === 0) {
    return (
      <div className="wp-tv-root">
        <div className="wp-tv-main wp-tv-empty">
           <span className="material-symbols-rounded">inbox</span>
           <h2>No permits scheduled for today.</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="wp-tv-root">
      {/* 🧩 Header */}
      <header className="wp-tv-header">
        <div className="wp-tv-title-block">
          <h1>Today's Work Permit</h1>
          <p>Real-time Site Safety Broadcast</p>
        </div>
        <div className="wp-tv-clock-block">
          <span className="wp-tv-time">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </span>
          <span className="wp-tv-date">
            {currentTime.toLocaleDateString([], { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </header>

      {/* 🧩 Main Permit Card */}
      <div className="wp-tv-main">
        <div className={`wp-tv-card ${isExiting ? 'wp-tv-fade-exit' : 'wp-tv-fade-active'}`}>
           <div className="wp-tv-card-header">
              <div className="wp-tv-left">
                 <span className="wp-tv-permit-id">{currentPermit.id}</span>
                 <h2 className="wp-tv-work-title">{currentPermit.title}</h2>
              </div>
              <span className={`wp-tv-status-badge wp-tv-badge-${currentPermit.status.toLowerCase()}`}>
                 {currentPermit.status}
              </span>
           </div>

           <div className="wp-tv-grid">
              <div className="wp-tv-node">
                 <div className="wp-tv-node-icon"><span className="material-symbols-rounded">{currentPermit.icon}</span></div>
                 <div className="wp-tv-node-content">
                    <label>Work Category</label>
                    <span>{currentPermit.type}</span>
                 </div>
              </div>
              <div className="wp-tv-node">
                 <div className="wp-tv-node-icon"><span className="material-symbols-rounded">location_on</span></div>
                 <div className="wp-tv-node-content">
                    <label>Job Location</label>
                    <span>{currentPermit.location}</span>
                 </div>
              </div>
              <div className="wp-tv-node">
                 <div className="wp-tv-node-icon"><span className="material-symbols-rounded">timeline</span></div>
                 <div className="wp-tv-node-content">
                    <label>Operational Window</label>
                    <span>{currentPermit.start} → {currentPermit.end}</span>
                 </div>
              </div>
              <div className="wp-tv-node">
                 <div className="wp-tv-node-icon"><span className="material-symbols-rounded">person_alert</span></div>
                 <div className="wp-tv-node-content">
                    <label>Supervisor / Officer</label>
                    <div className="wp-tv-supervisor-pill">
                       <img src={currentPermit.supervisorImg} alt="Supervisor" />
                       <span>{currentPermit.supervisor}</span>
                    </div>
                 </div>
              </div>
              <div className="wp-tv-node">
                 <div className="wp-tv-node-icon"><span className="material-symbols-rounded">medical_services</span></div>
                 <div className="wp-tv-node-content">
                    <label>Safety Parameters (PPE/Hazards)</label>
                    <div className="wp-tv-mini-icons">
                       {currentPermit.hazards?.map(h => <span key={h} className="wp-tv-h-badge">{h}</span>)}
                       {currentPermit.ppe?.map(p => <span key={p} className="wp-tv-p-badge">{p}</span>)}
                    </div>
                 </div>
              </div>
              <div className="wp-tv-node">
                 <div className="wp-tv-node-icon"><span className="material-symbols-rounded">warning</span></div>
                 <div className="wp-tv-node-content">
                    <label>Critical Risk Index</label>
                    <span className={`wp-tv-risk-pill wp-tv-risk-${currentPermit.risk.toLowerCase()}`}>
                       {currentPermit.risk} RISK
                    </span>
                 </div>
              </div>
           </div>
        </div>

        {/* 🔢 Page Indicator (Outside Card Now) */}
        <div className="wp-tv-counter">
           Permit {activeIndex + 1} of {permits.length}
        </div>
      </div>

      {/* ⏳ Rotation Footer */}
      <footer className="wp-tv-footer">
          <div className="wp-tv-progress-track">
             <div className="wp-tv-progress-bar" style={{ width: `${progressWidth}%` }} />
          </div>
      </footer>

    </div>
  );
};

export default WorkPermitTV;
