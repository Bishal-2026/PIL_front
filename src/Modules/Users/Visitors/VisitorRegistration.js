import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, User, Users, FileText, CheckCircle, ChevronRight, ChevronLeft, Clock } from "lucide-react";
import { API, postData, getData } from "../../../Helpers/api";
import { toast } from "react-toastify";

const VisitorRegistration = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    visitorName: "",
    visitorPhone: "",
    visitorEmail: "",
    employeeId: "",
    employeeName: "",
    reason: "",
    visitorImage: "",
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [visitStatus, setVisitStatus] = useState("Pending");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const fetchEmployees = async (search = "") => {
    try {
      const res = await API.getEmployees(search, 0, 10);
      if (res.employees) setEmployees(res.employees);
    } catch (error) {
      console.error("Failed to fetch employees");
    }
  };

  useEffect(() => {
    if (step === 2) {
      fetchEmployees();
    }
    if (step === 3 && !formData.visitorImage) {
      startCamera();
    }
  }, [step]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera", err);
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
      
      // Stop camera stream
      const stream = video.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await postData("/visitorlogs/register", formData);
      if (res.status) {
        setVisitStatus("Pending");
        setStep(5);
        toast.success("Registration successful!");
        // Poll for approval status
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
          clearInterval(interval);
          if (res.data.status === "Approved") {
            toast.success("Welcome! Your visit has been approved.");
          } else if (res.data.status === "Declined") {
            toast.error("Sorry, your visit request was declined.");
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 5000);
    return () => clearInterval(interval);
  };

  const steps = [
    { title: "Basic Info", icon: User },
    { title: "To Meet", icon: Users },
    { title: "Photo", icon: Camera },
    { title: "Reason", icon: FileText },
    { title: "Status", icon: CheckCircle },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen bg-white">
      {/* Progress Bar */}
      <div className="flex justify-between mb-12 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0"></div>
        <div className="absolute top-1/2 left-0 h-1 bg-indigo-500 -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${(step - 1) * 25}%` }}></div>
        {steps.map((s, i) => (
          <div key={i} className="relative z-10 flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              step > i + 1 ? "bg-indigo-600 text-white" : 
              step === i + 1 ? "bg-white border-4 border-indigo-600 text-indigo-600" : 
              "bg-white border-2 border-gray-200 text-gray-400"
            }`}>
              {step > i + 1 ? <CheckCircle size={20} /> : <s.icon size={20} />}
            </div>
            <span className={`mt-2 text-xs font-bold uppercase tracking-tighter ${step >= i + 1 ? "text-gray-900" : "text-gray-400"}`}>{s.title}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-indigo-50/50">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome!</h2>
              <p className="text-gray-500">Please enter your basic information to get started.</p>
            </div>
            <div className="space-y-4">
              <div className="group">
                <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-indigo-600 transition-colors">Your Full Name</label>
                <input
                  type="text"
                  className="w-full px-6 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all text-lg font-medium outline-none"
                  placeholder="John Doe"
                  value={formData.visitorName}
                  onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-indigo-600 transition-colors">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full px-6 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all text-lg font-medium outline-none"
                    placeholder="+91 98765 43210"
                    value={formData.visitorPhone}
                    onChange={(e) => setFormData({ ...formData, visitorPhone: e.target.value })}
                  />
                </div>
                <div className="group">
                  <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-indigo-600 transition-colors">Email Address (Optional)</label>
                  <input
                    type="email"
                    className="w-full px-6 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all text-lg font-medium outline-none"
                    placeholder="john@example.com"
                    value={formData.visitorEmail}
                    onChange={(e) => setFormData({ ...formData, visitorEmail: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Who are you visiting?</h2>
              <p className="text-gray-500">Search for the employee by their name or ID.</p>
            </div>
            <div className="relative">
              <input
                type="text"
                className="w-full px-6 py-4 bg-gray-100 border-0 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
                placeholder="Search Employee..."
                onChange={(e) => fetchEmployees(e.target.value)}
              />
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => setFormData({ ...formData, employeeId: emp.employeeId, employeeName: emp.name })}
                    className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                      formData.employeeId === emp.employeeId ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.02]" : "bg-gray-50 hover:bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mr-3 ${formData.employeeId === emp.employeeId ? "bg-white/20" : "bg-indigo-100 text-indigo-600"}`}>
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold">{emp.name}</p>
                        <p className={`text-xs ${formData.employeeId === emp.employeeId ? "text-indigo-100" : "text-gray-400"}`}>{emp.employeeId} • {emp.department}</p>
                      </div>
                    </div>
                    {formData.employeeId === emp.employeeId && <CheckCircle size={20} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 text-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Smile for the Camera!</h2>
              <p className="text-gray-500">We need a quick photo for your visitor badge.</p>
            </div>
            
            <div className="relative inline-block rounded-3xl overflow-hidden border-8 border-gray-50 shadow-2xl">
              {formData.visitorImage ? (
                <img src={formData.visitorImage} alt="Visitor" className="max-w-full h-auto" />
              ) : (
                <video ref={videoRef} autoPlay playsInline className="w-full max-w-sm h-auto bg-black" />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex justify-center gap-4">
              {formData.visitorImage ? (
                <button
                  onClick={() => { setFormData({ ...formData, visitorImage: "" }); startCamera(); }}
                  className="px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Retake Photo
                </button>
              ) : (
                <button
                  onClick={captureImage}
                  className="px-12 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <Camera size={20} />
                  Take Photo
                </button>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Reason for Visit</h2>
              <p className="text-gray-500">Briefly let us know why you are here today.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {["Interview", "Meeting", "Delivery", "Maintenance", "Personal", "Others"].map((r) => (
                <button
                  key={r}
                  onClick={() => setFormData({ ...formData, reason: r })}
                  className={`p-4 rounded-2xl font-bold transition-all border-2 ${
                    formData.reason === r ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" : "bg-white text-gray-600 border-gray-100 hover:border-indigo-200 hover:text-indigo-600"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <textarea
              className="w-full mt-4 p-6 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all font-medium min-h-[120px]"
              placeholder="Additional details (optional)..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            ></textarea>
          </div>
        )}

        {step === 5 && (
          <div className="text-center py-12 space-y-6">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Clock size={48} />
            </div>
            <h2 className="text-3xl font-black text-gray-900">Request Sent!</h2>
            <p className="text-gray-500 max-w-md mx-auto text-lg leading-relaxed">
              We've notified <span className="text-indigo-600 font-bold">{formData.employeeName}</span> of your arrival. 
              Please wait while they review your request.
            </p>
            <div className="mt-8 p-6 bg-amber-50 rounded-2xl inline-block border border-amber-100">
              <div className="flex items-center gap-3 text-amber-700">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>
                <span className="font-bold uppercase tracking-widest text-xs">Current Status: {visitStatus}</span>
              </div>
            </div>
            <div className="pt-8">
              <button 
                onClick={() => navigate("/")}
                className="text-indigo-600 font-bold hover:underline"
              >
                Return to Home
              </button>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        {step < 5 && (
          <div className="mt-12 flex justify-between gap-4">
            <button
              onClick={() => step > 1 && setStep(step - 1)}
              className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 ${
                step === 1 ? "invisible" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <ChevronLeft size={20} />
              Back
            </button>
            <button
              onClick={() => {
                if (step === 4) handleSubmit();
                else setStep(step + 1);
              }}
              disabled={
                (step === 1 && !formData.visitorName) ||
                (step === 2 && !formData.employeeId) ||
                (step === 3 && !formData.visitorImage) ||
                (step === 4 && !formData.reason) ||
                loading
              }
              className={`px-10 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-xl ${
                loading ? "bg-gray-400 text-white cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-neutral-900 shadow-indigo-200"
              }`}
            >
              {loading ? "Processing..." : step === 4 ? "Complete Registration" : "Continue"}
              {step < 4 && !loading && <ChevronRight size={20} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitorRegistration;
