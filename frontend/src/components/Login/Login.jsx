import React, { Component } from "react";
import { AuthContext } from '../../context/AuthContext';
import GoogleLoginButton from '../GoogleLoginButton';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@300;400;500;600&display=swap');

  .mxp-login-root {
    min-height: 100vh;
    background: #001a33;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Barlow', sans-serif;
    overflow: hidden;
    position: relative;
  }

  /* ── Background animated scene ── */
  .scene {
    position: fixed; inset: 0; overflow: hidden; z-index: 0;
  }

  .scene-grad {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 120% 80% at 60% 110%, #003366 0%, #001a33 55%, #000d1a 100%);
  }

  .ripple {
    position: absolute;
    border-radius: 50%;
    border: 1px solid rgba(0,212,255,0.18);
    animation: ripple-expand 6s linear infinite;
    transform-origin: center;
  }
  .ripple-1 { width: 300px; height: 300px; bottom: -150px; left: 10%; animation-delay: 0s; }
  .ripple-2 { width: 500px; height: 500px; bottom: -250px; left: 5%; animation-delay: 2s; }
  .ripple-3 { width: 700px; height: 700px; bottom: -350px; left: 0%; animation-delay: 4s; }
  .ripple-4 { width: 400px; height: 400px; bottom: -200px; right: 5%; animation-delay: 1s; }
  .ripple-5 { width: 600px; height: 600px; bottom: -300px; right: 0%; animation-delay: 3s; }

  @keyframes ripple-expand {
    0%   { transform: scale(0.7); opacity: 0.4; }
    100% { transform: scale(1.4); opacity: 0; }
  }

  .bubble {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), rgba(0,212,255,0.05));
    border: 1px solid rgba(0,212,255,0.3);
    animation: float-up linear infinite;
  }
  @keyframes float-up {
    0%   { transform: translateY(0) scale(1);   opacity: 0.7; }
    80%  { opacity: 0.5; }
    100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
  }

  .drop {
    position: absolute;
    border-radius: 50% 50% 50% 0 / 60% 60% 40% 40%;
    background: rgba(0,212,255,0.15);
    animation: drop-fall linear infinite;
  }
  @keyframes drop-fall {
    0%   { transform: translateY(-10px) scaleY(0.8); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 0.6; }
    100% { transform: translateY(100vh) scaleY(1.2); opacity: 0; }
  }

  .car-wrap {
    position: absolute;
    bottom: 14%;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0.07;
    animation: car-drift 8s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes car-drift {
    0%,100% { transform: translateX(-50%) translateY(0); }
    50%      { transform: translateX(-50%) translateY(-8px); }
  }

  .card {
    position: relative; z-index: 10;
    width: 900px; min-height: 540px;
    display: flex;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 32px 80px rgba(0,30,60,0.7), 0 0 0 1px rgba(0,212,255,0.25);
    animation: card-in 0.8s cubic-bezier(0.16,1,0.3,1) both;
  }
  @keyframes card-in {
    from { opacity: 0; transform: translateY(40px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .brand-panel {
    width: 340px;
    flex-shrink: 0;
    background: linear-gradient(160deg, #004080 0%, #002655 50%, #001133 100%);
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 36px;
    gap: 28px;
    overflow: hidden;
  }

  .ring {
    position: absolute;
    border-radius: 50%;
    border: 1px solid rgba(0,212,255,0.25);
    animation: spin linear infinite;
  }
  .ring-1 { width: 260px; height: 260px; top: 50%; left: 50%; margin: -130px 0 0 -130px; animation-duration: 18s; }
  .ring-2 { width: 180px; height: 180px; top: 50%; left: 50%; margin: -90px 0 0 -90px; border-color: rgba(0,212,255,0.15); animation-duration: 12s; animation-direction: reverse; }
  @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }

  .brand-logo {
    position: relative; z-index: 2;
    text-align: center;
  }
  .brand-logo .drop-icon {
    width: 64px; height: 64px;
    background: linear-gradient(135deg, #00d4ff, #0088cc);
    border-radius: 50% 50% 50% 0 / 60% 60% 40% 40%;
    margin: 0 auto 16px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 32px rgba(0,212,255,0.5);
    animation: drop-pulse 3s ease-in-out infinite;
  }
  @keyframes drop-pulse {
    0%,100% { box-shadow: 0 0 24px rgba(0,212,255,0.4); }
    50%      { box-shadow: 0 0 48px rgba(0,212,255,0.7); }
  }

  .brand-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 38px; font-weight: 900;
    color: #fff;
    letter-spacing: 2px;
    text-transform: uppercase;
    line-height: 1;
  }
  .brand-name span { color: #00d4ff; }

  .brand-tagline {
    font-size: 12px;
    color: rgba(255,255,255,0.5);
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-top: 4px;
  }

  .brand-features {
    position: relative; z-index: 2;
    display: flex; flex-direction: column; gap: 12px; width: 100%;
  }
  .feat {
    display: flex; align-items: center; gap: 10px;
    color: rgba(255,255,255,0.7);
    font-size: 13px;
    animation: feat-in 0.6s ease both;
  }
  .feat-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #00d4ff;
    flex-shrink: 0;
    box-shadow: 0 0 8px #00d4ff;
  }

  .brand-badge {
    position: relative; z-index: 2;
    background: rgba(0,212,255,0.1);
    border: 1px solid rgba(0,212,255,0.3);
    border-radius: 100px;
    padding: 6px 18px;
    font-size: 12px;
    color: #00d4ff;
    letter-spacing: 2px;
    text-transform: uppercase;
    font-weight: 600;
  }

  .form-panel {
    flex: 1;
    background: rgba(0,10,25,0.92);
    backdrop-filter: blur(20px);
    padding: 48px 44px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .tabs {
    display: flex; gap: 0; margin-bottom: 36px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .tab {
    background: none; border: none; cursor: pointer;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 18px; font-weight: 700;
    color: rgba(255,255,255,0.35);
    padding: 10px 28px 14px;
    text-transform: uppercase; letter-spacing: 1px;
    position: relative;
    transition: color 0.3s;
  }
  .tab.active { color: #00d4ff; }
  .tab.active::after {
    content: '';
    position: absolute; bottom: -1px; left: 0; right: 0; height: 2px;
    background: #00d4ff;
    box-shadow: 0 0 12px #00d4ff;
  }

  .form-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 28px; font-weight: 800;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 6px;
    line-height: 1;
  }
  .form-sub {
    font-size: 13px; color: rgba(255,255,255,0.4);
    margin-bottom: 28px;
  }

  .field {
    position: relative; margin-bottom: 14px;
  }
  .field svg {
    position: absolute; left: 14px; top: 50%;
    transform: translateY(-50%);
    color: rgba(0,212,255,0.5);
    width: 16px; height: 16px;
    pointer-events: none;
  }
  .field input {
    width: 100%;
    padding: 13px 14px 13px 40px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    font-size: 14px; color: #fff;
    font-family: 'Barlow', sans-serif;
    outline: none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }
  .field input:focus {
    border-color: #00d4ff;
    background: rgba(0,212,255,0.05);
  }

  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .forgot {
    text-align: right; margin: -6px 0 20px;
  }
  .forgot button {
    background: none; border: none; cursor: pointer;
    font-size: 12px; color: rgba(0,212,255,0.7);
    font-family: 'Barlow', sans-serif;
  }

  .check-row {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 13px; color: rgba(255,255,255,0.45); margin-bottom: 18px;
  }
  .check-row button {
    background: none; border: none; cursor: pointer;
    color: #00d4ff; font-size: 13px;
  }

  .btn-primary {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, #00a8d4, #0066cc);
    color: #fff; border: none; border-radius: 10px;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 18px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 2px;
    cursor: pointer;
    position: relative; overflow: hidden;
    transition: transform 0.15s;
  }
  .btn-primary:disabled { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.25); cursor: not-allowed; }

  .divider {
    display: flex; align-items: center; gap: 10px;
    margin: 16px 0;
  }
  .divider::before,.divider::after { content:''; flex:1; height:1px; background: rgba(255,255,255,0.08); }
  .divider span { font-size: 11px; color: rgba(255,255,255,0.25); }

  .btn-social {
    width: 100%; padding: 11px 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: rgba(255,255,255,0.7);
    font-family: 'Barlow', sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; margin-bottom: 10px;
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }

  .msg {
    padding: 10px 14px; border-radius: 8px;
    font-size: 13px; font-weight: 600; margin-bottom: 16px;
  }
  .msg.ok  { background: rgba(0,180,100,0.12); color: #4ade80; border: 1px solid rgba(0,180,100,0.2); }
  .msg.err { background: rgba(220,50,50,0.12); color: #f87171; border: 1px solid rgba(220,50,50,0.2); }

  .back-btn {
    background: none; border: none; cursor: pointer;
    font-size: 13px; color: rgba(0,212,255,0.7);
    display: block; margin: 14px auto 0;
  }

  .overlay {
    position: fixed; inset: 0; z-index: 500;
    background: rgba(0,5,15,0.8); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .modal {
    background: #001a33;
    border: 1px solid rgba(0,212,255,0.25);
    border-radius: 20px;
    max-width: 440px; width: 100%;
    overflow: hidden;
  }
  .modal-head {
    background: linear-gradient(135deg, #004080, #001a40);
    padding: 18px 24px; display: flex; justify-content: space-between; align-items: center;
  }
  .modal-head h3 {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 20px; font-weight: 800;
    color: #00d4ff; text-transform: uppercase;
  }
  .modal-foot button {
    padding: 10px 24px;
    background: linear-gradient(135deg, #00a8d4, #0066cc);
    color: #fff; border: none; border-radius: 8px;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
    cursor: pointer;
  }
`;

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLogin: true,
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
      view: "auth", // auth, forgot, reset
      identifier: "",
      otp: "",
      recoveryUserId: null,
      message: { text: "", isErr: false }
    };
    this.bubblesRef = React.createRef();
    this.dropsRef = React.createRef();
  }

  componentDidMount() {
    this.generateParticles();
  }

  generateParticles = () => {
    if (this.bubblesRef.current) {
      const wrap = this.bubblesRef.current;
      for (let i = 0; i < 18; i++) {
        const b = document.createElement('div');
        b.className = 'bubble';
        const s = Math.random() * 20 + 6;
        b.style.cssText = `
          width:${s}px; height:${s}px;
          left:${Math.random() * 100}%;
          bottom:${Math.random() * 30 - 10}%;
          animation-duration:${Math.random() * 8 + 6}s;
          animation-delay:${Math.random() * 8}s;
        `;
        wrap.appendChild(b);
      }
    }
    if (this.dropsRef.current) {
      const drops = this.dropsRef.current;
      for (let i = 0; i < 12; i++) {
        const d = document.createElement('div');
        d.className = 'drop';
        const w = Math.random() * 6 + 3;
        d.style.cssText = `
          width:${w}px; height:${w * 1.4}px;
          left:${Math.random() * 100}%;
          top:-20px;
          animation-duration:${Math.random() * 5 + 4}s;
          animation-delay:${Math.random() * 6}s;
        `;
        drops.appendChild(d);
      }
    }
  };

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
    const payload = isLogin ? { email, password } : { nombre, apellidos, documento, email, telefono, password, aceptaTerminos };
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        if (isLogin) {
          localStorage.setItem("token",     data.access_token);
          localStorage.setItem("role",      data.role);
          localStorage.setItem("userId",    data.userId    || "");
          localStorage.setItem("userName",  data.nombre    || "");
          localStorage.setItem("userEmail", email          || "");
          localStorage.setItem("userPicture", data.picture || "");
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

        {/* ── Background Scene ── */}
        <div className="scene">
          <div className="scene-grad"></div>
          <div className="ripple ripple-1"></div>
          <div className="ripple ripple-2"></div>
          <div className="ripple ripple-3"></div>
          <div className="ripple ripple-4"></div>
          <div className="ripple ripple-5"></div>

          <div className="car-wrap">
            <svg width="500" height="180" viewBox="0 0 500 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M60 120 L100 70 Q130 50 180 48 L320 48 Q370 48 400 70 L440 120 L60 120Z" fill="#00d4ff"/>
              <rect x="40" y="120" width="420" height="28" rx="14" fill="#00d4ff"/>
              <circle cx="120" cy="152" r="22" fill="#001a33" stroke="#00d4ff" stroke-width="3"/>
              <circle cx="120" cy="152" r="10" fill="#00d4ff" opacity="0.4"/>
              <circle cx="380" cy="152" r="22" fill="#001a33" stroke="#00d4ff" stroke-width="3"/>
              <circle cx="380" cy="152" r="10" fill="#00d4ff" opacity="0.4"/>
              <path d="M185 55 L175 110 L325 110 L315 55Z" fill="#001a33" opacity="0.5"/>
              <line x1="250" y1="55" x2="250" y2="110" stroke="#00d4ff" stroke-width="1" opacity="0.3"/>
            </svg>
          </div>
        </div>

        {/* Dynamic bubbles */}
        <div ref={this.bubblesRef}></div>
        <div ref={this.dropsRef}></div>

        {/* ── Modal ── */}
        {showModal && (
          <div className="overlay" role="dialog">
            <div className="modal">
              <div className="modal-head">
                <h3>Términos y Condiciones</h3>
                <button onClick={this.toggleModal}>✕</button>
              </div>
              <div className="modal-body">
                <p><strong style={{color:"#fff"}}>Aviso Legal — MotoExpert</strong></p>
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
          {/* Brand Panel */}
          <div className="brand-panel">
            <div className="ring ring-1"></div>
            <div className="ring ring-2"></div>
            <div className="brand-logo">
              <div className="drop-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2 C12 2, 4 10, 4 15 a8 8 0 0 0 16 0 C20 10 12 2 12 2Z"/>
                </svg>
              </div>
              <div className="brand-name">moto<span>expert</span></div>
              <div className="brand-tagline">Autolavado Premium</div>
            </div>
            <div className="brand-features">
              <div className="feat"><div className="feat-dot"></div>Lavado a presión HD</div>
              <div className="feat"><div className="feat-dot"></div>Cera protectora UV</div>
              <div className="feat"><div className="feat-dot"></div>Secado por aire caliente</div>
            </div>
            <div className="brand-badge">★ Servicio 24/7</div>
          </div>

          {/* Form Panel */}
          <div className="form-panel">
            {view === "auth" && (
              <>
                <div className="tabs">
                  <button className={`tab ${isLogin ? "active" : ""}`} onClick={() => this.setState({ isLogin: true })}>Ingresar</button>
                  <button className={`tab ${!isLogin ? "active" : ""}`} onClick={() => this.setState({ isLogin: false })}>Registrarse</button>
                </div>

                {message.text && (
                  <div className={`msg ${message.isErr ? "err" : "ok"}`}>
                    {message.text}
                  </div>
                )}

                {isLogin ? (
                  <div className="view active">
                    <div className="form-title">Bienvenido de vuelta</div>
                    <div className="form-sub">Ingresa tus credenciales para continuar</div>
                    <form onSubmit={this.handleSubmit}>
                      <div className="field">
                        <input name="email" type="email" placeholder="Correo electrónico" value={email} onChange={this.handleChange} required />
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>
                      </div>
                      <div className="field">
                        <input name="password" type="password" placeholder="Contraseña" value={password} onChange={this.handleChange} required />
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </div>
                      <div className="forgot">
                        <button type="button" onClick={() => this.setState({ view: "forgot", identifier: email })}>¿Olvidó su contraseña?</button>
                      </div>
                      <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? "Procesando..." : "Iniciar Sesión"}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="view active">
                    <div className="form-title">Crea tu cuenta</div>
                    <div className="form-sub">Únete a MotoExpert y agenda tu servicio</div>
                    <form onSubmit={this.handleSubmit}>
                      <div className="grid2">
                        <div className="field">
                          <input name="nombre" type="text" placeholder="Nombre" value={nombre} onChange={this.handleChange} required />
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                        <div className="field">
                          <input name="apellidos" type="text" placeholder="Apellidos" value={apellidos} onChange={this.handleChange} required />
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                      </div>
                      <div className="field">
                        <input name="documento" type="text" placeholder="Número de documento" value={documento} onChange={this.handleChange} required />
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <div className="field">
                        <input name="email" type="email" placeholder="Correo electrónico" value={email} onChange={this.handleChange} required />
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>
                      </div>
                      <div className="field">
                        <input name="telefono" type="tel" placeholder="Teléfono" value={telefono} onChange={this.handleChange} required />
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3.09 4.18 2 2 0 0 1 5.07 2h3a2 2 0 0 1 2 1.72c.13 1 .37 1.97.72 2.9a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 5.91 5.91l1.18-1.18a2 2 0 0 1 2.11-.45c.93.35 1.9.59 2.9.72A2 2 0 0 1 22 16.92z"/></svg>
                      </div>
                      <div className="grid2">
                        <div className="field">
                          <input name="password" type="password" placeholder="Contraseña" value={password} onChange={this.handleChange} required />
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </div>
                        <div className="field">
                          <input name="confirmPassword" type="password" placeholder="Confirmar" value={confirmPassword} onChange={this.handleChange} required />
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
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
                  </div>
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
              <div className="view active">
                <div className="form-title">Recuperar acceso</div>
                <div className="form-sub">Te enviaremos un código a tu correo</div>
                {message.text && (
                  <div className={`msg ${message.isErr ? "err" : "ok"}`}>
                    {message.text}
                  </div>
                )}
                <form onSubmit={this.handleForgotPassword}>
                  <div className="field">
                    <input name="identifier" type="email" placeholder="tu@correo.com" value={identifier} onChange={this.handleChange} required />
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>
                  </div>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8 }}>
                    {loading ? "Enviando..." : "Enviar Código"}
                  </button>
                </form>
                <button className="back-btn" onClick={() => this.setState({ view: "auth" })}>← Volver al inicio de sesión</button>
              </div>
            )}

            {view === "reset" && (
              <div className="view active">
                <div className="form-title">Nueva contraseña</div>
                <div className="form-sub">Ingresa el código recibido y tu nueva clave</div>
                {message.text && (
                  <div className={`msg ${message.isErr ? "err" : "ok"}`}>
                    {message.text}
                  </div>
                )}
                <form onSubmit={this.handleResetPassword}>
                  <div className="field">
                    <input name="otp" type="text" placeholder="Código OTP" value={otp} onChange={this.handleChange} required maxLength="6" style={{ letterSpacing: 4, fontSize: 18, fontWeight: 600 }} />
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3v4M8 3v4M2 11h20"/></svg>
                  </div>
                  <div className="field">
                    <input name="password" type="password" placeholder="Nueva contraseña" value={password} onChange={this.handleChange} required />
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <div className="field">
                    <input name="confirmPassword" type="password" placeholder="Confirmar contraseña" value={confirmPassword} onChange={this.handleChange} required />
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? "Procesando..." : "Restablecer Contraseña"}
                  </button>
                </form>
                <button className="back-btn" onClick={() => this.setState({ view: "forgot" })}>¿No recibiste el código? Reenviar</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default Login;
