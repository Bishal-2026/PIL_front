import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../Helpers/api.js";
import Validator from "../Helpers/validators.js";
import { toast } from "react-toastify";
import {
    Building2,
    Mail,
    Lock,
    User,
    Phone,
    MapPin,
    ChevronRight,
    ArrowLeft,
    ShieldCheck,
    CheckCircle,
    Building,
    Eye,
    EyeOff,
    ShieldAlert,
    Smartphone
} from "lucide-react";
import pidilitelogo from "../Images/PIL.png";
import securelogin from "../Images/secure-login.png";
import "../Components/Website/LoginPage.css";

const VendorRegister = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState("form"); // form | otp
    const [registeredEmail, setRegisteredEmail] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        organizationName: "",
        contactNo: "",
        address: "",
        latitude: "",
        longitude: "",
        radius: 500
    });

    const [otp, setOtp] = useState("");
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchingAddress, setSearchingAddress] = useState(false);
    const suggestionRef = useRef(null);

    // Rules and Validator (can be outside or early)
    const rules = {
        name: { required: true, type: "string", errorMessage: "Full name is required." },
        email: { required: true, type: "string", errorMessage: "Email is required." },
        password: { required: true, type: "string", errorMessage: "Password is required (min 6 chars)." },
        organizationName: { required: true, type: "string", errorMessage: "Organization name is required." },
        contactNo: { required: true, type: "string", errorMessage: "Contact number is required." },
        address: { required: true, type: "string", errorMessage: "Address is required." },
        radius: { required: true, type: "number", errorMessage: "Location radius is required." },
    };

    const validator = new Validator(rules);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced search with AbortController to prevent 429 errors and race conditions
    useEffect(() => {
        if (!formData.address || formData.address.length < 3) {
            setAddressSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(() => {
            fetchAddressSuggestions(formData.address, controller.signal);
        }, 600); 

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [formData.address]);

    const fetchAddressSuggestions = async (query, signal) => {
        setSearchingAddress(true);
        try {
            // Geoapify Search API - More thorough than autocomplete for finding business names
            const apiKey = "59ab35bb5ccb49a589cf28b26e73d03f";
            
            // Appending India ensures we don't get results from abroad
            const searchQuery = query.toLowerCase().includes("india") ? query : `${query}, India`;
            
            const response = await fetch(
                `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(searchQuery)}&filter=countrycode:in&bias=countrycode:in&lang=en&limit=10&format=json&apiKey=${apiKey}`,
                { signal }
            );
            const data = await response.json();
            
            if (data && data.results && data.results.length > 0) {
                const suggestions = data.results.map(p => {
                    const subParts = [p.city, p.state, p.postcode].filter(Boolean);
                    return {
                        label: p.formatted,
                        name: p.name || p.street || p.address_line1,
                        sublabel: subParts.join(", "),
                        category: p.category || p.result_type,
                        lat: p.lat,
                        lon: p.lon
                    };
                });

                setAddressSuggestions(suggestions);
                setShowSuggestions(true);
            } else {
                setAddressSuggestions([]);
                setShowSuggestions(true);
            }
        } catch (error) {
            if (error.name !== "AbortError") {
                console.error("Geocoding error:", error);
                setAddressSuggestions([]);
            }
        } finally {
            setSearchingAddress(false);
        }
    };

    const handleSelectSuggestion = (suggestion) => {
        setFormData(prev => ({
            ...prev,
            address: suggestion.label,
            latitude: suggestion.lat,
            longitude: suggestion.lon
        }));
        setShowSuggestions(false);
        if (errors.address) setErrors(prev => ({ ...prev, address: "" }));
    };

    const handleBlur = async (e) => {
        const { name, value } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        const fieldErrors = await validator.validate({ [name]: value }, { [name]: rules[name] });
        setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const validationErrors = await validator.validate(formData, rules);
            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                setLoading(false);
                return;
            }

            const response = await API.vendor.register(formData);

            if (response.status === true) {
                const successMsg = String(response.message || "OTP sent to your email. Please check your inbox.");
                toast.success(successMsg);
                setRegisteredEmail(formData.email);
                setStep("otp");
            } else {
                toast.error(response.message || "Registration failed.");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otp || otp.length < 6) {
            toast.warning("Please enter a valid 6-digit OTP.");
            return;
        }

        setLoading(true);
        try {
            const response = await API.vendor.verifyOtp({
                email: registeredEmail,
                otp: otp
            });

            if (response.status === true) {
                const finalMsg = String(response.message || "Email verified and registration complete!");
                toast.success(finalMsg);
                setTimeout(() => navigate("/login"), 2000);
            } else {
                toast.error(response.message || "Verification failed.");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };



    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    return (
        <div className="pil-login-root">
            <div className="pil-login-layout">

                {/* ── LEFT PANEL ── */}
                <div className="pil-login-left relative">
                    <div className="absolute top-8 left-8 z-10">
                        {step === "form" ? (
                            <button
                                onClick={() => navigate("/")}
                                className="flex items-center gap-2 text-slate-700 hover:text-blue-700 font-bold text-sm bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
                            >
                                <ArrowLeft size={18} /> Back to Home
                            </button>
                        ) : (
                            <button
                                onClick={() => setStep("form")}
                                className="flex items-center gap-2 text-slate-700 hover:text-blue-700 font-bold text-sm bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
                            >
                                <ArrowLeft size={18} /> Edit Details
                            </button>
                        )}
                    </div>
                    <div className="pil-left-content">
                        <div className="pil-left-badge">
                            <span></span>
                            {step === "form" ? "Vendor Onboarding Portal" : "Secure Verification"}
                        </div>
                        <img
                            src={securelogin}
                            alt="Vendor registration"
                            className="pil-left-illustration"
                        />
                        {step === "form" ? (
                            <>
                                <h2 className="pil-left-headline">
                                    Partner with <span>PIL</span>
                                </h2>
                                <p className="pil-left-sub">
                                    Empower your organization with smart workforce management and advanced policy-driven security controls.
                                </p>
                                <div className="mt-8 space-y-4 text-left max-w-sm mx-auto">
                                    {[
                                        "Policy-Driven Restrictions",
                                        "Automated Attendance System",
                                        "Centralized MDM Control",
                                        "Comprehensive Audit Logs"
                                    ].map((benefit, i) => (
                                        <div key={i} className="flex items-center gap-3 text-slate-700 bg-white/50 backdrop-blur-sm p-3 rounded-xl border border-blue-100 shadow-sm">
                                            <CheckCircle size={18} className="text-blue-500 shrink-0" />
                                            <span className="font-semibold text-sm">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="pil-left-headline">
                                    Security <span>Verification</span>
                                </h2>
                                <p className="pil-left-sub">
                                    A verification code has been sent to <strong>{registeredEmail}</strong>. Please enter the code to activate your account.
                                </p>
                                <div className="mt-8 flex justify-center">
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3">
                                        <Smartphone className="text-blue-600" />
                                        <div className="text-left">
                                            <div className="text-xs text-blue-500 uppercase font-bold letter-spacing-wider">Check Inbox</div>
                                            <div className="text-sm font-semibold text-blue-900">OTP Sent Successfully</div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ── RIGHT PANEL ── */}
                <div className="pil-login-right">
                    <div className="pil-card" style={{ padding: '32px 40px' }}>
                        {/* Logo */}
                        <div className="pil-card-logo">
                            <img src={pidilitelogo} alt="PIL Logo" />
                        </div>

                        {step === "form" ? (
                            <>
                                {/* Title */}
                                <div className="pil-card-title mb-6">
                                    <h1 className="text-2xl font-bold">Register Organization</h1>
                                    <p className="text-slate-500 text-sm">Join the next-gen security platform</p>
                                </div>

                                <form onSubmit={handleSubmit} noValidate>
                                    <div style={{ maxHeight: '45vh', overflowY: 'auto', overflowX: 'hidden', paddingRight: '4px', paddingBottom: '10px', marginBottom: '15px' }} className="pr-2 custom-scrollbar">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                                                <div className="pil-field-group">
                                                    <label className="pil-field-label">Organization Name *</label>
                                                    <div className="pil-field-wrap">
                                                        <span className="pil-field-icon"><Building size={16} /></span>
                                                        <input
                                                            type="text"
                                                            name="organizationName"
                                                            value={formData.organizationName}
                                                            placeholder="Acme Corp"
                                                            onChange={handleInputChange}
                                                            onBlur={handleBlur}
                                                            className={`pil-field-input${errors.organizationName ? " pil-has-error" : ""}`}
                                                        />
                                                    </div>
                                                    {errors.organizationName && <div className="pil-field-error">⚠ {errors.organizationName}</div>}
                                                </div>

                                                <div className="pil-field-group">
                                                    <label className="pil-field-label">Location Radius (meters) *</label>
                                                    <div className="pil-field-wrap">
                                                        <span className="pil-field-icon"><MapPin size={16} /></span>
                                                        <input
                                                            type="number"
                                                            name="radius"
                                                            value={formData.radius}
                                                            placeholder="500"
                                                            onChange={handleInputChange}
                                                            onBlur={handleBlur}
                                                            className={`pil-field-input${errors.radius ? " pil-has-error" : ""}`}
                                                        />
                                                    </div>
                                                    {errors.radius && <div className="pil-field-error">⚠ {errors.radius}</div>}
                                                </div>
                                            </div>

                                            <div className="pil-field-group">
                                                <label className="pil-field-label">Admin Representative Name *</label>
                                                <div className="pil-field-wrap">
                                                    <span className="pil-field-icon"><User size={16} /></span>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={formData.name}
                                                        placeholder="John Doe"
                                                        onChange={handleInputChange}
                                                        onBlur={handleBlur}
                                                        className={`pil-field-input${errors.name ? " pil-has-error" : ""}`}
                                                    />
                                                </div>
                                                {errors.name && <div className="pil-field-error">⚠ {errors.name}</div>}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                                                <div className="pil-field-group">
                                                    <label className="pil-field-label">Email Address *</label>
                                                    <div className="pil-field-wrap">
                                                        <span className="pil-field-icon"><Mail size={16} /></span>
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            value={formData.email}
                                                            placeholder="admin@acme.com"
                                                            onChange={handleInputChange}
                                                            onBlur={handleBlur}
                                                            className={`pil-field-input${errors.email ? " pil-has-error" : ""}`}
                                                        />
                                                    </div>
                                                    {errors.email && <div className="pil-field-error">⚠ {errors.email}</div>}
                                                </div>

                                                <div className="pil-field-group">
                                                    <label className="pil-field-label">Contact Number *</label>
                                                    <div className="pil-field-wrap">
                                                        <span className="pil-field-icon"><Phone size={16} /></span>
                                                        <input
                                                            type="text"
                                                            name="contactNo"
                                                            value={formData.contactNo}
                                                            placeholder="+1 234 567 890"
                                                            onChange={handleInputChange}
                                                            onBlur={handleBlur}
                                                            className={`pil-field-input${errors.contactNo ? " pil-has-error" : ""}`}
                                                        />
                                                    </div>
                                                    {errors.contactNo && <div className="pil-field-error">⚠ {errors.contactNo}</div>}
                                                </div>
                                            </div>

                                            <div className="pil-field-group">
                                                <label className="pil-field-label">Account Password *</label>
                                                <div className="pil-field-wrap">
                                                    <span className="pil-field-icon"><Lock size={16} /></span>
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        name="password"
                                                        value={formData.password}
                                                        placeholder="Min 6 characters"
                                                        onChange={handleInputChange}
                                                        onBlur={handleBlur}
                                                        className={`pil-field-input${errors.password ? " pil-has-error" : ""}`}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="pil-pw-toggle"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                                {errors.password && <div className="pil-field-error">⚠ {errors.password}</div>}
                                            </div>

                                            <div className="pil-field-group">
                                                <label className="pil-field-label">Address / Location *</label>
                                                <div className="pil-field-wrap" ref={suggestionRef}>
                                                    <span className="pil-field-icon">
                                                        {searchingAddress ? (
                                                            <span className="pil-btn-spinner !border-blue-500 !w-4 !h-4 !m-0"></span>
                                                        ) : (
                                                            <MapPin size={16} />
                                                        )}
                                                    </span>
                                                    <input
                                                        type="text"
                                                        name="address"
                                                        autoComplete="off"
                                                        value={formData.address}
                                                        placeholder="Search Headquarters address"
                                                        onChange={handleInputChange}
                                                        onBlur={handleBlur}
                                                        className={`pil-field-input${errors.address ? " pil-has-error" : ""}`}
                                                    />
                                                    
                                                    {showSuggestions && addressSuggestions.length > 0 && (
                                                        <div className="pil-custom-suggestions">
                                                            {addressSuggestions.map((s, i) => (
                                                                <div 
                                                                    key={i} 
                                                                    className="pil-suggestion-item"
                                                                    onClick={() => handleSelectSuggestion(s)}
                                                                >
                                                                    <div className="pil-suggestion-icon">
                                                                        <MapPin size={14} className="text-blue-500" />
                                                                    </div>
                                                                    <div className="flex flex-col overflow-hidden">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-bold text-slate-800 text-sm truncate">{s.name}</span>
                                                                            {s.category && s.category !== 'address' && (
                                                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-medium capitalize">
                                                                                    {s.category.replace(/_/g, ' ')}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <span className="text-[11px] text-slate-500 truncate mt-0.5">
                                                                            {s.sublabel || s.label}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {showSuggestions && addressSuggestions.length === 0 && !searchingAddress && formData.address.length > 2 && (
                                                        <div className="pil-custom-suggestions p-4 text-sm text-slate-500 text-center">
                                                            No matches found.
                                                        </div>
                                                    )}
                                                </div>
                                                {errors.address && <div className="pil-field-error">⚠ {errors.address}</div>}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="pil-btn-submit mt-4"
                                        disabled={loading}
                                    >
                                        {loading ? <><span className="pil-btn-spinner"></span>Processing...</> : <>Next Step <ChevronRight className="inline-block ml-1" size={18} /></>}
                                    </button>

                                    <div className="pil-register-row mt-4">
                                        Already have an account?&nbsp;
                                        <a href="/login" className="text-blue-600 hover:underline">Sign in</a>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <>
                                {/* OTP Step */}
                                <div className="pil-card-title">
                                    <div className="pil-auth-icon-wrap mb-4">
                                        <ShieldCheck size={32} />
                                    </div>
                                    <h1 className="text-2xl font-bold text-slate-900">Verify Email</h1>
                                    <p className="text-slate-500 text-sm mt-2">
                                        Enter the 6-digit code sent to your email.
                                    </p>
                                </div>

                                <form onSubmit={handleVerifyOtp} className="mt-8 space-y-6 text-center">
                                    <div className="pil-field-group text-left">
                                        <label className="pil-field-label text-center">Verification Code</label>
                                        <div className="pil-field-wrap flex justify-center">
                                            <input
                                                type="text"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").substring(0, 6))}
                                                placeholder="000000"
                                                className="pil-field-input text-center text-3xl tracking-[0.5rem] font-bold h-16 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl w-full"
                                                autoFocus
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 mt-4 text-center">
                                            Code expires in 15 minutes.
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        className="pil-btn-submit"
                                        disabled={loading || otp.length < 6}
                                    >
                                        {loading ? <><span className="pil-btn-spinner"></span>Verifying...</> : "Verify & Complete"}
                                    </button>

                                    <div className="text-sm text-slate-500">
                                        Didn't receive the code?&nbsp;
                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            className="text-blue-600 font-bold hover:underline"
                                            disabled={loading}
                                        >
                                            Resend OTP
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default VendorRegister;
