import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import QRCode from "qrcode";
import CryptoJS from "crypto-js";
import { domainpath } from "../../Helpers/api.js";
import "../../Styles/qrpage.css";
import logo from "../../Images/PIL.png";

const QrCard = ({
  title,
  subtitle,
  imageSrc,
  expiresAt,
  remainingSeconds,
  loading,
  onTitleClick,
}) => (
  <div className="qr-app-card">
    <div className="qr-app-card-head">
      <img src={logo} alt="Pidilite" className="qr-app-logo" />
      {onTitleClick ? (
        <button
          type="button"
          className="qr-app-title-button"
          onClick={onTitleClick}
        >
          {title}
        </button>
      ) : (
        <h3 className="qr-app-card-title">{title}</h3>
      )}
      <p className="qr-app-card-subtitle">{subtitle}</p>
      <span className={`qr-app-pill ${loading ? "is-loading" : ""}`}>
        {loading ? "Refreshing..." : "Auto refresh on expiry"}
      </span>
    </div>

    <div className="qr-app-frame">
      {imageSrc ? (
        <img src={imageSrc} alt={`${title} QR`} className="qr-app-image" />
      ) : (
        <span className="qr-app-empty">No QR generated</span>
      )}
    </div>

    <div className="qr-app-meta">
      <div className="qr-app-meta-item">
        <span className="qr-app-meta-label">Expires</span>
        <span className="qr-app-meta-value">
          {expiresAt ? new Date(expiresAt).toLocaleString() : "—"}
        </span>
      </div>
      <div className="qr-app-meta-item">
        <span className="qr-app-meta-label">Time left</span>
        <span className="qr-app-meta-value">
          {remainingSeconds !== null ? `${Math.max(0, remainingSeconds)}s` : "—"}
        </span>
      </div>
    </div>
  </div>
);

const QrPage = ({ singleAction = null }) => {
  const queryParams = new URLSearchParams(window.location.search);
  const isAppMode = queryParams.get('mode') === 'app';

  const [loginState, setLoginState] = useState({
    token: "",
    imageSrc: "",
    expiresAt: null,
    loading: false,
  });
  const [logoutState, setLogoutState] = useState({
    token: "",
    imageSrc: "",
    expiresAt: null,
    loading: false,
  });
  const [loginRemaining, setLoginRemaining] = useState(null);
  const [logoutRemaining, setLogoutRemaining] = useState(null);
  const navigate = useNavigate();

  const isLoginOnly = singleAction === "login";
  const isLogoutOnly = singleAction === "logout";

  const loginRefreshRef = useRef(null);
  const logoutRefreshRef = useRef(null);
  const loginStatusRef = useRef(null);
  const logoutStatusRef = useRef(null);
  const loginTimerRef = useRef(null);
  const logoutTimerRef = useRef(null);

  const clearTimer = (ref) => {
    if (ref.current) {
      clearTimeout(ref.current);
      ref.current = null;
    }
  };

  const clearIntervalRef = (ref) => {
    if (ref.current) {
      clearInterval(ref.current);
      ref.current = null;
    }
  };

  const revokeImage = (src) => {
    if (src) {
      URL.revokeObjectURL(src);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("qr_access_token");
    if (!token) {
      navigate(`/qr-login${window.location.search}`);
      return;
    }

    // Fetch offline secret if we don't have it
    const fetchOfflineSecret = async () => {
      try {
        if (!localStorage.getItem("qr_offline_secret") || !localStorage.getItem("qr_location")) {
          const response = await axios.get(`${domainpath}/qr/offline-secret`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data?.offlineSecret) {
            localStorage.setItem("qr_offline_secret", response.data.offlineSecret);
            localStorage.setItem("qr_location", response.data.location);
          }
        }
      } catch (err) {
        console.error("Failed to fetch offline secret", err);
      }
    };
    fetchOfflineSecret();
  }, [navigate]);

  const handleQrLogout = () => {
    localStorage.removeItem("qr_access_token");
    navigate(`/qr-login${window.location.search}`);
  };

  const generateOfflineJwt = useCallback((action) => {
    const secret = localStorage.getItem("qr_offline_secret");
    const location = localStorage.getItem("qr_location");

    if (!secret || !location) return null;

    const header = { alg: "HS256", typ: "JWT" };

    // Create random UUID-like string for jti
    const jti = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

    // No static expiration on backend, valid until action occurs
    const iat = Math.floor(Date.now() / 1000);

    const payload = {
      jti,
      action,
      location,
      iat
    };

    const base64UrlEncode = (obj) => {
      const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
      const enc = CryptoJS.enc.Utf8.parse(str);
      const base64 = CryptoJS.enc.Base64.stringify(enc);
      return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };

    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payload);

    const signature = CryptoJS.HmacSHA256(`${encodedHeader}.${encodedPayload}`, secret);
    const encodedSignature = CryptoJS.enc.Base64.stringify(signature)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  }, []);

  const fetchQrPng = useCallback(
    async (action, setState) => {
      setState((prev) => ({ ...prev, loading: true }));
      let token = "";
      let expiresAt = null;
      let isOffline = false;

      try {
        const accessToken = localStorage.getItem("qr_access_token");
        const response = await axios.post(
          `${domainpath}/qr/generate`,
          { action },
          {
            headers: {
              Authorization: accessToken ? `Bearer ${accessToken}` : "",
            },
            timeout: 5000 // Quick timeout so we fallback faster if offline
          }
        );

        token = response?.data?.token || "";
        expiresAt = response?.data?.expiresAt || null;
      } catch (error) {
        // Network error or timeout, try offline generation
        token = generateOfflineJwt(action);
        if (token) {
          // Force a 45-second refresh on the frontend
          expiresAt = new Date(Date.now() + 45 * 1000).toISOString();
          isOffline = true;
        }
      }

      if (token) {
        try {
          const imageSrc = await QRCode.toDataURL(token, {
            width: 360,
            margin: 2,
            color: {
              dark: "#0f172a",
              light: "#ffffff",
            },
          });

          setState((prev) => {
            return {
              token,
              imageSrc,
              expiresAt,
              loading: false,
              isOffline
            };
          });
        } catch (err) {
          setState((prev) => ({ ...prev, loading: false }));
        }
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    },
    [generateOfflineJwt]
  );

  const scheduleRefresh = useCallback((expiresAt, action) => {
    if (!expiresAt) return;
    const expiresMs = new Date(expiresAt).getTime() - Date.now();
    if (!Number.isFinite(expiresMs) || expiresMs <= 0) return;

    const timeout = setTimeout(() => {
      if (action === "login") {
        fetchQrPng("login", setLoginState);
      } else {
        fetchQrPng("logout", setLogoutState);
      }
    }, expiresMs + 500);

    if (action === "login") {
      clearTimer(loginRefreshRef);
      loginRefreshRef.current = timeout;
    } else {
      clearTimer(logoutRefreshRef);
      logoutRefreshRef.current = timeout;
    }
  }, [fetchQrPng]);

  const startCountdown = useCallback((expiresAt, action) => {
    if (!expiresAt) return;
    const endTime = new Date(expiresAt).getTime();
    const update = () => {
      const secondsLeft = Math.ceil((endTime - Date.now()) / 1000);
      if (action === "login") {
        setLoginRemaining(secondsLeft > 0 ? secondsLeft : 0);
      } else {
        setLogoutRemaining(secondsLeft > 0 ? secondsLeft : 0);
      }
      if (secondsLeft <= 0) {
        clearIntervalRef(action === "login" ? loginTimerRef : logoutTimerRef);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    if (action === "login") {
      clearIntervalRef(loginTimerRef);
      loginTimerRef.current = interval;
    } else {
      clearIntervalRef(logoutTimerRef);
      logoutTimerRef.current = interval;
    }
  }, []);

  useEffect(() => {
    if (!isLogoutOnly) {
      fetchQrPng("login", setLoginState);
    }
    if (!isLoginOnly) {
      fetchQrPng("logout", setLogoutState);
    }
    return () => {
      clearTimer(loginRefreshRef);
      clearTimer(logoutRefreshRef);
      clearIntervalRef(loginStatusRef);
      clearIntervalRef(logoutStatusRef);
      clearIntervalRef(loginTimerRef);
      clearIntervalRef(logoutTimerRef);
    };
  }, [fetchQrPng, isLoginOnly, isLogoutOnly]);

  useEffect(() => {
    if (isLogoutOnly) return;
    if (loginState.expiresAt) {
      scheduleRefresh(loginState.expiresAt, "login");
      startCountdown(loginState.expiresAt, "login");
    }
    // Status polling removed; local expiry timer handles refresh.
  }, [
    loginState.expiresAt,
    loginState.token,
    scheduleRefresh,
    startCountdown,
    isLogoutOnly,
  ]);

  useEffect(() => {
    if (isLoginOnly) return;
    if (logoutState.expiresAt) {
      scheduleRefresh(logoutState.expiresAt, "logout");
      startCountdown(logoutState.expiresAt, "logout");
    }
    // Status polling removed; local expiry timer handles refresh.
  }, [
    logoutState.expiresAt,
    logoutState.token,
    scheduleRefresh,
    startCountdown,
    isLoginOnly,
  ]);

  const headerTitle = isLoginOnly
    ? "Login QR"
    : isLogoutOnly
      ? "Logout QR"
      : "QR Login / Logout";
  const headerSubtitle = isLoginOnly || isLogoutOnly
    ? "One QR per action. Auto-generates offline if network is unavailable."
    : "One QR per action. Auto-generates offline if network is unavailable.";

  return (
    <div className="qr-app-page">
      <div className="qr-app-shell">
        {!singleAction && !isAppMode && (
          <div className="qr-app-header">
            <img src={logo} alt="Pidilite" className="qr-app-logo-main" />
            <h1 className="qr-app-title">{headerTitle}</h1>
            <p className="qr-app-subtitle">{headerSubtitle}</p>
            <div className="qr-app-actions">
              <button
                className="qr-app-btn qr-app-btn--ghost"
                type="button"
                onClick={() => navigate("/")}
              >
                Back to Home
              </button>
              <button
                className="qr-app-btn qr-app-btn--dark"
                type="button"
                onClick={handleQrLogout}
              >
                Logout
              </button>
            </div>
          </div>
        )}

        <div className={`qr-app-grid ${singleAction ? "is-single" : ""}`}>
          {!isLogoutOnly && (
            <QrCard
              title="Login QR"
              subtitle="Scan the QR to log in securely."
              imageSrc={loginState.imageSrc}
              expiresAt={loginState.expiresAt}
              loading={loginState.loading}
              remainingSeconds={loginRemaining}
              onTitleClick={
                isLoginOnly ? undefined : () => navigate(`/LoginQr${window.location.search}`)
              }
            />
          )}
          {!isLoginOnly && (
            <QrCard
              title="Logout QR"
              subtitle="Scan the QR to log out securely."
              imageSrc={logoutState.imageSrc}
              expiresAt={logoutState.expiresAt}
              loading={logoutState.loading}
              remainingSeconds={logoutRemaining}
              onTitleClick={
                isLogoutOnly ? undefined : () => navigate(`/LogoutQr${window.location.search}`)
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default QrPage;
