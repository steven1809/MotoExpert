import React, { useState } from 'react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, User, Phone, FileText } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
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
          setError('La contraseña debe tener al menos 8 caracteres');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden');
          setLoading(false);
          return;
        }
        await authService.register(nombre, apellidos, documento, email, telefono, password);
        setSuccessMessage('¡Registro exitoso! Ahora inicia sesión');
        setTimeout(() => {
          setIsLogin(true);
          setSuccessMessage('');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || (isLogin ? 'Credenciales incorrectas o error de conexión' : 'Error al crear la cuenta'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '30px',
      backgroundColor: '#F8FAFC'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ 
          width: '70px', 
          height: '70px', 
          backgroundColor: '#2563EB', 
          borderRadius: '22px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 10px 25px rgba(37, 99, 235, 0.25)'
        }}>
          <span style={{ color: 'white', fontSize: '32px', fontWeight: '900', fontStyle: 'italic' }}>A</span>
        </div>
        <h1 style={{ fontSize: '32px', color: '#0F172A', marginBottom: '5px' }}>AutoClean</h1>
        <p style={{ color: '#64748B', fontSize: '15px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detailing Profesional</p>
      </div>

      <div className="card" style={{ padding: '30px' }}>
        {error && (
          <div style={{ 
            backgroundColor: '#FEF2F2', 
            border: '1px solid #FCA5A5', 
            color: '#B91C1C', 
            padding: '12px', 
            borderRadius: '16px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600',
            marginBottom: '15px'
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {successMessage && (
          <div style={{ 
            backgroundColor: '#ECFDF5', 
            border: '1px solid #6EE7B7', 
            color: '#065F46', 
            padding: '12px', 
            borderRadius: '16px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600',
            marginBottom: '15px'
          }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {!isLogin && (
            <>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', marginLeft: '4px' }}>Nombre</label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={18} />
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '56px',
                      backgroundColor: '#F1F5F9',
                      borderRadius: '18px',
                      padding: '0 16px 0 48px',
                      color: '#0F172A',
                      fontSize: '15px',
                      fontWeight: '600',
                      border: '1px solid transparent'
                    }}
                  />
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', marginLeft: '4px' }}>Apellidos</label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={18} />
                  <input
                    type="text"
                    placeholder="Tus apellidos"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '56px',
                      backgroundColor: '#F1F5F9',
                      borderRadius: '18px',
                      padding: '0 16px 0 48px',
                      color: '#0F172A',
                      fontSize: '15px',
                      fontWeight: '600',
                      border: '1px solid transparent'
                    }}
                  />
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', marginLeft: '4px' }}>Documento</label>
                <div style={{ position: 'relative' }}>
                  <FileText style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={18} />
                  <input
                    type="text"
                    placeholder="Número de documento"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '56px',
                      backgroundColor: '#F1F5F9',
                      borderRadius: '18px',
                      padding: '0 16px 0 48px',
                      color: '#0F172A',
                      fontSize: '15px',
                      fontWeight: '600',
                      border: '1px solid transparent'
                    }}
                  />
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', marginLeft: '4px' }}>Teléfono</label>
                <div style={{ position: 'relative' }}>
                  <Phone style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={18} />
                  <input
                    type="tel"
                    placeholder="Tu teléfono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '56px',
                      backgroundColor: '#F1F5F9',
                      borderRadius: '18px',
                      padding: '0 16px 0 48px',
                      color: '#0F172A',
                      fontSize: '15px',
                      fontWeight: '600',
                      border: '1px solid transparent'
                    }}
                  />
                </div>
              </div>
            </>
          )}

          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', marginLeft: '4px' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={18} />
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: '56px',
                  backgroundColor: '#F1F5F9',
                  borderRadius: '18px',
                  padding: '0 16px 0 48px',
                  color: '#0F172A',
                  fontSize: '15px',
                  fontWeight: '600',
                  border: '1px solid transparent'
                }}
              />
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', marginLeft: '4px' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={18} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: '56px',
                  backgroundColor: '#F1F5F9',
                  borderRadius: '18px',
                  padding: '0 16px 0 48px',
                  color: '#0F172A',
                  fontSize: '15px',
                  fontWeight: '600',
                  border: '1px solid transparent'
                }}
              />
            </div>
          </div>

          {!isLogin && (
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', marginLeft: '4px' }}>Confirmar contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '56px',
                    backgroundColor: '#F1F5F9',
                    borderRadius: '18px',
                    padding: '0 16px 0 48px',
                    color: '#0F172A',
                    fontSize: '15px',
                    fontWeight: '600',
                    border: '1px solid transparent'
                  }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ marginTop: '10px', height: '60px' }}
          >
            {loading ? (isLogin ? 'Ingresando...' : 'Creando cuenta...') : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <p style={{ color: '#64748B', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
          {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <span
            style={{ color: '#2563EB', fontWeight: '800' }}
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccessMessage('');
            }}
          >
            {isLogin ? 'Regístrate' : 'Inicia Sesión'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
