import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
import {
  Shield, Lock, Activity, Smartphone, ArrowRight, Globe, ChevronLeft,
  Mail, FileText, CheckCircle, Menu, X
} from "lucide-react";
import pidliteLogo from "../Images/PIL.png";
import CyberBackground from "./Components/CyberBackground.js";
import Cookies from "js-cookie";

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const scrollProgressX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  const sections = [
    {
      title: "Scope",
      icon: <Globe className="text-blue-600" />,
      content: "This policy applies to the PIL (Policy-Driven Information Lock) mobile app, web dashboard, and backend services used to manage employee device access and workplace compliance."
    },
    {
      title: "Data we collect",
      icon: <Activity className="text-blue-600" />,
      list: [
        "Account details: name, employee ID, role, and contact info.",
        "Device identifiers: device ID, model, OS version, app version.",
        "Access events: login/logout time, QR usage, device status.",
        "Location status: entry/exit location and device location (if enabled).",
        "Security metadata: policy state, camera/app restrictions, audit logs."
      ]
    },
    {
      title: "Why we collect it",
      icon: <Shield className="text-blue-600" />,
      list: [
        "Verify employee identity and device ownership.",
        "Enforce workplace security policies automatically.",
        "Maintain attendance and access logs.",
        "Detect abnormal or unauthorized device activity.",
        "Support audits and compliance reporting."
      ]
    },
    {
      title: "How the system works",
      icon: <Smartphone className="text-blue-600" />,
      content: "PIL enables location-based security controls within company premises. When a user enters a protected zone, the app applies policy rules such as camera restriction, blocked apps, or kiosk mode. When a user exits, normal device access can be restored based on policy settings."
    },
    {
      title: "Security & Sharing",
      icon: <Lock className="text-blue-600" />,
      content: "We protect data using encryption in transit, access controls, and audit logging. We do not sell personal data. Data may be shared with your organization strictly to deliver the service."
    }
  ];

  return (
    <div className="min-h-screen bg-transparent text-slate-900 font-['Inter',_sans-serif] selection:bg-blue-600 selection:text-white overflow-x-hidden">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-blue-600 z-[60] origin-left"
        style={{ scaleX: scrollProgressX }}
      />

      <CyberBackground />

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

      {/* Hero Section */}
      <section className="pt-48 pb-32 relative overflow-hidden w-full flex flex-col items-center">

        <div className="max-w-7xl w-full px-6 relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="flex flex-col items-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-[0.2em] mb-8 shadow-sm border border-blue-100/50">
              <FileText className="w-3.5 h-3.5" /> Privacy Management
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tighter leading-[0.95]">
              Device security with clear, <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">human rules.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed max-w-3xl mx-auto">
              Transparent, robust, and designed for enterprise safety. Here's how PIL manages and protects your digital workspace data.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-12">
              <div className="px-6 py-2.5 bg-white rounded-full border border-slate-200 shadow-sm flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-sm font-black text-slate-700 uppercase tracking-widest">Active</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-400 font-bold uppercase tracking-wider">
                <span>v1.0 Revision</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>March 18, 2026</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

  <section className="pb-32 relative w-full flex flex-col items-center">
    <div className="max-w-6xl w-full px-4 sm:px-6 flex flex-col items-center">
      <div className="flex flex-col gap-12 w-full max-w-5xl items-center">
        {sections.map((section, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: idx * 0.05 }}
            className="w-full p-12 md:p-16 rounded-[4rem] bg-white/50 backdrop-blur-2xl border border-white/70 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_24px_48px_-8px_rgba(59,130,246,0.15)] hover:-translate-y-1.5 transition-all duration-500 relative overflow-hidden group"
          >
            {/* Accent line on top */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="flex flex-col md:flex-row md:items-center gap-8 mb-10 text-left">
              <div className="w-20 h-20 rounded-3xl bg-blue-50/80 flex items-center justify-center shrink-0 border border-blue-100/50 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 shadow-sm">
                {React.cloneElement(section.icon, { size: 40 })}
              </div>
              <div>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                  {section.title}
                </h3>
                <p className="text-blue-500 text-sm font-black uppercase tracking-[0.25em] mt-1.5">Management Policy</p>
              </div>
            </div>

            {section.content && (
              <p className="text-slate-600 leading-relaxed font-medium text-xl md:text-2xl text-left">
                {section.content}
              </p>
            )}

            {section.list && (
              <div className="grid grid-cols-1 gap-5 text-left">
                {section.list.map((item, i) => (
                  <div key={i} className="flex items-start gap-5 p-6 rounded-3xl border border-white/40 bg-white/40 backdrop-blur-sm group/item hover:bg-white hover:border-blue-100 hover:shadow-md transition-all duration-500">
                    <CheckCircle className="w-7 h-7 text-blue-400 mt-0.5 shrink-0 group-hover/item:text-blue-600 transition-colors" />
                    <span className="text-slate-600 font-bold leading-relaxed text-xl">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}

            {/* Contact Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="md:col-span-12 p-16 rounded-[4rem] bg-slate-900 text-white shadow-3xl relative overflow-hidden group mt-12 w-full"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none group-hover:scale-125 transition-transform duration-1000"></div>

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="text-center md:text-left max-w-2xl">
                  <div className="inline-flex items-center gap-2 text-blue-400 font-black uppercase tracking-[0.3em] text-xs mb-6">
                    <Mail className="w-4 h-4" /> Global Support
                  </div>
                  <h3 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter leading-none">Need more clarity?</h3>
                  <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                    Our compliance team is ready to answer specific questions about device logs, storage, or your privacy rights.
                  </p>
                </div>

                <a
                  href="mailto:info@ajivainfotech.com"
                  className="shrink-0 flex items-center justify-center gap-4 px-10 py-6 bg-blue-600 text-white rounded-3xl font-black text-xl hover:bg-blue-500 transition-all shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.6)] hover:-translate-y-2 group/btn uppercase tracking-widest"
                >
                  Contact Support
                  <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Simplified Footer */}
      <footer className="bg-white border-t border-slate-200 py-20 w-full flex flex-col items-center">
        <div className="max-w-7xl w-full px-6 flex flex-col items-center gap-12">
          <div className="flex items-center gap-3 mb-6 transition-all duration-500">
            <img src={pidliteLogo} alt="PIL Logo" className="h-10 w-auto" />
            <span className="text-2xl font-black tracking-tight text-slate-900">PIL</span>
          </div>

          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-sm font-black text-slate-400 uppercase tracking-widest">
            <a href="/" className="hover:text-blue-600 transition-colors">Security</a>
            <a href="/" className="hover:text-blue-600 transition-colors">Terms</a>
            <a href="/" className="hover:text-blue-600 transition-colors">System</a>
          </div>

          <p className="text-slate-400 text-sm font-bold tracking-tight text-center">
            © {new Date().getFullYear()} PIL • Policy-Driven Information Lock. <br className="md:hidden" />
            Engineered by <span className="text-slate-900">AjivaInfotech Pvt Ltd</span>.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
