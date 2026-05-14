import React, { Component } from "react";
import { AuthContext } from '../../context/AuthContext';
import GoogleLoginButton from '../GoogleLoginButton';

// ─── Inline styles & keyframes injected once ────────────────────────────────
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

  .mxp-root * { box-sizing: border-box; font-family: 'Nunito', sans-serif; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-14px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes pulse-blob {
    0%,100% { transform: scale(1);   opacity:.55; }
    50%      { transform: scale(1.1); opacity:.75; }
  }
  @keyframes float {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-10px); }
  }

  .mxp-card {
    display: flex;
    width: 900px;
    min-height: 540px;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 32px 80px rgba(88,60,220,.25);
    animation: fadeUp .55s ease both;
  }

  /* ── LEFT PANEL ── */
  .mxp-left {
    flex: 1;
    background: #ffffff;
    padding: 48px 44px 40px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .mxp-title {
    font-size: 28px;
    font-weight: 900;
    color: #1a1a2e;
    letter-spacing: -.5px;
    margin: 0 0 4px;
    animation: slideIn .45s .1s ease both;
  }
  .mxp-subtitle {
    font-size: 13px;
    color: #9095a0;
    margin: 0 0 28px;
    animation: slideIn .45s .15s ease both;
  }

  .mxp-field {
    position: relative;
    margin-bottom: 14px;
    animation: slideIn .45s ease both;
  }
  .mxp-field:nth-child(1){ animation-delay:.18s }
  .mxp-field:nth-child(2){ animation-delay:.23s }
  .mxp-field:nth-child(3){ animation-delay:.26s }

  .mxp-field svg {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #b0b8c8;
    pointer-events: none;
    width: 17px; height: 17px;
  }
  .mxp-field input {
    width: 100%;
    padding: 13px 14px 13px 40px;
    background: #f3f4ff;
    border: 1.5px solid transparent;
    border-radius: 10px;
    font-size: 14px;
    color: #1a1a2e;
    outline: none;
    transition: border-color .2s, background .2s;
  }
  .mxp-field input:focus {
    border-color: #6c63ff;
    background: #fff;
  }
  .mxp-field input::placeholder { color: #b0b8c8; }

  .mxp-forgot {
    text-align: right;
    margin: -6px 0 18px;
    animation: slideIn .45s .28s ease both;
  }
  .mxp-forgot button {
    background: none; border: none; cursor: pointer;
    font-size: 12px; font-weight: 700; color: #6c63ff;
  }
  .mxp-forgot button:hover { text-decoration: underline; }

  .mxp-btn-primary {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #6c63ff 0%, #5046e4 100%);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(108,99,255,.4);
    transition: transform .15s, box-shadow .15s;
    animation: slideIn .45s .3s ease both;
  }
  .mxp-btn-primary:hover   { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(108,99,255,.45); }
  .mxp-btn-primary:active  { transform: translateY(0); }
  .mxp-btn-primary:disabled{ background: #c5c9d6; box-shadow: none; cursor: not-allowed; }

  .mxp-divider {
    display: flex; align-items: center; gap: 10px;
    margin: 18px 0 14px;
    animation: slideIn .45s .34s ease both;
  }
  .mxp-divider span { font-size: 12px; color: #b0b8c8; white-space: nowrap; }
  .mxp-divider::before,.mxp-divider::after {
    content:''; flex:1; height:1px; background:#e8eaf0;
  }

  .mxp-social-btn {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    width: 100%; padding: 11px 14px;
    background: #fff; border: 1.5px solid #e8eaf0;
    border-radius: 10px; font-size: 13px; font-weight: 700;
    color: #1a1a2e; cursor: pointer; margin-bottom: 10px;
    transition: border-color .2s, box-shadow .2s;
    animation: slideIn .45s ease both;
  }
  .mxp-social-btn:hover { border-color: #6c63ff; box-shadow: 0 2px 12px rgba(108,99,255,.12); }
  .mxp-social-btn:nth-child(1){ animation-delay:.37s }
  .mxp-social-btn:nth-child(2){ animation-delay:.41s }

  .mxp-toggle {
    text-align: center; margin-top: 16px;
    font-size: 13px; color: #9095a0;
    animation: slideIn .45s .44s ease both;
  }
  .mxp-toggle button {
    background: none; border: none; cursor: pointer;
    font-weight: 800; color: #6c63ff; font-size: 13px;
  }
  .mxp-toggle button:hover { text-decoration: underline; }

  /* ── RIGHT PANEL ── */
  .mxp-right {
    width: 360px;
    background: linear-gradient(145deg, #7c73f5 0%, #5046e4 100%);
    position: relative;
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
  }
  .mxp-blob {
    position: absolute; border-radius: 50%;
    background: rgba(255,255,255,.12);
    animation: pulse-blob 4s ease-in-out infinite;
  }
  .mxp-blob-1 { width:220px; height:220px; top:-40px; right:-50px; animation-delay:0s; }
  .mxp-blob-2 { width:160px; height:160px; bottom:-30px; left:-40px; animation-delay:1.5s; }
  .mxp-blob-3 { width:90px;  height:90px;  bottom:80px; right:20px; animation-delay:.8s; }

  .mxp-right-content {
    position: relative; z-index: 2;
    display: flex; flex-direction: column;
    align-items: center; gap: 24px;
    padding: 32px;
  }
  .mxp-brand {
    font-size: 32px; font-weight: 900;
    color: #fff; letter-spacing: -1px;
    font-style: italic; text-shadow: 0 2px 12px rgba(0,0,0,.2);
  }

  .mxp-img-frame {
    width: 220px; height: 260px;
    background: rgba(255,255,255,.18);
    border-radius: 20px;
    backdrop-filter: blur(8px);
    border: 1.5px solid rgba(255,255,255,.3);
    overflow: hidden;
    display: flex; align-items: flex-end; justify-content: center;
    box-shadow: 0 16px 48px rgba(0,0,0,.2);
    animation: float 4s ease-in-out infinite;
  }
  .mxp-img-frame img {
    width: 100%; height: 100%;
    object-fit: cover; object-position: top;
  }
  .mxp-img-placeholder {
    width:100%; height:100%;
    display:flex; align-items:center; justify-content:center;
    flex-direction:column; gap:8px; color:rgba(255,255,255,.7);
    font-size:13px; font-weight:700;
  }

  .mxp-badge {
    position: absolute; bottom: 52px; left: 28px;
    background: #fff; border-radius: 50%;
    width: 46px; height: 46px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px rgba(0,0,0,.18);
    font-size: 22px;
    animation: float 3s 1s ease-in-out infinite;
  }

  /* ── REGISTER GRID ── */
  .mxp-grid-2 {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  }
  .mxp-grid-2 .mxp-field { margin-bottom: 0; }

  /* ── CHECKBOX ── */
  .mxp-check-row {
    display: flex; align-items: flex-start; gap: 8px;
    font-size: 13px; color: #6b7280; margin: 4px 0 14px;
    animation: slideIn .45s .28s ease both;
  }
  .mxp-check-row input { margin-top:2px; accent-color:#6c63ff; cursor:pointer; }
  .mxp-check-row button {
    background:none; border:none; cursor:pointer;
    color:#6c63ff; font-weight:700; font-size:13px; padding:0;
  }
  .mxp-check-row button:hover { text-decoration:underline; }

  /* ── RECOVERY VIEWS ── */
  .mxp-recover-hint {
    font-size:13px; color:#9095a0; text-align:center;
    margin-bottom:20px; line-height:1.6;
  }
  .mxp-back-btn {
    background:none; border:none; cursor:pointer;
    font-size:13px; font-weight:700; color:#6c63ff;
    display:block; margin:14px auto 0; text-align:center;
  }
  .mxp-back-btn:hover { text-decoration:underline; }

  /* ── MODAL ── */
  .mxp-modal-overlay {
    position:fixed; inset:0; z-index:200;
    background:rgba(30,20,80,.55); backdrop-filter:blur(4px);
    display:flex; align-items:center; justify-content:center; padding:16px;
  }
  .mxp-modal {
    background:#fff; border-radius:20px;
    max-width:480px; width:100%; max-height:80vh;
    display:flex; flex-direction:column; overflow:hidden;
    box-shadow:0 24px 64px rgba(0,0,0,.22);
    animation:fadeUp .3s ease both;
  }
  .mxp-modal-header {
    background:linear-gradient(135deg,#6c63ff,#5046e4);
    padding:20px 24px; color:#fff;
    display:flex; justify-content:space-between; align-items:center;
  }
  .mxp-modal-header h3 { margin:0; font-size:18px; font-weight:800; }
  .mxp-modal-header button {
    background:none; border:none; cursor:pointer;
    color:#fff; font-size:20px; line-height:1;
    opacity:.8; transition:opacity .2s;
  }
  .mxp-modal-header button:hover { opacity:1; }
  .mxp-modal-body {
    padding:24px; overflow-y:auto;
    font-size:14px; color:#555; line-height:1.7;
  }
  .mxp-modal-footer {
    padding:16px 24px; border-top:1px solid #f0f0f0;
    display:flex; justify-content:flex-end;
  }
  .mxp-modal-footer button {
    padding:10px 24px; background:linear-gradient(135deg,#6c63ff,#5046e4);
    color:#fff; border:none; border-radius:8px;
    font-weight:800; font-size:14px; cursor:pointer;
    box-shadow:0 4px 14px rgba(108,99,255,.35);
  }
`;

// ─── Icon helpers ─────────────────────────────────────────────────────────────
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/>
  </svg>
);
const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3.09 4.18 2 2 0 0 1 5.07 2h3a2 2 0 0 1 2 1.72c.13 1 .37 1.97.72 2.9a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 5.91 5.91l1.18-1.18a2 2 0 0 1 2.11-.45c.93.35 1.9.59 2.9.72A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IconId = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 10h2M16 14h2M6 10h.01M6 14h.01M9 10h3M9 14h3"/>
  </svg>
);
const IconOtp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3v4M8 3v4M2 11h20"/>
  </svg>
);

// ─── Google SVG ───────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>
);

// ─── Facebook SVG ─────────────────────────────────────────────────────────────
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

// ─── Right panel illustration ─────────────────────────────────────────────────
const RightPanel = () => (
  <div className="mxp-right">
    <div className="mxp-blob mxp-blob-1" />
    <div className="mxp-blob mxp-blob-2" />
    <div className="mxp-blob mxp-blob-3" />
    <div className="mxp-right-content">
      <div className="mxp-brand">MotoExpert</div>
      <div className="mxp-img-frame">
        <div className="mxp-img-placeholder">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/>
          </svg>
          <span>Tu foto aquí</span>
        </div>
      </div>
    </div>
    <div className="mxp-badge">⚡</div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nombre: "", apellidos: "", documento: "", email: "",
      telefono: "", password: "", confirmPassword: "",
      aceptaTerminos: false, showModal: false, loading: false,
      isLogin: props.initialMode !== "register",
      view: "auth",
      identifier: "", otp: "", recoveryUserId: null, resetToken: "",
    };
  }

  handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    this.setState({ [name]: type === "checkbox" ? checked : value });
  };

  toggleModal  = () => this.setState(s => ({ showModal: !s.showModal }));
  toggleMode   = () => this.setState(s => ({
    isLogin: !s.isLogin,
    nombre:"", apellidos:"", documento:"", email:"", telefono:"",
    password:"", confirmPassword:"", aceptaTerminos:false, loading:false, view:"auth"
  }));

  handleForgotPassword = async (e) => {
    e.preventDefault();
    this.setState({ loading: true });
    try {
      const res  = await fetch("http://localhost:3000/auth/forgot-password", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email: this.state.identifier }),
      });
      const data = await res.json();
      if (res.ok) { alert(data.message); this.setState({ view:"reset", recoveryUserId:data.userId }); }
      else alert(data.message || "Error al solicitar recuperación");
    } catch { alert("Error de conexión"); }
    finally { this.setState({ loading:false }); }
  };

  handleResetPassword = async (e) => {
    e.preventDefault();
    const { recoveryUserId, otp, password, confirmPassword } = this.state;
    if (password !== confirmPassword) { alert("Las contraseñas no coinciden"); return; }
    this.setState({ loading:true });
    try {
      const vr   = await fetch("http://localhost:3000/auth/verify-recovery-otp", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ userId:recoveryUserId, code:otp }),
      });
      const vd   = await vr.json();
      if (!vr.ok) { alert(vd.message || "Código inválido"); this.setState({ loading:false }); return; }
      const rr   = await fetch("http://localhost:3000/auth/reset-password", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ resetToken:vd.resetToken, newPassword:password }),
      });
      const rd   = await rr.json();
      if (rr.ok) { alert(rd.message); this.setState({ view:"auth", isLogin:true, identifier:"", otp:"", password:"", confirmPassword:"", recoveryUserId:null, resetToken:"" }); }
      else alert(rd.message || "Error al restablecer contraseña");
    } catch { alert("Error de conexión"); }
    finally { this.setState({ loading:false }); }
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { nombre, apellidos, documento, email, telefono, password, confirmPassword, aceptaTerminos, isLogin } = this.state;
    if (!isLogin && password !== confirmPassword) { alert("Las contraseñas no coinciden."); return; }
    if (!isLogin && !aceptaTerminos) { alert("Debes aceptar los términos."); return; }
    this.setState({ loading:true });
    const endpoint = isLogin ? "/auth/login" : "/auth/register";
    const payload  = isLogin ? { email, password } : { nombre, apellidos, documento, email, telefono, password, aceptaTerminos };
    try {
      const res  = await fetch(`http://localhost:3000${endpoint}`, {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        if (isLogin) {
          localStorage.setItem("token",     data.access_token);
          localStorage.setItem("role",      data.role);
          localStorage.setItem("userId",    data.userId    || "");
          localStorage.setItem("userName",  data.nombre    || "");
          localStorage.setItem("userEmail", email          || "");
          this.props.onLoginSuccess(data.role);
        } else { alert("¡Registro exitoso! Ya puedes iniciar sesión."); this.toggleMode(); }
      } else alert(data.message || "Error en los datos proporcionados.");
    } catch { alert("No se pudo conectar con el servidor."); }
    finally { this.setState({ loading:false }); }
  };

  render() {
    const {
      isLogin, loading, nombre, apellidos, documento, email, telefono,
      password, confirmPassword, aceptaTerminos, showModal, view, identifier, otp
    } = this.state;

    return (
      <div className="mxp-root">
        <style>{STYLE}</style>

        {/* ── MODAL ── */}
        {showModal && (
          <div className="mxp-modal-overlay">
            <div className="mxp-modal">
              <div className="mxp-modal-header">
                <h3>Términos y Condiciones</h3>
                <button onClick={this.toggleModal}>✕</button>
              </div>
              <div className="mxp-modal-body">
                <p><strong>Aviso Legal — MotoExpert</strong></p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
                <p>Al utilizar esta plataforma, usted acepta que MotoExpert recopile y procese sus datos personales de acuerdo con nuestra política de privacidad.</p>
                <p>El acceso es personal e intransferible. El usuario es responsable de mantener la confidencialidad de sus credenciales.</p>
              </div>
              <div className="mxp-modal-footer">
                <button onClick={this.toggleModal}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        <div className="mxp-card">
          {/* ── LEFT PANEL ── */}
          <div className="mxp-left">

            {/* FORGOT PASSWORD */}
            {view === "forgot" && (
              <>
                <p className="mxp-title">Recuperar contraseña</p>
                <p className="mxp-subtitle">Te enviaremos un código a tu correo</p>
                <form onSubmit={this.handleForgotPassword}>
                  <div className="mxp-field">
                    <IconMail />
                    <input name="identifier" type="email" placeholder="tu@email.com" value={identifier} onChange={this.handleChange} required />
                  </div>
                  <button type="submit" className="mxp-btn-primary" disabled={loading} style={{marginTop:8}}>
                    {loading ? "Enviando..." : "Enviar código"}
                  </button>
                </form>
                <button className="mxp-back-btn" onClick={() => this.setState({ view:"auth", isLogin:true })}>
                  ← Volver al inicio de sesión
                </button>
              </>
            )}

            {/* RESET PASSWORD */}
            {view === "reset" && (
              <>
                <p className="mxp-title">Nueva contraseña</p>
                <p className="mxp-subtitle">Ingresa el código recibido y tu nueva clave</p>
                <form onSubmit={this.handleResetPassword}>
                  <div className="mxp-field">
                    <IconOtp />
                    <input name="otp" type="text" placeholder="Código OTP" value={otp} onChange={this.handleChange} required />
                  </div>
                  <div className="mxp-field">
                    <IconLock />
                    <input name="password" type="password" placeholder="Nueva contraseña" value={password} onChange={this.handleChange} required />
                  </div>
                  <div className="mxp-field">
                    <IconLock />
                    <input name="confirmPassword" type="password" placeholder="Confirmar contraseña" value={confirmPassword} onChange={this.handleChange} required />
                  </div>
                  <button
                    type="submit"
                    className="mxp-btn-primary"
                    disabled={loading || !otp || !password || password !== confirmPassword}
                    style={{marginTop:8}}
                  >
                    {loading ? "Procesando..." : "Restablecer contraseña"}
                  </button>
                </form>
                <button className="mxp-back-btn" onClick={() => this.setState({ view:"forgot" })}>
                  ¿No recibiste el código? Reenviar
                </button>
              </>
            )}

            {/* AUTH (LOGIN / REGISTER) */}
            {view === "auth" && (
              <>
                <p className="mxp-title">{isLogin ? "LOGIN" : "REGISTRO"}</p>
                <p className="mxp-subtitle">
                  {isLogin ? "¿Cómo accedo? Ingresa tus credenciales" : "Crea tu cuenta en MotoExpert"}
                </p>

                <form onSubmit={this.handleSubmit}>
                  {!isLogin && (
                    <div className="mxp-grid-2" style={{marginBottom:14}}>
                      <div className="mxp-field">
                        <IconUser />
                        <input name="nombre" type="text" placeholder="Nombre" value={nombre} onChange={this.handleChange} required />
                      </div>
                      <div className="mxp-field">
                        <IconUser />
                        <input name="apellidos" type="text" placeholder="Apellidos" value={apellidos} onChange={this.handleChange} required />
                      </div>
                    </div>
                  )}

                  {!isLogin && (
                    <div className="mxp-field">
                      <IconId />
                      <input name="documento" type="text" placeholder="Número de documento" value={documento} onChange={this.handleChange} required />
                    </div>
                  )}

                  <div className="mxp-field">
                    <IconMail />
                    <input name="email" type="email" placeholder="Username / Correo" value={email} onChange={this.handleChange} required />
                  </div>

                  {!isLogin && (
                    <div className="mxp-field">
                      <IconPhone />
                      <input name="telefono" type="tel" placeholder="Teléfono" value={telefono} onChange={this.handleChange} required />
                    </div>
                  )}

                  <div className="mxp-field">
                    <IconLock />
                    <input name="password" type="password" placeholder="Password" value={password} onChange={this.handleChange} required />
                  </div>

                  {isLogin && (
                    <div className="mxp-forgot">
                      <button type="button" onClick={() => this.setState({ view:"forgot", identifier:email })}>
                        ¿Olvidó su contraseña?
                      </button>
                    </div>
                  )}

                  {!isLogin && (
                    <div className="mxp-field">
                      <IconLock />
                      <input name="confirmPassword" type="password" placeholder="Confirmar contraseña" value={confirmPassword} onChange={this.handleChange} required />
                    </div>
                  )}

                  {!isLogin && (
                    <div className="mxp-check-row">
                      <input id="aceptaTerminos" name="aceptaTerminos" type="checkbox" checked={aceptaTerminos} onChange={this.handleChange} required />
                      <label htmlFor="aceptaTerminos">
                        Acepto los <button type="button" onClick={this.toggleModal}>Términos y Condiciones</button>
                      </label>
                    </div>
                  )}

                  <button type="submit" className="mxp-btn-primary" disabled={loading || (!isLogin && !aceptaTerminos)}>
                    {loading ? "Procesando..." : isLogin ? "Login Now" : "Registrarse"}
                  </button>
                </form>

                <div className="mxp-divider"><span>Login with Others</span></div>

                <button className="mxp-social-btn" type="button">
                  <GoogleIcon /> Login with <strong>google</strong>
                </button>
                <button className="mxp-social-btn" type="button">
                  <FacebookIcon /> Login with <strong>Facebook</strong>
                </button>

                {/* Hidden real Google login */}
                <div style={{display:"none"}}>
                  <AuthContext.Consumer>
                    {({ googleLogin }) => (
                      <GoogleLoginButton
                        onSuccess={async (credential) => {
                          try { await googleLogin(credential); this.props.onLoginSuccess("user"); }
                          catch (err) { console.error("Google login error:", err); }
                        }}
                      />
                    )}
                  </AuthContext.Consumer>
                </div>

                <div className="mxp-toggle">
                  {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                  <button type="button" onClick={this.toggleMode}>
                    {isLogin ? "Regístrate" : "Inicia Sesión"}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── RIGHT PANEL ── */}
          <RightPanel />
        </div>
      </div>
    );
  }
}

export default Login;
