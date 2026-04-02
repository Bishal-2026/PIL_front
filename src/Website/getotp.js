import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API, postData } from "../Helpers/api.js";
import { toast } from "react-toastify";
import pidilitelogo from "../Images/PIL.png";
import { KeyRound, ArrowRight, ShieldCheck } from "lucide-react";
import "../Components/Website/LoginPage.css";

const GetOtp = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const email = sessionStorage.getItem("resetEmail") || "";

  useEffect(() => {
    if (!email) navigate("/forgotpassword");
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!otp.trim()) { setError("OTP is required."); return; }

    setLoading(true);
    try {
      const result = await postData(API.auth.verifyOtp, { email, otp: otp.trim() });
      if (result && result.status === true) {
        toast.success(result.message || "OTP verified.");
        navigate("/resetpassword");
      } else {
        const msg = result.message || "Invalid OTP. Please try again.";
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = "An error occurred. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

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

          <h1 className="pil-auth-title">Verify OTP</h1>
          <p className="pil-auth-subtitle">
            Enter the 6-digit OTP sent to <strong style={{ color: "#7ec8ff" }}>{email}</strong>
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="pil-field-group">
              <label className="pil-field-label" htmlFor="otp-input">One-Time Password</label>
              <div className="pil-field-wrap">
                <span className="pil-field-icon"><KeyRound size={16} /></span>
                <input
                  id="otp-input"
                  type="text"
                  name="otp"
                  value={otp}
                  autoComplete="one-time-code"
                  placeholder="_ _ _ _ _ _"
                  maxLength={6}
                  onChange={(e) => { setOtp(e.target.value); if (error) setError(""); }}
                  className={`pil-field-input pil-otp-input${error ? " pil-has-error" : ""}`}
                />
              </div>
              {error && <div className="pil-field-error">⚠ {error}</div>}
            </div>

            <button
              id="verify-otp-btn"
              type="submit"
              className="pil-btn-submit"
              disabled={loading}
            >
              {loading
                ? <><span className="pil-btn-spinner"></span>Verifying…</>
                : <><ArrowRight size={16} style={{ marginRight: 8, verticalAlign: "middle" }} />Verify OTP</>}
            </button>
          </form>

          <div className="pil-auth-back-link">
            <a href="/forgotpassword">← Resend OTP</a>
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

export default GetOtp;
