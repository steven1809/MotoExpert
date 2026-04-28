import React, { useState } from "react";
import Login from "./components/Login/Login"; 
import Servicios from "./pages/Servicios";
import Navbar from "./components/Navbar";

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
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Navbar Superior Global */}
      <Navbar 
        setView={setView} 
        setIsLoggedIn={setIsLoggedIn} 
        setUserRole={setUserRole} 
        userRole={userRole} 
      />

      {/* Contenido Principal con margen superior para el Navbar fixed */}
      <main className="pt-16 p-8">
        {view === "dashboard" && (
          <div className="text-center mt-10">
            <h1 className="text-4xl font-bold text-blue-400 italic mb-4">Panel MotoExpert</h1>
            <p className="text-gray-400 text-lg">Bienvenido al sistema de gestión de servicios.</p>
          </div>
        )}
        
        {view === "servicios" && <Servicios />}
        
        {view === "users" && userRole === "admin" && (
          <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-xl border border-blue-500/20">
            <h2 className="text-2xl font-bold text-blue-400 mb-4 text-center">Usuarios en el sistema</h2>
            <div className="text-center text-gray-500 py-10">Lista de usuarios (próximamente)</div>
          </div>
        )}

        {/* Acceso rápido para admin si no está en la vista de usuarios */}
        {userRole === 'admin' && view !== 'users' && (
          <div className="fixed bottom-8 right-8">
            <button 
              onClick={() => setView("users")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg transition-all transform hover:scale-105 font-bold"
            >
              👥 Administrar Usuarios
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
