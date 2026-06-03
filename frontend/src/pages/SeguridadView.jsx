import React, { Component } from 'react'; 
import emailjs from '@emailjs/browser'; 
import FaceAuthModal from '../components/FaceAuthModal'; // ← Ruta corregida para componentes

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@300;400;500;600&display=swap');

.seguridad-container {
  min-height: 100vh;
  background: #020617;
  font-family: 'Barlow', sans-serif;
  padding: 40px;
}

.seguridad-container h2 {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 36px;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.seguridad-container > p {
  color: #64748b;
  font-size: 14px;
  margin-bottom: 40px;
}

.seguridad-card {
  background: rgba(15,23,42,0.65);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 28px;
  padding: 32px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
}

.seguridad-header-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.icon-shield {
  font-size: 32px;
  width: 56px;
  height: 56px;
  border-radius: 20px;
  background: rgba(120,220,255,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.seguridad-header-info h3 {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: #ffffff;
  margin: 0;
}

.seguridad-header-info p {
  color: #64748b;
  font-size: 14px;
  margin: 0;
}

.btn-primary, .btn-verify {
  width: 100%;
  padding: 14px;
  background: rgba(0,180,220,0.25);
  border: 1px solid rgba(0,212,255,0.4);
  border-radius: 12px;
  color: rgba(255,255,255,0.95);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 17px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled), .btn-verify:hover:not(:disabled) {
  background: rgba(0,180,220,0.35);
  box-shadow: 0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 24px rgba(0,180,220,0.35);
}

.btn-primary:disabled, .btn-verify:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(16,185,129,0.12);
  color: #34d399;
  border: 1px solid rgba(16,185,129,0.25);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  width: fit-content;
}

.btn-danger {
  width: 100%;
  padding: 14px;
  background: rgba(239,68,68,0.12);
  border: 1px solid rgba(239,68,68,0.25);
  border-radius: 12px;
  color: #f87171;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 17px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: rgba(239,68,68,0.2);
}

.otp-verification-flow {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-box {
  background: rgba(120,220,255,0.1);
  border: 1px solid rgba(120,220,255,0.2);
  border-radius: 12px;
  padding: 12px;
  color: #ffffff;
  font-size: 14px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
}

.otp-input {
  padding: 14px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 12px;
  font-size: 18px;
  color: rgba(255,255,255,0.9);
  text-align: center;
  letter-spacing: 8px;
  outline: none;
}

.actions-group {
  display: flex;
  gap: 12px;
}

.btn-cancel {
  flex: 1;
  padding: 14px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: rgba(255,255,255,0.7);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 17px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
}

.btn-verify {
  flex: 1;
}
`;

export default class SeguridadView extends Component { 
  constructor(props) { 
    super(props); 
    this.state = { 
      verificationStep: false, 
      isFaceIdRegistered: false,
      showFaceScanner: false, 
      emailCode: '', 
      generatedCode: '', 
      userEmail: 'iansteven1820@gmail.com', 
      loading: false 
    }; 
  } 

  componentDidMount() { 
    // Clean up old global flag if it exists
    if (localStorage.getItem('faceId_registered')) {
      localStorage.removeItem('faceId_registered');
    }
    
    // Get current user's email from localStorage
    const currentEmail = localStorage.getItem('userEmail') || this.state.userEmail;
    this.setState({ userEmail: currentEmail });
    
    // Verify if THIS user has Face ID registered locally 
    const hasBiometrics = localStorage.getItem(`faceId_registered_${currentEmail}`) === 'true'; 
    this.setState({ isFaceIdRegistered: hasBiometrics }); 
  } 
 
  generarCodigoOTP = () => { 
    return Math.floor(100000 + Math.random() * 900000).toString(); 
  }; 
 
  iniciarValidacionCorreo = async () => { 
    this.setState({ loading: true }); 
    const nuevoCodigo = this.generarCodigoOTP(); 
 
    const templateParams = {
      to_email: this.state.userEmail,       // Vincula al {{to_email}} de tu panel
      to_name: 'Steven Diaz',              
      codigo_verificacion: nuevoCodigo    // Vincula al {{codigo_verificacion}} de tu panel
    };
 
    try { 
      // REEMPLAZA AQUÍ LAS CREDENCIALES DE TU PROPIO PANEL:
      await emailjs.send( 
        'service_1zw6lr5',       // Reemplaza 'service_1zw6lr5' por el tuyo
        'template_phtm2dl',           // Reemplaza por tu Template ID si es diferente a este
        templateParams,
        'DnCU3e4N9NdapUEmI'        // Coloca tu Public Key real de la sección 'Account'
      ); 
 
      this.setState({ 
        generatedCode: nuevoCodigo, 
        verificationStep: true, 
        loading: false 
      }); 
       
      alert(`¡Código de verificación enviado a ${this.state.userEmail}!`); 
    } catch (error) { 
      console.error('Error al enviar con EmailJS:', error); 
      this.setState({ loading: false }); 
      alert(`No se pudo enviar el código. Motivo: ${error.text || error.message || error}`); 
    } 
  };
 
  handleCodeChange = (e) => { 
    this.setState({ emailCode: e.target.value }); 
  }; 
 
  verificarCodigoYRegistrar = () => { 
    const { emailCode, generatedCode } = this.state; 
 
    if (emailCode.trim() !== generatedCode) { 
      alert("El código ingresado es incorrecto. Por favor, verifícalo."); 
      return; 
    } 
 
    // Al ser correcto el OTP de EmailJS, abrimos tu modal de reconocimiento facial
    this.setState({ showFaceScanner: true });
  }; 

  handleFaceEnrollSuccess = () => {
    const email = localStorage.getItem('userEmail') || this.state.userEmail;
    
    // Set registration flag tied to THIS user's email
    localStorage.setItem(`faceId_registered_${email}`, 'true');
    
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const userPicture = localStorage.getItem('userPicture');
    
    if (token) {
      localStorage.setItem(`faceToken_${email}`, token);
      localStorage.setItem(`faceRole_${email}`, role);
      localStorage.setItem(`faceUserId_${email}`, userId);
      localStorage.setItem(`faceUserName_${email}`, userName);
      localStorage.setItem(`facePicture_${email}`, userPicture || '');
    }

    this.setState({ 
      isFaceIdRegistered: true, 
      verificationStep: false,
      showFaceScanner: false 
    }); 
    
    alert("¡Rostro registrado exitosamente en este dispositivo!");
  };

  eliminarFaceID = () => { 
    const email = localStorage.getItem('userEmail') || this.state.userEmail;
    // Remove registration flag tied to THIS user's email
    localStorage.removeItem(`faceId_registered_${email}`);
    localStorage.removeItem(`faceDescriptor_${email}`);
    localStorage.removeItem(`faceToken_${email}`);
    localStorage.removeItem(`faceRole_${email}`);
    localStorage.removeItem(`faceUserId_${email}`);
    localStorage.removeItem(`faceUserName_${email}`);
    localStorage.removeItem(`facePicture_${email}`);
    this.setState({ isFaceIdRegistered: false }); 
    alert("Registro de Face ID eliminado del dispositivo."); 
  }; 
 
  render() { 
    const { verificationStep, isFaceIdRegistered, showFaceScanner, emailCode, userEmail, loading } = this.state; 
 
    return ( 
      <div className="seguridad-container">
        <style>{STYLE}</style>

        <button 
          className="back-to-return" 
          onClick={() => this.props.setView('cuenta')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#94a3b8',
            textTransform: 'uppercase',
            fontSize: '12px',
            letterSpacing: '1px',
            fontWeight: 600,
            cursor: 'pointer',
            background: 'transparent',
            border: 'none',
            marginBottom: '24px'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Volver a Cuenta
        </button>
        
        <h2>Seguridad de la Cuenta</h2> 
        <p>Gestiona tus métodos de autenticación y seguridad</p> 
 
        <div className="seguridad-card"> 
          <div className="seguridad-header-info"> 
            <span className="icon-shield">🛡️</span> 
            <div> 
              <h3>Autenticación Biométrica</h3> 
              <p>Face ID / Reconocimiento Facial</p> 
            </div> 
          </div> 
 
          <div className="seguridad-body"> 
            {isFaceIdRegistered ? ( 
              <div className="status-container"> 
                <span className="status-badge">● Activo en este dispositivo</span> 
                <button onClick={this.eliminarFaceID} className="btn-danger"> 
                  ELIMINAR REGISTRO 
                </button> 
              </div> 
            ) : !verificationStep ? ( 
              <button 
                onClick={this.iniciarValidacionCorreo} 
                className="btn-primary" 
                disabled={loading} 
              > 
                {loading ? "ENVIANDO..." : "CONFIGURAR FACE ID"} 
              </button> 
            ) : ( 
              <div className="otp-verification-flow"> 
                <div className="info-box"> 
                  Se ha enviado un código de verificación a <strong>{userEmail}</strong> 
                </div> 
                
                <div className="input-group"> 
                  <label>CÓDIGO DE VERIFICACIÓN</label> 
                  <input 
                    type="text" 
                    placeholder="000000" 
                    value={emailCode} 
                    onChange={this.handleCodeChange} 
                    maxLength={6} 
                    className="otp-input" 
                  /> 
                </div> 
 
                <div className="actions-group"> 
                  <button 
                    onClick={this.verificarCodigoYRegistrar} 
                    className="btn-verify" 
                    disabled={loading} 
                  > 
                    {loading ? "PROCESANDO..." : "VERIFICAR Y CONTINUAR"} 
                  </button> 
                  <button 
                    onClick={() => this.setState({ verificationStep: false })} 
                    className="btn-cancel" 
                  > 
                    CANCELAR 
                  </button> 
                </div> 
              </div> 
            )} 
          </div> 
        </div> 

        {showFaceScanner && (
          <FaceAuthModal
            userId={userEmail}
            mode="enroll"
            onSuccess={this.handleFaceEnrollSuccess}
            onError={(msg) => alert(msg)}
            onClose={() => this.setState({ showFaceScanner: false })}
          />
        )}
      </div> 
    ); 
  } 
}