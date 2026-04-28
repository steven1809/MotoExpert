import React, { useState } from "react";
import Login from "./components/Login/Login"; 
import Servicios from "./pages/Servicios";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [userRole, setUserRole] = useState("admin"); // 'admin' o 'user'
  const [view, setView] = useState("dashboard"); 

  const handleLoginSuccess = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setView("dashboard");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0f172a] text-white">
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shadow-2xl">
        <div className="p-6 bg-blue-600 text-white font-bold text-xl text-center italic">
          MotoExpert
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button onClick={() => setView("dashboard")} className={`w-full text-left px-4 py-3 rounded-lg transition ${view === 'dashboard' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
            🏠 Inicio
          </button>
          <button onClick={() => setView("servicios")} className={`w-full text-left px-4 py-3 rounded-lg transition ${view === 'servicios' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
            🛠️ Servicios
          </button>

          {/* SECCIÓN EXCLUSIVA: Solo renderiza si el rol es estrictamente admin */}
          {userRole === 'admin' && (
            <div className="pt-4 mt-4 border-t border-gray-800">
              <p className="px-4 text-[10px] font-semibold text-gray-500 uppercase mb-2 tracking-widest">
                Administración
              </p>
              <button 
                onClick={() => setView("users")} 
                className={`w-full text-left px-4 py-3 rounded-lg text-blue-400 transition ${view === 'users' ? 'bg-gray-800 font-bold' : 'hover:bg-gray-800'}`}
              >
                👥 Ver Usuarios
              </button>
            </div>
          )}
        </nav>

        {/* BOTÓN CERRAR SESIÓN: Es vital resetear el rol aquí */}
        <button 
          onClick={() => {
            setIsLoggedIn(false);
            setUserRole(null); // RESETEA EL ROL PARA QUE EL SIGUIENTE NO VEA LO MISMO
            localStorage.removeItem("token");
            localStorage.removeItem("role");
          }} 
          className="p-4 text-red-400 hover:bg-gray-800 transition text-sm border-t border-gray-800"
        >
          Cerrar Sesión
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {view === "dashboard" && <h1 className="text-3xl font-bold text-blue-400 italic">Panel MotoExpert</h1>}
        {view === "servicios" && <Servicios />}
        {view === "users" && userRole === "admin" && (
          <div className="bg-gray-800 p-6 rounded-xl border border-blue-500/20">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Usuarios en el sistema</h2>
            {/* Lista de usuarios aquí */}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;