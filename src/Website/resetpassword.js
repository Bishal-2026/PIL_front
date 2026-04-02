import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API, postData } from "../Helpers/api.js";
import { toast } from "react-toastify";
import pidilitelogo from "../Images/PIL.png";
import { Eye, EyeOff, Lock, ShieldCheck, CheckCircle } from "lucide-react";
import "../Components/Website/LoginPage.css";

const ResetPassword = () => {
  const navigate = useNavigate();
  const email = sessionStorage.getItem("resetEmail") || "";

  const [formData, setFormData] = useState({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!email) navigate("/forgotpassword");
  }, [email, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "confirmPassword" && updated.newPassword === value)
        setErrors((prevErr) => ({ ...prevErr, confirmPassword: "" }));
      if (name === "newPassword" && updated.confirmPassword && updated.confirmPassword === value)
        setErrors((prevErr) => ({ ...prevErr, confirmPassword: "" }));
      return updated;
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const err = {};
    if (!formData.newPassword) err.newPassword = "New password is required";
    else if (formData.newPassword.length < 6) err.newPassword = "Minimum 6 characters required";
    if (!formData.confirmPassword) err.confirmPassword = "Confirm password is required";
    else if (formData.confirmPassword !== formData.newPassword) err.confirmPassword = "Passwords do not match";
    return err;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setLoading(true);
    try {
      const res = await postData(API.auth.resetPassword, { email, newPassword: formData.newPassword });
      if (res?.status) {
        toast.success(res.message || "Password reset successful");
        sessionStorage.removeItem("resetEmail");
        navigate("/login", { replace: true });
      } else {
        setMessage(res?.message || "Reset failed");
      }
    } catch {
      setMessage("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = formData.newPassword;
    if (!p) return null;
    if (p.length < 6) return { label: "Weak", color: "#ff6b6b", width: "30%" };
    if (p.length < 10) return { label: "Fair", color: "#ffa94d", width: "60%" };
    return { label: "Strong", color: "#43e97b", width: "100%" };
  };
  const strength = passwordStrength();

  return (
    <div className="pil-auth-page">
      <div className="pil-auth-bg" />

      <div className="pil-auth-container">
        {/* Card */}
        <div className="pil-auth-card">
          {/* Logo */}
          <div className="pil-auth-logo">
            <img src={pidilitelogo} alt="PIL Logo" />
          </div>

          <h1 className="pil-auth-title">Reset Password</h1>
          <p className="pil-auth-subtitle">Create a strong new password for your account</p>

          <form onSubmit={handleSubmit} noValidate>

            {/* New Password */}
            <div className="pil-field-group">
              <label className="pil-field-label" htmlFor="new-password">New Password</label>
              <div className="pil-field-wrap">
                <span className="pil-field-icon"><Lock size={16} /></span>
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  placeholder="Min. 6 characters"
                  onChange={handleChange}
                  className={`pil-field-input${errors.newPassword ? " pil-has-error" : ""}`}
                />
                <button
                  type="button"
                  className="pil-pw-toggle"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength bar */}
              {strength && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: strength.width, background: strength.color, borderRadius: 4, transition: "width 0.3s" }} />
                  </div>
                  <span style={{ fontSize: "0.75rem", color: strength.color, marginTop: 3, display: "block" }}>{strength.label}</span>
                </div>
              )}
              {errors.newPassword && <div className="pil-field-error">⚠ {errors.newPassword}</div>}
            </div>

            {/* Confirm Password */}
            <div className="pil-field-group">
              <label className="pil-field-label" htmlFor="confirm-password">Confirm Password</label>
              <div className="pil-field-wrap">
                <span className="pil-field-icon"><Lock size={16} /></span>
                <input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  placeholder="Re-enter your password"
                  onChange={handleChange}
                  className={`pil-field-input${errors.confirmPassword ? " pil-has-error" : ""}`}
                />
                <button
                  type="button"
                  className="pil-pw-toggle"
                  tabIndex={-1}
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {/* Match tick */}
                {formData.confirmPassword && formData.confirmPassword === formData.newPassword && (
                  <span style={{ position: "absolute", right: 40, top: "50%", transform: "translateY(-50%)", color: "#43e97b" }}>
                    <CheckCircle size={16} />
                  </span>
                )}
              </div>
              {errors.confirmPassword && <div className="pil-field-error">⚠ {errors.confirmPassword}</div>}
            </div>

            <button
              id="reset-password-btn"
              type="submit"
              className="pil-btn-submit"
              disabled={loading}
            >
              {loading
                ? <><span className="pil-btn-spinner"></span>Resetting…</>
                : "Reset Password"}
            </button>

            {message && <div className="pil-auth-message">{message}</div>}
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

export default ResetPassword;
