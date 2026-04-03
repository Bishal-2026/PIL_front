import React, { useState, useEffect, useMemo } from "react";
import "./workpermit.css";
import { API } from "../../Helpers/api";

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
  const [activeStep, setActiveStep] = useState(1);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [typingMessage, setTypingMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleAutoFill = () => {
    switch (activeStep) {
      case 1:
        setForm(prev => ({
          ...prev,
          title: "Boiler B-04 Annual Maintenance & Pressure Test",
          workType: "Hot Work",
          riskLevel: "High",
          description: "Comprehensive inspection of boiler internal tubes, pressure testing up to 15 bar, and replacement of safety valve gaskets."
        }));
        break;
      case 2:
        setForm(prev => ({
          ...prev,
          plant: "Refinery Alpha - Unit 4",
          area: "Technical Wing",
          exactLocation: "Boiler Room #4, 2nd Floor Mezzanine",
          startTime: new Date().toISOString().slice(0, 16),
          endTime: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 16)
        }));
        break;
      case 3:
        setWorkers([
          { name: "John Smith", id: "EMP-0492", image: null },
          { name: "Michael Ross", id: "EMP-0821", image: null }
        ]);
        break;
      case 4:
        setHazards(["fire", "gas", "fall"]);
        setPpe(["Helmet", "Gloves", "Safety Shoes", "Goggles", "Harness"]);
        break;
      case 5:
        setSafetyChecks({
          gasTest: true,
          isolated: true,
          fireExt: true,
          equipChecked: true,
          ventilationCheck: true,
          communicationSet: true,
          lockOutTagOut: true,
          scaffoldingReady: true
        });
        setForm(prev => ({
          ...prev,
          emergencyContact: "+91 99887-76655",
          emergencyPoint: "Safety Station #12 (Zone B)"
        }));
        break;
      case 6:
        setForm(prev => ({
          ...prev,
          supervisor: "Rajesh Sharma",
          safetyOfficer: "Amit Varma"
        }));
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    fetchPermits();
    const interval = setInterval(fetchPermits, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchPermits = async () => {
    try {
      const res = await API.workpermit.getAll();
      if (res.status) {
        // Sort by date (latest first)
        const sorted = res.data.length > 0 ? res.data.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)) : INITIAL_PERMITS;
        setPermits(sorted);
      }
    } catch (error) {
      console.error("Error fetching permits:", error);
    } finally {
      setLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const toggleSection = (id) => {
    setActiveStep(id);
  };

  const steps = [
    { id: 1, label: "Basic Details", icon: "article" },
    { id: 2, label: "Location", icon: "pin_drop" },
    { id: 3, label: "Crew", icon: "engineering" },
    { id: 4, label: "Safety", icon: "security" },
    { id: 5, label: "Checklist", icon: "verified_user" },
    { id: 6, label: "Approval", icon: "assignment_turned_in" },
  ];

  // Filtered Permits
  const filteredPermits = useMemo(() => {
    return permits.filter(p => {
      const titleSearch = (p.title || "").toLowerCase();
      const idSearch = (p.permitId || p.id || "").toLowerCase();
      const search = searchTerm.toLowerCase();
      
      const matchSearch = titleSearch.includes(search) || idSearch.includes(search);
      const matchStatus = statusFilter === "All" || p.status === statusFilter;
      const matchType = typeFilter === "All" || p.workType === typeFilter;
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

  const saveStep = async (nextStep = null) => {
    try {
      const payload = {
        ...form,
        permitId,
        hazards,
        ppe,
        safetyChecks,
        workers: workers.filter(w => w.name || w.id).map(w => ({ name: w.name, id: w.id })),
        status: isEditing ? (nextStep === null ? "Pending" : "Pending") : "Pending"
      };

      let res;
      if (editingPermit) {
        res = await API.workpermit.update(editingPermit, payload);
      } else {
        res = await API.workpermit.add(payload);
        if (res.status) {
          setEditingPermit(res.data._id); // Assign the new DB ID
          setIsEditing(true);
        }
      }

      if (res.status) {
        if (nextStep !== null) setActiveStep(nextStep);
        await fetchPermits();
      }
    } catch (err) {
      console.error("Failed to sync step data:", err);
    }
  };

  const handleNext = () => {
    if (activeStep < 6) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrev = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
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
      title: p.title || "",
      description: p.description || "",
      workType: p.workType || "Hot Work",
      plant: p.plant || "",
      area: p.area || "",
      location: p.location || "",
      exactLocation: p.exactLocation || "",
      startTime: p.startTime ? new Date(p.startTime).toISOString().slice(0, 16) : "",
      endTime: p.endTime ? new Date(p.endTime).toISOString().slice(0, 16) : "",
      requestedBy: p.requestedBy || "Sandeep Kumar",
      supervisor: p.supervisor || "Rajesh Sharma",
      safetyOfficer: p.safetyOfficer || "Amit Varma",
      riskLevel: p.riskLevel || "Low",
      controlMeasures: p.controlMeasures || "",
      remarks: p.remarks || "",
      emergencyContact: p.emergencyContact || "+91 99887-76655",
      emergencyPoint: p.emergencyPoint || "Safety Station #04",
    });
    setWorkers(p.workers && Array.isArray(p.workers) && p.workers.length > 0 ? p.workers.map(w => ({ ...w, image: null })) : [{ name: "", id: "", image: null }]);
    setHazards(p.hazards || []);
    setPpe(p.ppe || []);
    setSafetyChecks(p.safetyChecks || { gasTest: false, isolated: false, fireExt: false, equipChecked: false });
    setIsEditing(true);
    setEditingPermit(p._id);
    setPermitId(p.permitId);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      try {
        if (isEditing) {
          const res = await API.workpermit.update(editingPermit, {
            title: form.title,
            workType: form.workType,
            riskLevel: form.riskLevel,
            plant: form.plant,
            description: form.description,
            startTime: form.startTime,
            endTime: form.endTime,
            hazards: hazards,
            ppe: ppe,
            safetyChecks: safetyChecks,
            workers: workers
          });
          if (res.status) {
            setPermits(permits.map(p => p._id === editingPermit ? res.data : p));
            setIsEditing(false);
            setEditingPermit(null);
          }
        } else {
          const res = await API.workpermit.add({ 
            permitId: permitId, 
            title: form.title, 
            workType: form.workType, 
            status: "Pending", 
            plant: form.plant, 
            description: form.description,
            startTime: form.startTime,
            endTime: form.endTime,
            riskLevel: form.riskLevel,
            hazards: [...hazards],
            ppe: [...ppe],
            safetyChecks: safetyChecks,
            workers: workers
          });
          if (res.status) {
            setPermits([res.data, ...permits]);
          }
        }
        alert(isEditing ? "Updated Successfully!" : "Success!");
        setActiveTab("history");
        fetchPermits();
      } catch (error) {
        alert("Failed to save permit.");
      }
    }
  };

  if (loading) {
    return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div className="wp-loader">Initializing Safety Portal...</div>
    </div>;
  }

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
          {activeTab === "request" && (
            <div className="wp-header-actions">
                <div className="wp-permit-id-badge">
                   <span className="wp-id-label">Application Unique ID</span>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input className="wp-id-input" value={permitId} onChange={(e) => setPermitId(e.target.value)} spellCheck={false} />
                      <span className="material-symbols-rounded" style={{ fontSize: '18px', color: '#64748b' }}>edit_square</span>
                   </div>
                </div>
            </div>
          )}
        </header>


        {activeTab === "request" ? (
          <form onSubmit={handleSubmit}>
            {/* 🏗️ Modern Stepper Row */}
            <div className="wp-stepper-row">
               {steps.map(s => (
                  <div key={s.id} className={`wp-step-item ${activeStep === s.id ? 'active' : ''} ${activeStep > s.id ? 'completed' : ''}`} onClick={() => setActiveStep(s.id)}>
                     <div className="wp-step-icon">
                        <span className="material-symbols-rounded">{activeStep > s.id ? 'check' : s.icon}</span>
                     </div>
                     <span className="wp-step-label">{s.label}</span>
                     <div className="wp-step-line"></div>
                  </div>
               ))}
            </div>

            <div className="wp-active-section-container">
              {/* 📝 Step 1: Basic Job Details */}
              {activeStep === 1 && (
                <div className="wp-section-fade-in wp-section-modern">
                   <div className="wp-section-header-simple">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h2><span className="material-symbols-rounded">article</span> 1. Basic Job Details</h2>
                          <p>Define the scope and classification of the work permit.</p>
                        </div>
                        <button type="button" className="wp-autofill-btn" onClick={handleAutoFill}>
                          <span className="material-symbols-rounded">magic_button</span> Auto Fill Step
                        </button>
                      </div>
                   </div>
                   <div className="wp-grid">
                      <div className="wp-form-group wp-full">
                        <label>Work Title / Subject</label>
                        <input name="title" value={form.title} onChange={handleInputChange} placeholder="E.g. Boiler Area Maintenance..." autoFocus />
                      </div>
                      <div className="wp-form-group">
                        <label>Classification</label>
                        <select name="workType" value={form.workType} onChange={handleInputChange}>
                           {WORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="wp-form-group">
                        <label>Risk Level</label>
                        <select name="riskLevel" value={form.riskLevel} onChange={handleInputChange}>
                           <option value="Low">Low Risk</option>
                           <option value="Medium">Medium Risk</option>
                           <option value="High">High Risk</option>
                        </select>
                      </div>
                      <div className="wp-form-group wp-full">
                        <label>Detailed Methodology / Scope of Work</label>
                        <textarea rows="4" name="description" value={form.description} onChange={handleInputChange} placeholder="Describe the step-by-step methodology..." />
                      </div>
                   </div>
                </div>
              )}
  
              {/* 📍 Step 2: Location & Schedule */}
              {activeStep === 2 && (
                <div className="wp-section-fade-in wp-section-modern">
                   <div className="wp-section-header-simple">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h2><span className="material-symbols-rounded">pin_drop</span> 2. Location & Schedule</h2>
                          <p>Where and when will this work occur?</p>
                        </div>
                        <button type="button" className="wp-autofill-btn" onClick={handleAutoFill}>
                          <span className="material-symbols-rounded">magic_button</span> Auto Fill Step
                        </button>
                      </div>
                   </div>
                   <div className="wp-grid">
                      <div className="wp-form-group"><label>Plant / Unit</label><input name="plant" value={form.plant} onChange={handleInputChange} placeholder="E.g. Unit 4 Refinery" /></div>
                      <div className="wp-form-group"><label>Department Area</label><input name="area" value={form.area} onChange={handleInputChange} placeholder="E.g. Zone B" /></div>
                      <div className="wp-form-group wp-full"><label>Exact Location Point</label><input name="exactLocation" value={form.exactLocation} onChange={handleInputChange} placeholder="E.g. Boiler #4, 2nd Floor Floor Mezzanine" /></div>
                      
                      <div className="wp-form-group">
                        <label>Start Window (Permit From)</label>
                        <input type="datetime-local" name="startTime" value={form.startTime} onChange={handleInputChange} />
                      </div>
                      <div className="wp-form-group">
                        <label>Expiry Window (Permit Until)</label>
                        <input type="datetime-local" name="endTime" value={form.endTime} onChange={handleInputChange} />
                      </div>
                      
                      <div className="wp-form-group wp-full">
                        <label>Calculated Active Duration</label>
                        <div className="wp-duration-card">
                           <span className="material-symbols-rounded">schedule</span>
                           <div>
                              <strong>{duration === "Invalid" ? "Set Valid Range" : duration}</strong>
                              <span>Total active work time on-site</span>
                           </div>
                        </div>
                      </div>
                   </div>
                </div>
              )}
  
              {/* 👤 Step 3: Technical Crew */}
              {activeStep === 3 && (
                <div className="wp-section-fade-in wp-section-modern">
                   <div className="wp-section-header-simple">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h2><span className="material-symbols-rounded">engineering</span> 3. Technical Crew</h2>
                          <p>Register all personnel involved in the task.</p>
                        </div>
                        <button type="button" className="wp-autofill-btn" onClick={handleAutoFill}>
                          <span className="material-symbols-rounded">magic_button</span> Auto Fill Step
                        </button>
                      </div>
                   </div>
                   <div className="wp-crew-grid">
                      {workers.map((w, i) => (
                        <div key={i} className="wp-simple-worker-card">
                          <div className="wp-worker-avatar-lite">
                             {w.image ? <img src={URL.createObjectURL(w.image)} alt="Avatar" /> : <span className="material-symbols-rounded">person</span>}
                             <input type="file" accept="image/*" onChange={(e) => {
                                const nw = [...workers]; nw[i].image = e.target.files[0]; setWorkers(nw);
                             }} />
                          </div>
                          <div className="wp-worker-info-lite">
                             <input value={w.name} onChange={(e) => {
                                const nw = [...workers]; nw[i].name = e.target.value; setWorkers(nw);
                             }} placeholder="Full Name" />
                             <input value={w.id} onChange={(e) => {
                                const nw = [...workers]; nw[i].id = e.target.value; setWorkers(nw);
                             }} placeholder="EMP-####" />
                          </div>
                          {workers.length > 1 && (
                            <button type="button" className="wp-remove-worker-btn" onClick={() => setWorkers(workers.filter((_, idx) => idx !== i))}>
                               <span className="material-symbols-rounded">delete_outline</span>
                            </button>
                          )}
                        </div>
                      ))}
                   </div>
                   <button type="button" className="wp-add-member-btn" onClick={() => setWorkers([...workers, { name: "", id: "", image: null }])}>
                      <span className="material-symbols-rounded">person_add</span> Add Another Team Member
                   </button>
                </div>
              )}
  
              {/* ⚠️ Step 4: Hazard & PPE */}
              {activeStep === 4 && (
                <div className="wp-section-fade-in wp-section-modern">
                   <div className="wp-section-header-simple">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h2><span className="material-symbols-rounded">security</span> 4. Hazard Analysis & PPE</h2>
                          <p>Identify risks and required protective equipment.</p>
                        </div>
                        <button type="button" className="wp-autofill-btn" onClick={handleAutoFill}>
                          <span className="material-symbols-rounded">magic_button</span> Auto Fill Step
                        </button>
                      </div>
                   </div>
                   <div className="wp-risk-section">
                       <label className="wp-sub-label">Incident & Hazard Identification</label>
                       <div className="wp-hazard-selection-grid">
                         {HAZARDS.map(h => (
                           <div key={h.id} className={`wp-hazard-chip ${hazards.includes(h.id) ? 'active' : ''}`} onClick={() => {
                             setHazards(hazards.includes(h.id) ? hazards.filter(x => x !== h.id) : [...hazards, h.id]);
                           }}>
                             <span className="material-symbols-rounded">{h.icon}</span>
                             <span>{h.label}</span>
                             {hazards.includes(h.id) && <span className="material-symbols-rounded chip-check">check_circle</span>}
                           </div>
                         ))}
                       </div>
  
                       <label className="wp-sub-label" style={{ marginTop: 32 }}>Required PPE Selection</label>
                       <div className="wp-ppe-selection-grid">
                         {PPE_LIST.map(p => (
                           <button type="button" key={p} className={`wp-ppe-chip ${ppe.includes(p) ? 'active' : ''}`} onClick={() => {
                             setPpe(ppe.includes(p) ? ppe.filter(x => x !== p) : [...ppe, p]);
                           }}>
                             {p}
                             {ppe.includes(p) && <span className="material-symbols-rounded">check</span>}
                           </button>
                         ))}
                       </div>
                   </div>
                </div>
              )}
  
              {/* 🛡️ Step 5: Checklist & Emergency */}
              {activeStep === 5 && (
                <div className="wp-section-fade-in wp-section-modern">
                   <div className="wp-section-header-simple">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h2><span className="material-symbols-rounded">verified_user</span> 5. Safety Checklist & Emergency</h2>
                          <p>Final safety verification and response details.</p>
                        </div>
                        <button type="button" className="wp-autofill-btn" onClick={handleAutoFill}>
                          <span className="material-symbols-rounded">magic_button</span> Auto Fill Step
                        </button>
                      </div>
                   </div>
                   <div className="wp-grid">
                      <div className="wp-form-group wp-full">
                         <label>Safety Readiness Checklist</label>
                         <div className="wp-checklist-grid">
                            {Object.keys(safetyChecks).map(key => (
                              <div key={key} className={`wp-check-row ${safetyChecks[key] ? 'checked' : ''}`} onClick={() => setSafetyChecks(prev => ({...prev, [key]: !prev[key]}))}>
                                 <span className="material-symbols-rounded">{safetyChecks[key] ? 'check_circle' : 'circle'}</span>
                                 <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                              </div>
                            ))}
                         </div>
                      </div>
  
                      <div className="wp-form-group">
                        <label>Supporting Certificates (Image/PDF)</label>
                        <div className="wp-modern-upload-box" onClick={() => fileInputRef.current?.click()}>
                           <input type="file" style={{ display: 'none' }} ref={fileInputRef} multiple />
                           <span className="material-symbols-rounded">cloud_upload</span>
                           <div>
                              <strong>Upload Documentation</strong>
                              <span>Max 10MB per file</span>
                           </div>
                        </div>
                      </div>
  
                      <div className="wp-form-group wp-full">
                         <label>Emergency Action Details (Editable)</label>
                         <div className="wp-grid sm">
                            <div className="wp-form-group">
                               <label><span className="material-symbols-rounded">call</span> SOS line</label>
                               <input 
                                  name="emergencyContact" 
                                  value={form.emergencyContact} 
                                  onChange={handleInputChange} 
                                  placeholder="+91 00000-00000"
                                  className="wp-emergency-input"
                               />
                            </div>
                            <div className="wp-form-group">
                               <label><span className="material-symbols-rounded">medical_services</span> First Aid Point</label>
                               <input 
                                  name="emergencyPoint" 
                                  value={form.emergencyPoint} 
                                  onChange={handleInputChange} 
                                  placeholder="e.g. Area B Station"
                                  className="wp-emergency-input"
                               />
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              )}
  
              {/* ✅ Step 6: Approval Workflow */}
              {activeStep === 6 && (
                <div className="wp-section-fade-in wp-section-modern">
                   <div className="wp-section-header-simple">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h2><span className="material-symbols-rounded">assignment_turned_in</span> 6. Approval Workflow</h2>
                          <p>Finalize the permit and send for authorization.</p>
                        </div>
                        <button type="button" className="wp-autofill-btn" onClick={handleAutoFill}>
                          <span className="material-symbols-rounded">magic_button</span> Auto Fill Step
                        </button>
                      </div>
                   </div>
                   <div className="wp-grid">
                      <div className="wp-form-group">
                         <label>Line Supervisor (Issuer)</label>
                         <select name="supervisor" value={form.supervisor} onChange={handleInputChange}>
                            {SUPERVISORS.map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                      </div>
                      <div className="wp-form-group">
                         <label>Safety Officer (HSSE)</label>
                         <select name="safetyOfficer" value={form.safetyOfficer} onChange={handleInputChange}>
                            {SAFETY_OFFICERS.map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                      </div>
                      <div className="wp-form-group">
                         <label>Authorized Emergency Contact</label>
                         <input name="emergencyContact" value={form.emergencyContact} onChange={handleInputChange} />
                      </div>
                      <div className="wp-form-group">
                         <label>Nearest Safety Station</label>
                         <input name="emergencyPoint" value={form.emergencyPoint} onChange={handleInputChange} />
                      </div>
                   </div>
                   <div className="wp-declaration-box">
                      <span className="material-symbols-rounded">info</span>
                      <p>By submitting this permit, I confirm that all safety protocols have been reviewed and necessary precautions are in place as per company policy.</p>
                   </div>
                </div>
              )}

              {/* 🧙 Navigation Controls */}
              <div className="wp-wizard-nav">
                  <button type="button" className="wp-nav-btn wp-prev" disabled={activeStep === 1} onClick={handlePrev}>
                     <span className="material-symbols-rounded">arrow_back</span> Previous
                  </button>
                  {activeStep < 6 ? (
                    <button type="button" className="wp-nav-btn wp-next" onClick={handleNext}>
                       Next Step <span className="material-symbols-rounded">arrow_forward</span>
                    </button>
                  ) : (
                    <button type="submit" className="wp-nav-btn wp-submit">
                       Finalize & Submit <span className="material-symbols-rounded">send</span>
                    </button>
                  )}
              </div>
            </div>

            {/* 🛠️ Actions Bar */}
            <div className="wp-actions-bar">
               <div className="wp-actions-left">
                  <p>PERMIT UNIQUE ID: {permitId}</p>
               </div>
               <div className="wp-actions-right">
                  <button type="button" className="wp-btn-main wp-btn-secondary" onClick={() => saveStep()}>Save Draft</button>
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPermits.map((p, idx) => (
                    <tr key={p._id} className="wp-fade-in">
                      <td><span className="wp-table-sno">{idx + 1}</span></td>
                      <td>
                        <span className="wp-clickable-id" onClick={() => handleEditPermit(p)}>#{p.permitId}</span>
                      </td>
                      <td>
                        <div className="wp-table-title clickable" onClick={() => handleEditPermit(p)}>
                           <h4>{p.title}</h4>
                        </div>
                      </td>
                      <td><span className="wp-history-type">{p.workType}</span></td>
                      <td>
                        <div className="wp-meta-pill">
                          <span className="material-symbols-rounded">location_on</span>
                          {p.plant || "N/A"}
                        </div>
                      </td>
                      <td>
                        <div className="wp-table-date-group">
                           <div className="wp-meta-pill"><span className="material-symbols-rounded">schedule</span> {new Date(p.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                           <div className="wp-meta-pill"><span className="material-symbols-rounded">arrow_right_alt</span> {new Date(p.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`wp-history-badge wp-badge-${p.status?.toLowerCase() || 'pending'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                         <div className="wp-table-safety-group">
                            <span className={`wp-risk-tag wp-risk-${(p.riskLevel || 'Low').toLowerCase()}`}>{p.riskLevel || 'Low'} Risk</span>
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
                        <div className="wp-table-actions">
                          {p.status === 'Approved' ? (
                            <button className="wp-action-btn wp-chat-btn" onClick={() => { setActiveChatId(p.permitId); setIsChatOpen(true); }}>
                              <span className="material-symbols-rounded">chat_bubble</span>
                            </button>
                          ) : (
                            <button className="wp-action-btn wp-edit-btn" onClick={() => handleEditPermit(p)}>
                              <span className="material-symbols-rounded">edit_square</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPermits.length === 0 && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '100px', color: '#94a3b8' }}>
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

      {/* 💬 Floating Chat Drawer */}
      {isChatOpen && (
        <div className="wp-chat-overlay" onClick={() => setIsChatOpen(false)}>
          <div className="wp-chat-drawer" onClick={e => e.stopPropagation()}>
            <div className="wp-chat-header">
               <div className="wp-chat-header-info">
                  <span className="material-symbols-rounded">group</span>
                  <div>
                    <h3>Chat: {activeChatId}</h3>
                    <p>Safety & Maintenance Group</p>
                  </div>
               </div>
               <button className="wp-chat-close-btn" onClick={() => setIsChatOpen(false)}>
                  <span className="material-symbols-rounded">close</span>
               </button>
            </div>
            
            <div className="wp-chat-body">
               <div className="wp-chat-date-divider"><span>Today</span></div>
               <div className="wp-chat-msg income">
                  <div className="wp-chat-bubble">
                    The work in Bay 2 is proceeding as per safety standards.
                    <span className="wp-chat-time">10:30 AM</span>
                  </div>
               </div>
               <div className="wp-chat-msg outcome">
                  <div className="wp-chat-bubble">
                    Acknowledged. Ensure the gas sensors are calibrated correctly.
                    <span className="wp-chat-time">10:35 AM</span>
                  </div>
               </div>
               {chatMessages.map((m, i) => (
                  <div key={i} className="wp-chat-msg outcome">
                    <div className="wp-chat-bubble">
                      {m.text}
                      <span className="wp-chat-time">{m.time}</span>
                    </div>
                  </div>
               ))}
            </div>

            <div className="wp-chat-footer">
               <input 
                  placeholder="Type your message..." 
                  value={typingMessage}
                  onChange={(e) => setTypingMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && typingMessage.trim()) {
                      setChatMessages([...chatMessages, { text: typingMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
                      setTypingMessage("");
                    }
                  }}
               />
               <button onClick={() => {
                  if (typingMessage.trim()) {
                    setChatMessages([...chatMessages, { text: typingMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
                    setTypingMessage("");
                  }
               }}>
                  <span className="material-symbols-rounded">send</span>
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkPermitPage;
