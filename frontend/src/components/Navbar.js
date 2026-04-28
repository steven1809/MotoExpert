import React, { useState } from "react";

const Navbar = ({ setView, setIsLoggedIn, setUserRole, userRole }) => {
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  };

  const toggleMenu = () => setOpen(!open);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div 
          className="flex items-center space-x-2 cursor-pointer" 
          onClick={() => setView("dashboard")}
        >
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold text-white">M</span>
          </div>
          <span className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            MotoExpert
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <button 
            onClick={() => setView("dashboard")} 
            className="text-sm font-medium text-slate-400 hover:text-blue-500 transition-colors"
          >
            Inicio
          </button>
          <button 
            onClick={() => setView("servicios")} 
            className="text-sm font-medium text-slate-400 hover:text-blue-500 transition-colors"
          >
            Servicios
          </button>
          
          {userRole === "admin" && (
            <button 
              onClick={() => setView("users")} 
              className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors border border-blue-400/30 px-3 py-1 rounded-md bg-blue-400/10"
            >
              Ver Usuarios
            </button>
          )}

          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-full transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]"
          >
            Cerrar Sesión
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all border border-slate-700 shadow-lg"
          onClick={toggleMenu}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Overlay & Sidebar */}
      {open && (
        <div className="fixed inset-0 z-[9999] md:hidden">
          {/* Fondo con desenfoque (Backdrop blur) */}
          <div 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={toggleMenu}
          ></div>
          
          {/* Sidebar al 75% a la derecha - FONDO AZUL OSCURO SÓLIDO */}
          <div className="absolute top-0 right-0 w-[75%] h-full bg-[#1e3a8a] border-l border-blue-900 p-6 flex flex-col space-y-6 shadow-2xl transform transition-transform duration-300">
            <div className="flex justify-between items-center border-b border-blue-800 pb-4">
              <span className="text-white font-bold tracking-tighter text-xl">Menú</span>
              <button onClick={toggleMenu} className="p-2 bg-blue-900 text-white hover:bg-blue-800 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col space-y-4">
              <button 
                className="text-xl font-medium text-white py-3 border-b border-blue-800 text-left flex items-center space-x-2 hover:text-blue-200 transition-colors" 
                onClick={() => { setView("dashboard"); toggleMenu(); }}
              >
                <span>🏠</span> <span>Inicio</span>
              </button>
              <button 
                className="text-xl font-medium text-white py-3 border-b border-blue-800 text-left flex items-center space-x-2 hover:text-blue-200 transition-colors" 
                onClick={() => { setView("servicios"); toggleMenu(); }}
              >
                <span>🛠️</span> <span>Servicios</span>
              </button>
              
              {userRole === "admin" && (
                <button 
                  className="text-xl font-bold text-blue-200 py-3 border-b border-blue-800 text-left flex items-center space-x-2 hover:text-white transition-colors" 
                  onClick={() => { setView("users"); toggleMenu(); }}
                >
                  <span>👥</span> <span>Ver Usuarios</span>
                </button>
              )}
            </nav>

            <div className="mt-auto">
              <button 
                onClick={handleLogout}
                className="w-full py-4 bg-red-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center space-x-2"
              >
                <span>🚪</span> <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
