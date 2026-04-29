import React, { useState } from "react";

const Navbar = ({ setView, setIsLoggedIn, setUserRole, handleLogout,userRole }) => {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => setOpen(!open);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between relative">
        
        {/* Espaciador invisible para mantener flex-between en móvil */}
        <div className="md:hidden w-10"></div>

        {/* Logo */}
        <div 
          className="flex items-center space-x-2 cursor-pointer absolute left-1/2 transform -translate-x-1/2 md:relative md:transform-none md:left-auto" 
          onClick={() => setView("dashboard")}
        >
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold text-white" translate="no">M</span>
          </div>
          <span className="text-xl font-bold tracking-tighter bg-gradient-to-r from-white via-blue-100 to-slate-400 bg-clip-text text-transparent group-hover:from-blue-400 group-hover:to-white transition-all duration-500">
            MotoExpert
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 ml-auto">
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
          <button 
            onClick={() => setView("vehiculos")} 
            className="text-sm font-medium text-slate-400 hover:text-blue-500 transition-colors"
          >
            Vehículos
          </button>
          <button 
            onClick={() => setView("citas")} 
            className="text-sm font-medium text-slate-400 hover:text-blue-500 transition-colors"
          >
            Citas
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
          
          {/* Sidebar al 75% a la derecha - FONDO AZUL OSCURO PROFUNDO */}
          <div className="absolute top-0 right-0 w-[75%] h-full bg-[#020617] border-l border-blue-900/50 p-6 flex flex-col space-y-6 shadow-2xl transform transition-transform duration-300">
            <div className="flex justify-between items-center border-b border-blue-900/30 pb-4">
              <span className="text-white font-bold tracking-tighter text-xl">Menú</span>
              <button onClick={toggleMenu} className="p-2 bg-blue-900/30 text-white hover:bg-blue-800/50 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col space-y-4">
              <button 
                className="text-xl font-medium text-white py-3 border-b border-blue-900/20 text-left flex items-center space-x-3 hover:text-blue-400 transition-colors" 
                onClick={() => { setView("dashboard"); toggleMenu(); }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Inicio</span>
              </button>
              <button 
                className="text-xl font-medium text-white py-3 border-b border-blue-900/20 text-left flex items-center space-x-3 hover:text-blue-400 transition-colors" 
                onClick={() => { setView("servicios"); toggleMenu(); }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Servicios</span>
              </button>
              <button 
                className="text-xl font-medium text-white py-3 border-b border-blue-800 text-left flex items-center space-x-2 hover:text-blue-200 transition-colors" 
                onClick={() => { setView("vehiculos"); toggleMenu(); }}
              >
                <span>🏍️</span> <span>Vehículos</span>
              </button>
              <button 
                className="text-xl font-medium text-white py-3 border-b border-blue-800 text-left flex items-center space-x-2 hover:text-blue-200 transition-colors" 
                onClick={() => { setView("citas"); toggleMenu(); }}
              >
                <span>📅</span> <span>Citas</span>
              </button>
              
              {userRole === "admin" && (
                <button 
                  className="text-xl font-bold text-blue-400 py-3 border-b border-blue-900/20 text-left flex items-center space-x-3 hover:text-blue-300 transition-colors" 
                  onClick={() => { setView("users"); toggleMenu(); }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>Ver Usuarios</span>
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
