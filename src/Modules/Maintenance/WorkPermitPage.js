import React, { useState, useEffect, useMemo } from "react";
import "./workpermit.css";

const WORK_TYPES = ["Hot Work", "Cold Work", "Electrical", "Confined Space", "Work at Height"];
const HAZARDS = [
  { id: "fire", label: "Fire / Explosion", icon: "local_fire_department" },
  { id: "elec", label: "Electrical Shock", icon: "bolt" },
  { id: "fall", label: "Fall from Height", icon: "height" },
  { id: "gas", label: "Toxic Gas", icon: "masks" },
];
const PPE_LIST = ["Helmet", "Gloves", "Safety Shoes", "Goggles", "Harness", "Ear Protection"];
const SUPERVISORS = ["Rajesh Sharma", "Vikas Gupta", "Sanjay Mehta", "Anil Kulkarni"];
const SAFETY_OFFICERS = ["Amit Varma", "Sunil Deshmukh", "Priya Singh", "Karan Malhotra"];

const INITIAL_PERMITS = [
  { id: "WP-821903", title: "Monthly Boiler Inspection", type: "Cold Work", status: "Approved", date: "2026-03-25", location: "Plant A, Bay 2", workers: 4 },
  { id: "WP-128492", title: "Gas Pipeline Welding", type: "Hot Work", status: "Pending", date: "2026-04-01", location: "Main Refinery, Zone 4", workers: 2 },
  { id: "WP-452391", title: "Electrical Panel Upgrade", type: "Electrical", status: "Rejected", date: "2026-03-30", location: "Control Room, Floor 2", workers: 3 },
];

const WorkPermitPage = () => {
  const [activeTab, setActiveTab] = useState("history"); // Default to history table
  const [isEditing, setIsEditing] = useState(false);
  const [editingPermit, setEditingPermit] = useState(null);
  const [permitId, setPermitId] = useState(`WP-${Math.floor(Math.random() * 900000 + 100000)}`);
  const fileInputRef = React.useRef(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    workType: "Hot Work",
    plant: "",
    area: "",
    location: "",
    exactLocation: "",
    startTime: "",
    endTime: "",
    requestedBy: "Sandeep Kumar",
    supervisor: "Rajesh Sharma",
    safetyOfficer: "Amit Varma",
    riskLevel: "Low",
    controlMeasures: "",
    remarks: "",
    emergencyContact: "+91 99887-76655",
    emergencyPoint: "Safety Station #04",
  });

  const [workers, setWorkers] = useState([{ name: "", id: "", image: null }]);
  const [hazards, setHazards] = useState([]);
  const [ppe, setPpe] = useState([]);
  const [safetyChecks, setSafetyChecks] = useState({
    gasTest: false,
    isolated: false,
    fireExt: false,
    equipChecked: false,
    ventilationCheck: false,
    communicationSet: false,
    lockOutTagOut: false,
    scaffoldingReady: false
  });
  const [errors, setErrors] = useState({});
  const [permits, setPermits] = useState(INITIAL_PERMITS);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [expandedSections, setExpandedSections] = useState([1]); // Default section 1 open

  const toggleSection = (id) => {
    if (expandedSections.includes(id)) {
      setExpandedSections(expandedSections.filter(x => x !== id));
    } else {
      setExpandedSections([...expandedSections, id]);
    }
  };

  // Filtered Permits
  const filteredPermits = useMemo(() => {
    return permits.filter(p => {
      const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "All" || p.status === statusFilter;
      const matchType = typeFilter === "All" || p.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [permits, searchTerm, statusFilter, typeFilter]);

  // Completion Percentage
  const progress = useMemo(() => {
    let fields = [form.title, form.plant, form.startTime, form.endTime, form.description];
    let filled = fields.filter(f => f && f.length > 0).length;
    if (hazards.length > 0) filled++;
    if (ppe.length > 0) filled++;
    if (Object.values(safetyChecks).some(v => v)) filled++;
    return Math.min(Math.round((filled / 8) * 100), 100);
  }, [form, hazards, ppe, safetyChecks]);

  const duration = useMemo(() => {
    if (!form.startTime || !form.endTime) return "0h";
    const start = new Date(form.startTime);
    const end = new Date(form.endTime);
    const diff = end - start;
    if (diff <= 0) return "Invalid";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  }, [form.startTime, form.endTime]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const fillExampleData = () => {
    const now = new Date();
    const future = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    setForm({
      ...form,
      title: "Boiler B-04 Annual Maintenance",
      description: "Comprehensive inspection of internal tubing and replacement of gaskets.",
      plant: "Unit 3 Refinery",
      area: "Zone B",
      location: "Main Production Floor",
      startTime: now.toISOString().slice(0, 16),
      endTime: future.toISOString().slice(0, 16),
      riskLevel: "Medium",
    });
    setWorkers([
      { name: "John Smith", id: "TECH-101", image: null }, 
      { name: "Mike Johnson", id: "TECH-105", image: null }
    ]);
    setHazards(["fire", "gas"]);
    setPpe(["Helmet", "Gloves", "Safety Shoes", "Goggles"]);
    setSafetyChecks({ 
      gasTest: true, 
      isolated: true, 
      fireExt: true, 
      equipChecked: true,
      ventilationCheck: true,
      communicationSet: true,
      lockOutTagOut: true,
      scaffoldingReady: false
    });
    setErrors({});
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      workType: "Hot Work",
      plant: "",
      area: "",
      location: "",
      exactLocation: "",
      startTime: "",
      endTime: "",
      requestedBy: "Sandeep Kumar",
      supervisor: "Rajesh Sharma",
      safetyOfficer: "Amit Varma",
      riskLevel: "Low",
      controlMeasures: "",
      remarks: "",
      emergencyContact: "+91 99887-76655",
      emergencyPoint: "Safety Station #04",
    });
    setWorkers([{ name: "", id: "", image: null }]);
    setHazards([]);
    setPpe([]);
    setSafetyChecks({ gasTest: false, isolated: false, fireExt: false, equipChecked: false });
    setErrors({});
  };

  const handleEditPermit = (p) => {
    setForm({
      title: p.title,
      description: "Annual maintenance and pressure testing of industrial boilers.",
      workType: p.type,
      plant: p.location,
      area: "Technical Wing",
      location: p.location,
      exactLocation: "Boiler Room #4",
      startTime: p.date + "T08:00",
      endTime: p.date + "T16:00",
      requestedBy: "Sandeep Kumar",
      supervisor: "Rajesh Sharma",
      safetyOfficer: "Amit Varma",
      riskLevel: p.risk || "Low",
      controlMeasures: "Constant gas monitoring",
      remarks: "",
      emergencyContact: "+91 99887-76655",
      emergencyPoint: "Safety Station #04",
    });
    setWorkers([{ name: "John Smith", id: "TECH-101", image: null }]);
    setHazards(p.hazards || []);
    setPpe(p.ppe || []);
    setIsEditing(true);
    setEditingPermit(p.id);
    setPermitId(p.id);
    setActiveTab("request");
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title) newErrors.title = "Title required";
    if (!form.plant) newErrors.plant = "Plant required";
    if (!form.startTime) newErrors.startTime = "Start time required";
    if (!form.endTime) newErrors.endTime = "End time required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      if (isEditing) {
        setPermits(permits.map(p => p.id === editingPermit ? { ...p, title: form.title, type: form.workType, risk: form.riskLevel, location: form.plant } : p));
        setIsEditing(false);
        setEditingPermit(null);
      } else {
        setPermits([{ 
          id: permitId, 
          title: form.title, 
          type: form.workType, 
          status: "Pending", 
          date: new Date().toISOString().split('T')[0], 
          location: form.plant, 
          workers: workers.length,
          risk: form.riskLevel,
          hazards: [...hazards],
          ppe: [...ppe],
          hasAttachment: true 
        }, ...permits]);
      }
      alert(isEditing ? "Updated Successfully!" : "Success!");
      setActiveTab("history");
    }
  };

  return (
    <div className="wp-root wp-fade-in">
      <div className={`wp-container ${activeTab === "history" ? "wp-full-width" : ""}`}>
        
        {/* 🚀 Progress Bar (Only for Request Tab) */}
        {activeTab === "request" && (
          <div className="wp-progress-wrapper">
             <div className="wp-progress-bar-container">
                <button type="button" className="wp-back-btn-inline" onClick={() => setActiveTab("history")}>
                  <span className="material-symbols-rounded">arrow_back</span>
                  Approval Log
                </button>
                <div className="wp-separator" />
                <span className="wp-progress-label">Permit Progress</span>
                <div className="wp-progress-track">
                   <div className="wp-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#3b82f6' }}>{progress}%</span>
             </div>
          </div>
        )}

        <header className="wp-header">
          <div className="wp-header-left">
            <h1>Permit to Work</h1>
            <p>Enterprise Safety Management System</p>
          </div>
          <div className="wp-header-actions">
              <div className="wp-permit-id-badge">
                 <span className="wp-id-label">Application Unique ID</span>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input className="wp-id-input" value={permitId} onChange={(e) => setPermitId(e.target.value)} spellCheck={false} />
                    <span className="material-symbols-rounded" style={{ fontSize: '18px', color: '#64748b' }}>edit_square</span>
                 </div>
              </div>
          </div>
        </header>


        {activeTab === "request" ? (
          <form onSubmit={handleSubmit}>
            {/* 📝 Section 1: Basic Job Details */}
            <div className={`wp-collapsible-card ${expandedSections.includes(1) ? 'expanded' : ''}`}>
               <div className="wp-section-header-clickable" onClick={() => toggleSection(1)}>
                  <div className="wp-section-title sm">
                     <div className="wp-section-icon sm"><span className="material-symbols-rounded">article</span></div>
                     <span>1. Basic Job Details</span>
                  </div>
                  <span className="material-symbols-rounded wp-collapse-icon">expand_more</span>
               </div>
               <div className="wp-section-content">
                  <div className="wp-grid sm">
                     <div className="wp-form-group">
                       <label>Work Title / Subject</label>
                       <input name="title" value={form.title} onChange={handleInputChange} placeholder="E.g. Crane Refurbishment..." />
                     </div>
                     <div className="wp-form-group">
                       <label>Classification</label>
                       <select name="type" value={form.type} onChange={handleInputChange}>
                          <option value="Hot Work">Hot Work (Flame/Spark)</option>
                          <option value="Cold Work">Cold Work (General)</option>
                          <option value="Confined Space">Confined Space Entry</option>
                          <option value="Height Work">Height / Elevated Work</option>
                       </select>
                     </div>
                     <div className="wp-form-group wp-full">
                       <label>Detailed Scope of Work</label>
                       <textarea rows="2" name="description" value={form.description} onChange={handleInputChange} placeholder="Describe the methodology..." />
                     </div>
                  </div>
               </div>
            </div>

            {/* 📍 Section 2 & 3: Location & Schedule */}
            <div className={`wp-collapsible-card ${expandedSections.includes(2) ? 'expanded' : ''}`}>
               <div className="wp-section-header-clickable" onClick={() => toggleSection(2)}>
                  <div className="wp-section-title sm">
                     <div className="wp-section-icon sm"><span className="material-symbols-rounded">pin_drop</span></div>
                     <span>2. Location & Schedule</span>
                  </div>
                  <span className="material-symbols-rounded wp-collapse-icon">expand_more</span>
               </div>
               <div className="wp-section-content">
                  <div className="wp-form-row">
                     <div className="wp-flex-1">
                        <div className="wp-grid sm">
                           <div className="wp-form-group"><label>Plant</label><input name="plant" value={form.plant} onChange={handleInputChange} /></div>
                           <div className="wp-form-group"><label>Area</label><input name="area" value={form.area} onChange={handleInputChange} /></div>
                           <div className="wp-form-group wp-full"><label>Exact Location</label><input name="exactLocation" value={form.exactLocation} onChange={handleInputChange} /></div>
                        </div>
                     </div>
                     <div className="wp-flex-1">
                        <div className="wp-grid sm">
                           <div className="wp-form-group">
                             <label>Start Window</label>
                             <input type="datetime-local" name="startTime" value={form.startTime} onChange={handleInputChange} />
                           </div>
                           <div className="wp-form-group">
                             <label>Expiry Window </label>
                             <input type="datetime-local" name="endTime" value={form.endTime} onChange={handleInputChange} />
                           </div>
                        </div>
                        <div className="wp-form-group" style={{ marginTop: 16 }}>
                          <label>Calculated Active Duration</label>
                          <div className="wp-duration-pill sm">
                            <span className="material-symbols-rounded">timer</span>
                            <span>{duration === "Invalid" ? "Set Valid Range" : duration}</span>
                          </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* 👤 Section 4: People */}
            <div className={`wp-collapsible-card ${expandedSections.includes(3) ? 'expanded' : ''}`}>
               <div className="wp-section-header-clickable" onClick={() => toggleSection(3)}>
                  <div className="wp-section-title sm">
                     <div className="wp-section-icon sm"><span className="material-symbols-rounded">engineering</span></div>
                     <span>3. Technical Crew</span>
                  </div>
                  <span className="material-symbols-rounded wp-collapse-icon">expand_more</span>
               </div>
               <div className="wp-section-content">
                  {workers.map((w, i) => (
                    <div key={i} className="wp-worker-card">
                      <div className="wp-worker-avatar-upload">
                         <div className="wp-worker-avatar">
                            {w.image ? <img src={URL.createObjectURL(w.image)} alt="Avatar" /> : <span className="material-symbols-rounded">person</span>}
                         </div>
                         <input type="file" accept="image/*" className="wp-avatar-input" onChange={(e) => {
                            const nw = [...workers]; nw[i].image = e.target.files[0]; setWorkers(nw);
                         }} />
                         <div className="wp-avatar-overlay"><span className="material-symbols-rounded">photo_camera</span></div>
                      </div>
                      <div className="wp-form-group">
                         <label>Tech Full Name</label>
                         <input value={w.name} onChange={(e) => {
                            const nw = [...workers]; nw[i].name = e.target.value; setWorkers(nw);
                         }} placeholder="User Name" />
                      </div>
                      <div className="wp-form-group">
                         <label>Employee ID</label>
                         <input value={w.id} onChange={(e) => {
                            const nw = [...workers]; nw[i].id = e.target.value; setWorkers(nw);
                         }} placeholder="EMP-####" />
                      </div>
                      {workers.length > 1 && (
                        <button type="button" className="wp-remove-btn" onClick={() => setWorkers(workers.filter((_, idx) => idx !== i))}>
                           <span className="material-symbols-rounded">close</span>
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="wp-autofill-btn" onClick={() => setWorkers([...workers, { name: "", id: "", image: null }])} style={{ width: '100%', marginTop: 12, justifyContent: 'center' }}>
                     <span className="material-symbols-rounded">person_add</span> Add New Crew Member
                  </button>
               </div>
            </div>

            {/* ⚠️ Section 5 & 6: Risk & PPE */}
            <div className={`wp-collapsible-card ${expandedSections.includes(4) ? 'expanded' : ''}`}>
               <div className="wp-section-header-clickable" onClick={() => toggleSection(4)}>
                  <div className="wp-section-title sm">
                     <div className="wp-section-icon sm"><span className="material-symbols-rounded">security</span></div>
                     <span>4. Hazard & Safety Gear</span>
                  </div>
                  <span className="material-symbols-rounded wp-collapse-icon">expand_more</span>
               </div>
               <div className="wp-section-content">
                  <div className="wp-form-row">
                     <div className="wp-flex-1">
                        <label className="wp-inner-label">Hazard Analysis</label>
                        <div className="wp-check-grid dense">
                          {HAZARDS.map(h => (
                            <div key={h.id} className={`wp-check-item sm ${hazards.includes(h.id) ? 'active' : ''}`} onClick={() => {
                              setHazards(hazards.includes(h.id) ? hazards.filter(x => x !== h.id) : [...hazards, h.id]);
                            }}>
                              <span className="material-symbols-rounded">{h.icon}</span>
                              <span className="wp-check-label">{h.label}</span>
                              {hazards.includes(h.id) && <span className="material-symbols-rounded" style={{ marginLeft: 'auto', fontSize: '18px' }}>check_circle</span>}
                            </div>
                          ))}
                        </div>
                        <div className="wp-form-group" style={{ marginTop: 20 }}>
                          <label>Risk Level</label>
                          <select name="riskLevel" value={form.riskLevel} onChange={handleInputChange}>
                             <option value="Low">Low Risk</option>
                             <option value="Medium">Medium Risk</option>
                             <option value="High">High Risk</option>
                          </select>
                        </div>
                     </div>
                     <div className="wp-flex-1">
                        <label className="wp-inner-label">Safety Gear (PPE)</label>
                        <div className="wp-check-grid dense">
                          {PPE_LIST.map(p => (
                            <div key={p} className={`wp-check-item sm ${ppe.includes(p) ? 'active' : ''}`} onClick={() => {
                              setPpe(ppe.includes(p) ? ppe.filter(x => x !== p) : [...ppe, p]);
                            }}>
                              <span className="wp-check-label">{p}</span>
                              {ppe.includes(p) && <span className="material-symbols-rounded" style={{ marginLeft: 'auto', fontSize: '18px' }}>check_circle</span>}
                            </div>
                          ))}
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* 🛡️ Section 7, 8 & 9 Combined */}
            <div className={`wp-collapsible-card ${expandedSections.includes(5) ? 'expanded' : ''}`}>
               <div className="wp-section-header-clickable" onClick={() => toggleSection(5)}>
                  <div className="wp-section-title sm">
                     <div className="wp-section-icon sm"><span className="material-symbols-rounded">verified_user</span></div>
                     <span>5. Safety Check & Emergency</span>
                  </div>
                  <span className="material-symbols-rounded wp-collapse-icon">expand_more</span>
               </div>
               <div className="wp-section-content">
                  <div className="wp-form-row">
                     <div className="wp-flex-2">
                        <label className="wp-inner-label">Safety Checklist</label>
                        <div className="wp-safety-checklist dense">
                           {Object.keys(safetyChecks).map(key => (
                             <div key={key} className={`wp-safety-item ${safetyChecks[key] ? 'checked' : ''}`} onClick={() => setSafetyChecks(prev => ({...prev, [key]: !prev[key]}))}>
                                <span className="material-symbols-rounded">{safetyChecks[key] ? 'check_box' : 'check_box_outline_blank'}</span>
                                <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                             </div>
                           ))}
                        </div>
                        <div className="wp-form-group" style={{ marginTop: 16 }}>
                          <label>Supporting Documents</label>
                          <input type="file" style={{ display: 'none' }} ref={fileInputRef} onChange={(e) => alert(`Files attached: ${e.target.files.length}`)} />
                          <div className="wp-upload-zone sm" onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
                            <span className="material-symbols-rounded">cloud_upload</span>
                            <span>Drop Photos (Max 5MB) or Click to Browse</span>
                          </div>
                        </div>
                     </div>
                     <div className="wp-flex-1">
                        <label className="wp-inner-label">Emergency Info</label>
                        <div className="wp-emergency-info dense">
                           <div className="wp-emergency-row sm">
                              <span className="material-symbols-rounded">call</span>
                              <p>{form.emergencyContact}</p>
                           </div>
                           <div className="wp-emergency-row sm">
                              <span className="material-symbols-rounded">medical_information</span>
                              <p>{form.emergencyPoint}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* ✅ Section 10: Approval Workflow */}
            <div className={`wp-collapsible-card ${expandedSections.includes(6) ? 'expanded' : ''}`}>
               <div className="wp-section-header-clickable" onClick={() => toggleSection(6)}>
                  <div className="wp-section-title sm">
                     <div className="wp-section-icon sm"><span className="material-symbols-rounded">assignment_turned_in</span></div>
                     <span>6. Approval Workflow</span>
                  </div>
                  <span className="material-symbols-rounded wp-collapse-icon">expand_more</span>
               </div>
               <div className="wp-section-content">
                  <div className="wp-grid">
                     <div className="wp-form-group">
                        <label>Select Line Supervisor</label>
                        <select name="supervisor" value={form.supervisor} onChange={handleInputChange}>
                           {SUPERVISORS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                     </div>
                     <div className="wp-form-group">
                        <label>Select Safety Officer</label>
                        <select name="safetyOfficer" value={form.safetyOfficer} onChange={handleInputChange}>
                           {SAFETY_OFFICERS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                     </div>
                  </div>
                  <div className="wp-grid" style={{ marginTop: 24 }}>
                     <div className="wp-form-group">
                        <label>Authorized SOS Contact</label>
                        <input name="emergencyContact" value={form.emergencyContact} onChange={handleInputChange} placeholder="E.g. +91 99887-76655" />
                     </div>
                     <div className="wp-form-group">
                        <label>Nearest Safety Station / Point</label>
                        <input name="emergencyPoint" value={form.emergencyPoint} onChange={handleInputChange} placeholder="E.g. Safety Pillar #04" />
                     </div>
                  </div>
               </div>
            </div>

            {/* 🛠️ Actions Bar */}
            <div className="wp-actions-bar">
               <div className="wp-actions-left">
                  <p>PERMIT UNIQUE ID: {permitId}</p>
               </div>
               <div className="wp-actions-right">
                  <button type="button" className="wp-btn-main wp-btn-secondary">Save Draft</button>
                  <button type="submit" className="wp-btn-main wp-btn-primary">
                    {isEditing ? "Update Permit" : "Submit For Approval"} <span className="material-symbols-rounded">send</span>
                  </button>
               </div>
            </div>
          </form>
        ) : (
          <div className="wp-history-view-container">
            {/* 🔍 Filter Bar */}
            <div className="wp-filter-bar wp-fade-in">
                <div className="wp-search-box">
                    <span className="material-symbols-rounded">search</span>
                    <input className="wp-search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search Permit ID or Title..." />
                </div>
                <div className="wp-filter-group">
                   <select className="wp-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="All">All Statuses</option>
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Rejected">Rejected</option>
                   </select>
                </div>
                <div className="wp-filter-group">
                   <select className="wp-filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                      <option value="All">All Categories</option>
                      {WORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                </div>
                <div className="wp-separator" />
                <button className="wp-btn-main wp-btn-primary sm" onClick={() => { setActiveTab("request"); setIsEditing(false); resetForm(); }}>
                  <span className="material-symbols-rounded">add</span> New Application
                </button>
            </div>

            <div className="wp-history-table-wrap wp-fade-in">
              <table className="wp-history-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Permit ID</th>
                    <th>Work Title</th>
                    <th>Category</th>
                    <th>Location / Site</th>
                    <th>Timeline (Start → End)</th>
                    <th>Status</th>
                    <th>Safety & Risk</th>
                    <th>Crew</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPermits.map((p, idx) => (
                    <tr key={p.id} className="wp-fade-in">
                      <td><span className="wp-table-sno">{idx + 1}</span></td>
                      
                      <td>
                        <span className="wp-clickable-id" onClick={() => handleEditPermit(p)}>#{p.id}</span>
                      </td>
                      <td>
                        <div className="wp-table-title clickable" onClick={() => handleEditPermit(p)}>
                          <h4>{p.title}</h4>
                        </div>
                      </td>
                      <td><span className="wp-history-type">{p.type}</span></td>
                      <td>
                        <div className="wp-meta-pill">
                          <span className="material-symbols-rounded">location_on</span>
                          {p.location}
                        </div>
                      </td>
                      <td>
                        <div className="wp-table-date-group">
                           <div className="wp-meta-pill"><span className="material-symbols-rounded">schedule</span> {p.date} (08:00 AM)</div>
                           <div className="wp-meta-pill"><span className="material-symbols-rounded">arrow_right_alt</span> {p.date} (05:30 PM)</div>
                        </div>
                      </td>
                      <td>
                        <span className={`wp-history-badge wp-badge-${p.status.toLowerCase()}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                         <div className="wp-table-safety-group">
                            <span className={`wp-risk-tag wp-risk-${(p.risk || 'Low').toLowerCase()}`}>{p.risk || 'Low'} Risk</span>
                            <div className="wp-table-hazard-icons">
                               {p.hazards?.map(h => (
                                 <span key={h} className="material-symbols-rounded" title={h}>
                                   {HAZARDS.find(hx => hx.id === h)?.icon || 'warning'}
                                 </span>
                               ))}
                            </div>
                         </div>
                      </td>
                      <td>
                        <div className="wp-meta-pill">
                          <span className="material-symbols-rounded">groups</span>
                          {p.workers} Techs
                        </div>
                      </td>
                      <td>
                        <div className="wp-table-actions">
                          <button className="wp-action-btn wp-edit-btn" onClick={() => handleEditPermit(p)}>
                            <span className="material-symbols-rounded">edit_square</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPermits.length === 0 && (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '100px', color: '#94a3b8' }}>
                         <span className="material-symbols-rounded" style={{ fontSize: '48px', marginBottom: '12px', display: 'block' }}>search_off</span>
                         No results found for your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkPermitPage;
