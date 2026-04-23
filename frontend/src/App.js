import { useEffect, useState } from "react";
import Register from './components/register'; // 1. Importamos tu nuevo componente

function App() {
  const [users, setUsers] = useState([]);

  const fetchUsers = () => {
    fetch("http://localhost:3000/auth") 
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          setUsers([]); 
        }
      })
      .catch(err => {
        console.log("Error:", err);
        setUsers([]);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-moto-dark text-white p-10">
      {/* 2. Sección del Formulario de Registro */}
      <Register onSuccess={fetchUsers} /> 

      {/* 3. Sección de la Lista de Usuarios que ya tenías */}
      <div className="max-w-md mx-auto p-5">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Usuarios Registrados</h1>
        
        {users.length === 0 ? (
          <p className="text-gray-500">No hay usuarios aún.</p>
        ) : (
          users.map(user => (
            <div key={user.id} className="bg-white shadow-sm border-l-4 border-blue-500 p-3 mb-2 rounded">
              <p className="font-semibold text-gray-700">{user.nombre || user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;