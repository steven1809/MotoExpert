import React, { useState } from 'react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const isLogin = tab === 'login';

  const switchTab = (t) => {
    setTab(t);
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (isLogin) {
        await authService.login(email, password);
        navigate('/');
      } else {
        if (password.length < 8) {
          setError('La contraseña debe tener mínimo 8 caracteres');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden');
          setLoading(false);
          return;
        }
        await authService.register(nombre, apellidos, documento, email, telefono, password);
        setSuccessMessage('¡Cuenta creada! Ahora inicia sesión');
        setTimeout(() => {
          switchTab('login');
          setSuccessMessage('');
        }, 2000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (isLogin ? 'Credenciales incorrectas o error de conexión' : 'Error al crear la cuenta')
      );
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: {
      minHeight: '100vh',
      background: '#0B1628',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      fontFamily: 'system-ui, sans-serif',
    },
    header: {
      textAlign: 'center',
      marginBottom: '36px',
    },
    logoRing: {
      width: '64px',
      height: '64px',
      border: '2px solid #3B82F6',
      borderRadius: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 18px',
      background: '#1D3A6E',
    },
    brand: {
      fontSize: '26px',
      fontWeight: 800,
      color: '#EFF6FF',
      letterSpacing: '-0.3px',
      lineHeight: 1,
    },
    brandAccent: {
      color: '#60A5FA',
    },
    tagline: {
      fontSize: '11px',
      fontWeight: 600,
      color: '#4A6FA8',
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      marginTop: '7px',
    },
    card: {
      background: '#112040',
      border: '1px solid #1E3A6A',
      borderRadius: '22px',
      padding: '28px 24px',
      width: '100%',
      maxWidth: '360px',
    },
    tabs: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: '#0B1628',
      border: '1px solid #1E3A6A',
      borderRadius: '13px',
      padding: '4px',
      gap: '4px',
      marginBottom: '26px',
    },
    tabBase: {
      padding: '11px',
      textAlign: 'center',
      fontSize: '12px',
      fontWeight: 800,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'all 0.16s',
    },
    tabActive: {
      background: '#3B82F6',
      color: '#fff',
    },
    tabInactive: {
      background: 'transparent',
      color: '#4A6FA8',
    },
    alertBase: {
      borderRadius: '12px',
      padding: '12px 14px',
      fontSize: '13px',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '9px',
      marginBottom: '18px',
    },
    alertError: {
      background: '#1A0A0A',
      border: '1px solid #7F1D1D',
      color: '#FCA5A5',
    },
    alertSuccess: {
      background: '#041A10',
      border: '1px solid #065F46',
      color: '#6EE7B7',
    },
    field: {
      marginBottom: '14px',
    },
    label: {
      fontSize: '10px',
      fontWeight: 800,
      color: '#4A6FA8',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      display: 'block',
      marginBottom: '7px',
    },
    inputWrap: {
      position: 'relative',
    },
    input: {
      width: '100%',
      height: '50px',
      background: '#0D1F3C',
      border: '1px solid #1E3A6A',
      borderRadius: '13px',
      padding: '0 14px 0 44px',
      color: '#EFF6FF',
      fontSize: '14px',
      fontWeight: 500,
      outline: 'none',
      boxSizing: 'border-box',
    },
    row2: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
      gap: '12px',
    },
    button: {
      width: '100%',
      height: '54px',
      background: '#3B82F6',
      border: 'none',
      borderRadius: '14px',
      color: '#fff',
      fontSize: '14px',
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: '0.09em',
      cursor: 'pointer',
      marginTop: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '9px',
      opacity: 1,
      transition: 'opacity 0.15s',
    },
    buttonDisabled: {
      opacity: 0.45,
      cursor: 'not-allowed',
    },
    footer: {
      marginTop: '22px',
      fontSize: '12px',
      color: '#4A6FA8',
      textAlign: 'center',
      fontWeight: 600,
    },
    footerLink: {
      color: '#60A5FA',
      cursor: 'pointer',
      fontWeight: 700,
    },
  };

  const InputField = ({ label, icon, type, placeholder, value, onChange, style }) => (
    <div style={{ ...styles.field, ...style }}>
      <label style={styles.label}>{label}</label>
      <div style={styles.inputWrap}>
        <span style={{
          position: 'absolute',
          left: '15px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#4A6FA8',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
        }}>
          {icon}
        </span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          style={styles.input}
          onFocus={e => (e.target.style.borderColor = '#3B82F6')}
          onBlur={e => (e.target.style.borderColor = '#1E3A6A')}
        />
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.logoRing}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
          </svg>
        </div>
        <div style={styles.brand}>
          Moto<span style={styles.brandAccent}>Expert</span>
        </div>
        <div style={styles.tagline}>Gestión de taller</div>
      </div>

      <div style={styles.card}>
        {error && (
          <div style={{ ...styles.alertBase, ...styles.alertError }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}
        {successMessage && (
          <div style={{ ...styles.alertBase, ...styles.alertSuccess }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {successMessage}
          </div>
        )}

        <div style={styles.tabs}>
          <button
            type="button"
            style={{ ...styles.tabBase, ...(isLogin ? styles.tabActive : styles.tabInactive) }}
            onClick={() => switchTab('login')}
          >
            Ingresar
          </button>
          <button
            type="button"
            style={{ ...styles.tabBase, ...(!isLogin ? styles.tabActive : styles.tabInactive) }}
            onClick={() => switchTab('register')}
          >
            Registro
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div style={styles.row2}>
                <InputField
                  label="Nombre"
                  type="text"
                  placeholder="Juan"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                />
                <InputField
                  label="Apellidos"
                  type="text"
                  placeholder="García"
                  value={apellidos}
                  onChange={e => setApellidos(e.target.value)}
                  icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                />
              </div>
              <div style={styles.row2}>
                <InputField
                  label="Documento"
                  type="text"
                  placeholder="CC / NIT"
                  value={documento}
                  onChange={e => setDocumento(e.target.value)}
                  icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
                />
                <InputField
                  label="Teléfono"
                  type="tel"
                  placeholder="3001234567"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}
                />
              </div>
            </>
          )}

          <InputField
            label="Correo electrónico"
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
          />

          {!isLogin ? (
            <div style={styles.row2}>
              <InputField
                label="Contraseña"
                type="password"
                placeholder="Min. 8 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              />
              <InputField
                label="Confirmar"
                type="password"
                placeholder="Repetir"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              />
            </div>
          ) : (
            <InputField
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
            />
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" style={{ animation: 'spin 0.7s linear infinite' }} />
              </svg>
            ) : isLogin ? (
              <>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Iniciar sesión
              </>
            ) : (
              <>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                Crear cuenta
              </>
            )}
          </button>
        </form>
      </div>

      <div style={styles.footer}>
        {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
        <span
          style={styles.footerLink}
          onClick={() => switchTab(isLogin ? 'register' : 'login')}
        >
          {isLogin ? 'Regístrate' : 'Inicia sesión'}
        </span>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #2D4A7A; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #0D1F3C inset !important;
          -webkit-text-fill-color: #EFF6FF !important;
        }
      `}</style>
    </div>
  );
};

export default Login;