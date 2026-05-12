import React, { Component } from "react";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nombre: "",
      apellidos: "",
      documento: "",
      email: "",
      telefono: "",
      password: "",
      confirmPassword: "",
      aceptaTerminos: false,
      showModal: false,
      loading: false,
      isLogin: props.initialMode !== "register", 
      view: "auth", 
      identifier: "", 
      otp: "",
    };
  }

  handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    this.setState({ 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  toggleModal = () => {
    this.setState((prevState) => ({ showModal: !prevState.showModal }));
  };

  toggleMode = () => {
    this.setState((prevState) => ({
      isLogin: !prevState.isLogin,
      nombre: "", apellidos: "", documento: "", email: "", telefono: "", password: "", confirmPassword: "",
      aceptaTerminos: false,
      loading: false,
      view: "auth"
    }));
  };

  handleForgotPassword = async (e) => {
    e.preventDefault();
    this.setState({ loading: true });
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: this.state.identifier }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        this.setState({ view: "reset" });
      } else {
        alert(data.message || "Error al solicitar recuperación");
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      this.setState({ loading: false });
    }
  };

  handleResetPassword = async (e) => {
    e.preventDefault();
    const { identifier, otp, password, confirmPassword } = this.state;
    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    this.setState({ loading: true });
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp, password, confirmPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        this.setState({ view: "auth", isLogin: true, identifier: "", otp: "", password: "", confirmPassword: "" });
      } else {
        alert(data.message || "Error al restablecer contraseña");
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      this.setState({ loading: false });
    }
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { nombre, apellidos, documento, email, telefono, password, confirmPassword, aceptaTerminos, isLogin } = this.state;

    if (!isLogin && password !== confirmPassword) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    if (!isLogin && !aceptaTerminos) {
      alert("Debes aceptar los términos y condiciones para registrarte.");
      return;
    }

    this.setState({ loading: true });

    // Endpoint configurado para tu backend NestJS
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
          const userRoleFromServer = data.role;
          
          localStorage.setItem("token", data.access_token);
          localStorage.setItem("role", userRoleFromServer);
          localStorage.setItem("userId", data.userId || "");
          localStorage.setItem("userName", data.nombre || "");
          localStorage.setItem("userEmail", email || "");
          this.props.onLoginSuccess(userRoleFromServer);
        } else {
          alert("¡Registro exitoso! Ya puedes iniciar sesión.");
          this.toggleMode();
        }
      } else {
        
        alert(data.message || "Error en los datos proporcionados.");
      }
    } catch (error) {
      
      alert("No se pudo conectar con el servidor. Verifica que NestJS esté corriendo en el puerto 3001.");
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { isLogin, loading, nombre, apellidos, documento, email, telefono, password, confirmPassword, aceptaTerminos, showModal, view, identifier, otp } = this.state;

    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all">
        {/* Modal de Términos y Condiciones */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                <h3 className="text-xl font-bold">Términos y Condiciones</h3>
                <button onClick={this.toggleModal} className="text-white hover:text-blue-200 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-8 overflow-y-auto text-gray-600 leading-relaxed space-y-4 text-sm">
                <p className="font-bold text-gray-800 uppercase">Aviso Legal - MotoExpert</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                <p>Al utilizar esta plataforma, usted acepta que MotoExpert recopile y procese sus datos personales de acuerdo con nuestra política de privacidad para fines de gestión de servicios mecánicos y comunicación directa.</p>
                <p>El acceso a la plataforma es personal e intransferible. El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.</p>
              </div>
              <div className="p-6 border-t bg-gray-50 flex justify-end">
                <button 
                  onClick={this.toggleModal}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-md active:scale-95"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-600 p-8 text-center text-white">
          <h2 className="text-4xl font-extrabold italic tracking-tighter">MotoExpert</h2>
          <p className="mt-2 opacity-90 font-medium">
            {view === "forgot" ? "Recuperar Contraseña" : view === "reset" ? "Nueva Contraseña" : isLogin ? "Accede a tu cuenta" : "Crea tu perfil"}
          </p>
        </div>

        {/* INTERFAZ DE SOLICITUD DE RECUPERACIÓN */}
        {view === "forgot" && (
          <form onSubmit={this.handleForgotPassword} className="p-8 space-y-6">
            <div className="space-y-2 text-center mb-4">
              <p className="text-sm text-gray-600">Ingresa tu correo, teléfono o documento para recibir un código de recuperación.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase ml-1">Identificador</label>
              <input 
                name="identifier" 
                type="text" 
                placeholder="Email, Teléfono o Documento" 
                value={identifier} 
                onChange={this.handleChange} 
                className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" 
                required 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {loading ? "Procesando..." : "Enviar código de recuperación"}
            </button>
            <div className="text-center">
              <button 
                type="button" 
                onClick={() => this.setState({ view: "auth", isLogin: true })} 
                className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Volver al inicio de sesión
              </button>
            </div>
          </form>
        )}

        {/* INTERFAZ DE VALIDACIÓN Y NUEVA CLAVE */}
        {view === "reset" && (
          <form onSubmit={this.handleResetPassword} className="p-8 space-y-4">
            <div className="space-y-2 text-center mb-4">
              <p className="text-sm text-gray-600">Ingresa el código enviado y tu nueva contraseña.</p>
              <p className="text-xs text-blue-600 font-bold italic">Código de prueba: 123456</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase ml-1">Código OTP</label>
              <input 
                name="otp" 
                type="text" 
                placeholder="123456" 
                value={otp} 
                onChange={this.handleChange} 
                className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" 
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase ml-1">Nueva Clave</label>
                <input name="password" type="password" placeholder="••••••••" value={password} onChange={this.handleChange} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase ml-1">Confirmar</label>
                <input name="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={this.handleChange} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" required />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading || !otp || !password || password !== confirmPassword} 
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 text-white ${loading || !otp || !password || password !== confirmPassword ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {loading ? "Procesando..." : "Restablecer Contraseña"}
            </button>
            <div className="text-center">
              <button 
                type="button" 
                onClick={() => this.setState({ view: "forgot" })} 
                className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                ¿No recibiste el código? Reenviar
              </button>
            </div>
          </form>
        )}

        {/* INTERFAZ DE LOGIN / REGISTRO */}
        {view === "auth" && (
          <form onSubmit={this.handleSubmit} className="p-8 space-y-4">
            
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase ml-1">Nombre</label>
                  <input name="nombre" type="text" value={nombre} onChange={this.handleChange} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase ml-1">Apellidos</label>
                  <input name="apellidos" type="text" value={apellidos} onChange={this.handleChange} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" required />
                </div>
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase ml-1">Número de Documento</label>
                <input name="documento" type="text" placeholder="ID de identificación" value={documento} onChange={this.handleChange} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" required />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase ml-1">Correo Electrónico</label>
              <input name="email" type="email" placeholder="tu@email.com" value={email} onChange={this.handleChange} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" required />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase ml-1">Teléfono</label>
                <input name="telefono" type="tel" placeholder="3001234567" value={telefono} onChange={this.handleChange} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" required />
              </div>
            )}

            <div className={!isLogin ? "grid grid-cols-2 gap-4" : "space-y-4"}>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase ml-1">Contraseña</label>
                <input name="password" type="password" placeholder="••••••••" value={password} onChange={this.handleChange} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" required />
                {isLogin && (
                  <div className="mt-1 text-right">
                    <button 
                      type="button" 
                      onClick={() => this.setState({ view: "forgot", identifier: email })}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      ¿Olvidó su contraseña?
                    </button>
                  </div>
                )}
              </div>
              {!isLogin && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase ml-1">Confirmar</label>
                  <input name="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={this.handleChange} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" required />
                </div>
              )}
            </div>

            {!isLogin && (
              <div className="flex items-start space-x-2 py-2">
                <input 
                  id="aceptaTerminos"
                  name="aceptaTerminos" 
                  type="checkbox" 
                  checked={aceptaTerminos} 
                  onChange={this.handleChange} 
                  className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  required 
                />
                <label htmlFor="aceptaTerminos" className="text-sm text-gray-600 cursor-pointer select-none">
                  Acepto los <button type="button" onClick={this.toggleModal} className="text-blue-600 font-bold hover:underline">Términos y Condiciones</button> de uso
                </label>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || (!isLogin && !aceptaTerminos)} 
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 text-white ${loading || (!isLogin && !aceptaTerminos) ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {loading ? "Procesando..." : isLogin ? "Entrar" : "Registrarse"}
            </button>

            <div className="flex flex-col items-center space-y-2 pt-2">
              <button type="button" onClick={this.toggleMode} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia Sesión"}
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }
}

export default Login;
