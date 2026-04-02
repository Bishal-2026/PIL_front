import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API, postData } from "../Helpers/api.js";
import { toast } from "react-toastify";
import pidilitelogo from "../Images/PIL.png";
import { Mail, ArrowRight, ShieldCheck } from "lucide-react";
import "../Components/Website/LoginPage.css";

const ForgotPassword = () => {
  const [userData, setUserdata] = useState({ email: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    if (!email) return "Email is required.";
    if (!/\S+@\S+\.\S+/.test(email)) return "Email is invalid.";
    return null;
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    if (name === "email") {
      const emailError = validateEmail(userData.email);
      setErrors({ ...errors, email: emailError });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserdata({ ...userData, [name]: value });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailError = validateEmail(userData.email);
    if (emailError) { setErrors({ email: emailError }); return; }

    setLoading(true);
    try {
      const result = await postData(API.auth.forgotPassword, { email: userData.email });
      if (result && result.status === true) {
        toast.success(result.message || "OTP sent successfully.");
        sessionStorage.setItem("resetEmail", userData.email);
        navigate("/getotp");
      } else {
        toast.error(result.message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pil-auth-page">
      {/* Background */}
      <div className="pil-auth-bg" />

      <div className="pil-auth-container">
        {/* Card */}
        <div className="pil-auth-card">
          {/* Logo */}
          <div className="pil-auth-logo">
            <img src={pidilitelogo} alt="PIL Logo" />
          </div>

          <h1 className="pil-auth-title">Forgot Password?</h1>
          <p className="pil-auth-subtitle">
            Enter your registered email and we'll send you a one-time password to reset your account.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="pil-field-group">
              <label className="pil-field-label" htmlFor="forgot-email">Email Address</label>
              <div className="pil-field-wrap">
                <span className="pil-field-icon"><Mail size={16} /></span>
                <input
                  id="forgot-email"
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

            <button
              id="forgot-otp-btn"
              type="submit"
              className="pil-btn-submit"
              disabled={loading}
            >
              {loading
                ? <><span className="pil-btn-spinner"></span>Sending OTP…</>
                : <><ArrowRight size={16} style={{ marginRight: 8, verticalAlign: "middle" }} />Send OTP</>}
            </button>
          </form>

          <div className="pil-auth-back-link">
            <a href="/login">← Back to Sign In</a>
          </div>
        </div>

        <div className="pil-auth-footer">
          <ShieldCheck size={14} />
          Secured with 256-bit encryption
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
