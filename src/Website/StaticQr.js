import React from "react";
import "./StaticQr.css";

const StaticQr = () => {
  const apiBase = process.env.REACT_APP_API_DOMAIN_ENDPOINT || "";
  const loginQr = `${apiBase}/qr/static-png?type=login&size=640`;
  const logoutQr = `${apiBase}/qr/static-png?type=logout&size=640`;

  return (
    <div className="static-qr-page">
      <header className="static-qr-hero">
        <div className="static-qr-hero-inner">
          <p className="static-qr-eyebrow">Pidilite</p>
          <h1>Static QR Access</h1>
          <p className="static-qr-lede">
            Permanent login/logout QR codes for testing. No login required to
            open this page.
          </p>
        </div>
      </header>

      <main className="static-qr-content">
        <section className="static-qr-card">
          <div className="static-qr-card-header">
            <h2>Login QR</h2>
            <p>Scan to log in from any location.</p>
          </div>
          <div className="static-qr-frame">
            <img src={loginQr} alt="Login QR code" />
          </div>
          <a className="static-qr-link" href={loginQr} target="_blank" rel="noreferrer">
            Open full size
          </a>
        </section>

        <section className="static-qr-card">
          <div className="static-qr-card-header">
            <h2>Logout QR</h2>
            <p>Scan to log out from any location.</p>
          </div>
          <div className="static-qr-frame">
            <img src={logoutQr} alt="Logout QR code" />
          </div>
          <a className="static-qr-link" href={logoutQr} target="_blank" rel="noreferrer">
            Open full size
          </a>
        </section>
      </main>
    </div>
  );
};

export default StaticQr;
