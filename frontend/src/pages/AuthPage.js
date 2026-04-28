import React, { Component } from 'react';

class AuthPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLogin: true,
      email: '',
      password: '',
      confirmPassword: '',
    };
  }

  toggleMode = () => {
    this.setState((prevState) => ({
      isLogin: !prevState.isLogin,
      email: '',
      password: '',
      confirmPassword: '',
    }));
  };

  handleInputChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  handleSubmit = (event) => {
    event.preventDefault();
    const { isLogin, email, password, confirmPassword } = this.state;
    
    if (isLogin) {
      console.log('Iniciando sesión con:', { email, password });
    } else {
      if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
      }
      console.log('Registrando con:', { email, password });
    }
  };

  render() {
    const { isLogin } = this.state;

    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
          {/* Cabecera Azul */}
          <div className="bg-blue-600 py-6 px-4">
            <h1 className="text-3xl font-bold text-white text-center tracking-tight">
              MotoExpert
            </h1>
          </div>

          {/* Cuerpo de la Tarjeta */}
          <div className="p-8">
            <h2 className="text-xl font-semibold text-gray-100 mb-6 text-center">
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>

            <form onSubmit={this.handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  value={this.state.email}
                  onChange={this.handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  name="password"
                  value={this.state.password}
                  onChange={this.handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Confirmar Contraseña (Solo en modo Registro) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={this.state.confirmPassword}
                    onChange={this.handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              )}

              {/* Botón de Envío */}
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-lg transform hover:scale-[1.02] transition-all duration-200 mt-2"
              >
                {isLogin ? 'Ingresar' : 'Registrarse'}
              </button>
            </form>

            {/* Enlaces Inferiores */}
            <div className="mt-6 flex flex-col items-center space-y-3">
              {isLogin && (
                <div className="flex items-center space-x-4 text-sm">
                  <button className="text-gray-400 hover:text-white transition-colors">
                    ¿Olvidaste tu contraseña?
                  </button>
                  <span className="text-gray-600">|</span>
                  <button
                    onClick={this.toggleMode}
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    Registrarse
                  </button>
                </div>
              )}

              {!isLogin && (
                <button
                  onClick={this.toggleMode}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  ¿Ya tienes cuenta? <span className="text-blue-400">Inicia sesión</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default AuthPage;
