import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API, postData } from "../../Helpers/api";
import Validator from "../../Helpers/validators.js";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import securelogin from "../../Images/secure-login.png";
import pidilitelogo from "../../Images/PIL.png";
import { Eye, EyeOff, Mail, Lock, QrCode } from "lucide-react";
import "../../Components/Website/LoginPage.css";

const QrLoginComponent = () => {
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(window.location.search);
  const isAppMode = queryParams.get('mode') === 'app';

  const [userData, setUserdata] = useState({ email: "", password: "", rememberMe: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);

  const rules = {
    email: { required: true, type: "string", errorMessage: "Email is required." },
    password: { required: true, type: "string", errorMessage: "Password is required." },
  };
  const validator = new Validator(rules);

  const validateFormField = async (name, value) => {
    return await validator.validate({ [name]: value }, { [name]: rules[name] });
  };

  const validateform = async (formData) => {
    const validationErrors = await validator.validate(formData, rules);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return true; }
    setErrors({});
    return false;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserdata({ ...userData, [name]: type === "checkbox" ? checked : value });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleBlur = async (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    const fieldErrors = await validateFormField(name, value);
    setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const hasErrors = await validateform(userData);
    if (hasErrors) { setLoading(false); return; }
    await sendData(userData);
    setLoading(false);
  };

  const sendData = async (formData) => {
    try {
      const response = await postData(API.auth.qrLogin, formData);
      const token = response?.accessToken || response?.token;
      if (token) {
        localStorage.setItem("qr_access_token", token);
        if (response?.location) localStorage.setItem("qr_location", response.location);
        if (formData.rememberMe) {
          localStorage.setItem("qr_email", formData.email);
          localStorage.setItem("qr_password", formData.password);
        } else {
          localStorage.removeItem("qr_email");
          localStorage.removeItem("qr_password");
        }
        navigate(`/qr${window.location.search}`);
      } else {
        toast.error(response?.message || "Login failed");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem("qr_email");
    const savedPassword = localStorage.getItem("qr_password");
    if (savedEmail && savedPassword) {
      setUserdata({ email: savedEmail, password: savedPassword, rememberMe: true });
    }
    const accessToken = localStorage.getItem("qr_access_token");
    if (accessToken) navigate(`/qr${window.location.search}`);
  }, [navigate]);

  return (
    <>
      <div className={`pil-login-root ${isAppMode ? 'is-app-mode' : ''}`}>
        <div className="pil-login-layout">

          {/* ── LEFT PANEL ── */}
          {!isAppMode && (
            <div className="pil-login-left">
              <div className="pil-left-content">
                <div className="pil-left-badge">
                  <span></span>
                  QR Attendance System
                </div>
                <img
                  src={securelogin}
                  alt="QR Login illustration"
                  className="pil-left-illustration"
                />
                <h2 className="pil-left-headline">
                  Touchless <span>Check-In</span> Experience
                </h2>
                <p className="pil-left-sub">
                  Sign in once to activate QR-based attendance for your location. Fast, secure, and contactless.
                </p>
                <div className="pil-left-stats">
                  <div className="pil-stat">
                    <div className="pil-stat-number">&lt;2s</div>
                    <div className="pil-stat-label">Scan Time</div>
                  </div>
                  <div className="pil-stat">
                    <div className="pil-stat-number">Auto</div>
                    <div className="pil-stat-label">Refresh</div>
                  </div>
                  <div className="pil-stat">
                    <div className="pil-stat-number">Offline</div>
                    <div className="pil-stat-label">Ready</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── RIGHT PANEL ── */}
          <div className="pil-login-right">
            <div className="pil-card">

              {/* Logo */}
              <div className="pil-card-logo">
                <img src={pidilitelogo} alt="PIL Logo" />
              </div>

              {/* QR badge */}
              <div className="pil-qr-badge">
                <QrCode size={20} />
                QR Station Login — Admin, HR or Manager Access Required
              </div>

              {/* Title */}
              <div className="pil-card-title">
                <h1>QR Login</h1>
                <p>Authenticate to activate QR attendance for this device</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate>

                {/* Email */}
                <div className="pil-field-group">
                  <label className="pil-field-label" htmlFor="qr-email">Email Address</label>
                  <div className="pil-field-wrap">
                    <span className="pil-field-icon"><Mail size={16} /></span>
                    <input
                      id="qr-email"
                      type="text"
                      name="email"
                      value={userData.email}
                      placeholder="admin@company.com"
                      autoComplete="email"
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`pil-field-input${errors.email ? " pil-has-error" : ""}`}
                    />
                  </div>
                  {errors.email && <div className="pil-field-error">⚠ {errors.email}</div>}
                </div>

                {/* Password */}
                <div className="pil-field-group">
                  <label className="pil-field-label" htmlFor="qr-password">Password</label>
                  <div className="pil-field-wrap">
                    <span className="pil-field-icon"><Lock size={16} /></span>
                    <input
                      id="qr-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={userData.password}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`pil-field-input${errors.password ? " pil-has-error" : ""}`}
                    />
                    <button
                      type="button"
                      className="pil-pw-toggle"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <div className="pil-field-error">⚠ {errors.password}</div>}
                </div>

                {/* Remember Me */}
                <div className="pil-row-rf">
                  <label className="pil-remember">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={userData.rememberMe}
                      onChange={handleInputChange}
                    />
                    Remember this device
                  </label>
                </div>

                {/* Submit */}
                <button
                  id="qr-login-submit-btn"
                  type="submit"
                  className="pil-btn-submit"
                  disabled={loading}
                >
                  {loading
                    ? <><span className="pil-btn-spinner"></span>Authenticating…</>
                    : "Activate QR Station"}
                </button>

              </form>
            </div>
          </div>

        </div>
      </div>

      {loading && (
        <div className="pil-loader-overlay">
          <div className="pil-loader-ring"></div>
        </div>
      )}
    </>
  );
};

export default QrLoginComponent;
