import { useEffect, useState } from "react";
import Login from "./Login";

function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/usuarios")
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
          console.error("Los datos recibidos no son un array:", data);
          setUsers([]);
        }
      })
      .catch(err => {
        console.error("Error al cargar usuarios:", err);
        setUsers([]);
      });
  }, []);

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Usuarios</h1>
      <Login />
      
      {users.map(user => (
        <div key={user.id} className="bg-gray-200 p-3 mb-2 rounded">
          {user.email} {/* muestra email en lugar de name */}
        </div>
      ))}
    </div>
  );
}

export default App;
