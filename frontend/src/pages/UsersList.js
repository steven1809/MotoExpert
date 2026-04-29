import React, { Component } from 'react';

class UsersList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      users: [],
      loading: true,
      error: null,
      isAdmin: false,
    };
  }

  componentDidMount() {
    // 1. Verificar si el usuario es admin desde localStorage
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');

    if (role === 'admin' && token) {
      this.setState({ isAdmin: true }, () => {
        this.fetchUsers(token);
      });
    } else {
      this.setState({ loading: false, isAdmin: false });
    }
  }

  fetchUsers = async (token) => {
    try {
      // Usamos el endpoint configurado en el backend
      const response = await fetch('http://localhost:3001/auth', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.setState({ users: data, loading: false });
      } else {
        const errorData = await response.json();
        this.setState({ error: errorData.message || 'Error al obtener usuarios', loading: false });
      }
    } catch (err) {
      this.setState({ error: 'No se pudo conectar con el servidor', loading: false });
    }
  };

  handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3000/auth/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Actualizar el estado local eliminando al usuario
        this.setState((prevState) => ({
          users: prevState.users.filter((user) => user.id !== id),
        }));
        alert('Usuario eliminado con éxito');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'No se pudo eliminar el usuario'}`);
      }
    } catch (err) {
      alert('Error de conexión al intentar eliminar el usuario');
    }
  };

  render() {
    const { isAdmin, users, loading, error } = this.state;

    // Caso 1: No es administrador
    if (!loading && !isAdmin) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-950">
          <div className="bg-red-900/20 border border-red-500/50 p-8 rounded-2xl text-center max-w-md">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h2>
            <p className="text-slate-400">Esta sección es exclusiva para administradores del sistema.</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      );
    }

    // Caso 2: Cargando datos
    if (loading) {
      return (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    // Caso 3: Error en la petición
    if (error) {
      return (
        <div className="p-6 bg-red-900/10 border border-red-500/20 rounded-xl text-red-400 text-center">
          {error}
        </div>
      );
    }

    // Caso 4: Renderizado de la tabla para Admin
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Gestión de Usuarios</h1>
            <p className="text-slate-400 mt-1">Lista completa de usuarios registrados en MotoExpert</p>
          </div>
          <div className="bg-blue-600/10 text-blue-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-500/20">
            {users.length} Usuarios totales
          </div>
        </div>

        <div className="overflow-x-auto bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Completo</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Correo Electrónico</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rol</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="p-4 text-sm text-slate-500">#{user.id}</td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500 font-bold text-xs uppercase">
                        {user.nombre?.charAt(0) || 'U'}
                      </div>
                      <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                        {user.nombre} {user.apellidos}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-300">{user.email}</td>
                  <td className="p-4 text-sm text-slate-300">{user.telefono || 'N/A'}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      user.role === 'admin' 
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button 
                        title="Editar usuario"
                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button 
                        onClick={() => this.handleDelete(user.id)}
                        title="Eliminar usuario"
                        className="p-1.5 hover:bg-red-900/30 rounded text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              No se encontraron usuarios registrados.
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default UsersList;
