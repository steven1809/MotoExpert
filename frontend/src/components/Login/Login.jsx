import React, { Component } from "react";
import { AuthContext } from '../../context/AuthContext';
import GoogleLoginButton from '../GoogleLoginButton';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@300;400;500;600&display=swap');

  .mxp-login-root {
    min-height: 100vh;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Barlow', sans-serif;
    overflow: hidden;
    position: relative;
    z-index: 100;
  }

  /* ── Background scene is hidden to see landing ── */
  .scene {
    display: none;
  }

  .back-to-landing {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 110;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 10px 20px;
    border-radius: 50px;
    font-weight: 700;
    text-transform: uppercase;
    font-family: 'Barlow Condensed', sans-serif;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .back-to-landing:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateX(-5px);
  }

  .card {
    position: relative; z-index: 10;
    width: 480px;
    min-height: 500px;
    display: flex;
    flex-direction: column;
    border-radius: 32px;
    overflow: hidden;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    animation: card-in 0.8s cubic-bezier(0.16,1,0.3,1) both;
  }

  @keyframes card-in {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .brand-header {
    padding: 40px 40px 20px;
    text-align: center;
  }

  .brand-logo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .brand-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 32px; font-weight: 900;
    color: #fff;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .brand-name span { color: #00d4ff; }

  .form-panel {
    flex: 1;
    padding: 0 40px 40px;
    display: flex;
    flex-direction: column;
  }

  .tabs {
    display: flex; gap: 0; margin-bottom: 30px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .tab {
    background: none; border: none; cursor: pointer;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 17px; font-weight: 700;
    color: rgba(255,255,255,0.3);
    padding: 10px 28px 14px;
    text-transform: uppercase; letter-spacing: 1px;
    position: relative;
    transition: color 0.3s;
  }
  .tab.active { color: rgba(255,255,255,0.9); }
  .tab.active::after {
    content: '';
    position: absolute; bottom: -1px; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(120,220,255,0.8), transparent);
    border-radius: 2px;
  }

  .form-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 26px; font-weight: 800;
    color: rgba(255,255,255,0.92);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px; line-height: 1;
  }
  .form-sub {
    font-size: 13px; color: rgba(255,255,255,0.35);
    margin-bottom: 24px;
  }

  /* ── LIQUID GLASS INPUTS ── */
  .field {
    position: relative; margin-bottom: 12px;
  }
  .field svg {
    position: absolute; left: 14px; top: 50%;
    transform: translateY(-50%);
    color: rgba(255,255,255,0.35);
    width: 16px; height: 16px;
    pointer-events: none;
  }
  .field input {
    width: 100%;
    padding: 12px 14px 12px 40px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 12px;
    font-size: 14px; color: rgba(255,255,255,0.9);
    font-family: 'Barlow', sans-serif;
    outline: none;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 1px 0 rgba(255,255,255,0.08) inset;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }
  .field input::placeholder { color: rgba(255,255,255,0.3); }
  .field input:focus {
    border-color: rgba(120,220,255,0.5);
    background: rgba(255,255,255,0.1);
    box-shadow: 0 0 0 3px rgba(0,212,255,0.1), 0 1px 0 rgba(255,255,255,0.12) inset;
  }

  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  .forgot {
    text-align: right; margin: -4px 0 18px;
  }
  .forgot button {
    background: none; border: none; cursor: pointer;
    font-size: 12px; color: rgba(120,220,255,0.7);
    font-family: 'Barlow', sans-serif;
  }
  .forgot button:hover { color: rgba(120,220,255,1); }

  .check-row {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 16px;
  }
  .check-row input[type="checkbox"] {
    accent-color: rgba(0,212,255,0.8);
    margin-top: 2px;
  }
  .check-row button {
    background: none; border: none; cursor: pointer;
    color: rgba(120,220,255,0.8); font-size: 13px;
  }

  /* ── LIQUID GLASS PRIMARY BUTTON ── */
  .btn-primary {
    width: 100%; padding: 13px;
    background: rgba(0, 180, 220, 0.25);
    border: 1px solid rgba(0, 212, 255, 0.4);
    border-radius: 12px;
    color: rgba(255,255,255,0.95);
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 17px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 2px;
    cursor: pointer;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.2) inset,
      0 4px 16px rgba(0,180,220,0.2);
    transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  }
  .btn-primary:hover:not(:disabled) {
    background: rgba(0,180,220,0.35);
    box-shadow: 0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 24px rgba(0,180,220,0.35);
  }
  .btn-primary:active:not(:disabled) { transform: scale(0.99); }
  .btn-primary:disabled {
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.2);
    cursor: not-allowed;
    box-shadow: none;
  }

  .divider {
    display: flex; align-items: center; gap: 10px;
    margin: 14px 0;
  }
  .divider::before,.divider::after { content:''; flex:1; height:1px; background: rgba(255,255,255,0.1); }
  .divider span { font-size: 11px; color: rgba(255,255,255,0.2); }

  .msg {
    padding: 9px 14px; border-radius: 10px;
    font-size: 13px; font-weight: 600; margin-bottom: 14px;
    backdrop-filter: blur(8px);
  }
  .msg.ok  {
    background: rgba(0,180,100,0.12);
    color: rgba(120,255,180,0.9);
    border: 1px solid rgba(0,180,100,0.2);
  }
  .msg.err {
    background: rgba(220,50,50,0.12);
    color: rgba(255,150,150,0.9);
    border: 1px solid rgba(220,50,50,0.2);
  }

  .back-btn {
    background: none; border: none; cursor: pointer;
    font-size: 13px; color: rgba(120,220,255,0.6);
    display: block; margin: 14px auto 0;
    font-family: 'Barlow', sans-serif;
  }
  .back-btn:hover { color: rgba(120,220,255,0.9); }

  /* ── MODAL — liquid glass ── */
  .overlay {
    position: fixed; inset: 0; z-index: 500;
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .modal {
    background: rgba(10, 20, 40, 0.55);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 24px;
    max-width: 440px; width: 100%;
    overflow: hidden;
    box-shadow:
      0 0 0 0.5px rgba(255,255,255,0.08) inset,
      0 24px 48px rgba(0,0,0,0.5);
  }
  .modal-head {
    background: rgba(255,255,255,0.05);
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding: 16px 22px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .modal-head h3 {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 19px; font-weight: 800;
    color: rgba(160,230,255,0.9);
    text-transform: uppercase;
    margin: 0;
  }
  .modal-head button {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 50%;
    width: 28px; height: 28px;
    color: rgba(255,255,255,0.6);
    cursor: pointer; font-size: 14px;
    display: flex; align-items: center; justify-content: center;
  }
  .modal-body {
    padding: 20px 22px;
    color: rgba(255,255,255,0.6);
    font-size: 13px; line-height: 1.65;
  }
  .modal-body p { margin: 0 0 12px; }
  .modal-body strong { color: rgba(255,255,255,0.85); }
  .modal-foot {
    padding: 14px 22px;
    border-top: 1px solid rgba(255,255,255,0.08);
    display: flex; justify-content: flex-end;
  }
  .modal-foot button {
    padding: 9px 22px;
    background: rgba(0,180,220,0.2);
    border: 1px solid rgba(0,212,255,0.35);
    border-radius: 10px;
    color: rgba(255,255,255,0.9);
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 15px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 1px;
    cursor: pointer;
    backdrop-filter: blur(8px);
  }
`;

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLogin: props.initialMode !== 'register',
      loading: false,
      nombre: "",
      apellidos: "",
      documento: "",
      email: "",
      telefono: "",
      password: "",
      confirmPassword: "",
      aceptaTerminos: false,
      showModal: false,
      view: "auth",
      identifier: "",
      otp: "",
      recoveryUserId: null,
      message: { text: "", isErr: false }
    };
  }

  toggleMode = () => this.setState({ isLogin: !this.state.isLogin, message: { text: "", isErr: false } });
  toggleModal = () => this.setState({ showModal: !this.state.showModal });

  handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    this.setState({ [name]: type === "checkbox" ? checked : value });
  };

  showMsg = (text, isErr) => this.setState({ message: { text, isErr } });

  handleForgotPassword = async (e) => {
    e.preventDefault();
    this.setState({ loading: true });
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: this.state.identifier }),
      });
      const data = await res.json();
      if (res.ok) {
        this.showMsg(data.message, false);
        this.setState({ view: "reset", recoveryUserId: data.userId });
      } else {
        this.showMsg(data.message || "Error al solicitar recuperación", true);
      }
    } catch {
      this.showMsg("Error de conexión", true);
    } finally {
      this.setState({ loading: false });
    }
  };

  handleResetPassword = async (e) => {
    e.preventDefault();
    const { recoveryUserId, otp, password, confirmPassword } = this.state;
    if (password !== confirmPassword) {
      this.showMsg("Las contraseñas no coinciden", true);
      return;
    }
    this.setState({ loading: true });
    try {
      const vr = await fetch(`${API_BASE_URL}/auth/verify-recovery-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: recoveryUserId, code: otp }),
      });
      const vd = await vr.json();
      if (!vr.ok) {
        this.showMsg(vd.message || "Código inválido", true);
        this.setState({ loading: false });
        return;
      }
      const rr = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken: vd.resetToken, newPassword: password }),
      });
      const rd = await rr.json();
      if (rr.ok) {
        alert(rd.message);
        this.setState({
          view: "auth",
          isLogin: true,
          identifier: "",
          otp: "",
          password: "",
          confirmPassword: "",
          recoveryUserId: null,
          message: { text: "", isErr: false }
        });
      } else {
        this.showMsg(rd.message || "Error al restablecer contraseña", true);
      }
    } catch {
      this.showMsg("Error de conexión", true);
    } finally {
      this.setState({ loading: false });
    }
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { nombre, apellidos, documento, email, telefono, password, confirmPassword, aceptaTerminos, isLogin } = this.state;
    if (!isLogin && password !== confirmPassword) {
      this.showMsg("Las contraseñas no coinciden.", true);
      return;
    }
    if (!isLogin && !aceptaTerminos) {
      this.showMsg("Debes aceptar los términos.", true);
      return;
    }
    this.setState({ loading: true });
    const endpoint = isLogin ? "/auth/login" : "/auth/register";
    const payload = isLogin
      ? { email, password }
      : { nombre, apellidos, documento, email, telefono, password, aceptaTerminos };
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        if (isLogin) {
          localStorage.setItem("token",       data.access_token);
          localStorage.setItem("role",        data.role);
          localStorage.setItem("userId",      data.userId    || "");
          localStorage.setItem("userName",    data.nombre    || "");
          localStorage.setItem("userEmail",   email          || "");
          localStorage.setItem("userPicture", data.picture   || "");
          this.props.onLoginSuccess(data.role);
        } else {
          this.showMsg("¡Registro exitoso! Ya puedes iniciar sesión.", false);
          this.toggleMode();
        }
      } else {
        this.showMsg(data.message || "Error en los datos proporcionados.", true);
      }
    } catch {
      this.showMsg("No se pudo conectar con el servidor.", true);
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const {
      isLogin, loading, nombre, apellidos, documento, email, telefono,
      password, confirmPassword, aceptaTerminos, showModal, view, identifier, otp, message
    } = this.state;

    return (
      <div className="mxp-login-root">
        <style>{STYLE}</style>

        {/* Botón para volver a la Landing Page */}
        <button 
          className="back-to-landing" 
          onClick={() => this.props.onBack && this.props.onBack()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Volver al Inicio
        </button>

        {/* Ambient particles — layered on top of landing bg */}
        <div className="scene">
          <div className="ripple ripple-1"></div>
          <div className="ripple ripple-2"></div>
          <div className="ripple ripple-3"></div>
          <div className="ripple ripple-4"></div>
          <div className="ripple ripple-5"></div>
          <div className="car-wrap">
            <svg width="500" height="180" viewBox="0 0 500 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M60 120 L100 70 Q130 50 180 48 L320 48 Q370 48 400 70 L440 120 L60 120Z" fill="rgba(255,255,255,0.6)"/>
              <rect x="40" y="120" width="420" height="28" rx="14" fill="rgba(255,255,255,0.6)"/>
              <circle cx="120" cy="152" r="22" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
              <circle cx="120" cy="152" r="10" fill="rgba(255,255,255,0.2)"/>
              <circle cx="380" cy="152" r="22" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
              <circle cx="380" cy="152" r="10" fill="rgba(255,255,255,0.2)"/>
              <path d="M185 55 L175 110 L325 110 L315 55Z" fill="rgba(255,255,255,0.1)"/>
              <line x1="250" y1="55" x2="250" y2="110" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
            </svg>
          </div>
        </div>

        <div ref={this.bubblesRef}></div>
        <div ref={this.dropsRef}></div>

        {/* ── Modal ── */}
        {showModal && (
          <div className="overlay" role="dialog" aria-modal="true">
            <div className="modal">
              <div className="modal-head">
                <h3>Términos y Condiciones</h3>
                <button onClick={this.toggleModal} aria-label="Cerrar">✕</button>
              </div>
              <div className="modal-body">
                <p><strong>Aviso Legal — MotoExpert</strong></p>
                <p>Al utilizar esta plataforma, usted acepta que MotoExpert recopile y procese sus datos personales de acuerdo con nuestra política de privacidad vigente.</p>
                <p>El acceso es personal e intransferible. El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.</p>
                <p>El uso indebido de la plataforma o la transferencia de credenciales a terceros puede resultar en la suspensión inmediata de la cuenta.</p>
              </div>
              <div className="modal-foot">
                <button onClick={this.toggleModal}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* ── CARD ── */}
        <div className="card">
          <div className="brand-header">
            <div className="brand-logo">
              <div className="brand-name">moto<span>expert</span></div>
            </div>
          </div>

          {/* Form Panel */}
          <div className="form-panel">
            {view === "auth" && (
              <>
                <div className="tabs">
                  <button className={`tab ${isLogin ? "active" : ""}`} onClick={() => this.setState({ isLogin: true, message: { text: "", isErr: false } })}>Ingresar</button>
                  <button className={`tab ${!isLogin ? "active" : ""}`} onClick={() => this.setState({ isLogin: false, message: { text: "", isErr: false } })}>Registrarse</button>
                </div>

                {message.text && (
                  <div className={`msg ${message.isErr ? "err" : "ok"}`}>{message.text}</div>
                )}

                {isLogin ? (
                  <>
                    <div className="form-title">Bienvenido de vuelta</div>
                    <div className="form-sub">Ingresa tus credenciales para continuar</div>
                    <form onSubmit={this.handleSubmit}>
                      <div className="field">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>
                        <input name="email" type="email" placeholder="Correo electrónico" value={email} onChange={this.handleChange} required />
                      </div>
                      <div className="field">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <input name="password" type="password" placeholder="Contraseña" value={password} onChange={this.handleChange} required />
                      </div>
                      <div className="forgot">
                        <button type="button" onClick={() => this.setState({ view: "forgot", identifier: email })}>¿Olvidó su contraseña?</button>
                      </div>
                      <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? "Procesando..." : "Iniciar Sesión"}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <div className="form-title">Crea tu cuenta</div>
                    <div className="form-sub">Únete a MotoExpert y agenda tu servicio</div>
                    <form onSubmit={this.handleSubmit}>
                      <div className="grid2">
                        <div className="field">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          <input name="nombre" type="text" placeholder="Nombre" value={nombre} onChange={this.handleChange} required />
                        </div>
                        <div className="field">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          <input name="apellidos" type="text" placeholder="Apellidos" value={apellidos} onChange={this.handleChange} required />
                        </div>
                      </div>
                      <div className="field">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <input name="documento" type="text" placeholder="Número de documento" value={documento} onChange={this.handleChange} required />
                      </div>
                      <div className="field">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>
                        <input name="email" type="email" placeholder="Correo electrónico" value={email} onChange={this.handleChange} required />
                      </div>
                      <div className="field">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3.09 4.18 2 2 0 0 1 5.07 2h3a2 2 0 0 1 2 1.72c.13 1 .37 1.97.72 2.9a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 5.91 5.91l1.18-1.18a2 2 0 0 1 2.11-.45c.93.35 1.9.59 2.9.72A2 2 0 0 1 22 16.92z"/></svg>
                        <input name="telefono" type="tel" placeholder="Teléfono" value={telefono} onChange={this.handleChange} required />
                      </div>
                      <div className="grid2">
                        <div className="field">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          <input name="password" type="password" placeholder="Contraseña" value={password} onChange={this.handleChange} required />
                        </div>
                        <div className="field">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          <input name="confirmPassword" type="password" placeholder="Confirmar" value={confirmPassword} onChange={this.handleChange} required />
                        </div>
                      </div>
                      <div className="check-row">
                        <input name="aceptaTerminos" type="checkbox" id="terminos" checked={aceptaTerminos} onChange={this.handleChange} required />
                        <label htmlFor="terminos">Acepto los <button type="button" onClick={this.toggleModal}>Términos y Condiciones</button></label>
                      </div>
                      <button type="submit" className="btn-primary" disabled={loading || !aceptaTerminos}>
                        {loading ? "Procesando..." : "Crear Cuenta"}
                      </button>
                    </form>
                  </>
                )}

                <div className="divider"><span>o continuar con</span></div>
                <AuthContext.Consumer>
                  {({ googleLogin }) => (
                    <GoogleLoginButton
                      onSuccess={async (credential) => {
                        try {
                          await googleLogin(credential);
                          this.props.onLoginSuccess("user");
                        } catch (err) {
                          console.error("Google login error:", err);
                        }
                      }}
                    />
                  )}
                </AuthContext.Consumer>
              </>
            )}

            {view === "forgot" && (
              <>
                <div className="form-title">Recuperar acceso</div>
                <div className="form-sub">Te enviaremos un código a tu correo</div>
                {message.text && <div className={`msg ${message.isErr ? "err" : "ok"}`}>{message.text}</div>}
                <form onSubmit={this.handleForgotPassword}>
                  <div className="field">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>
                    <input name="identifier" type="email" placeholder="tu@correo.com" value={identifier} onChange={this.handleChange} required />
                  </div>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8 }}>
                    {loading ? "Enviando..." : "Enviar Código"}
                  </button>
                </form>
                <button className="back-btn" onClick={() => this.setState({ view: "auth" })}>← Volver al inicio de sesión</button>
              </>
            )}

            {view === "reset" && (
              <>
                <div className="form-title">Nueva contraseña</div>
                <div className="form-sub">Ingresa el código recibido y tu nueva clave</div>
                {message.text && <div className={`msg ${message.isErr ? "err" : "ok"}`}>{message.text}</div>}
                <form onSubmit={this.handleResetPassword}>
                  <div className="field">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3v4M8 3v4M2 11h20"/></svg>
                    <input name="otp" type="text" placeholder="Código OTP" value={otp} onChange={this.handleChange} required maxLength="6" style={{ letterSpacing: 4, fontSize: 18, fontWeight: 600 }} />
                  </div>
                  <div className="field">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input name="password" type="password" placeholder="Nueva contraseña" value={password} onChange={this.handleChange} required />
                  </div>
                  <div className="field">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input name="confirmPassword" type="password" placeholder="Confirmar contraseña" value={confirmPassword} onChange={this.handleChange} required />
                  </div>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? "Procesando..." : "Restablecer Contraseña"}
                  </button>
                </form>
                <button className="back-btn" onClick={() => this.setState({ view: "forgot" })}>¿No recibiste el código? Reenviar</button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default Login;
