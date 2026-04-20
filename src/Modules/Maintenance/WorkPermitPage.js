import React, { useState, useEffect, useMemo } from "react";
import "./workpermit.css";
import { API } from "../../Helpers/api";
import { toast } from "react-toastify";
import SearchableSelection from './SearchableSelection';

const WORK_TYPES = ["Hot Work", "Cold Work", "Confined Space", "Height Work", "Electrical", "Excavation", "Radiography"];
const PLANTS = ["Main Factory", "Chemical Plant B", "Warehouse 4", "Unit 7 Refinery"];
const HAZARDS = [
  { id: "fire", label: "Fire / Explosion" },
  { id: "fall", label: "Fall from Height" },
  { id: "gas", label: "Toxic Gas" },
];
const PPE_LIST = ["Helmet", "Gloves", "Safety Shoes", "Goggles", "Harness", "Ear Protection"];
const SUPERVISORS = ["Rajesh Sharma", "Suresh Gupta", "Vikram Singh", "Praveen Kumar"];
const SAFETY_OFFICERS = ["Amit Varma", "Deepak Chawla", "Sunil Mehta"];

const WorkPermitPage = () => {
  const [activeTab, setActiveTab] = useState("history"); // Default to history table
  const [activeStep, setActiveStep] = useState(1);
  const [dynamicOptions, setDynamicOptions] = useState({
    workType: ["Hot Work", "Cold Work", "Confined Space", "Height Work", "Electrical", "Excavation", "Radiography"],
    riskLevel: ["Low", "Medium", "High"],
    plant: ["Main Factory", "Chemical Plant B", "Warehouse 4", "Unit 7 Refinery"],
    area: [],
    location: [],
    requestedBy: [],
    supervisor: SUPERVISORS,
    safetyOfficer: SAFETY_OFFICERS,
    assignedApprover: [...SUPERVISORS, ...SAFETY_OFFICERS]
  });

  const fetchOptions = async () => {
    try {
      const res = await API.workpermit.getOptions();
      if (res.status) {
        setDynamicOptions(prev => {
          const fetched = res.data;
          const merged = { ...prev };
          Object.keys(fetched).forEach(key => {
            if (fetched[key] && Array.isArray(fetched[key])) {
              // Merge existing defaults with fetched unique values
              merged[key] = Array.from(new Set([...prev[key], ...fetched[key]]));
            }
          });
          return merged;
        });
      }
    } catch (err) {
      console.error("Failed to fetch options:", err);
    }
  };

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
    exactLocationMarker: null, // { x: number, y: number }
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
        setMapView("detail");
        setMapPin({ x: 45, y: 55 });
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
      case 5:
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
    fetchOptions();
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
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, 5));
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
    { id: 5, label: "Approval", icon: "assignment_turned_in" },
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

  const [mapView, setMapView] = useState("overview"); // 'overview' or 'detail'
  const [mapPin, setMapPin] = useState(null);
  const [uploadedSiteImage, setUploadedSiteImage] = useState(null);
  const [isMarkerConfirmed, setIsMarkerConfirmed] = useState(false);

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (uploadedSiteImage) {
      setMapPin({ x, y });
      setForm(prev => ({ ...prev, exactLocation: `Marked at [${Math.round(x)}%, ${Math.round(y)}%]` }));
      return;
    }

    if (mapView === "overview") {
      setMapView("detail");
      setMapPin(null); // Reset pin when zooming in
    } else {
      setMapPin({ x, y });
      // Optionally auto-fill some coordinates or exact location
      setForm(prev => ({ ...prev, exactLocation: `Zone ${Math.floor(x)} / P-${Math.floor(y)}` }));
    }
  };

  const overviewImg = "/industrial_site_plan_overview_1775819045593.png";
  const detailImg = "/industrial_area_plan_detail_1775819067697.png";

  const duration = useMemo(() => {
    // ...
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
    setUploadedSiteImage(null);
    setIsMarkerConfirmed(false);
    setMapPin(null);
    setPermitId(`WP-${Math.floor(Math.random() * 900000 + 100000)}`);
    setActiveStep(1);
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
      exactLocationMarker: p.exactLocationMarker || null,
    });
    setUploadedSiteImage(p.siteImage || null);
    setMapPin(p.exactLocationMarker || null);
    setIsMarkerConfirmed(!!p.exactLocationMarker);
    setWorkers(p.workers && Array.isArray(p.workers) && p.workers.length > 0 ? p.workers.map(w => ({ ...w, image: null, workerType: w.workerType || "Employee", company: w.company || "" })) : [{ name: "", id: "", image: null, workerType: "Employee", company: "" }]);
    setHazards(p.hazards || []);
    setPpe(p.ppe || []);
    setSafetyChecks(p.safetyChecks || { gasTest: false, isolated: false, fireExt: false, equipChecked: false });
    setIsEditing(true);
    setEditingPermit(p._id);
    setPermitId(p.permitId);
    setActiveTab("request");
  };

  const handleRefillPermit = (p) => {
    // 1. Reset everything to new permit defaults but copy core data
    setForm({
      title: p.title || "",
      description: p.description || "",
      workType: p.workType || "Hot Work",
      plant: p.plant || "",
      area: p.area || "",
      location: p.location || "",
      exactLocation: p.exactLocation || "",
      startTime: "", // Reset times for new application
      endTime: "",
      requestedBy: p.requestedBy || "Sandeep Kumar",
      supervisor: p.supervisor || "Rajesh Sharma",
      safetyOfficer: p.safetyOfficer || "Amit Varma",
      riskLevel: p.riskLevel || "Low",
      controlMeasures: p.controlMeasures || "",
      remarks: p.remarks || "",
      emergencyContact: p.emergencyContact || "+91 99887-76655",
      assignedApprover: p.assignedApprover || "Rajesh Sharma",
      exactLocationMarker: p.exactLocationMarker || null,
    });
    setUploadedSiteImage(p.siteImage || null);
    setMapPin(p.exactLocationMarker || null);
    setIsMarkerConfirmed(!!p.exactLocationMarker);

    // Copy technical crew
    setWorkers(p.workers && Array.isArray(p.workers) && p.workers.length > 0
      ? p.workers.map(w => ({ ...w, image: null, workerType: w.workerType || "Employee", company: w.company || "" }))
      : [{ name: "", id: "", image: null, workerType: "Employee", company: "" }]
    );

    // Copy safety measures
    setHazards(p.hazards || []);
    setPpe(p.ppe || []);
    setSafetyChecks(p.safetyChecks || {
      gasTest: false,
      isolated: false,
      fireExt: false,
      equipChecked: false,
      ventilationCheck: false,
      communicationSet: false,
      lockOutTagOut: false,
      scaffoldingReady: false
    });

    // 2. Generate new ID
    setPermitId(`WP-${Math.floor(Math.random() * 900000 + 100000)}`);

    // 3. Set UI state
    setIsEditing(false); // It's a new permit application
    setEditingPermit(null);
    setActiveStep(1);
    setActiveTab("request");

    toast.info("Previous permit details copied. Please update the schedule and submit.");
  };

  const handleDeletePermit = async (permit) => {
    if (window.confirm("Are you sure you want to delete this permit application?")) {
      try {
        const res = await API.workpermit.remove(permit._id);
        if (res.status) {
          toast.success("Permit deleted successfully.");
          fetchPermits();
        } else {
          toast.error(res.message || "Failed to delete permit.");
        }
      } catch (error) {
        console.error("Error deleting permit:", error);
        toast.error("An error occurred while deleting the permit.");
      }
    }
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
    if (activeStep < 5) return; // Prevent submission until last step
    if (validate()) {
      try {
        if (isEditing) {
          const res = await API.workpermit.update(editingPermit, {
            ...form,
            hazards: hazards,
            ppe: ppe,
            safetyChecks: safetyChecks,
            siteImage: uploadedSiteImage,
            exactLocationMarker: mapPin,
            workers: workers.filter(w => w.name || w.id).map(w => ({ name: w.name, id: w.id, workerType: w.workerType, company: w.company }))
          });
          if (res.status) {
            toast.success("Permit updated successfully!");
            setPermits(permits.map(p => p._id === editingPermit ? res.data : p));
            setIsEditing(false);
            setEditingPermit(null);
          } else {
            toast.error(res.message || "Failed to update permit.");
            return;
          }
        } else {
          const res = await API.workpermit.add({
            ...form,
            permitId: permitId,
            status: "Pending",
            hazards: [...hazards],
            ppe: [...ppe],
            safetyChecks: safetyChecks,
            siteImage: uploadedSiteImage,
            exactLocationMarker: mapPin,
            workers: workers.filter(w => w.name || w.id).map(w => ({ name: w.name, id: w.id, workerType: w.workerType, company: w.company }))
          });
          if (res.status) {
            toast.success("Work Permit created successfully!");
            setPermits([res.data, ...permits]);
          } else {
            toast.error(res.message || "Failed to create permit.");
            return;
          }
        }
        // Success transition
        setActiveTab("history");
        await Promise.all([fetchPermits(), fetchOptions()]);
        resetForm();
      } catch (error) {
        console.error("Failed to save permit:", error);
        toast.error("An unexpected error occurred during submission.");
      }
    } else {
      toast.warning("Please fill all required fields correctly.");
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

        {activeTab === "request" ? (
          <div className="wp-form-container">
            <div className="wp-progress-wrapper">
              <div className="wp-progress-bar-container">
                <div className="wp-header-info-group">
                  <div className="wp-title-box">
                    <h2 className="wp-compact-title">Permit to Work</h2>
                    <p className="wp-compact-subtitle">Safety Management</p>
                  </div>
                  <button type="button" className="wp-back-btn-inline" onClick={() => setActiveTab("history")}>
                    <span className="material-symbols-rounded">arrow_back</span>
                    Log
                  </button>
                  <div className="wp-separator" />
                  <div className="wp-id-pill-wrapper">
                    <div className="wp-id-pill">
                      <span className="wp-pill-label">ID</span>
                      <span className="wp-pill-val">{permitId}</span>
                    </div>
                  </div>
                </div>

                <div className="wp-header-actions-group">
                  <div className="wp-progress-mini-group">
                    <div className="wp-progress-track">
                      <div className="wp-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="wp-progress-percent">{progress}%</span>
                  </div>
                </div>
              </div>
            </div>
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
                    <div className="wp-form-group">
                      <label>Work Title / Subject</label>
                      <input name="title" value={form.title} onChange={handleInputChange} placeholder="E.g. Boiler Area Maintenance..." autoFocus />
                    </div>
                    <SearchableSelection
                      label="Classification"
                      name="workType"
                      value={form.workType}
                      options={dynamicOptions.workType}
                      onChange={handleInputChange}
                    />
                    <SearchableSelection
                      label="Risk Level"
                      name="riskLevel"
                      value={form.riskLevel}
                      options={dynamicOptions.riskLevel}
                      onChange={handleInputChange}
                    />
                    <div className="wp-form-group">
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

                  {/* 🗺️ Interactive Map / Site Image Selection */}
                  <div className="wp-map-card">
                    <div className="wp-map-header">
                      <span className="material-symbols-rounded">map</span>
                      <span>{uploadedSiteImage ? 'Exact Work Location' : 'Step 2: Site Blueprint / Image'}</span>
                      {uploadedSiteImage && (
                        <button type="button" className="wp-map-reset" onClick={() => { setUploadedSiteImage(null); setMapPin(null); setIsMarkerConfirmed(false); }}>
                          <span className="material-symbols-rounded">refresh</span> Change Image
                        </button>
                      )}
                    </div>
                    
                    {!uploadedSiteImage ? (
                      <div className="wp-map-upload-container">
                        <div className="wp-map-upload-dropzone" onClick={() => fileInputRef.current.click()}>
                          <span className="material-symbols-rounded">cloud_upload</span>
                          <p>Upload site image and click on the image to mark exact work location.</p>
                          <span className="wp-upload-hint">Supports JPG, PNG</span>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{ display: 'none' }} 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setUploadedSiteImage(reader.result);
                                };
                                reader.readAsDataURL(file);
                              }
                            }} 
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="wp-map-viewport-container">
                         <div className="wp-map-instruction">
                           {isMarkerConfirmed ? 'Location Confirmed' : 'Click on the image to mark exact work location'}
                         </div>
                         <div className={`wp-map-viewport ${isMarkerConfirmed ? 'confirmed' : ''}`} onClick={!isMarkerConfirmed ? handleMapClick : undefined}>
                          <img
                            src={uploadedSiteImage}
                            alt="Site Plan"
                            className="wp-blueprint-img custom"
                          />
                          {mapPin && (
                            <div
                              className="wp-map-pin active bounce-animation"
                              style={{ left: `${mapPin.x}%`, top: `${mapPin.y}%` }}
                            >
                              <span className="material-symbols-rounded">location_on</span>
                            </div>
                          )}
                        </div>
                        <div className="wp-map-controls">
                          {!isMarkerConfirmed ? (
                            <button 
                              type="button" 
                              className="wp-confirm-loc-btn" 
                              disabled={!mapPin}
                              onClick={() => {
                                setIsMarkerConfirmed(true);
                                setForm(prev => ({ ...prev, exactLocationMarker: mapPin }));
                              }}
                            >
                              <span className="material-symbols-rounded">check_circle</span> Confirm Location
                            </button>
                          ) : (
                            <button 
                              type="button" 
                              className="wp-change-loc-btn"
                              onClick={() => setIsMarkerConfirmed(false)}
                            >
                              <span className="material-symbols-rounded">edit_location_alt</span> Change Mark
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="wp-grid">
                    <SearchableSelection
                      label="Plant / Facility"
                      name="plant"
                      value={form.plant}
                      options={dynamicOptions.plant}
                      onChange={handleInputChange}
                      placeholder="e.g. Chemical Unit B"
                    />

                    <SearchableSelection
                      label="Process Area"
                      name="area"
                      value={form.area}
                      options={dynamicOptions.area}
                      onChange={handleInputChange}
                      placeholder="e.g. Tank Farm 4"
                    />

                    <SearchableSelection
                      label="General Site Location"
                      name="location"
                      value={form.location}
                      options={dynamicOptions.location}
                      onChange={handleInputChange}
                      placeholder="e.g. Zone 2 Refinery"
                    />
                    <div className="wp-form-group"><label>Exact Location Point</label><input name="exactLocation" value={form.exactLocation} onChange={handleInputChange} placeholder="E.g. Boiler #4, 2nd Floor Floor Mezzanine" /></div>

                    <div className="wp-form-group">
                      <label>Start Window (Permit From)</label>
                      <input type="datetime-local" name="startTime" value={form.startTime} onChange={handleInputChange} />
                    </div>
                    <div className="wp-form-group">
                      <label>Expiry Window (Permit Until)</label>
                      <input type="datetime-local" name="endTime" value={form.endTime} onChange={handleInputChange} />
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

              {/* ⚠️ Step 4: Safety Analysis & Readiness */}
              {activeStep === 4 && (
                <div className="wp-section-fade-in wp-section-modern">
                  <div className="wp-section-header-simple">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h2><span className="material-symbols-rounded">security</span> 4. Safety & Readiness</h2>
                        <p>Identify risks, PPE, and verify safety checklist.</p>
                      </div>
                      <button type="button" className="wp-autofill-btn" onClick={handleAutoFill}>
                        <span className="material-symbols-rounded">magic_button</span> Auto Fill Step
                      </button>
                    </div>
                  </div>
                  <div className="wp-risk-section">
                    <div className="wp-grid" style={{ gap: '24px' }}>
                      <SearchableSelection
                        label="Identify Hazards"
                        name="hazards"
                        value={hazards.map(id => HAZARDS.find(h => h.id === id)?.label).filter(Boolean)}
                        multiple={true}
                        options={HAZARDS.map(h => h.label)}
                        onChange={(e) => {
                          const selectedLabels = e.target.value;
                          const selectedIds = selectedLabels.map(label => HAZARDS.find(h => h.label === label)?.id).filter(Boolean);
                          setHazards(selectedIds);
                        }}
                        placeholder="Search or select hazards..."
                      />

                      <SearchableSelection
                        label="Required PPE"
                        name="ppe"
                        value={ppe}
                        multiple={true}
                        options={PPE_LIST}
                        onChange={(e) => setPpe(e.target.value)}
                        placeholder="Search or select PPE..."
                      />

                      <SearchableSelection
                        label="Safety Readiness Checklist"
                        name="safetyChecks"
                        value={Object.keys(safetyChecks)
                          .filter(k => safetyChecks[k])
                          .map(k => k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()))}
                        multiple={true}
                        options={Object.keys(safetyChecks).map(k => k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()))}
                        onChange={(e) => {
                          const selectedLabels = e.target.value;
                          const newChecks = { ...safetyChecks };
                          Object.keys(newChecks).forEach(k => {
                            const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                            newChecks[k] = selectedLabels.includes(label);
                          });
                          setSafetyChecks(newChecks);
                        }}
                        placeholder="Final verification items..."
                      />

                      <div className="wp-form-group">
                        <label>Supporting Certificates (Image/PDF)</label>
                        <div className="wp-modern-upload-box" onClick={() => fileInputRef.current?.click()}>
                          <input 
                            type="file" 
                            style={{ display: 'none' }} 
                            ref={fileInputRef} 
                            multiple 
                            onChange={(e) => {
                              toast.info(`${e.target.files.length} safety documents selected.`);
                            }}
                          />
                          <span className="material-symbols-rounded">cloud_upload</span>
                          <div>
                            <strong>Upload Documentation</strong>
                            <span>Max 10MB per file</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="wp-grid" style={{ marginTop: 20 }}>
                      {/* Emergency Action Details */}
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
                </div>
              )}

              {/* ✅ Step 5: Approval Workflow */}
              {activeStep === 5 && (
                <div className="wp-section-fade-in wp-section-modern">
                  <div className="wp-section-header-simple">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h2><span className="material-symbols-rounded">assignment_turned_in</span> 5. Approval Workflow</h2>
                        <p>Finalize the permit and send for authorization.</p>
                      </div>
                      <button type="button" className="wp-autofill-btn" onClick={handleAutoFill}>
                        <span className="material-symbols-rounded">magic_button</span> Auto Fill Step
                      </button>
                    </div>
                  </div>
                  <div className="wp-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <SearchableSelection
                      label="Line Supervisor (Issuer)"
                      name="supervisor"
                      value={form.supervisor}
                      options={dynamicOptions.supervisor}
                      onChange={handleInputChange}
                    />

                    <SearchableSelection
                      label="Safety Officer (HSSE)"
                      name="safetyOfficer"
                      value={form.safetyOfficer}
                      options={dynamicOptions.safetyOfficer}
                      onChange={handleInputChange}
                    />

                    <SearchableSelection
                      label="Assigned Approver (Final Auth)"
                      name="assignedApprover"
                      value={form.assignedApprover}
                      options={dynamicOptions.assignedApprover}
                      onChange={handleInputChange}
                    />
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

                {activeStep < 5 ? (
                  <button type="button" className="wp-nav-btn wp-next" onClick={handleNext}>
                    Next Step <span className="material-symbols-rounded">arrow_forward</span>
                  </button>
                ) : (
                  <button type="button" className="wp-nav-btn wp-submit" onClick={handleSubmit}>
                    Finalize & Submit <span className="material-symbols-rounded">send</span>
                  </button>
                )}
              </div>
            </div>
          </div>
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
                        <span
                          className={`wp-clickable-id ${p.status === 'Approved' ? 'disabled' : ''}`}
                          onClick={() => p.status !== 'Approved' && handleEditPermit(p)}
                        >
                          #{p.permitId}
                        </span>
                      </td>
                      <td>
                        <div
                          className={`wp-table-title ${p.status !== 'Approved' ? 'clickable' : ''}`}
                          onClick={() => p.status !== 'Approved' && handleEditPermit(p)}
                        >
                          <h4>{p.title}</h4>
                          <p>{p.description || "Routine operational safety task for site maintenance."}</p>
                        </div>
                      </td>
                      <td><span className="wp-history-type">{p.workType}</span></td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ color: 'var(--wp-primary)', fontWeight: '700', fontSize: '13px' }}>
                          <span style={{ whiteSpace: 'nowrap' }}>{p.plant || "Refinery Alpha"}</span>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '800', color: 'var(--wp-primary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                            {new Date(p.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <span style={{ color: '#94a3b8' }}>→</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--wp-secondary-light)', opacity: 0.8, whiteSpace: 'nowrap' }}>
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
                        </div>
                      </td>
                      <td>
                        <div className="wp-table-actions">
                          {p.status === 'Approved' ? (
                            <button className="wp-action-btn wp-chat-btn" title="Chat with team" onClick={() => { setActiveChatId(p.permitId); setIsChatOpen(true); }}>
                              <span className="material-symbols-rounded">chat_bubble</span>
                            </button>
                          ) : (
                            <button className="wp-action-btn wp-edit-btn" title="Edit Permit" onClick={() => handleEditPermit(p)}>
                              <span className="material-symbols-rounded">edit_square</span>
                            </button>
                          )}
                          <button className="wp-action-btn wp-delete-btn" title="Delete Permit" onClick={() => handleDeletePermit(p)}>
                            <span className="material-symbols-rounded">delete</span>
                          </button>
                          {p.status !== 'Approved' && (
                            <button className="wp-action-btn wp-refill-btn" title="Re-apply / Copy Details" onClick={() => handleRefillPermit(p)}>
                              <span className="material-symbols-rounded">history_edu</span>
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
