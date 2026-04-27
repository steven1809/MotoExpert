import { useEffect, useState } from "react";
import Login from "./components/Login/Login.jsx";
import Register from "./components/Register/Register";

function App() {
  const [users, setUsers] = useState([]);
  const [view, setView] = useState("login"); // "login", "register", o "users"

  const fetchUsers = () => {
    fetch("http://localhost:3000/auth")
      .then(res => {
        if (!res.ok) {
          throw new Error("Error en la petición");
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          setUsers([]);
        }
      })
      .catch(err => {
        console.error("Error al cargar usuarios:", err);
        setUsers([]);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Navegación Simple */}
      <nav className="bg-gray-800 p-4 flex justify-center space-x-4 shadow-lg">
        <button 
          onClick={() => setView("login")}
          className={`px-4 py-2 rounded ${view === 'login' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
        >
          Iniciar Sesión
        </button>
        <button 
          onClick={() => setView("register")}
          className={`px-4 py-2 rounded ${view === 'register' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
        >
          Registrarse
        </button>
        <button 
          onClick={() => setView("users")}
          className={`px-4 py-2 rounded ${view === 'users' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
        >
          Ver Usuarios
        </button>
      </nav>

      <main className="p-6 flex justify-center items-center min-h-[calc(100vh-80px)]">
        {view === "login" && (
          <Login />
        )}

        {view === "register" && (
          <Register onSuccess={() => {
            fetchUsers();
            setView("users");
          }} />
        )}

        {view === "users" && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Usuarios Registrados</h2>
            {users.length === 0 ? (
              <p className="text-gray-400 text-center italic">No hay usuarios registrados aún.</p>
            ) : (
              <div className="grid gap-4">
                {users.map(user => (
                  <div key={user.id} className="bg-gray-800 border-l-4 border-blue-500 p-4 rounded-lg shadow-md hover:bg-gray-750 transition-colors">
                    <p className="font-bold text-lg text-white">{user.nombre || user.email}</p>
                    <p className="text-blue-300 text-sm">{user.email}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
