import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Lock, Activity, Smartphone, AlertTriangle,
  CheckCircle, Zap, Eye, Building2, Factory, Landmark,
  Microscope, Truck, GraduationCap, Menu, X,
  Network, Database, Cloud, LockKeyhole, Cpu, Globe, ArrowRight, Users, Phone, FileText
} from "lucide-react";
import pidliteLogo from "../Images/PIL.png";
import heroSecurity from "../Images/hero_secure_final.png";
import dashboardMockup from "../Images/dashboard_actual.png";
import { toast } from "react-toastify";
import { postData } from "../Helpers/api.js";
import ExitIntentPopup from "./Components/ExitIntentPopup.js";
import CyberBackground from "./Components/CyberBackground.js";


// Reusable Animation Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const DashboardPreview = () => {
  return (
    <div className="w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex border border-slate-200">
      <img
        src={dashboardMockup}
        alt="PIL Dashboard Control Center"
        className="w-full h-auto object-cover"
      />
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    message: "",
    requestDemo: false
  });
  const [isExitPopupOpen, setIsExitPopupOpen] = useState(false);
  const [hasTriggeredExit, setHasTriggeredExit] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(1);

  const testimonials = [
    {
      quote: "We deployed PIL across 15,000 devices globally. The centralized camera control and anomaly detection gave us visibility we didn't even know was possible.",
      name: "David Chen",
      role: "VP of IT Infrastructure",
      company: "Global Financial Services",
      image: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      quote: "PIL completely transformed how we handle on-premise device restrictions. The MDM integration is flawless and reporting fulfills compliance audits perfectly.",
      name: "Sarah Jenkins",
      role: "CISO",
      company: "Fortune 500 Manufacturing",
      image: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    {
      quote: "The ability to enforce geofenced camera policies within our secure R&D facilities has completely eliminated our visual data exfiltration risks.",
      name: "Marcus Thorne",
      role: "Director of Physical Security",
      company: "Leading Tech Innovator",
      image: "https://randomuser.me/api/portraits/men/86.jpg"
    }
  ];

  const handleNextTestimonial = () => {
    setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrevTestimonial = () => {
    setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };


  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    // Sometimes a small timeout is needed to override browser default behavior
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);

    // Exit Intent Detection
    const handleMouseLeave = (e) => {
      // clientY < 0 means the mouse left the top of the viewport (indicating tab close intent)
      if (e.clientY < 0 && !hasTriggeredExit) {
        setIsExitPopupOpen(true);
        setHasTriggeredExit(true); // Only show once per session/visit
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [hasTriggeredExit]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.company || !formData.email) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await postData("/demoResponse/submit", formData);
      if (resp.status) {
        toast.success(resp.message || "Request submitted successfully!");
        setFormData({
          name: "",
          company: "",
          email: "",
          message: "",
          requestDemo: false
        });
      } else {
        toast.error(resp.message || "Something went wrong.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };


  // Features Data
  const features = [
    { icon: <Lock className="w-8 h-8" />, title: "Camera Restriction", desc: "Policy-driven camera blocking to prevent unauthorized visual data recording." },
    { icon: <Activity className="w-8 h-8" />, title: "Automated Attendance", desc: "Real-time login/logout tracking with QR and location-based validation." },
    { icon: <Users className="w-8 h-8" />, title: "Visitor Management", desc: "Seamless guest check-ins, badge generation, and activity monitoring." },
    { icon: <Smartphone className="w-8 h-8" />, title: "MDM Integration", desc: "Manage device settings and security protocols via centralized policies." },
    { icon: <AlertTriangle className="w-8 h-8" />, title: "Instant Security Alerts", desc: "Automated notifications for policy breaches and restricted area access." },
    { icon: <Shield className="w-8 h-8" />, title: "Compliance Auditing", desc: "Comprehensive logs for Contractors, Employees, and Managers for audit-ready reporting." }
  ];

  // Industries Data
  const industries = [
    { icon: <Factory className="w-10 h-10" />, name: "Manufacturing" },
    { icon: <Building2 className="w-10 h-10" />, name: "Corporate Offices" },
    { icon: <Landmark className="w-10 h-10" />, name: "Government" },
    { icon: <Microscope className="w-10 h-10" />, name: "Pharma" },
    { icon: <GraduationCap className="w-10 h-10" />, name: "Education" },
    { icon: <Truck className="w-10 h-10" />, name: "Logistics" }
  ];

  // Particle Background component removed in favor of CyberBackground

  return (
    <div className="min-h-screen bg-transparent text-slate-900 font-['Inter',_sans-serif] selection:bg-blue-600 selection:text-white overflow-x-hidden">

      {/* MODERN BEAUTIFUL HEADER */}
      <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-white/90 backdrop-blur-md border-b border-slate-200 py-2 shadow-lg' : 'bg-white/40 backdrop-blur-sm py-3'}`}>
        <div className="w-full mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/")}>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-100 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <img
                src={pidliteLogo}
                alt="PIL Logo"
                className="h-12 w-auto object-contain relative z-10 transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4">
            <button
              onClick={() => navigate("/app-qr")}
              className="px-5 py-2 text-slate-600 hover:text-blue-600 font-bold transition-all duration-300 text-sm"
            >
              Get App
            </button>
            <button
              onClick={() => navigate("/qr-login")}
              className="px-5 py-2 text-slate-600 hover:text-blue-600 font-bold transition-all duration-300 text-sm"
            >
              QR Login
            </button>
            <button
              onClick={() => navigate("/vendor-register")}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all duration-300 text-sm border border-slate-200"
            >
              Vendor Register
            </button>

            <button
              onClick={() => {
                localStorage.removeItem("accesstoken");
                localStorage.removeItem("refreshtoken");
                Cookies.remove("accesstoken");
                Cookies.remove("refreshtoken");
                navigate("/login");
              }}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_25px_-5px_rgba(37,99,235,0.5)] transform hover:-translate-y-0.5 transition-all duration-300 text-sm uppercase tracking-wider"
            >
              Sign In
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-700 p-2 focus:outline-none">
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 overflow-hidden"
            >
              <div className="flex flex-col gap-3 px-6 py-6">
                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate("/app-qr"); }}
                  className="w-full text-center px-6 py-3 bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-200 text-base"
                >
                  Get App
                </button>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate("/qr-login"); }}
                  className="w-full text-center px-6 py-3 bg-blue-50 text-blue-600 font-bold rounded-xl border border-blue-100 text-base"
                >
                  QR Login
                </button>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate("/vendor-register"); }}
                  className="w-full text-center px-6 py-3 bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-200 text-base"
                >
                  Vendor Register
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem("accesstoken");
                    localStorage.removeItem("refreshtoken");
                    Cookies.remove("accesstoken");
                    Cookies.remove("refreshtoken");
                    setIsMobileMenuOpen(false);
                    navigate("/login");
                  }}
                  className="w-full text-center px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md shadow-blue-200 text-base"
                >
                  Sign In
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <CyberBackground />

      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center pt-24 pb-20 overflow-hidden">
        {/* Floating Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[15%] left-[5%] w-64 h-32 bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl shadow-2xl flex items-center gap-4 px-6 z-0 hidden lg:flex"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-600">
              <Shield size={28} />
            </div>
            <div>
              <p className="text-xs font-black text-blue-600 uppercase tracking-tighter">Restriction</p>
              <p className="text-sm font-bold text-slate-800">Camera Blocker</p>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[20%] right-[3%] w-72 h-36 bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl shadow-2xl flex items-center gap-4 px-6 z-0 hidden lg:flex"
          >
            <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600">
              <Activity size={32} />
            </div>
            <div>
              <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Real-time</p>
              <p className="text-sm font-bold text-slate-800">Compliance Analytics</p>
              <div className="mt-2 h-1 w-full bg-emerald-100 rounded-full overflow-hidden">
                <motion.div animate={{ width: ["0%", "85%"] }} transition={{ duration: 2, repeat: Infinity }} className="h-full bg-emerald-500"></motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="w-full  mx-auto px-6 md:px-12 lg:px-16 relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-widest mb-8">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Next-Gen Security Platform
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 mb-6 leading-[1] tracking-tight">
              Control Your <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Digital Perimeter
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl font-medium leading-relaxed">
              Policy-driven information lock for next-gen enterprises. <br className="hidden sm:block" />
              Protect cameras, restrict devices, and ensure absolute workspace compliance.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full relative z-20">
              <button
                onClick={() => {
                  document.getElementById("request-demo")?.scrollIntoView({ behavior: 'smooth' });
                  setFormData(prev => ({ ...prev, requestDemo: true }));
                }}
                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-black text-lg transition-all shadow-2xl shadow-blue-200/50 flex items-center justify-center gap-3 transform hover:-translate-y-1 hover:scale-105 active:scale-95 cursor-pointer"
              >
                REQUEST DEMO
                <ArrowRight size={20} strokeWidth={3} />
              </button>
              <button 
                onClick={() => {
                  document.getElementById("request-demo")?.scrollIntoView({ behavior: 'smooth' });
                  setFormData(prev => ({ ...prev, requestDemo: false }));
                }}
                className="w-full sm:w-auto px-10 py-4 bg-white/60 backdrop-blur-md hover:bg-white border-2 border-slate-200 text-slate-800 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 cursor-pointer"
              >
                CONTACT SALES
              </button>
            </div>
          </motion.div>

          {/* Visual Showcase - Center aligned with 3D feel */}
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="relative w-full max-w-5xl mt-12"
          >
            {/* Background Glow */}
            <div className="absolute -inset-10 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>

            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] border-[12px] border-white/80 backdrop-blur-sm bg-white/40"
            >
              <img
                src={heroSecurity}
                alt="PIL Security Restriction"
                className="w-full h-auto object-cover transform scale-105"
              />

              {/* Overlay Glass Elements on the image */}
              <div className="absolute top-10 left-10 p-4 bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                    <Lock size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase">Device Status</p>
                    <p className="text-sm font-black text-slate-800 tracking-tight">ENFORCED</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Quick Stats / Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-20 flex flex-wrap items-center justify-center gap-12 border-t border-slate-200/50 pt-10 w-full"
          >
            {[
              { label: "Active Deployments", value: "50,000+" },
              { label: "Uptime SLA", value: "99.99%" },
              { label: "Security Compliance", value: "SOC2 / ISO" },
              { label: "Countries Served", value: "24+" }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <p className="text-2xl font-black text-slate-800">{stat.value}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 2. ABOUT PIL SECTION */}
      <section id="platform" className="py-28 relative overflow-hidden bg-transparent">

        <div className="w-full mx-auto px-6 md:px-12 lg:px-16 relative z-10 flex flex-col">
          
          {/* Top Layer: Split Layout */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20 mb-20">
            
            {/* Left Column: Heading & Info (Decreased Font Size) */}
            <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/50 border border-blue-200 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6"
              >
                Core Security Ecosystem
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-4xl lg:text-5xl font-black mb-12 text-slate-900 tracking-tight leading-[1.1]"
              >
                Empowering Security with <br className="hidden lg:block" />
                <span className="text-2xl md:text-3xl lg:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  PIL (Policy-Driven Information Lock)
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-slate-500 text-lg md:text-xl leading-relaxed font-medium max-w-2xl"
              >
                PIL (Policy-Driven Information Lock) is a comprehensive ecosystem designed for the modern workspace. From automated attendance to military-grade camera restrictions, we provide everything needed for a secure and efficient environment.
              </motion.p>
            </div>

            {/* Right Column: Premises Card */}
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="group relative w-full max-w-[520px] p-10 md:p-14 rounded-[3.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 shadow-[0_40px_100px_-20px_rgba(37,99,235,0.4)] transition-all duration-700 text-center flex flex-col items-center overflow-hidden"
              >
                {/* Visual Accent Orbs */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 mb-8 rounded-[1.8rem] bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30"
                  >
                    <Shield className="w-10 h-10" />
                  </motion.div>

                  <h3 className="text-2xl lg:text-3xl font-black mb-6 text-white tracking-tight">Premises Restrictions</h3>
                  <p className="text-blue-50/90 text-base md:text-lg font-medium leading-relaxed mb-8">
                    Policy-based automated blocking of cameras and apps strictly within the organization's premises.
                  </p>

                  <div className="flex flex-wrap justify-center gap-4">
                    <div className="flex items-center gap-2 p-3 bg-white/10 rounded-xl border border-white/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                      <span className="text-white text-[10px] font-black uppercase tracking-widest leading-none">Hardware Lock</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-white/10 rounded-xl border border-white/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-300"></div>
                      <span className="text-white text-[10px] font-black uppercase tracking-widest leading-none">Geofenced</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Bottom Layer: Secondary Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {/* QR Attendance */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-start gap-6 p-8 md:p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-25px_rgba(0,0,0,0.08)] transition-all duration-500"
            >
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                <Network className="w-8 h-8" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-black mb-3 text-slate-800 tracking-tight">QR Attendance</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Seamless and touchless attendance management for employees and visitors through secure QR authentication.
                </p>
              </div>
            </motion.div>

            {/* Secure Cloud */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex items-start gap-6 p-8 md:p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-25px_rgba(0,0,0,0.08)] transition-all duration-500"
            >
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 shadow-inner">
                <Database className="w-8 h-8" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-black mb-3 text-slate-800 tracking-tight">Secure Cloud</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Centralized, encrypted logs and activity data storage for complete audit trails and transparency.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. WHY CHOOSE US */}
      <section id="solutions" className="pt-16 pb-28 relative overflow-hidden bg-transparent">

        {/* Magical Background Orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-0">
          <div className="absolute top-[-10%] left-[5%] w-[500px] h-[500px] bg-white/40 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[10%] right-[0%] w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-[120px]"></div>

          <svg className="absolute top-[20%] left-[-5%] w-[110%] h-[400px] text-blue-200/30" fill="none" viewBox="0 0 1200 400">
            <path d="M0,200 Q300,50 600,200 T1200,200" stroke="currentColor" strokeWidth="2" strokeDasharray="20 40" />
            <path d="M0,250 Q400,100 800,250 T1600,250" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>

        <div className="w-full mx-auto px-6 md:px-12 lg:px-16 flex flex-col items-center text-center relative z-10">

          <div className="mb-20 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/50 border border-blue-200 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6"
            >
              Enterprise Advantage
            </motion.div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-slate-900 tracking-tight leading-[1.1]">
              Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Us</span>
            </h2>
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">
              Unmatched capabilities for next-generation intelligence and device restriction management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 w-full">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                className="group relative p-10 rounded-[2.5rem] bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_-30px_rgba(37,99,235,0.2)] transition-all duration-500 text-left overflow-hidden"
              >
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-200/40 transition-colors"></div>

                {/* Icon Container */}
                <div className="relative w-16 h-16 mb-8 rounded-2xl bg-gradient-to-br from-blue-50 to-white flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform duration-500 border border-white">
                  <div className="absolute inset-0 bg-blue-400/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {feature.icon}
                </div>

                <h3 className="text-xl font-black mb-4 text-slate-900 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  {feature.desc}
                </p>

                {/* Subtle Hover Decorative Line */}
                <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 w-0 group-hover:w-full"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SECURITY ARCHITECTURE */}
      <section id="architecture" className="py-24 relative overflow-hidden bg-transparent">
        {/* Abstract Background Accents */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[10%] left-[20%] w-[600px] h-[600px] bg-blue-50 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px]"></div>

          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#2563eb 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
        </div>

        <div className="w-full mx-auto px-6 md:px-12 lg:px-16 flex flex-col items-center relative z-10">
          <div className="text-center max-w-3xl mb-24">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-slate-900 tracking-tight">
              Security <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Architecture</span>
            </h2>
            <p className="text-slate-500 text-lg md:text-xl font-medium">
              A multi-layered defense system connecting your devices to our global intelligence cloud.
            </p>
          </div>

          <div className="relative w-full max-w-[1600px] h-[600px] lg:h-[700px] flex items-center justify-center">

            {/* SVG Connecting Lines (Visible only on desktop) */}
            <svg className="absolute inset-0 w-full h-full hidden lg:block pointer-events-none" viewBox="0 0 1200 700">
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0" />
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Lines from left cards to center */}
              <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                d="M200,180 L520,300" stroke="url(#lineGrad)" strokeWidth="2" fill="none" />
              <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                d="M200,520 L520,400" stroke="url(#lineGrad)" strokeWidth="2" fill="none" />
              {/* Lines from right cards to center */}
              <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.5 }}
                d="M1000,180 L680,300" stroke="url(#lineGrad)" strokeWidth="2" fill="none" />
              <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.5 }}
                d="M1000,520 L680,400" stroke="url(#lineGrad)" strokeWidth="2" fill="none" />
            </svg>

            {/* Central High-Tech Core Component */}
            <div className="relative z-20">
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative flex flex-col items-center"
              >
                {/* Image Asset */}
                <div className="relative w-[300px] md:w-[400px] lg:w-[450px] drop-shadow-[0_0_50px_rgba(59,130,246,0.3)]">
                  <img
                    src="/cyber-core.png"
                    alt="Cybersecurity Core"
                    className="w-full h-auto object-contain"
                  />
                </div>

                {/* Ground Reflection/Ambient Glow */}
                <div className="absolute bottom-[-10%] w-[300px] h-10 bg-blue-600/10 rounded-full blur-[40px]"></div>
              </motion.div>
            </div>

            {/* Feature Cards Around the Center */}
            {/* Top Left: Cloud Intelligence */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="absolute top-[5%] left-[0%] lg:left-[2%] w-[320px] p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-[20px_20px_60px_-15px_rgba(0,0,0,0.05)] hover:shadow-[30px_30px_80px_-20px_rgba(0,0,0,0.1)] transition-all group text-center flex flex-col items-center"
            >
              <div className="w-14 h-14 mb-8 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Cloud className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Cloud Intelligence</h3>
              <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] mb-4">Global Threat Analysis</p>
              <p className="text-slate-400 text-sm leading-relaxed">Continuous scanning for global vulnerabilities and instantaneous policy updates across your entire fleet.</p>
            </motion.div>

            {/* Bottom Left: Control Engine */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="absolute bottom-[2%] left-[0%] lg:left-[2%] w-[320px] p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-[20px_-20px_60px_-15px_rgba(0,0,0,0.05)] hover:shadow-[30px_-30px_80px_-20px_rgba(0,0,0,0.1)] transition-all group text-center flex flex-col items-center"
            >
              <div className="w-14 h-14 mb-8 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Cpu className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Control Engine</h3>
              <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] mb-4">Policy & MDM Sync</p>
              <p className="text-slate-400 text-sm leading-relaxed">The brains behind real-time restriction enforcement. Seamlessly synchronizes with major MDM providers.</p>
            </motion.div>

            {/* Top Right: Monitoring Layer */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="absolute top-[5%] right-[0%] lg:right-[2%] w-[320px] p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-[-20px_20px_60px_-15px_rgba(0,0,0,0.05)] hover:shadow-[-30px_30px_80px_-20px_rgba(0,0,0,0.1)] transition-all group text-center flex flex-col items-center"
            >
              <div className="w-14 h-14 mb-8 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                <Eye className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Monitoring Layer</h3>
              <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] mb-4">Feed & Anomaly Detection</p>
              <p className="text-slate-400 text-sm leading-relaxed">AI-driven analysis of device behavior identifying unauthorized activities and perimeter breaches in milliseconds.</p>
            </motion.div>

            {/* Bottom Right: Device Layer */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="absolute bottom-[2%] right-[0%] lg:right-[2%] w-[320px] p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-[-20px_-20px_60px_-15px_rgba(0,0,0,0.05)] hover:shadow-[-30px_-30px_80px_-20px_rgba(0,0,0,0.1)] transition-all group text-center flex flex-col items-center"
            >
              <div className="w-14 h-14 mb-8 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Smartphone className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Device Layer</h3>
              <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] mb-4">Endpoints & Hardware</p>
              <p className="text-slate-400 text-sm leading-relaxed">Total control over cameras and applications on smartphones, tablets, and specialized IoT endpoints.</p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 5. PERFORMANCE MONITORING */}
      <section className="py-24 relative overflow-hidden bg-transparent">
        <div className="absolute inset-x-0 top-0 h-px bg-slate-200/60"></div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-slate-200/60"></div>

        <div className="w-full mx-auto px-6 md:px-12 lg:px-16 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 justify-items-center">
            {[
              { label: "Uptime guarantee", value: "99.9%", icon: <CheckCircle className="w-6 h-6" />, color: "text-emerald-500", bg: "bg-emerald-50" },
              { label: "Devices Monitored", value: "10,000+", icon: <Smartphone className="w-6 h-6" />, color: "text-blue-500", bg: "bg-blue-50" },
              { label: "Active Monitoring", value: "24/7", icon: <Activity className="w-6 h-6" />, color: "text-indigo-500", bg: "bg-indigo-50" },
              { label: "Alert Response Time", value: "<1s", icon: <Zap className="w-6 h-6" />, color: "text-orange-500", bg: "bg-orange-50" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative group p-8 rounded-[2rem] bg-white border border-slate-100 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-20px_rgba(37,99,235,0.15)] transition-all duration-500 text-center flex flex-col items-center overflow-hidden"
              >
                {/* Individual Glow */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 ${stat.bg} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                <div className={`w-14 h-14 mb-8 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500 relative z-10`}>
                  {stat.icon}
                </div>

                <div className="relative z-10">
                  <div className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tighter">
                    {stat.value}
                  </div>
                  <div className="text-slate-500 font-bold uppercase tracking-[0.15em] text-[10px] md:text-xs">
                    {stat.label}
                  </div>
                </div>

                {/* Decorative Bottom Dash */}
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 ${stat.color} bg-current rounded-t-full opacity-20 group-hover:w-16 transition-all duration-500`}></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS TIMELINE */}
      <section className="py-32 relative bg-transparent flex flex-col items-center overflow-hidden">
        <div className="w-full  mx-auto px-6 md:px-12 lg:px-16 flex flex-col items-center">
          <div className="mb-24 max-w-3xl text-center">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-slate-900">How It <span className="text-blue-600">Works</span></h2>
            <p className="text-slate-600 text-xl md:text-2xl font-medium">From deployment to active monitoring in a streamlined, frictionless process.</p>
          </div>

          <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center">
            <div className="absolute left-6 md:left-1/2 top-4 bottom-4 w-1.5 bg-gradient-to-b from-blue-200 via-indigo-200 to-transparent md:-translate-x-1/2 hidden sm:block"></div>

            {[
              { title: "Device Enrollment", desc: "Auto-provision devices via Zero-Touch or MDM profiles instantly." },
              { title: "Policy Configuration", desc: "Define geofences, time-based restrictions, and rigorous camera usage rules." },
              { title: "Camera Monitoring", desc: "Continuous state monitoring for unauthorized camera activation across the fleet." },
              { title: "Alert & Reporting", desc: "Instantly flag policy breaches to the central security console for rapid response." },
              { title: "Compliance Audit Logs", desc: "Generate immutable logs ready for automatic enterprise compliance reporting." }
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className={`relative flex flex-col sm:flex-row items-center w-full mb-16 ${idx % 2 === 0 ? 'sm:flex-row-reverse' : ''}`}
              >
                <div className="w-full sm:w-1/2"></div>

                {/* Timeline Dot */}
                <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white border-4 border-blue-600 shadow-xl items-center justify-center text-blue-600 font-bold z-10">
                  {idx + 1}
                </div>

                <div className="w-full sm:w-1/2 flex justify-center">
                  <div className={`w-full max-w-md p-8 md:p-10 rounded-[2.5rem] bg-white border border-slate-200 shadow-xl hover:-translate-y-2 transition-transform duration-500 text-center ${idx % 2 === 0 ? 'sm:text-left sm:ml-12' : 'sm:text-right sm:mr-12'}`}>
                    <h3 className="text-sm font-black text-blue-600 mb-3 uppercase tracking-widest bg-blue-50 inline-block px-4 py-1.5 rounded-full">Step 0{idx + 1}</h3>
                    <h4 className="text-2xl font-bold mb-4 text-slate-900 mt-2">{step.title}</h4>
                    <p className="text-slate-600 leading-relaxed text-lg">{step.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DASHBOARD SHOWCASE */}
      <section className="py-24 relative overflow-hidden bg-transparent">
        <div className="w-full mx-auto px-6 md:px-12 lg:px-16 flex flex-col items-center text-center">
          <div className="max-w-4xl mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-slate-800">The <span className="text-blue-600">Command Center</span></h2>
            <p className="text-slate-600 text-xl font-medium">Experience the power of centralized management with our intuitive, feature-rich dashboard.</p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-6xl p-4 md:p-8 bg-slate-100 rounded-[3rem] border border-white shadow-[0_50px_100px_-20px_rgba(59,130,246,0.15)]"
          >
            <DashboardPreview />
          </motion.div>
        </div>
      </section>

      {/* 7. INDUSTRIES WE SERVE */}
      <section id="industries" className="py-32 relative overflow-hidden bg-transparent">
        {/* Advanced Background Design */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

          {/* Subtle Grid Pattern */}
          <div className="absolute inset-x-0 top-0 h-full opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(#2563eb 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>

          {/* Ambient Orbs */}
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-[150px]"></div>

          {/* Decorative SVG Sparkles */}
          <svg className="absolute top-[10%] right-[15%] w-12 h-12 text-blue-200/40 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2L14.5,9.5L22,12L14.5,14.5L12,22L9.5,14.5L2,12L9.5,9.5L12,2Z" />
          </svg>
        </div>

        <div className="w-full mx-auto px-6 md:px-12 lg:px-16 flex flex-col items-center relative z-10">
          <div className="mb-24 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6"
            >
              Enterprise Solutions
            </motion.div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Industries We <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Serve</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl">
            {industries.map((industry, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="group relative p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_15px_35px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_25px_50px_-15px_rgba(37,99,235,0.1)] transition-all duration-500 cursor-pointer flex flex-col items-center text-center overflow-hidden"
              >
                {/* Internal Glow on Hover */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Icon Container with Glow */}
                <div className="relative mb-8 w-20 h-20 rounded-3xl bg-blue-50/50 flex items-center justify-center transition-all duration-500 group-hover:bg-blue-600 group-hover:shadow-[0_15px_30px_-10px_rgba(37,99,235,0.5)] group-hover:scale-110 z-10">
                  <div className="absolute inset-0 bg-blue-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {React.cloneElement(industry.icon, {
                    className: "w-9 h-9 text-blue-600 transition-colors duration-500 group-hover:text-white relative z-10",
                    strokeWidth: 1.5
                  })}
                </div>

                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                    {industry.name}
                  </h3>
                  <div className="w-10 h-1 bg-slate-100 mx-auto rounded-full group-hover:w-16 group-hover:bg-blue-400 transition-all duration-500"></div>
                </div>

                {/* Decorative Industry Marker */}
                <span className="absolute bottom-4 right-8 text-[3rem] font-black text-slate-500/5 select-none transition-all duration-500 group-hover:text-blue-500/10 group-hover:-translate-y-2">
                  0{i + 1}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. TESTIMONIALS SLIDER - RESTORED CLEAN DESIGN */}
      <section className="py-24 md:py-32 relative bg-transparent overflow-hidden">
        {/* Simple Background Accent */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-50/30 rounded-full blur-[120px]"></div>
        </div>

        <div className="w-full mx-auto px-6 md:px-12 lg:px-16 flex flex-col items-center relative z-10">
          {/* Section Header - Increased Spacing */}
          <div className="flex flex-col items-center text-center mb-32 md:mb-40">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-[11px] font-black uppercase tracking-[0.2em] mb-8"
            >
              <Shield className="w-4 h-4" />
              Trusted Globally
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight max-w-5xl">
              Securing the world's <br className="hidden md:block" />
              <span className="text-blue-600">leading enterprise environments.</span>
            </h2>
          </div>

          {/* 3D Testimonial Slider Stage */}
          <div className="w-full relative flex flex-col items-center">
            
            <div className="flex justify-center items-center gap-4 md:gap-8 w-full max-w-7xl h-[450px] relative">
              
              {/* Dynamic 3D Cards Map - Smaller & Compact */}
              {[-1, 0, 1].map((offset) => {
                const index = (activeTestimonial + offset + testimonials.length) % testimonials.length;
                const t = testimonials[index];
                const isActive = offset === 0;

                return (
                  <motion.div
                    key={`${index}-${offset}`}
                    initial={false}
                    animate={{
                      scale: isActive ? 1 : 0.85,
                      x: offset * (window.innerWidth < 1024 ? 30 : 400),
                      opacity: isActive ? 1 : 0.3,
                      zIndex: isActive ? 20 : 10,
                      rotateY: offset * 12,
                    }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className={`absolute w-[95%] md:w-[500px] lg:w-[600px] p-6 md:p-10 rounded-[3rem] bg-white border border-slate-100 flex flex-col items-center transition-all cursor-pointer ${isActive ? 'shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)]' : 'blur-[2px] grayscale-[0.2] pointer-events-none'}`}
                    onClick={() => isActive ? null : offset < 0 ? handlePrevTestimonial() : handleNextTestimonial()}
                  >
                    {/* Star Rating */}
                    <div className="flex text-yellow-500 mb-6 gap-1">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                          <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z" />
                        </svg>
                      ))}
                    </div>

                    {/* Big Quotes */}
                    <div className="text-blue-100 mb-6">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                    </div>

                    <p className="text-lg md:text-xl lg:text-2xl text-slate-800 font-semibold mb-10 italic text-center leading-relaxed px-2">
                      "{t.quote}"
                    </p>

                    {/* Profile Layout */}
                    <div className="flex items-center gap-4">
                      <img 
                        src={t.image} 
                        alt={t.name} 
                        className="w-16 h-16 rounded-[1.5rem] border-2 border-white shadow-lg object-cover" 
                      />
                      <div className="text-left">
                        <h4 className="text-lg font-black text-slate-900 leading-tight">{t.name}</h4>
                        <p className="text-blue-600 font-bold text-xs uppercase tracking-wider">{t.role}</p>
                        <p className="text-slate-400 font-medium text-[9px] uppercase tracking-widest">{t.company}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Functional Arrows - Refined Colors */}
              <div className="absolute left-[-10px] md:left-[20px] lg:left-[5%] z-30">
                <button 
                  onClick={handlePrevTestimonial}
                  className="w-14 h-14 rounded-full bg-white border border-slate-100 shadow-xl flex items-center justify-center text-blue-600 hover:text-blue-700 transition-all hover:scale-110 active:scale-95"
                >
                  <ArrowRight className="w-7 h-7 rotate-180" strokeWidth={2.5} />
                </button>
              </div>
              <div className="absolute right-[-10px] md:right-[20px] lg:right-[5%] z-30">
                <button 
                  onClick={handleNextTestimonial}
                  className="w-14 h-14 rounded-full bg-white border border-slate-100 shadow-xl flex items-center justify-center text-blue-600 hover:text-blue-700 transition-all hover:scale-110 active:scale-95"
                >
                  <ArrowRight className="w-7 h-7" strokeWidth={2.5} />
                </button>
              </div>

            </div>

            {/* Pagination Dashboard */}
            <div className="flex items-center gap-4 mt-12">
              {testimonials.map((_, i) => (
                <div 
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`cursor-pointer transition-all duration-300 rounded-full ${i === activeTestimonial ? 'w-10 h-2.5 bg-blue-600' : 'w-2.5 h-2.5 bg-slate-200 hover:bg-slate-300'}`}
                ></div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* 9. CONTACT US */}
      <section id="request-demo" className="py-24 relative overflow-hidden bg-transparent">

        {/* Magical Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
          {/* Glowing Ambient Orbs */}
          <div className="absolute top-[10%] left-[20%] w-[600px] h-[600px] bg-blue-300/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[0%] right-[10%] w-[700px] h-[700px] bg-indigo-300/20 rounded-full blur-[150px]"></div>

          {/* Swirling lines (represented via SVGs/CSS sweeps) */}
          <div className="absolute top-[20%] right-[15%] w-[800px] h-[800px] border-[2px] border-white/40 rounded-full opacity-50 blur-[1px]"></div>
          <div className="absolute top-[25%] right-[10%] w-[700px] h-[700px] border-[4px] border-blue-200/30 rounded-full opacity-40 blur-[2px]"></div>

          {/* Sparkles */}
          <div className="absolute top-[30%] left-[40%] w-2 h-2 rounded-full bg-white shadow-[0_0_15px_3px_rgba(255,255,255,1)] animate-pulse"></div>
          <div className="absolute top-[15%] right-[45%] w-1.5 h-1.5 rounded-full bg-blue-300 shadow-[0_0_10px_2px_rgba(147,197,253,1)] animate-[pulse_3s_ease-in-out_infinite]"></div>
          <div className="absolute bottom-[30%] right-[25%] w-3 h-3 rounded-full bg-white shadow-[0_0_20px_5px_rgba(255,255,255,1)] animate-[pulse_4s_ease-in-out_infinite]"></div>
          <div className="absolute top-[50%] left-[10%] w-2 h-2 rounded-full bg-white shadow-[0_0_15px_3px_rgba(255,255,255,1)] animate-[pulse_2s_ease-in-out_infinite]"></div>
          <div className="absolute bottom-[10%] right-[40%] w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_2px_rgba(59,130,246,1)] animate-pulse"></div>

          {/* Floating Security Icons (Abstracted SVG shapes matching the image) */}
          <div className="absolute top-[15%] right-[30%] opacity-80 animate-[bounce_6s_infinite]">
            <Shield className="w-16 h-16 text-blue-400 drop-shadow-xl" fill="currentColor" stroke="white" strokeWidth="1" />
          </div>
          <div className="absolute bottom-[20%] left-[15%] opacity-70 animate-[bounce_8s_infinite]">
            <Lock className="w-20 h-20 text-indigo-400 drop-shadow-xl" fill="currentColor" stroke="white" strokeWidth="1" />
          </div>
          <div className="absolute top-[40%] right-[8%] opacity-60 animate-[bounce_7s_infinite]">
            <LockKeyhole className="w-14 h-14 text-blue-300 drop-shadow-xl" fill="currentColor" stroke="white" strokeWidth="1" />
          </div>
        </div>

        <div className="w-full mx-auto px-6 md:px-12 lg:px-16 flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10">

          {/* Left Side Content */}
          <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left z-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-slate-800 leading-[1.15] tracking-tight drop-shadow-sm">
              Ready to fortify your <br className="hidden md:block" />
              <span className="text-blue-600">infrastructure?</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-700 mb-10 font-medium max-w-lg leading-relaxed drop-shadow-sm">
              Speak with our certified security experts to customize a deployment architecture for your organization.
            </p>

            <div className="space-y-4 w-full flex flex-col items-center lg:items-start max-w-lg">
              {[
                "Live Interactive Demo of PIL Platform",
                "Comprehensive Security Architecture Review",
                "Enterprise Compliance Strategy Alignment"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 text-slate-800 text-[1.05rem] font-bold bg-white/70 backdrop-blur-md px-6 py-4 rounded-full border border-white shadow-[0_8px_16px_-6px_rgba(100,150,250,0.15)] w-full justify-start transition-transform hover:-translate-y-1 hover:bg-white duration-300">
                  <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={3} />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Right Side Form (Glassmorphism & Large overlapping shield) */}
          <div className="w-full lg:w-5/12 max-w-lg relative mt-16 lg:mt-0 z-20">

            {/* Massive Overlapping Shield (Like the Image) */}
            <div className="absolute -top-16 -right-10 md:right-4 z-30 drop-shadow-[0_20px_20px_rgba(59,130,246,0.4)] animate-[bounce_4s_infinite]">
              <div className="relative">
                <Shield className="w-32 h-32 md:w-40 md:h-40 text-blue-500" fill="currentColor" stroke="white" strokeWidth="1" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 md:w-16 md:h-16 text-white" fill="white" stroke="#3b82f6" strokeWidth={2} />
                </div>
              </div>
            </div>

            {/* Glowing Backdrop behind the form */}
            <div className="absolute inset-0 bg-blue-300 rounded-[2.5rem] blur-2xl opacity-20 translate-y-4 shadow-xl"></div>

            {/* Premium Glass Form Container */}
            <form onSubmit={handleSubmit} className="relative w-full p-8 md:p-12 rounded-[2.5rem] bg-white/80 backdrop-blur-2xl border-2 border-white/90 shadow-[0_25px_50px_-12px_rgba(100,150,255,0.25)] text-left flex flex-col gap-6">


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-black text-slate-800 mb-2 block uppercase tracking-widest opacity-80">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-white/60 border border-blue-100/80 rounded-2xl px-5 py-4 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner placeholder:text-slate-400"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-800 mb-2 block uppercase tracking-widest opacity-80">Company</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full bg-white/60 border border-blue-100/80 rounded-2xl px-5 py-4 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner placeholder:text-slate-400"
                    placeholder="Acme Corp"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-800 mb-2 block uppercase tracking-widest opacity-80">Enterprise Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-white/60 border border-blue-100/80 rounded-2xl px-5 py-4 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner placeholder:text-slate-400"
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-800 mb-2 block uppercase tracking-widest opacity-80">Project Details</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full bg-white/60 border border-blue-100/80 rounded-2xl px-5 py-4 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner resize-none placeholder:text-slate-400"
                  placeholder="Briefly describe your requirements..."
                ></textarea>
              </div>

              <div className="flex items-center gap-4 mt-2">
                <input
                  type="checkbox"
                  id="demo"
                  name="requestDemo"
                  checked={formData.requestDemo}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer shadow-sm"
                />
                <label htmlFor="demo" className="text-sm font-bold text-slate-700 leading-none cursor-pointer hover:text-blue-600 transition-colors">I would like to request a live technical demo.</label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl font-black text-lg transition-all shadow-[0_10px_20px_-10px_rgba(37,99,235,0.6)] hover:shadow-[0_15px_25px_-10px_rgba(37,99,235,0.8)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>

              {/* Support & Presentation Cards moved to bottom of form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-4">
                  <div className="bg-white/60 p-4 rounded-2xl border border-blue-50 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <Phone size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest m-0">Support</p>
                      <p className="text-slate-900 font-bold text-xs whitespace-nowrap m-0">0172-4084189</p>
                    </div>
                  </div>

                  <a 
                    href="/presentation.pdf" 
                    download="PIL.pdf"
                    className="bg-white/60 p-4 rounded-2xl border border-blue-50 flex items-center gap-3 no-underline"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest m-0">PIL</p>
                      <p className="text-blue-600 font-bold uppercase text-[10px] m-0">Download PDF</p>
                    </div>
                  </a>
              </div>
            </form>

          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="bg-white border-t border-slate-200 pt-20 pb-10">
        <div className="w-full  mx-auto px-6 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1 text-left">
              <div className="flex items-center gap-3 mb-6">
                <img src={pidliteLogo} alt="PIL Logo" className="h-8 w-auto" />
                <span className="text-2xl font-black tracking-tight text-slate-900">PIL</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed max-w-xs font-medium">
                Enterprise-grade security and camera intelligence platform. Monitor, restrict, and control with absolute confidence.
              </p>
            </div>

            <div className="text-left">
              <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-sm">Platform</h4>
              <ul className="flex flex-col gap-4 text-sm text-slate-600 font-medium">
                <li><a href="#" className="hover:text-blue-600 transition-colors">MDM Integration</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Real-Time Alerts</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Compliance Audits</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Analytics Dashboard</a></li>
              </ul>
            </div>

            <div className="text-left">
              <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-sm">Company</h4>
              <ul className="flex flex-col gap-4 text-sm text-slate-600 font-medium">
                <li><a href="#" className="hover:text-blue-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Security Policy</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Contact</a></li>
              </ul>
            </div>

            <div className="text-left">
              <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-sm">Legal</h4>
              <ul className="flex flex-col gap-4 text-sm text-slate-600 font-medium">
                <li><a href="/privacypolicy" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm font-medium">
              © {new Date().getFullYear()} Policy Driven Information Lock. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-slate-400">
              <a href="#" className="hover:text-blue-600 hover:scale-110 transition-all"><Globe size={24} /></a>
            </div>
          </div>
        </div>
      </footer>

      {/* Exit Intent Popup */}
      <ExitIntentPopup
        isOpen={isExitPopupOpen}
        onClose={() => setIsExitPopupOpen(false)}
      />
    </div>
  );
};

export default Home;
