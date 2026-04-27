import { useState } from 'react';

const Register = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
  });

  const [message, setMessage] = useState({ text: '', isError: false });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', isError: false });

    try {
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: '¡Registro exitoso! Bienvenido a MotoExpert', isError: false });
        setFormData({ nombre: '', email: '', password: '' });

        if (onSuccess) onSuccess();
        
      } else {
        setMessage({ text: data.message || 'Error al registrar', isError: true });
      }
    } catch (error) {
      setMessage({ text: 'No se pudo conectar con el servidor', isError: true });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Registro de Usuario</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {message.text && (
          <div className={message.isError ? "text-red-500" : "text-green-500"}>
            {message.text}
          </div>
        )}
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={formData.nombre}
          onChange={handleChange}
          className="border p-2 w-full text-black"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="border p-2 w-full text-black"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={handleChange}
          className="border p-2 w-full text-black"
          required
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Registrarse
        </button>
      </form>
    </div>
  );
};

export default Register;