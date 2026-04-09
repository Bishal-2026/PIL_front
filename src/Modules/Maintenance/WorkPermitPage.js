import React, { useState, useEffect, useMemo } from "react";
import "./workpermit.css";
import { API } from "../../Helpers/api";
import { toast } from "react-toastify";

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



const WorkPermitPage = () => {
    const [activeTab, setActiveTab] = useState("history"); // Default to history table
    const [isEditing, setIsEditing] = useState(false);
    const [editingPermit, setEditingPermit] = useState(null);
    const [permitId, setPermitId] = useState(`WP-${Math.floor(Math.random() * 900000 + 100000)}`);
    const fileInputRef = React.useRef(null);
    const [recentVisitors, setRecentVisitors] = useState([]);
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
    assignedApprover: "Rajesh Sharma",
  });

  const [workers, setWorkers] = useState([{ name: "", id: "", image: null, workerType: "Employee", company: "" }]);
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
          { name: "John Smith", id: "EMP-0492", image: "https://i.pravatar.cc/150?u=EMP-0492", workerType: "Employee", company: "PIL Internal" },
          { name: "Michael Ross", id: "CTR-0211", image: "https://i.pravatar.cc/150?u=CTR-0211", workerType: "Contractor", company: "Alpha Engineering Services" }
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
          safetyOfficer: "Amit Varma",
          assignedApprover: "Rajesh Sharma"
        }));
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    fetchPermits();
    const interval = setInterval(fetchPermits, 5000); // High-frequency polling (5s) for live updates
    return () => clearInterval(interval);
  }, []);

  const fetchPermits = async () => {
    try {
      const [permitRes, visitorRes] = await Promise.all([
        API.workpermit.getAll(),
        API.visitorlog.getAll({ limit: 50, status: "Approved" })
      ]);
      
      if (permitRes.status) {
        // Sort by date (latest first)
        const sorted = permitRes.data.length > 0 ? permitRes.data.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)) : [];
        setPermits(sorted);
      }
      
      if (visitorRes.status) {
        setRecentVisitors(visitorRes.data);
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

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!form.title?.trim() || !form.description?.trim()) {
          toast.error("Please provide a title and work description.");
          return false;
        }
        return true;
      case 2:
        if (!form.plant?.trim() || !form.startTime || !form.endTime) {
          toast.error("Site location and timeline are required.");
          return false;
        }
        return true;
      case 3:
        if (!workers.length || !workers[0].name.trim()) {
          toast.error("At least one crew member must be added.");
          return false;
        }
        return true;
      case 4:
        if (!hazards.length) {
          toast.error("Safety first: Please select relevant hazards.");
          return false;
        }
        return true;
      case 5:
        // Checklist is usually optional but encouraged, 
        // we can let them skip if they want or require all.
        // For now, let's keep it flexible.
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, 6));
      saveStep();
    }
  };

  const handlePrev = () => {
    setActiveStep(prev => Math.max(prev - 1, 1));
  };

  const toggleSection = (id) => {
    // Only allow jumping back, or jumping forward IF current step is valid
    if (id < activeStep) {
      setActiveStep(id);
    } else if (id === activeStep + 1) {
      if (validateStep(activeStep)) setActiveStep(id);
    } else {
      toast.info("Please complete current and intermediate steps first.");
    }
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
        workers: workers.filter(w => w.name || w.id).map(w => ({ name: w.name, id: w.id, workerType: w.workerType, company: w.company })),
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
      assignedApprover: "Rajesh Sharma",
    });
    setWorkers([{ name: "", id: "", image: null, workerType: "Employee", company: "" }]);
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
      assignedApprover: p.assignedApprover || "Rajesh Sharma",
    });
    setWorkers(p.workers && Array.isArray(p.workers) && p.workers.length > 0 ? p.workers.map(w => ({ ...w, image: null, workerType: w.workerType || "Employee", company: w.company || "" })) : [{ name: "", id: "", image: null, workerType: "Employee", company: "" }]);
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
    if (!form.supervisor) newErrors.supervisor = "Supervisor required";
    if (!form.safetyOfficer) newErrors.safetyOfficer = "Safety Officer required";
    if (!form.emergencyContact) newErrors.emergencyContact = "SOS number required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      try {
        if (isEditing) {
          const res = await API.workpermit.update(editingPermit, {
            ...form,
            hazards: hazards,
            ppe: ppe,
            safetyChecks: safetyChecks,
            workers: workers.filter(w => w.name || w.id).map(w => ({ name: w.name, id: w.id, workerType: w.workerType, company: w.company }))
          });
          if (res.status) {
            toast.success("Permit submitted successfully!");
            setPermits(permits.map(p => p._id === editingPermit ? res.data : p));
            setIsEditing(false);
            setEditingPermit(null);
            setActiveTab("history");
          } else {
            toast.error(res.message || "Failed to submit permit.");
          }
        } else {
          const res = await API.workpermit.add({
            ...form,
            permitId: permitId,
            status: "Pending",
            hazards: [...hazards],
            ppe: [...ppe],
            safetyChecks: safetyChecks,
            workers: workers.filter(w => w.name || w.id).map(w => ({ name: w.name, id: w.id, workerType: w.workerType, company: w.company }))
          });
          if (res.status) {
            setPermits([res.data, ...permits]);
          }
        }
        // Silent success transition
        setActiveTab("history");
        fetchPermits();
      } catch (error) {
        console.error("Failed to save permit:", error);
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
                <div key={s.id} className={`wp-step-item ${activeStep === s.id ? 'active' : ''} ${activeStep > s.id ? 'completed' : ''}`} onClick={() => toggleSection(s.id)}>
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
                          {w.image ? (
                            <img src={typeof w.image === 'string' ? w.image : URL.createObjectURL(w.image)} alt="Avatar" />
                          ) : (
                            <span className="material-symbols-rounded">{w.workerType === 'Contractor' ? 'engineering' : 'person'}</span>
                          )}
                          <input type="file" accept="image/*" onChange={(e) => {
                            const nw = [...workers]; nw[i].image = e.target.files[0]; setWorkers(nw);
                          }} />
                        </div>
                        <div className="wp-worker-info-lite">
                          <div className="wp-worker-type-toggle">
                            <button type="button"
                              className={w.workerType === 'Employee' ? 'active' : ''}
                              onClick={() => { const nw = [...workers]; nw[i].workerType = 'Employee'; setWorkers(nw); }}>
                              Employee
                            </button>
                            <button type="button"
                              className={w.workerType === 'Contractor' ? 'active' : ''}
                              onClick={() => { const nw = [...workers]; nw[i].workerType = 'Contractor'; setWorkers(nw); }}>
                              Contractor
                            </button>
                          </div>
                          <div className="wp-worker-name-wrapper" style={{ position: 'relative' }}>
                            <input value={w.name} onChange={(e) => {
                              const nw = [...workers]; nw[i].name = e.target.value; setWorkers(nw);
                            }} placeholder="Full Name" />
                            {w.workerType === 'Contractor' && w.name.length > 1 && (
                                <div className="wp-visitor-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '150px', overflowY: 'auto' }}>
                                    {recentVisitors.filter(v => v.visitorName.toLowerCase().includes(w.name.toLowerCase())).map(v => (
                                        <div key={v._id} className="wp-visitor-option" style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '12px' }}
                                             onClick={() => {
                                                 const nw = [...workers];
                                                 nw[i].name = v.visitorName;
                                                 nw[i].image = v.visitorImage;
                                                 nw[i].id = v.visitorPhone || "V-LOG";
                                                 nw[i].company = "Visitor Hub";
                                                 setWorkers(nw);
                                             }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <img src={v.visitorImage} style={{ width: '20px', height: '20px', borderRadius: '4px' }} alt="" />
                                                <span>{v.visitorName} ({v.reason})</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                          </div>
                          <div className="wp-worker-id-row">
                            <input value={w.id} onChange={(e) => {
                              const nw = [...workers]; nw[i].id = e.target.value; setWorkers(nw);
                            }} placeholder={w.workerType === 'Contractor' ? 'ID / License' : 'EMP-####'} />
                            {w.workerType === 'Contractor' && (
                              <input value={w.company} onChange={(e) => {
                                const nw = [...workers]; nw[i].company = e.target.value; setWorkers(nw);
                              }} placeholder="Contractor Co. Name" className="wp-company-input" />
                            )}
                          </div>
                        </div>
                        {workers.length > 1 && (
                          <button type="button" className="wp-remove-worker-btn" onClick={() => setWorkers(workers.filter((_, idx) => idx !== i))}>
                            <span className="material-symbols-rounded">delete_outline</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" className="wp-add-member-btn" onClick={() => setWorkers([...workers, { name: "", id: "", image: null, workerType: "Employee", company: "" }])}>
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
                          <div key={key} className={`wp-check-row ${safetyChecks[key] ? 'checked' : ''}`} onClick={() => setSafetyChecks(prev => ({ ...prev, [key]: !prev[key] }))}>
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
                      <label>Assigned Approver (Final Auth)</label>
                      <select name="assignedApprover" value={form.assignedApprover} onChange={handleInputChange} style={{ border: '2px solid #3b82f6', background: '#eff6ff' }}>
                        {[...SUPERVISORS, ...SAFETY_OFFICERS].map(s => <option key={s} value={s}>{s}</option>)}
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

                <div className="wp-nav-middle">
                   <div className="wp-compact-id-pills">
                      <div className="wp-id-pill">
                        <span className="wp-pill-label">ID</span>
                        <span className="wp-pill-val">{permitId}</span>
                      </div>
                      <button type="button" className="wp-draft-pill" onClick={() => saveStep()}>
                        <span className="material-symbols-rounded">save</span>
                        Save Draft
                      </button>
                   </div>
                </div>

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
                          <p>{p.description || "Routine operational safety task for site maintenance."}</p>
                        </div>
                      </td>
                      <td><span className="wp-history-type">{p.workType}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--wp-primary)', fontWeight: '700', fontSize: '13px' }}>
                          <span className="material-symbols-rounded" style={{ fontSize: '18px', color: 'var(--wp-accent)' }}>factory</span>
                          {p.plant || "Refinery Alpha"} 
                          <span style={{ color: '#cbd5e1', margin: '0 4px' }}>•</span>
                          <span style={{ fontSize: '12px', color: 'var(--wp-secondary-light)', fontWeight: '600' }}>Unit 4 • Technical Wing</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '800', color: 'var(--wp-primary)' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="material-symbols-rounded" style={{ fontSize: '16px', color: 'var(--wp-success)' }}>radio_button_checked</span>
                              {new Date(p.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </div>
                           <span className="material-symbols-rounded" style={{ fontSize: '16px', color: '#94a3b8' }}>arrow_right_alt</span>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--wp-secondary-light)', opacity: 0.8 }}>
                              <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>history</span>
                              {new Date(p.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </div>
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
