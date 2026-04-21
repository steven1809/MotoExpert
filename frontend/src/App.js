import { useEffect, useState } from "react";

function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/users")
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Usuarios</h1>

      {users.map(user => (
        <div key={user.id} className="bg-gray-200 p-3 mb-2 rounded">
          {user.name}
        </div>
      ))}
    </div>
  );
}

export default App;
