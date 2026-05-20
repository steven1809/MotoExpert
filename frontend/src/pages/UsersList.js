import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [userDetails, setUserDetails] = useState({
    vehiculos: [],
    citas: [],
    loading: false
  });

  const [activeTab, setActiveTab] = useState('usuarios'); // 'usuarios' o 'empleados'
  const [empleados, setEmpleados] = useState([]);
  const [citasGenerales, setCitasGenerales] = useState([]);
  const [filtroEstadoCita, setFiltroEstadoCita] = useState('TODAS');

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [userToEditRole, setUserToEditRole] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [updatingRole, setUpdatingRole] = useState(false);

  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: '', email: '' });
  const [showForceCompleteModal, setShowForceCompleteModal] = useState(false);
  const [citaToForce, setCitaToForce] = useState(null);

  const exportUsers = (format) => {
    const list = filteredUsers;
    if (!Array.isArray(list) || list.length === 0) {
      alert('No hay usuarios para exportar con los filtros actuales.');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const fileBaseName = `motoexpert_usuarios_${today}`;
    const headers = [
      'ID',
      'Nombre',
      'Apellidos',
      'Email',
      'Teléfono',
      'Documento',
      'Rol',
      'Proveedor',
      'Google ID',
    ];

    const body = list.map((u) => [
      u.id ?? '',
      u.nombre ?? '',
      u.apellidos ?? '',
      u.email ?? '',
      u.telefono ?? '',
      u.documento ?? '',
      u.role ?? '',
      u.provider ?? '',
      u.googleId ?? '',
    ]);

    if (format === 'excel') {
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...body]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');
      XLSX.writeFile(workbook, `${fileBaseName}.xlsx`);
      return;
    }

    if (format === 'pdf') {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      doc.setFontSize(14);
      doc.text('MotoExpert - Usuarios', 40, 40);
      doc.setFontSize(10);
      doc.text(`Exportado: ${today}`, 40, 58);

      autoTable(doc, {
        startY: 76,
        head: [headers],
        body,
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [37, 99, 235] },
        alternateRowStyles: { fillColor: [245, 247, 255] },
        margin: { left: 40, right: 40 },
      });

      doc.save(`${fileBaseName}.pdf`);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');

    if (role === 'admin' && token) {
      setIsAdmin(true);
      fetchUsers(token);
      fetchAdminData(token);
    } else {
      setLoading(false);
      setIsAdmin(false);
    }
  }, []);

  const fetchAdminData = async (token) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [empRes, citasRes] = await Promise.all([
        fetch(`${API_BASE_URL}/empleados`, { headers }),
        fetch(`${API_BASE_URL}/citas`, { headers })
      ]);
      if (empRes.ok) setEmpleados(await empRes.json());
      if (citasRes.ok) setCitasGenerales(await citasRes.json());
    } catch (err) {
      console.error('Error al cargar datos de admin:', err);
    }
  };

  // Filtrado dinámico en tiempo real
  useEffect(() => {
    const results = users.filter(user => 
      user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toString().includes(searchTerm)
    );
    setFilteredUsers(results);
  }, [searchTerm, users]);

  // Carga forzada de datos cuando cambia el usuario seleccionado
  useEffect(() => {
    if (selectedUser && showModal) {
      fetchUserDetails(selectedUser.id);
    }
  }, [selectedUser, showModal]);

  const fetchUsers = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const sortedUsers = data.sort((a, b) => a.id - b.id);
        setUsers(sortedUsers);
        setFilteredUsers(sortedUsers);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al obtener usuarios');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    setUserDetails(prev => ({ ...prev, vehiculos: [], citas: [], loading: true }));
    const token = localStorage.getItem('token');
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [vehiculosRes, citasRes] = await Promise.all([
        fetch(`${API_BASE_URL}/vehiculos?userId=${userId}`, { headers }),
        fetch(`${API_BASE_URL}/citas?userId=${userId}`, { headers })
      ]);

      if (vehiculosRes.ok && citasRes.ok) {
        const [vehiculos, citas] = await Promise.all([
          vehiculosRes.json(),
          citasRes.json()
        ]);

        setUserDetails({
          vehiculos: vehiculos,
          citas: citas,
          loading: false
        });
      } else {
        throw new Error('Error al obtener datos del servidor');
      }
    } catch (err) {
      console.error('Error al obtener detalles:', err);
      setUserDetails(prev => ({ ...prev, loading: false }));
    }
  };

  const handleOpenDetails = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setUserDetails({ vehiculos: [], citas: [], loading: false });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setUsers(prev => prev.filter(user => user.id !== id));
        alert('Usuario eliminado con éxito');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'No se pudo eliminar el usuario'}`);
      }
    } catch (err) {
      alert('Error de conexión al intentar eliminar el usuario');
    }
  };

  const handleOpenRoleModal = (user) => {
    setUserToEditRole(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const handleUpdateRole = async () => {
    if (!userToEditRole || !newRole) return;
    
    setUpdatingRole(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/${userToEditRole.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        // Actualizar estado local de usuarios
        setUsers(prev => prev.map(u => u.id === userToEditRole.id ? { ...u, role: newRole } : u));
        
        // Sincronizar en tiempo real con la lista de empleados
        const updatedUser = { ...userToEditRole, role: newRole };
        if (newRole === 'empleado') {
          // Si ahora es empleado, lo añadimos a la lista si no está
          if (!empleados.some(e => e.usuario?.id === updatedUser.id)) {
            const newEmpleado = {
              id: Date.now(), // ID temporal o esperar a refetch
              usuario: updatedUser,
              estado: 'activo',
              cargo: 'Técnico Especialista',
              especialidad: 'Mecánica General'
            };
            setEmpleados(prev => [...prev, newEmpleado]);
          }
        } else {
          // Si ya no es empleado, lo quitamos de la lista
          setEmpleados(prev => prev.filter(e => e.usuario?.id !== updatedUser.id));
        }

        setShowRoleModal(false);
        alert('Rol actualizado con éxito');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'No se pudo actualizar el rol'}`);
      }
    } catch (err) {
      alert('Error de conexión al intentar actualizar el rol');
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleStartEdit = (user) => {
    setEditingUserId(user.id);
    setEditForm({ nombre: user.nombre, email: user.email });
  };

  const handleSaveEdit = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...editForm } : u));
        setEditingUserId(null);
      } else {
        alert('Error al actualizar perfil');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const handleForceComplete = async (targetStatus) => {
    if (!citaToForce) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/citas/${citaToForce.id}/estado`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: targetStatus }),
      });

      if (response.ok) {
        setCitasGenerales(prev => prev.map(c => c.id === citaToForce.id ? { ...c, estado: targetStatus } : c));
        setShowForceCompleteModal(false);
        setCitaToForce(null);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'No se pudo actualizar la cita'}`);
      }
    } catch (err) {
      console.error('Error al forzar actualización:', err);
      alert('Error de conexión al servidor');
    }
  };

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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-900/10 border border-red-500/20 rounded-xl text-red-400 text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 relative">
      {/* Modal para Editar Rol */}
      {showRoleModal && userToEditRole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowRoleModal(false)} />
          <div className="relative bg-[#050507] border border-white/[0.08] rounded-[2.5rem] w-full max-w-md p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-blue-600" />
            
            <h3 className="text-2xl font-black text-white mb-2 tracking-tighter">EDITAR ROL</h3>
            <p className="text-slate-400 text-sm mb-8">Cambiando el rol de <span className="text-white font-bold">{userToEditRole.nombre}</span></p>

            <div className="space-y-4 mb-8">
              <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 ml-1">Seleccionar Nivel de Acceso</label>
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => setNewRole('admin')}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                    newRole === 'admin' 
                      ? 'bg-purple-600/20 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]' 
                      : 'bg-white/[0.02] border-white/[0.05] text-slate-500 hover:border-white/10'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 2.944V12m0 0l4.5 4.5M12 12l-4.5 4.5" />
                  </svg>
                  <span className="font-mono text-[8px] uppercase tracking-widest font-bold">Admin</span>
                </button>

                <button 
                  onClick={() => setNewRole('empleado')}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                    newRole === 'empleado' 
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
                      : 'bg-white/[0.02] border-white/[0.05] text-slate-500 hover:border-white/10'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="font-mono text-[8px] uppercase tracking-widest font-bold">Empleado</span>
                </button>

                <button 
                  onClick={() => setNewRole('usuario')}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                    newRole === 'usuario' || newRole === 'user' || newRole === 'cliente'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                      : 'bg-white/[0.02] border-white/[0.05] text-slate-500 hover:border-white/10'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-mono text-[8px] uppercase tracking-widest font-bold">Usuario</span>
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowRoleModal(false)}
                className="flex-1 py-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-slate-400 font-mono text-[10px] uppercase tracking-[0.2em] hover:bg-white/[0.05] transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleUpdateRole}
                disabled={updatingRole || newRole === userToEditRole.role}
                className={`flex-1 py-4 rounded-2xl font-mono text-[10px] uppercase tracking-[0.2em] transition-all ${
                  updatingRole || newRole === userToEditRole.role
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {updatingRole ? 'Actualizando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalles */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header del Modal */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl italic shadow-lg shadow-blue-600/20">
                  {selectedUser.nombre?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white leading-none">{selectedUser.nombre} {selectedUser.apellidos}</h3>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Detalles del Usuario #{selectedUser.id}</p>
                </div>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
              {/* Información Personal */}
              <section>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center">
                  <span className="w-8 h-px bg-slate-800 mr-3"></span> Información del Perfil
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Nombre</p>
                    <p className="text-sm text-white font-bold">{selectedUser.nombre || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Apellidos</p>
                    <p className="text-sm text-white font-bold">{selectedUser.apellidos || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 lg:col-span-1">
                    <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Email</p>
                    <p className="text-sm text-blue-400 font-medium truncate">{selectedUser.email}</p>
                  </div>
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Teléfono</p>
                    <p className="text-sm text-white font-medium">{selectedUser.telefono || 'No registrado'}</p>
                  </div>
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Rol</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                      selectedUser.role === 'admin' 
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {selectedUser.role}
                    </span>
                  </div>
                </div>
              </section>

              {/* Vehículos del Usuario */}
              <section>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center">
                  <span className="w-8 h-px bg-slate-800 mr-3"></span> Garaje de Vehículos
                </h4>
                {userDetails.loading ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3 bg-slate-950/30 rounded-3xl border border-slate-800">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Consultando garaje...</p>
                  </div>
                ) : userDetails.vehiculos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userDetails.vehiculos.map(v => (
                      <div key={v.id} className="bg-slate-950/50 p-5 rounded-3xl border border-slate-800 group hover:border-blue-600/40 transition-all shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${v.tipo === 'Auto' ? 'bg-purple-600/10 text-purple-500' : 'bg-blue-600/10 text-blue-500'}`}>
                            {v.tipo === 'Auto' ? '🚗' : '🏍️'}
                          </div>
                          <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 text-[10px] font-bold text-blue-400 tracking-widest uppercase">
                            {v.placa}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Marca / Modelo</p>
                          <p className="text-base font-bold text-white leading-tight">{v.marca} {v.modelo}</p>
                          <p className="text-[10px] text-slate-600 mt-1 uppercase font-bold tracking-widest">{v.color || 'Sin color'} • {v.anio || 'N/A'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center bg-slate-950/30 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center space-y-2">
                    <span className="text-3xl grayscale opacity-30">🏍️</span>
                    <p className="text-slate-500 text-sm font-medium">Este usuario no tiene vehículos registrados.</p>
                  </div>
                )}
              </section>

              {/* Historial de Citas */}
              <section>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center">
                  <span className="w-8 h-px bg-slate-800 mr-3"></span> Historial de Servicios
                </h4>
                {userDetails.loading ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3 bg-slate-950/30 rounded-3xl border border-slate-800">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Sincronizando citas...</p>
                  </div>
                ) : userDetails.citas.length > 0 ? (
                  <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/30">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 text-slate-500 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="p-5">Servicio</th>
                          <th className="p-5">Vehículo</th>
                          <th className="p-5">Fecha y Hora</th>
                          <th className="p-5 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {userDetails.citas.map(c => (
                          <tr key={c.id} className="hover:bg-slate-800/30 transition-colors group">
                            <td className="p-5">
                              <div className="flex flex-col">
                                <span className="font-bold text-white text-sm">{c.servicio?.nombre}</span>
                                <span className="text-[10px] text-slate-500 font-medium">ID Cita: #{c.id}</span>
                              </div>
                            </td>
                            <td className="p-5">
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-400 font-bold bg-blue-400/10 px-2 py-0.5 rounded text-[10px] tracking-widest border border-blue-400/20">{c.vehiculo?.placa}</span>
                                <span className="text-slate-400 font-medium">{c.vehiculo?.modelo}</span>
                              </div>
                            </td>
                            <td className="p-5">
                              <div className="flex flex-col">
                                <span className="text-slate-300 font-bold">{new Date(c.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">⏰ {c.hora_inicio?.substring(0, 5)}</span>
                              </div>
                            </td>
                            <td className="p-5 text-center">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${
                                c.estado === 'PENDIENTE' 
                                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                                  : c.estado === 'EN PROCESO'
                                  ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                  : 'bg-green-500/10 text-green-500 border border-green-500/20'
                              }`}>
                                {c.estado || 'PENDIENTE'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center bg-slate-950/30 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center space-y-2">
                    <span className="text-3xl grayscale opacity-30">📅</span>
                    <p className="text-slate-500 text-sm font-medium">Este usuario no tiene citas agendadas.</p>
                  </div>
                )}
              </section>
            </div>

            {/* Footer del Modal */}
            <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex justify-end">
              <button 
                onClick={handleCloseModal}
                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex flex-col space-y-4">
          <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent italic">
            Administración MotoExpert
          </h1>
          <div className="flex space-x-2 bg-slate-900 p-1 rounded-2xl border border-slate-800 w-fit">
            <button 
              onClick={() => setActiveTab('usuarios')}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'usuarios' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              👥 Usuarios
            </button>
            <button 
              onClick={() => setActiveTab('empleados')}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'empleados' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              🛠️ Empleados
            </button>
            <button 
              onClick={() => setActiveTab('citas')}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'citas' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              📅 Citas Globales
            </button>
          </div>
        </div>

        {/* Barra de Búsqueda Dinámica (Solo visible en Usuarios) */}
        {activeTab === 'usuarios' && (
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative w-full md:w-96 group">
              <input 
                type="text" 
                placeholder="Buscar por nombre, email o ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-purple-600 outline-none transition-all group-hover:border-purple-500/50"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <button
              type="button"
              onClick={() => exportUsers('excel')}
              className="px-5 py-3 rounded-2xl bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-emerald-500/40 font-bold text-xs uppercase tracking-widest transition-all"
            >
              Exportar Excel
            </button>

            <button
              type="button"
              onClick={() => exportUsers('pdf')}
              className="px-5 py-3 rounded-2xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 hover:border-blue-500/40 font-bold text-xs uppercase tracking-widest transition-all"
            >
              Exportar PDF
            </button>
          </div>
        )}
      </div>

      {activeTab === 'usuarios' && (
        <div className="overflow-x-auto bg-slate-900/50 border border-slate-800 rounded-3xl backdrop-blur-sm shadow-2xl">
          {/* ... tabla de usuarios existente ... */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="p-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID</th>
                <th className="p-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nombre Completo</th>
                <th className="p-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Correo Electrónico</th>
                <th className="p-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Teléfono</th>
                <th className="p-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rol</th>
                <th className="p-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-5 text-sm font-mono text-slate-500">#{user.id}</td>
                    <td className="p-5">
                      <button 
                        onClick={() => handleOpenDetails(user)}
                        className="flex items-center space-x-4 group/name text-left w-full"
                      >
                        <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 font-bold text-sm uppercase group-hover/name:bg-blue-600 group-hover/name:text-white transition-all shadow-inner shrink-0">
                          {user.nombre?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          {editingUserId === user.id ? (
                            <div className="flex items-center gap-2">
                              <input 
                                type="text"
                                value={editForm.nombre}
                                onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                                className="bg-slate-800 border border-blue-500/50 rounded-lg px-2 py-1 text-xs text-white outline-none w-full"
                                autoFocus
                              />
                              <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(user.id); }} className="text-emerald-500 hover:text-emerald-400 p-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setEditingUserId(null); }} className="text-red-500 hover:text-red-400 p-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white group-hover/name:text-blue-400 transition-colors block leading-tight truncate">
                                {user.nombre} {user.apellidos}
                              </span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleStartEdit(user); }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-blue-400"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                              </button>
                            </div>
                          )}
                          <span className="text-[10px] text-slate-600 uppercase font-bold tracking-tighter">Cliente Registrado</span>
                        </div>
                      </button>
                    </td>
                    <td className="p-5 text-sm text-slate-400">
                      {editingUserId === user.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                            className="bg-slate-800 border border-blue-500/50 rounded-lg px-2 py-1 text-xs text-white outline-none w-full"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/email">
                          <span>{user.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-5 text-sm text-slate-400 font-medium">{user.telefono || 'N/A'}</td>
                    <td className="p-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-widest ${
                        user.role === 'admin' 
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex space-x-3 justify-center">
                        {isAdmin && (
                          <button 
                            onClick={() => handleOpenRoleModal(user)}
                            title="Editar rol de usuario"
                            className="p-2 bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white rounded-2xl transition-all border border-purple-500/20 shadow-lg"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 2.944V12m0 0l4.5 4.5M12 12l-4.5 4.5" />
                            </svg>
                          </button>
                        )}
                        <button 
                          onClick={() => handleOpenDetails(user)}
                          title="Ver detalles completos"
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all border border-blue-500/20 shadow-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          <span>Detalles</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          title="Eliminar usuario"
                          className="p-2 hover:bg-red-900/30 rounded-2xl text-slate-600 hover:text-red-500 transition-colors border border-transparent hover:border-red-500/20"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <span className="text-5xl grayscale opacity-20">🔍</span>
                      <p className="text-slate-500 font-bold uppercase tracking-widest">Usuario no encontrado</p>
                      <p className="text-slate-600 text-xs italic">Intenta con otro término de búsqueda</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'empleados' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {empleados.map(emp => {
            const completedServices = emp.citas?.filter(c => c.estado === 'FINALIZADO').length || 0;
            const fechaRegistro = emp.usuario?.createdAt ? new Date(emp.usuario.createdAt) : null;
            const formattedFechaRegistro = fechaRegistro 
              ? `Desde ${fechaRegistro.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
              : 'N/A';
            
            return (
              <div key={emp.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#7b9cff]/10 flex items-center justify-center text-[#7b9cff] font-bold text-xl uppercase">
                    {emp.usuario?.nombre?.charAt(0) || 'E'}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    emp.estado === 'activo' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}>
                    {emp.estado === 'activo' ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {emp.usuario?.nombre} {emp.usuario?.apellidos}
                </h3>
                <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-2">{emp.cargo || 'Técnico Especialista'}</p>
                <p className="text-slate-400 text-xs mb-1">{emp.usuario?.email}</p>
                {emp.usuario?.telefono && <p className="text-slate-500 text-xs mb-4">{emp.usuario?.telefono}</p>}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-600 font-bold uppercase">Especialidad</span>
                    <span className="text-xs text-[#7b9cff] font-bold">{emp.especialidad || 'Mecánica General'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-600 font-bold uppercase">Registro</span>
                    <span className="text-xs text-slate-400">{formattedFechaRegistro}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-600 font-bold uppercase">Servicios completados</span>
                    <span className="text-xs text-slate-400">{completedServices}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'citas' && (
        <div className="space-y-6">
            <div className="flex space-x-2 bg-slate-900 p-1 rounded-2xl border border-slate-800 w-fit overflow-x-auto max-w-full">
            {['TODAS', 'PENDIENTE', 'EN PROCESO', 'FINALIZADO', 'CANCELADO'].map(est => (
              <button 
                key={est}
                onClick={() => setFiltroEstadoCita(est)}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap ${filtroEstadoCita === est ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {est}
              </button>
            ))}
          </div>
          
          <div className="overflow-x-auto bg-slate-900/50 border border-slate-800 rounded-3xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-500 font-bold uppercase tracking-widest">
                <tr>
                  <th className="p-5">Cita</th>
                  <th className="p-5">Cliente / Vehículo</th>
                  <th className="p-5">Empleado Asignado</th>
                  <th className="p-5">Fecha / Hora</th>
                  <th className="p-5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {citasGenerales
                  .filter(c => filtroEstadoCita === 'TODAS' || c.estado === filtroEstadoCita)
                  .map(c => (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-5 font-bold text-white">{c.servicio?.nombre}</td>
                      <td className="p-5">
                        <div className="flex flex-col">
                          <span className="text-slate-300">{c.usuario?.nombre}</span>
                          <span className="text-blue-400 font-bold tracking-tighter">{c.vehiculo?.placa}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className="bg-slate-800 px-3 py-1 rounded-lg text-slate-300 font-bold">
                          {c.empleado?.nombre || 'Sin asignar'}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col">
                          <span className="text-slate-300">{new Date(c.fecha).toLocaleDateString()}</span>
                          <span className="text-slate-500 font-bold">⏰ {c.hora_inicio.substring(0, 5)}</span>
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${
                            c.estado === 'PENDIENTE' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                            c.estado === 'EN PROCESO' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 
                            c.estado === 'FINALIZADO' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                            'bg-red-500/10 text-red-500 border border-red-500/20'
                          }`}>
                            {c.estado}
                          </span>
                          {(c.estado === 'PENDIENTE' || c.estado === 'EN PROCESO') && (
                            <button
                              onClick={() => {
                                setCitaToForce(c);
                                setShowForceCompleteModal(true);
                              }}
                              className="text-[8px] font-bold text-orange-500 hover:text-orange-400 border border-orange-500/30 hover:border-orange-500/50 px-2 py-0.5 rounded uppercase tracking-tighter transition-all"
                            >
                              Acción Forzada
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Acción Forzada (Finalizar o Cancelar) */}
      {showForceCompleteModal && citaToForce && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowForceCompleteModal(false)} />
          <div className="relative bg-[#050507] border border-purple-500/20 rounded-[2.5rem] w-full max-w-md p-8 shadow-[0_0_50px_rgba(123,156,255,0.1)] overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-blue-600" />
            
            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 mx-auto mb-6 border border-purple-500/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            
            <h3 className="text-xl font-black text-white text-center mb-1 tracking-tighter uppercase">¿Qué deseas hacer con esta cita?</h3>
            <p className="text-slate-400 text-sm text-center mb-8 font-medium italic">
              {citaToForce.servicio?.nombre} • Cliente: {citaToForce.usuario?.nombre}
            </p>

            <div className="grid grid-cols-1 gap-4 mb-8">
              <button 
                onClick={() => handleForceComplete('FINALIZADO')}
                className="w-full flex items-center justify-between px-6 py-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl group-hover:scale-110 transition-transform">✅</span>
                  <span className="font-mono text-[11px] uppercase tracking-widest font-bold">Finalizar Cita</span>
                </div>
                <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button 
                onClick={() => handleForceComplete('CANCELADO')}
                className="w-full flex items-center justify-between px-6 py-4 rounded-2xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl group-hover:scale-110 transition-transform">❌</span>
                  <span className="font-mono text-[11px] uppercase tracking-widest font-bold">Cancelar Cita</span>
                </div>
                <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <button 
              onClick={() => setShowForceCompleteModal(false)}
              className="w-full py-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-slate-500 font-mono text-[10px] uppercase tracking-widest hover:bg-white/[0.05] hover:text-slate-300 transition-all"
            >
              Volver atrás
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;
