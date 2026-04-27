import { useEffect, useState } from "react";
import Login from "./Login";
import Register from './components/register';

function App() {
  const [users, setUsers] = useState([]);

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
    <div className="min-h-screen bg-moto-dark text-white p-10">
      <h1 className="text-2xl font-bold mb-4">Usuarios</h1>
      <Login />
      
      <div className="mt-10">
        <Register onSuccess={fetchUsers} />
      </div>

      <div className="max-w-md mx-auto p-5 mt-10">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Usuarios Registrados</h1>
        
        {users.length === 0 ? (
          <p className="text-gray-500">No hay usuarios aún.</p>
        ) : (
          users.map(user => (
            <div key={user.id} className="bg-white shadow-sm border-l-4 border-blue-500 p-3 mb-2 rounded">
              <p className="font-semibold text-gray-700">{user.nombre || user.name || user.email}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
