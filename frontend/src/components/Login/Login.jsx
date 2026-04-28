import React, { Component } from "react";

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nombre: "",
      apellidos: "",
      email: "",
      telefono: "",
      password: "",
      confirmPassword: "",
      loading: false,
      isLogin: true, 
    };
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  toggleMode = () => {
    this.setState((prevState) => ({
      isLogin: !prevState.isLogin,
      nombre: "", apellidos: "", email: "", telefono: "", password: "", confirmPassword: "",
      loading: false // Reset por seguridad
    }));
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { nombre, apellidos, email, telefono, password, confirmPassword, isLogin } = this.state;

    if (!isLogin && password !== confirmPassword) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    this.setState({ loading: true });

    // Endpoint configurado para tu backend NestJS
    const endpoint = isLogin ? "/auth/login" : "/auth/register";
    
    // Objeto con los datos exactos que pide el backend
    const payload = isLogin 
      ? { email, password } 
      : { nombre, apellidos, email, telefono, password };

    try {
      const res = await fetch(`http://localhost:3001${endpoint}`, {
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
          this.props.onLoginSuccess(userRoleFromServer);
        } else {
          alert("¡Registro exitoso! Ya puedes iniciar sesión.");
          this.toggleMode();
        }
      } else {
        
        alert(data.message || "Error en los datos proporcionados.");
      }
    } catch (error) {
      
      alert("No se pudo conectar con el servidor. Verifica que NestJS esté corriendo en el puerto 3000.");
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { isLogin, loading, nombre, apellidos, email, telefono, password, confirmPassword } = this.state;

    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all">
        <div className="bg-blue-600 p-8 text-center text-white">
          <h2 className="text-4xl font-extrabold italic tracking-tighter">MotoExpert</h2>
          <p className="mt-2 opacity-90 font-medium">
            {isLogin ? "Accede a tu cuenta" : "Crea tu perfil"}
          </p>
        </div>

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
            </div>
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase ml-1">Confirmar</label>
                <input name="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={this.handleChange} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" required />
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? "Procesando..." : isLogin ? "Entrar" : "Registrarse"}
          </button>

          <div className="flex flex-col items-center space-y-2 pt-2">
            <button type="button" onClick={this.toggleMode} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
              {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia Sesión"}
            </button>
          </div>
        </form>
      </div>
    );
  }
}

export default Login;