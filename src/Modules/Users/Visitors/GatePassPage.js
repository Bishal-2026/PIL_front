import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, User, Users, FileText, CheckCircle, ChevronRight, ChevronLeft, Clock, ShieldCheck, XCircle } from "lucide-react";
import { API, postData, getData } from "../../../Helpers/api";
import { toast } from "react-toastify";

const GatePassPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    visitorName: "",
    visitorPhone: "",
    visitorEmail: "",
    employeeId: "",
    employeeName: "",
    reason: "General Visit",
    visitorImage: "",
    idType: "Aadhar",
    idNumber: "",
    timeSlot: "",
    remark: "",
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visitStatus, setVisitStatus] = useState("Pending");
  const [visitData, setVisitData] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const timeSlots = ["09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "12:00 - 13:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00"];

  const fetchEmployees = async (search = "") => {
    try {
      const res = await API.getEmployees(search, 0, 10);
      if (res.employees) setEmployees(res.employees);
    } catch (error) {
      console.error("Failed to fetch employees");
    }
  };

  useEffect(() => {
    if (step === 2) fetchEmployees();
    if (step === 3 && !formData.visitorImage) startCamera();
  }, [step]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      toast.error("Camera access denied");
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setFormData({ ...formData, visitorImage: dataUrl });
      const stream = video.srcObject;
      if (stream) stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSubmit = async () => {
    if (!formData.timeSlot) return toast.error("Please select a time slot");
    setLoading(true);
    try {
      const res = await postData("/visitorlogs/register", formData);
      if (res.status) {
        setVisitData(res.data);
        setStep(6);
        startPolling(res.data._id || res.data.id);
      }
    } catch (error) {
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (visitId) => {
    const interval = setInterval(async () => {
      try {
        const res = await API.visitorlog.getById(visitId);
        if (res.status && res.data.status !== "Pending") {
          setVisitStatus(res.data.status);
          setVisitData(res.data);
          clearInterval(interval);
        }
      } catch (err) { /* ignore */ }
    }, 5000);
    return () => clearInterval(interval);
  };

  const steps = [
    { title: "Identity", icon: User },
    { title: "Host", icon: Users },
    { title: "Photo", icon: Camera },
    { title: "Slot", icon: Clock },
    { title: "Review", icon: FileText },
    { title: "Pass", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-2 sm:p-4">
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="bg-white rounded-t-[2rem] sm:rounded-t-3xl p-6 sm:p-8 border-b border-gray-100 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none">GATE PASS</h1>
              <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-1">Digital Entry Access</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Issue Date</p>
            <p className="text-sm font-black text-gray-900">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white p-6 sm:p-8 shadow-2xl shadow-gray-200/50 min-h-[400px] sm:min-h-[450px]">
          {/* Progress Mini */}
          <div className="flex justify-between mb-8 px-4">
            {steps.map((s, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i + 1 ? "bg-indigo-600 w-8" : "bg-gray-100 w-2"}`} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-4">
                <div className="group">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Visitor Name</label>
                  <input className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none text-lg font-bold"
                    placeholder="Enter full name" value={formData.visitorName} onChange={e => setFormData({ ...formData, visitorName: e.target.value })} />
                </div>
                <div className="group">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Email Address</label>
                  <input className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none text-lg font-bold"
                    placeholder="visitor@example.com" value={formData.visitorEmail} onChange={e => setFormData({ ...formData, visitorEmail: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <input className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none text-md font-medium"
                placeholder="Search Host Employee..." onChange={e => fetchEmployees(e.target.value)} />
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                {employees.map(emp => (
                  <div key={emp.employeeId} onClick={() => setFormData({ ...formData, employeeId: emp.employeeId, employeeName: emp.name })}
                    className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer border-2 transition-all ${formData.employeeId === emp.employeeId ? "border-indigo-600 bg-indigo-50" : "border-transparent bg-gray-50 hover:bg-gray-100"}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-indigo-600 shadow-sm">{emp.name[0]}</div>
                      <div><p className="font-bold text-gray-900">{emp.name}</p><p className="text-xs text-gray-400">{emp.department}</p></div>
                    </div>
                    {formData.employeeId === emp.employeeId && <CheckCircle className="text-indigo-600" size={20} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6 animate-in zoom-in-95">
              <div className="relative inline-block bg-gray-100 rounded-[2.5rem] overflow-hidden border-8 border-white shadow-xl aspect-square w-[250px]">
                {formData.visitorImage ? <img src={formData.visitorImage} className="w-full h-full object-cover" /> : <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover mirror" />}
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex justify-center">
                {!formData.visitorImage ? (
                  <button onClick={captureImage} className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 hover:scale-110 active:scale-95 transition-all"><Camera size={28} /></button>
                ) : (
                  <button onClick={() => { setFormData({ ...formData, visitorImage: "" }); startCamera(); }} className="px-6 py-2 bg-gray-900 text-white rounded-full text-xs font-bold uppercase tracking-widest">Retake</button>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-4">Select Time Slot</label>
                <div className="grid grid-cols-2 gap-3">
                  {timeSlots.map(slot => (
                    <button key={slot} onClick={() => setFormData({ ...formData, timeSlot: slot })}
                      className={`p-3 rounded-xl border-2 font-bold text-xs transition-all ${formData.timeSlot === slot ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-100 text-gray-600 hover:border-indigo-200"}`}>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Visit Remark</label>
                <textarea rows="3" className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none text-md font-medium"
                  placeholder="Reason or additional info..." value={formData.remark} onChange={e => setFormData({ ...formData, remark: e.target.value })} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8 animate-in fade-in">
              <div className="bg-indigo-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
                <div className="relative z-10 flex items-center gap-4">
                  <img src={formData.visitorImage || "/visitor_placeholder.png"} className="w-20 h-20 rounded-2xl object-cover border-4 border-white/20" />
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold text-white/70">Gate Pass Preview</p>
                    <h2 className="text-xl font-black">{formData.visitorName}</h2>
                    <p className="text-sm font-medium opacity-80 mt-1">Visit Slot: {formData.timeSlot}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Host Employee</p>
                  <p className="text-sm font-bold text-gray-900">{formData.employeeName}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Visitor Email</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{formData.visitorEmail}</p>
                </div>
              </div>
              <p className="text-center text-gray-400 text-xs font-medium">By requesting, a digital gate pass will be issued upon approval and sent to your email.</p>
            </div>
          )}

          {step === 6 && (
            <div className="animate-in zoom-in duration-500">
              {visitStatus === 'Approved' ? (
                <div className="space-y-6">
                  {/* --- THE VISUAL GATE PASS --- */}
                  <div id="digital-gate-pass" className="bg-white border-2 border-dashed border-gray-200 rounded-[2rem] p-6 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-4">
                      <div className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Authorized</div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-8 border-b border-gray-100 pb-6 text-center sm:text-left">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-indigo-50 shadow-sm shrink-0">
                        <img src={formData.visitorImage || "/visitor_placeholder.png"} className="w-full h-full object-cover" alt="Visitor" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Pass Holder</p>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">{formData.visitorName}</h2>
                        <p className="text-xs font-bold text-indigo-600 mt-1 uppercase tracking-tighter">ID: {visitData?.visitorId || "Pending..."}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Host Employee</p>
                        <p className="text-sm font-black text-gray-800">{formData.employeeName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Time Slot</p>
                        <p className="text-sm font-black text-gray-800">{formData.timeSlot}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Validity</p>
                        <p className="text-sm font-black text-gray-800 line-clamp-1 truncate">{new Date().toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Location</p>
                        <p className="text-sm font-black text-gray-800">Main Facility</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">Security Instruction</p>
                      <p className="text-[11px] text-center text-gray-500 font-medium">Please present this digital pass at the entry gate. Subject to security screening.</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <button
                      onClick={() => window.print()}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      <FileText size={18} />
                      Download / Print Pass
                    </button>
                    <button onClick={() => navigate("/")} className="text-gray-400 font-bold text-xs tracking-widest uppercase hover:text-indigo-600">Exit Portal</button>
                  </div>
                </div>
              ) : visitStatus === 'Declined' ? (
                <div className="text-center space-y-6 py-10">
                  <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto"><XCircle size={40} /></div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase">Entry Declined</h2>
                    <p className="text-gray-500 font-medium mt-2">Administrative clearance was not granted. Please contact help desk.</p>
                  </div>
                  <button onClick={() => navigate("/")} className="text-indigo-600 font-bold uppercase tracking-widest text-xs">Return Home</button>
                </div>
              ) : (
                <div className="text-center space-y-8 py-4">
                  <div className="w-24 h-24 mx-auto bg-indigo-50 border-[6px] border-indigo-500 text-indigo-500 rounded-full flex items-center justify-center animate-pulse">
                    <Clock size={48} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">PENDING</h2>
                    <div className="mt-2 space-y-1">
                      <p className="text-gray-900 font-bold uppercase tracking-widest text-xs">Requesting Admin Authorization</p>
                      <p className="text-gray-400 font-medium px-8">
                        Please wait while we secure your entry pass. A copy will be sent to <strong>{formData.visitorEmail}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step < 6 && (
          <div className="bg-white rounded-b-3xl px-8 pb-8 flex justify-between gap-4">
            <button onClick={() => step > 1 && setStep(step - 1)} className={`py-4 px-6 rounded-2xl font-bold flex items-center gap-2 ${step === 1 ? "invisible" : "text-gray-400 hover:bg-gray-50"}`}>
              <ChevronLeft size={20} /> Back
            </button>
            <button onClick={() => step === 5 ? handleSubmit() : setStep(step + 1)}
              disabled={(step === 1 && !formData.visitorName) || (step === 2 && !formData.employeeId) || (step === 4 && !formData.timeSlot) || loading}
              className={`py-4 px-10 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${loading ? "bg-gray-200 text-gray-400" : "bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:translate-y-[-2px] active:translate-y-0"}`}>
              {loading ? "Issuing..." : step === 3 && !formData.visitorImage ? "Continue without Photo" : step === 5 ? "Request Gate Pass" : "Continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GatePassPage;
