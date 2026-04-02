import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { API } from "../Helpers/api.js";
import Validator from "../Helpers/validators.js";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import securelogin from "../Images/secure-login.png";
import pidilitelogo from "../Images/PIL.png";
import { useUser } from "../Helpers/Context/UserContext.js";
import { Eye, EyeOff, Mail, Lock, ShieldCheck } from "lucide-react";
import "../Components/Website/LoginPage.css";

const LoginComponent = () => {
  const { setUser } = useUser();
  const navigate = useNavigate();

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
    setErrors(validationErrors);
    return Object.keys(validationErrors).length > 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserdata({ ...userData, [name]: type === "checkbox" ? checked : value });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleBlur = async (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldErrors = await validateFormField(name, value);
    setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
  };

  const encodeData = (data) => btoa(JSON.stringify(data));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const hasErrors = await validateform(userData);
      if (hasErrors) { setLoading(false); return; }
      await sendData(userData);
    } catch (error) {
      toast.error(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const sendData = async (formData) => {
    try {
      const result = await API.login(formData);
      const user = result.data;
      if (user?.accessToken && user?.refreshToken) {
        const { accessToken, refreshToken, ...userInfo } = user;
        localStorage.setItem("accesstoken", accessToken);
        localStorage.setItem("refreshtoken", refreshToken);
        Cookies.set("accesstoken", accessToken);
        Cookies.set("refreshtoken", refreshToken);
        const fullName = `${userInfo.firstName || ""} ${userInfo.lastName || ""}`.trim();
        if (fullName) { localStorage.setItem("user_fullname", fullName); userInfo.fullname = fullName; }
        Cookies.set("userdetail", encodeData(userInfo));
        if (formData.rememberMe) {
          localStorage.setItem("email", formData.email);
          localStorage.setItem("password", formData.password);
        } else {
          localStorage.removeItem("email");
          localStorage.removeItem("password");
        }
        setUser(userInfo);
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        toast.error("Login failed: Tokens are missing in response.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "An error occurred. Please try again.");
    }
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem("email");
    const savedPassword = localStorage.getItem("password");
    if (savedEmail && savedPassword) {
      setUserdata((prev) => ({ ...prev, email: savedEmail, password: savedPassword, rememberMe: true }));
    }
    const accessToken = localStorage.getItem("accesstoken") || Cookies.get("accesstoken");
    if (accessToken) navigate("/dashboard");
  }, [navigate]);

  return (
    <>
      <div className="pil-login-root">
        <div className="pil-login-layout">

          {/* ── LEFT PANEL ── */}
          <div className="pil-login-left">
            <div className="pil-left-content">
              <div className="pil-left-badge">
                <span></span>
                Secure Enterprise Portal
              </div>
              <img
                src={securelogin}
                alt="Secure login illustration"
                className="pil-left-illustration"
              />
              <h2 className="pil-left-headline">
                Smart <span>Workforce</span> Management
              </h2>
              <p className="pil-left-sub">
                Track attendance, manage teams, and monitor productivity — all in one powerful platform.
              </p>
              <div className="pil-left-stats">
                <div className="pil-stat">
                  <div className="pil-stat-number">99.9%</div>
                  <div className="pil-stat-label">Uptime</div>
                </div>
                <div className="pil-stat">
                  <div className="pil-stat-number">10k+</div>
                  <div className="pil-stat-label">Employees</div>
                </div>
                <div className="pil-stat">
                  <div className="pil-stat-number">256-bit</div>
                  <div className="pil-stat-label">Encryption</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="pil-login-right">
            <div className="pil-card">

              {/* Logo */}
              <div className="pil-card-logo">
                <img src={pidilitelogo} alt="PIL Logo" />
              </div>

              {/* Title */}
              <div className="pil-card-title">
                <h1>Welcome Back</h1>
                <p>Sign in to your account to continue</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate>

                {/* Email */}
                <div className="pil-field-group">
                  <label className="pil-field-label" htmlFor="login-email">Email Address</label>
                  <div className="pil-field-wrap">
                    <span className="pil-field-icon"><Mail size={16} /></span>
                    <input
                      id="login-email"
                      type="text"
                      name="email"
                      value={userData.email}
                      autoComplete="email"
                      placeholder="you@company.com"
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`pil-field-input${errors.email ? " pil-has-error" : ""}`}
                    />
                  </div>
                  {errors.email && <div className="pil-field-error">⚠ {errors.email}</div>}
                </div>

                {/* Password */}
                <div className="pil-field-group">
                  <label className="pil-field-label" htmlFor="login-password">Password</label>
                  <div className="pil-field-wrap">
                    <span className="pil-field-icon"><Lock size={16} /></span>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={userData.password}
                      autoComplete="current-password"
                      placeholder="••••••••"
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

                {/* Remember Me + Forgot Password */}
                <div className="pil-row-rf">
                  <label className="pil-remember">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={userData.rememberMe}
                      onChange={handleInputChange}
                    />
                    Remember me
                  </label>
                  <a href="/forgotpassword" className="pil-forgot">Forgot Password?</a>
                </div>

                {/* Submit */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  className="pil-btn-submit"
                  disabled={loading}
                >
                  {loading ? <><span className="pil-btn-spinner"></span>Signing in…</> : "Sign In"}
                </button>

                {/* Divider */}
                <div className="pil-divider">OR</div>

                {/* Register */}
                <div className="pil-register-row">
                  Don't have an account?&nbsp;
                  <a href="/register">Create one</a>
                </div>

              </form>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default LoginComponent;
