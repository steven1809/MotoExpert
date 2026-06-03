import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { API_BASE_URL } from '../apiConfig';

const UsersList = (props) => {
  const { activeTab: propActiveTab } = props;
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

  const [activeTab, setActiveTab] = useState(propActiveTab || 'usuarios');
  const [empleados, setEmpleados] = useState([]);
  const [filteredEmpleados, setFilteredEmpleados] = useState([]);
  const [citasGenerales, setCitasGenerales] = useState([]);
  const [selectedCitaForDrawer, setSelectedCitaForDrawer] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showAplazarModal, setShowAplazarModal] = useState(false);
  const [showEliminarModal, setShowEliminarModal] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');
  const [motivoEliminacion, setMotivoEliminacion] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [filtroEstadoCita, setFiltroEstadoCita] = useState('TODAS');
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  // Paginación Citas
  const [citasPage, setCitasPage] = useState(1);
  const [citasLimit] = useState(10);
  const [totalCitas, setTotalCitas] = useState(0);
  const [totalPagesCitas, setTotalPagesCitas] = useState(0);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [userToEditRole, setUserToEditRole] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [updatingRole, setUpdatingRole] = useState(false);

  // Estados para Empleados
  const [expandedEmpleado, setExpandedEmpleado] = useState(null);
  const [showCargoModal, setShowCargoModal] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState(null);
  const [cargoForm, setCargoForm] = useState({ cargo: '', especialidad: '' });
  const [updatingEmpleado, setUpdatingEmpleado] = useState(false);

  // Paginación Usuarios/Empleados
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Actualizar pestaña si cambia el prop
  useEffect(() => {
    if (propActiveTab) {
      setActiveTab(propActiveTab);
      setCurrentPage(1);
      setCitasPage(1);
      setSearchTerm('');
    }
  }, [propActiveTab]);

  const exportData = (type, format) => {
    let list = [];
    let filename = '';
    let headers = [];
    let body = [];
    const today = new Date().toISOString().slice(0, 10);

    if (type === 'usuarios') {
      list = filteredUsers;
      filename = `motoexpert_usuarios_${today}`;
      headers = ['ID', 'Nombre', 'Apellidos', 'Email', 'Teléfono', 'Documento', 'Rol'];
      body = list.map(u => [u.id, u.nombre, u.apellidos, u.email, u.telefono || 'N/A', u.documento || 'N/A', u.role]);
    } else if (type === 'empleados') {
      list = filteredEmpleados;
      filename = `motoexpert_empleados_${today}`;
      headers = ['ID', 'Nombre', 'Email', 'Cargo', 'Especialidad', 'Estado'];
      body = list.map(e => [e.id, `${e.usuario?.nombre} ${e.usuario?.apellidos}`, e.usuario?.email, e.cargo, e.especialidad, e.estado]);
    } else if (type === 'citas') {
      list = citasGenerales;
      filename = `motoexpert_citas_${today}`;
      headers = ['ID', 'Servicio', 'Cliente', 'Vehículo', 'Fecha', 'Hora', 'Estado'];
      body = list.map(c => [
        c.id, 
        c.servicio?.nombre, 
        c.usuario?.nombre, 
        c.vehiculo?.placa, 
        new Date(c.fecha).toLocaleDateString(), 
        c.hora_inicio, 
        c.estado
      ]);
    }

    if (!Array.isArray(list) || list.length === 0) {
      alert('No hay datos para exportar con los filtros actuales.');
      return;
    }

    if (format === 'excel') {
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...body]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    } else {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      doc.setFontSize(14);
      doc.text(`MotoExpert - ${type.charAt(0).toUpperCase() + type.slice(1)}`, 40, 40);
      autoTable(doc, {
        startY: 60,
        head: [headers],
        body: body,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] }
      });
      doc.save(`${filename}.pdf`);
    }
  };

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    
    if (activeTab === 'usuarios') {
      const filtered = users.filter((user) =>
        user.nombre?.toLowerCase().includes(term) ||
        user.apellidos?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.id?.toString().includes(term)
      );
      setFilteredUsers(filtered);
      setCurrentPage(1);
    } else if (activeTab === 'empleados') {
      const filtered = empleados.filter((emp) =>
        emp.usuario?.nombre?.toLowerCase().includes(term) ||
        emp.usuario?.apellidos?.toLowerCase().includes(term) ||
        emp.usuario?.email?.toLowerCase().includes(term) ||
        emp.cargo?.toLowerCase().includes(term) ||
        emp.especialidad?.toLowerCase().includes(term)
      );
      setFilteredEmpleados(filtered);
      setCurrentPage(1);
    }
  }, [searchTerm, users, empleados, activeTab]);
  const fetchCitasPaginadas = useCallback(async (token, page, limit, estado) => {
    setLoadingAdmin(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const url = new URL(`${API_BASE_URL}/citas`);
      url.searchParams.append('page', page);
      url.searchParams.append('limit', limit);
      if (estado && estado !== 'TODAS') {
        url.searchParams.append('estado', estado);
      }

      const res = await fetch(url.toString(), { headers });
      if (res.ok) {
        const result = await res.json();
        // El backend ahora devuelve { data, total, page, limit, totalPages }
        setCitasGenerales(result.data || []);
        setTotalCitas(result.total || 0);
        setTotalPagesCitas(result.totalPages || 0);
      }
    } catch (err) {
      console.error('Error al cargar citas paginadas:', err);
    } finally {
      setLoadingAdmin(false);
    }
  }, []);

  const fetchAdminData = useCallback(async (token) => {
    setLoadingAdmin(true);
    try {
      console.log('[UsersList] Fetching admin data (employees and appointments)...');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const empRes = await fetch(`${API_BASE_URL}/empleados`, { headers });
      if (empRes.ok) {
        const data = await empRes.json();
        console.log('[UsersList] Employees fetched:', data);
        setEmpleados(data);
      }

      await fetchCitasPaginadas(token, citasPage, citasLimit, filtroEstadoCita);
    } catch (err) {
      console.error('Error al cargar datos de admin:', err);
    } finally {
      setLoadingAdmin(false);
    }
  }, [citasPage, citasLimit, filtroEstadoCita, fetchCitasPaginadas]);

  const handleReschedule = async () => {
    if (!nuevaFecha || !nuevaHora || !selectedCitaForDrawer) return;
    setSubmittingAction(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/citas/${selectedCitaForDrawer.id}/reschedule`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fecha: nuevaFecha, hora_inicio: nuevaHora })
      });

      if (res.ok) {
        setShowAplazarModal(false);
        setShowDrawer(false);
        fetchCitasPaginadas(token, citasPage, citasLimit, filtroEstadoCita);
        // Podrías agregar un toast aquí si existiera en este componente
      }
    } catch (err) {
      console.error('Error al reprogramar cita:', err);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleForceDelete = async () => {
    if (!motivoEliminacion || !selectedCitaForDrawer) return;
    setSubmittingAction(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/citas/${selectedCitaForDrawer.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ motivo: motivoEliminacion })
      });

      if (res.ok) {
        setShowEliminarModal(false);
        setShowDrawer(false);
        fetchCitasPaginadas(token, citasPage, citasLimit, filtroEstadoCita);
      }
    } catch (err) {
      console.error('Error al eliminar cita:', err);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleMarkAsOverdue = async () => {
    if (!selectedCitaForDrawer) return;
    setSubmittingAction(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/citas/${selectedCitaForDrawer.id}/estado`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: 'TIEMPO_EXCEDIDO' })
      });

      if (res.ok) {
        setShowDrawer(false);
        fetchCitasPaginadas(token, citasPage, citasLimit, filtroEstadoCita);
      }
    } catch (err) {
      console.error('Error al marcar como atrasada:', err);
    } finally {
      setSubmittingAction(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'citas') {
      const token = localStorage.getItem('token');
      if (token) {
        fetchCitasPaginadas(token, citasPage, citasLimit, filtroEstadoCita);
      }
    }
  }, [citasPage, citasLimit, filtroEstadoCita, activeTab, fetchCitasPaginadas]);

  const handleOpenDetails = (user) => {
    setSelectedUser(user);
    setShowModal(true);
    fetchUserDetails(user.id);
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

  const handleUpdateEmpleado = async (id, data) => {
    setUpdatingEmpleado(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/empleados/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updated = await response.json();
        setEmpleados(prev => prev.map(e => e.id === id ? updated : e));
        setShowCargoModal(false);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'No se pudo actualizar el empleado'}`);
      }
    } catch (err) {
      alert('Error de conexión al intentar actualizar el empleado');
    } finally {
      setUpdatingEmpleado(false);
    }
  };

  const handleOpenCargoModal = (empleado) => {
    setEditingEmpleado(empleado);
    setCargoForm({
      cargo: empleado.cargo || '',
      especialidad: empleado.especialidad || '',
      documentNumber: empleado.documentNumber || empleado.usuario?.documento || '',
      documentType: empleado.documentType || 'DNI',
      fechaIngreso: empleado.fechaIngreso ? new Date(empleado.fechaIngreso).toISOString().split('T')[0] : ''
    });
    setShowCargoModal(true);
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
        // Refrescar completamente las listas de usuarios y empleados para tener datos frescos
        await Promise.all([
          fetchUsers(token),
          fetchAdminData(token),
        ]);
        
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

  const fetchUsers = useCallback(async (token) => {
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
  }, []);

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
  }, [fetchUsers, fetchAdminData]);

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

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  
  const currentRecords = activeTab === 'usuarios' 
    ? filteredUsers.slice(indexOfFirstRecord, indexOfLastRecord)
    : filteredEmpleados.slice(indexOfFirstRecord, indexOfLastRecord);

  const totalPages = Math.ceil((activeTab === 'usuarios' ? filteredUsers.length : filteredEmpleados.length) / recordsPerPage);

  const getTitle = () => {
    switch(activeTab) {
      case 'usuarios': return 'Gestión de Usuarios';
      case 'empleados': return 'Gestión de Empleados';
      case 'citas': return 'Control de Citas Globales';
      default: return 'Administración MotoExpert';
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#020617] min-h-screen animate-in fade-in duration-500">
      {/* Modales */}
      {showCargoModal && editingEmpleado && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowCargoModal(false)} />
          <div className="relative bg-[#0B1220] border border-white/10 rounded-[3rem] w-full max-w-xl p-10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                  {editingEmpleado.cargo ? 'EDITAR PERFIL' : 'DEFINIR CARGO'}
                </h3>
                <p className="text-slate-500 text-sm mt-1 font-medium">Actualizando información de <span className="text-purple-400 font-bold">{editingEmpleado.usuario?.nombre}</span></p>
              </div>
              <button onClick={() => setShowCargoModal(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="md:col-span-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2 font-bold">Cargo del Empleado</label>
                <input 
                  type="text" 
                  value={cargoForm.cargo}
                  onChange={(e) => setCargoForm({ ...cargoForm, cargo: e.target.value })}
                  placeholder="Ej: Mecánico Senior"
                  className="w-full px-6 py-4 bg-black/40 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2 font-bold">Especialidad Técnica</label>
                <input 
                  type="text" 
                  value={cargoForm.especialidad}
                  onChange={(e) => setCargoForm({ ...cargoForm, especialidad: e.target.value })}
                  placeholder="Ej: Inyección Electrónica / Motores"
                  className="w-full px-6 py-4 bg-black/40 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2 font-bold">Tipo Doc.</label>
                <select 
                  value={cargoForm.documentType}
                  onChange={(e) => setCargoForm({ ...cargoForm, documentType: e.target.value })}
                  className="w-full px-6 py-4 bg-black/40 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all appearance-none"
                >
                  <option value="DNI">DNI</option>
                  <option value="Cédula">Cédula</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="RUT">RUT</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2 font-bold">Nº Documento</label>
                <input 
                  type="text" 
                  value={cargoForm.documentNumber}
                  onChange={(e) => setCargoForm({ ...cargoForm, documentNumber: e.target.value })}
                  placeholder="12345678-9"
                  className="w-full px-6 py-4 bg-black/40 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2 font-bold">Fecha de Ingreso</label>
                <input 
                  type="date" 
                  value={cargoForm.fechaIngreso}
                  onChange={(e) => setCargoForm({ ...cargoForm, fechaIngreso: e.target.value })}
                  className="w-full px-6 py-4 bg-black/40 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all color-scheme-dark"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowCargoModal(false)} 
                className="flex-1 py-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-white/[0.05] transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleUpdateEmpleado(editingEmpleado.id, cargoForm)} 
                disabled={updatingEmpleado} 
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 disabled:opacity-50 font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
              >
                {updatingEmpleado ? 'Procesando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRoleModal && userToEditRole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowRoleModal(false)} />
          <div className="relative bg-[#050507] border border-white/[0.08] rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl">
            <h3 className="text-2xl font-black text-white mb-2 tracking-tighter">EDITAR ROL</h3>
            <p className="text-slate-400 text-sm mb-8">Cambiando el rol de <span className="text-white font-bold">{userToEditRole.nombre}</span></p>
            <div className="space-y-3 mb-8">
              {['user', 'empleado', 'admin'].map((role) => (
                <button 
                  key={role}
                  onClick={() => setNewRole(role)}
                  className={`w-full p-4 rounded-2xl border transition-all text-left ${
                    newRole === role 
                      ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg' 
                      : 'bg-white/[0.02] border-white/[0.05] text-slate-500 hover:border-white/10'
                  }`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest font-bold">{role}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowRoleModal(false)} className="flex-1 py-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-slate-400 font-mono text-[10px] uppercase">Cancelar</button>
              <button onClick={handleUpdateRole} disabled={updatingRole} className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg disabled:opacity-50 uppercase text-[10px] font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl italic">{selectedUser.nombre?.charAt(0)}</div>
                <div>
                  <h3 className="text-xl font-bold text-white leading-none">{selectedUser.nombre} {selectedUser.apellidos}</h3>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">ID #{selectedUser.id}</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
              <section>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center"><span className="w-8 h-px bg-slate-800 mr-3"></span> Perfil</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50"><p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Email</p><p className="text-sm text-white font-bold truncate">{selectedUser.email}</p></div>
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50"><p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Teléfono</p><p className="text-sm text-white font-bold">{selectedUser.telefono || 'N/A'}</p></div>
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50"><p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Documento</p><p className="text-sm text-white font-bold">{selectedUser.documento || 'N/A'}</p></div>
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50"><p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Rol</p><p className="text-sm text-blue-400 font-bold uppercase">{selectedUser.role}</p></div>
                </div>
              </section>
              <section>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center"><span className="w-8 h-px bg-slate-800 mr-3"></span> Vehículos</h4>
                {userDetails.vehiculos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {userDetails.vehiculos.map(v => (
                      <div key={v.id} className="bg-slate-950/50 p-5 rounded-3xl border border-slate-800 flex justify-between items-center">
                        <div><p className="text-sm font-bold text-white">{v.marca} {v.modelo}</p><p className="text-[10px] text-slate-500 uppercase">{v.tipo} • {v.color}</p></div>
                        <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 text-[10px] font-bold text-blue-400 tracking-widest">{v.placa}</div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-slate-500 text-sm italic text-center py-8">Sin vehículos registrados.</p>}
              </section>
              <section>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center"><span className="w-8 h-px bg-slate-800 mr-3"></span> Historial</h4>
                {userDetails.citas.length > 0 ? (
                  <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/30">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 text-slate-500 font-bold uppercase"><tr><th className="p-5">Servicio</th><th className="p-5">Vehículo</th><th className="p-5">Fecha</th><th className="p-5 text-center">Estado</th></tr></thead>
                      <tbody className="divide-y divide-slate-800">
                        {userDetails.citas.map(c => (
                          <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-5 font-bold text-white">{c.servicio?.nombre}</td>
                            <td className="p-5 text-blue-400 font-bold">{c.vehiculo?.placa}</td>
                            <td className="p-5 text-slate-300">{new Date(c.fecha).toLocaleDateString()} ⏰ {c.hora_inicio?.substring(0, 5)}</td>
                            <td className="p-5 text-center"><span className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase ${c.estado === 'PENDIENTE' ? 'bg-amber-500/10 text-amber-500' : c.estado === 'EN PROCESO' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-500'}`}>{c.estado || 'PENDIENTE'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-slate-500 text-sm italic text-center py-8">Sin historial de citas.</p>}
              </section>
            </div>
            <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex justify-end">
              <button onClick={handleCloseModal} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Header Principal */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent italic">{getTitle()}</h1>
        <div className="w-full md:w-auto flex flex-col items-stretch md:items-end gap-3">
          <div className="relative w-full md:w-96 group">
            <input 
              type="text" 
              placeholder={`Buscar en ${activeTab}...`} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-purple-600 outline-none transition-all"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button onClick={() => exportData(activeTab, 'excel')} className="h-10 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-slate-300 hover:bg-white/[0.05] transition-all text-[10px] font-mono uppercase">Excel</button>
            <button onClick={() => exportData(activeTab, 'pdf')} className="h-10 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:scale-[1.02] transition-all text-[10px] font-mono uppercase">PDF</button>
          </div>
        </div>
      </div>



      {/* Tablas de Datos */}
      {activeTab === 'usuarios' && (
        <div className="overflow-x-auto bg-slate-900/50 border border-slate-800 rounded-3xl backdrop-blur-sm shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="p-5 text-[10px] font-bold text-slate-500 uppercase">ID</th>
                <th className="p-5 text-[10px] font-bold text-slate-500 uppercase">Nombre</th>
                <th className="p-5 text-[10px] font-bold text-slate-500 uppercase">Email</th>
                <th className="p-5 text-[10px] font-bold text-slate-500 uppercase">Rol</th>
                <th className="p-5 text-[10px] font-bold text-slate-500 uppercase text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {currentRecords.length > 0 ? currentRecords.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="p-5 text-sm font-mono text-slate-500">#{item.id}</td>
                  <td className="p-5"><button onClick={() => handleOpenDetails(item)} className="flex items-center space-x-4 text-left"><div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 font-bold text-sm uppercase">{item.nombre?.charAt(0) || 'U'}</div><div><span className="text-sm font-bold text-white block leading-tight">{item.nombre} {item.apellidos}</span><span className="text-[10px] text-slate-600 uppercase font-bold">Cliente</span></div></button></td>
                  <td className="p-5 text-sm text-slate-400">{item.email}</td>
                  <td className="p-5"><span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase ${item.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : item.role === 'empleado' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{item.role}</span></td>
                  <td className="p-5"><div className="flex space-x-3 justify-center">
                    {isAdmin && <button onClick={() => handleOpenRoleModal(item)} className="p-2 bg-purple-600/10 text-purple-400 rounded-2xl border border-purple-500/20"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 2.944V12m0 0l4.5 4.5M12 12l-4.5 4.5" /></svg></button>}
                    <button onClick={() => handleOpenDetails(item)} className="px-4 py-2 bg-blue-600/10 text-blue-400 rounded-2xl text-[10px] font-bold uppercase border border-blue-500/20 shadow-lg">Detalles</button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-600 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div></td>
                </tr>
              )) : <tr><td colSpan="5" className="py-20 text-center text-slate-500 italic">No se encontraron resultados.</td></tr>}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="p-6 border-t border-slate-800 bg-slate-900/80 flex justify-between items-center">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Página <span className="text-white font-bold">{currentPage}</span> de <span className="text-white font-bold">{totalPages}</span></div>
              <div className="flex items-center space-x-2">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-xl border border-slate-700 text-white disabled:opacity-30"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-xl border border-slate-700 text-white disabled:opacity-30"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'empleados' && (
        <div className="grid grid-cols-1 gap-6">
          {currentRecords.length > 0 ? currentRecords.map((item) => {
            const isExpanded = expandedEmpleado === item.id;
            const usuario = item.usuario || {};
            const imagenPerfil = usuario.picture || usuario.imagen || usuario.foto || null;

            return (
              <div 
                key={item.id} 
                className={`group bg-[#0B1220]/50 border transition-all duration-500 overflow-hidden ${
                  isExpanded 
                    ? 'border-purple-500/40 rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(168,85,247,0.2)] bg-[#0B1220]' 
                    : 'border-white/[0.05] rounded-3xl hover:border-white/10 hover:bg-[#0B1220]/80'
                }`}
              >
                {/* Vista Compacta (Por defecto) */}
                <div 
                  className={`p-6 flex flex-col md:flex-row items-center justify-between cursor-pointer gap-4 ${isExpanded ? 'bg-white/[0.02]' : ''}`}
                  onClick={() => setExpandedEmpleado(isExpanded ? null : item.id)}
                >
                  <div className="flex items-center space-x-5">
                    <div className="relative">
                      {imagenPerfil ? (
                        <img src={imagenPerfil} alt={usuario.nombre} className="w-16 h-16 rounded-2xl object-cover border border-white/10 shadow-lg" />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-2xl italic shadow-lg">
                          {usuario.nombre?.charAt(0)}
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-[3px] border-[#020617] ${item.estado === 'activo' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}></div>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none group-hover:text-purple-400 transition-colors">{usuario.nombre} {usuario.apellidos}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">ID EMP #{item.id}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                        <span className="text-[10px] text-purple-400 font-black uppercase tracking-widest">{item.cargo || 'SIN CARGO'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:grid grid-cols-2 gap-10 flex-1 px-12 border-x border-white/[0.03] mx-6">
                    <div>
                      <p className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-1.5 font-bold">Email Corporativo</p>
                      <p className="text-sm text-slate-300 font-medium truncate">{usuario.email}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-1.5 font-bold">Estado Actual</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        item.estado === 'activo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {item.estado}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setExpandedEmpleado(isExpanded ? null : item.id); }}
                      className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        isExpanded ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                      }`}
                    >
                      {isExpanded ? 'Ver Menos' : 'Ver Más'}
                    </button>
                  </div>
                </div>

                {/* Vista Expandida */}
                {isExpanded && (
                  <div className="p-10 border-t border-white/[0.05] animate-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                      {/* Columna Izquierda: Foto y Acciones */}
                      <div className="lg:col-span-4 flex flex-col items-center space-y-8">
                        <div className="relative group/photo">
                          {imagenPerfil ? (
                            <img src={imagenPerfil} alt={usuario.nombre} className="w-full aspect-square max-w-[280px] rounded-[3rem] object-cover border-4 border-white/5 shadow-2xl transition-transform duration-500 group-hover/photo:scale-[1.02]" />
                          ) : (
                            <div className="w-full aspect-square max-w-[280px] rounded-[3rem] bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-8xl italic shadow-2xl">
                              {usuario.nombre?.charAt(0)}
                            </div>
                          )}
                          <div className={`absolute -top-4 -right-4 px-6 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border shadow-2xl ${
                            item.estado === 'activo' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-rose-500 text-white border-rose-400'
                          }`}>
                            {item.estado}
                          </div>
                        </div>
                        
                        <div className="w-full max-w-[280px] space-y-3">
                          <button 
                            onClick={() => handleUpdateEmpleado(item.id, { estado: item.estado === 'activo' ? 'inactivo' : 'activo' })}
                            className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                              item.estado === 'activo' 
                                ? 'bg-rose-600/10 text-rose-500 border border-rose-500/20 hover:bg-rose-600 hover:text-white' 
                                : 'bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                            Cambiar Estado
                          </button>
                          <button 
                            onClick={() => handleOpenCargoModal(item)}
                            className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            {item.cargo ? 'Editar Cargo' : 'Definir Cargo'}
                          </button>
                        </div>
                      </div>

                      {/* Columna Derecha: Información Detallada */}
                      <div className="lg:col-span-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                          <div className="space-y-1">
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] font-bold">Nombre Completo</p>
                            <p className="text-xl font-black text-white italic uppercase tracking-tight">{usuario.nombre} {usuario.apellidos}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] font-bold">Email</p>
                            <p className="text-lg font-bold text-slate-300 truncate">{usuario.email}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] font-bold">Teléfono</p>
                            <p className="text-lg font-bold text-slate-300">{usuario.telefono || 'No registrado'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] font-bold">Documento</p>
                            <p className="text-lg font-bold text-slate-300 uppercase">
                              {item.documentType || 'DNI'} : {item.documentNumber || usuario.documento || 'No registrado'}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] font-bold">Cargo Actual</p>
                            <p className="text-lg font-black text-purple-400 italic uppercase">{item.cargo || 'POR DEFINIR'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] font-bold">Especialidad</p>
                            <p className="text-lg font-black text-blue-400 italic uppercase">{item.especialidad || 'GENERAL'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] font-bold">Fecha de Ingreso</p>
                            <p className="text-lg font-bold text-slate-300">
                              {item.fechaIngreso ? new Date(item.fechaIngreso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'No registrada'}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] font-bold">ID Empleado</p>
                            <p className="text-lg font-mono font-bold text-slate-400"># {item.id}</p>
                          </div>
                        </div>

                        <div className="mt-12 pt-10 border-t border-white/5">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/[0.05] hover:bg-white/[0.04] transition-all">
                              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2 font-bold">Servicios</p>
                              <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-black text-white italic">{item.citas?.length || 0}</p>
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Realizados</span>
                              </div>
                            </div>
                            <div className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/[0.05] hover:bg-white/[0.04] transition-all">
                              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2 font-bold">Antigüedad</p>
                              <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-black text-white italic">
                                  {item.fechaIngreso ? Math.floor((new Date() - new Date(item.fechaIngreso)) / (1000 * 60 * 60 * 24 * 30.44)) : '0'}
                                </p>
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Meses</span>
                              </div>
                            </div>
                            <div className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/[0.05] hover:bg-white/[0.04] transition-all">
                              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2 font-bold">Calificación</p>
                              <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-black text-amber-500 italic">4.9</p>
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Promedio</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="py-32 text-center bg-[#0B1220]/30 border border-dashed border-white/10 rounded-[3rem]">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 italic uppercase">No hay empleados</h3>
              <p className="text-slate-500 max-w-xs mx-auto">No se encontraron colaboradores que coincidan con tu búsqueda actual.</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="p-10 flex justify-between items-center">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Página <span className="text-white font-bold">{currentPage}</span> de <span className="text-white font-bold">{totalPages}</span></div>
              <div className="flex items-center space-x-2">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="h-12 px-6 rounded-2xl border border-slate-800 text-white font-black text-[10px] uppercase tracking-widest disabled:opacity-20 hover:bg-white/5 transition-all">Anterior</button>
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="h-12 px-6 rounded-2xl border border-slate-800 text-white font-black text-[10px] uppercase tracking-widest disabled:opacity-20 hover:bg-white/5 transition-all">Siguiente</button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'citas' && (
        <div className="space-y-6">
          <div className="flex space-x-2 bg-slate-900 p-1 rounded-2xl border border-slate-800 w-fit">
            {['TODAS', 'PENDIENTE', 'EN PROCESO', 'FINALIZADO'].map(est => (
              <button key={est} onClick={() => { setFiltroEstadoCita(est); setCitasPage(1); }} className={`px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all ${filtroEstadoCita === est ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{est}</button>
            ))}
          </div>
          <div className="overflow-x-auto bg-slate-900/50 border border-slate-800 rounded-3xl relative min-h-[200px]">
            {loadingAdmin && <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-3xl"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-500 uppercase tracking-widest"><tr><th className="p-5">Cita</th><th className="p-5">Cliente / Vehículo</th><th className="p-5">Empleado</th><th className="p-5">Fecha / Hora</th><th className="p-5 text-center">Estado</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {citasGenerales.length > 0 ? citasGenerales.map(c => (
                  <tr 
                    key={c.id} 
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                    onClick={() => {
                      setSelectedCitaForDrawer(c);
                      setShowDrawer(true);
                    }}
                  >
                    <td className="p-5 font-bold text-white group-hover:text-blue-400 transition-colors">{c.servicio?.nombre}</td>
                    <td className="p-5"><div className="flex flex-col"><span className="text-slate-300 font-bold">{c.usuario?.nombre}</span><span className="text-blue-400 font-bold">{c.vehiculo?.placa}</span></div></td>
                    <td className="p-5"><span className="bg-slate-800 px-3 py-1 rounded-lg text-slate-300 font-bold">{c.empleado?.usuario?.nombre || 'Sin asignar'}</span></td>
                    <td className="p-5"><div className="flex flex-col"><span className="text-slate-300 font-bold">{new Date(c.fecha).toLocaleDateString()}</span><span className="text-slate-500 font-bold italic">⏰ {c.hora_inicio?.substring(0, 5)}</span></div></td>
                    <td className="p-5 text-center"><span className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase ${c.estado === 'PENDIENTE' ? 'bg-amber-500/10 text-amber-500' : c.estado === 'EN PROCESO' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>{c.estado}</span></td>
                  </tr>
                )) : <tr><td colSpan="5" className="p-10 text-center text-slate-500 italic">No hay citas registradas.</td></tr>}
              </tbody>
            </table>
          </div>
          {totalCitas > 0 && (
            <div className="p-6 border border-slate-800 bg-slate-900/50 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Página <span className="text-white font-bold">{citasPage}</span> de <span className="text-white font-bold">{totalPagesCitas}</span> <span className="mx-2 opacity-20">|</span> Total: <span className="text-white font-bold">{totalCitas}</span></div>
              <div className="flex items-center space-x-2">
                <button onClick={() => setCitasPage(prev => Math.max(prev - 1, 1))} disabled={citasPage === 1 || loadingAdmin} className="px-4 py-2 rounded-xl border border-slate-700 text-white disabled:opacity-30">Anterior</button>
                <button onClick={() => setCitasPage(prev => Math.min(prev + 1, totalPagesCitas))} disabled={citasPage === totalPagesCitas || loadingAdmin} className="px-4 py-2 rounded-xl border border-slate-700 text-white disabled:opacity-30">Siguiente</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DRAWER LATERAL DE DETALLES DE CITA */}
      <>
        {/* Overlay */}
        <div 
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] transition-opacity duration-300 ${showDrawer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setShowDrawer(false)}
        />
        
        {/* Drawer */}
        <div className={`fixed right-0 top-0 h-full w-full sm:max-w-[420px] bg-[#0B1220] border-l border-white/5 shadow-2xl z-[1000] flex flex-col transform transition-transform duration-300 ease-in-out ${showDrawer ? 'translate-x-0' : 'translate-x-full'}`}>
          
          {selectedCitaForDrawer && (
            <>
              {/* Header */}
              <div className="p-8 border-b border-white/5">
                <div className="flex justify-between items-start mb-4">
                  <button 
                    onClick={() => setShowDrawer(false)}
                    className="p-2 -ml-2 rounded-xl hover:bg-white/5 text-slate-500 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    selectedCitaForDrawer.estado === 'PENDIENTE' ? 'bg-amber-500/10 text-amber-500' : 
                    selectedCitaForDrawer.estado === 'EN PROCESO' ? 'bg-blue-500/10 text-blue-500' : 
                    selectedCitaForDrawer.estado === 'CANCELADO' ? 'bg-red-500/10 text-red-500' :
                    selectedCitaForDrawer.estado === 'TIEMPO_EXCEDIDO' ? 'bg-orange-500/10 text-orange-500' :
                    'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {selectedCitaForDrawer.estado}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-1">
                  {selectedCitaForDrawer.servicio?.nombre}
                </h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Detalle de la Cita</p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Info Section */}
                <div className="space-y-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Cliente</span>
                    <span className="text-white font-bold text-lg">{selectedCitaForDrawer.usuario?.nombre} {selectedCitaForDrawer.usuario?.apellidos}</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Vehículo</span>
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-500/10 text-blue-400 px-4 py-2 rounded-xl font-black text-sm border border-blue-500/20">
                        {selectedCitaForDrawer.vehiculo?.placa}
                      </span>
                      <span className="text-slate-400 text-sm font-bold italic">{selectedCitaForDrawer.vehiculo?.marca} {selectedCitaForDrawer.vehiculo?.modelo}</span>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Empleado Asignado</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-slate-200 font-bold">{selectedCitaForDrawer.empleado?.usuario?.nombre || 'Sin asignar'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Fecha y Hora</span>
                      <span className="text-white font-bold">{new Date(selectedCitaForDrawer.fecha).toLocaleDateString()}</span>
                      <span className="text-slate-500 text-sm font-bold italic">⏰ {selectedCitaForDrawer.hora_inicio?.substring(0, 5)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Creación</span>
                      <span className="text-slate-400 text-xs font-bold">{new Date(selectedCitaForDrawer.createdAt).toLocaleDateString()}</span>
                      <span className="text-slate-500 text-[10px] font-bold italic uppercase">por {selectedCitaForDrawer.createdBy || 'Sistema'}</span>
                    </div>
                  </div>
                </div>

                {/* Verification Code Section */}
                {(selectedCitaForDrawer.estado === 'PENDIENTE' || 
                  selectedCitaForDrawer.estado === 'EN PROCESO' || 
                  selectedCitaForDrawer.estado === 'TIEMPO_EXCEDIDO') && (
                  <div className="bg-slate-950/50 border border-white/5 rounded-3xl p-6">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Código enviado al cliente</span>
                    <div className="bg-black/40 rounded-2xl p-6 text-center border border-white/5">
                      <span className="text-4xl font-mono font-black text-blue-400 tracking-[0.5em] ml-[0.5em]">
                        {selectedCitaForDrawer.codigoEntrega || selectedCitaForDrawer.verificationCode || '---'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedCitaForDrawer.estado !== 'FINALIZADO' && (
                <div className="p-8 bg-slate-950/30 border-t border-white/5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => {
                        setNuevaFecha(selectedCitaForDrawer.fecha?.split('T')[0]);
                        setNuevaHora(selectedCitaForDrawer.hora_inicio);
                        setShowAplazarModal(true);
                      }}
                      className="px-4 py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Aplazar Cita
                    </button>
                    <button 
                      onClick={() => setShowEliminarModal(true)}
                      className="px-4 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500/20 transition-all"
                    >
                      Forzar Eliminar
                    </button>
                  </div>
                  
                  {selectedCitaForDrawer.estado !== 'TIEMPO_EXCEDIDO' && (
                    <button 
                      onClick={handleMarkAsOverdue}
                      disabled={submittingAction}
                      className="w-full px-4 py-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-[10px] font-black text-orange-500 uppercase tracking-widest hover:bg-orange-500/20 transition-all disabled:opacity-50"
                    >
                      {submittingAction ? 'PROCESANDO...' : 'Marcar como atrasada'}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </>

      {/* MODAL APLAZAR */}
      {showAplazarModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1100] flex items-center justify-center p-4">
          <div className="bg-[#0B1220] border border-white/10 rounded-[40px] p-10 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-6 italic">Reprogramar Cita</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Nueva Fecha</label>
                <input 
                  type="date" 
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-bold"
                  value={nuevaFecha}
                  onChange={(e) => setNuevaFecha(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Nueva Hora</label>
                <input 
                  type="time" 
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-bold"
                  value={nuevaHora}
                  onChange={(e) => setNuevaHora(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => setShowAplazarModal(false)}
                  className="px-6 py-4 bg-slate-900 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleReschedule}
                  disabled={submittingAction || !nuevaFecha || !nuevaHora}
                  className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {submittingAction ? 'PROCESANDO...' : 'CONFIRMAR'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {showEliminarModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1100] flex items-center justify-center p-4">
          <div className="bg-[#0B1220] border border-white/10 rounded-[40px] p-10 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-black text-red-500 uppercase tracking-tighter mb-2 italic">Eliminar Cita</h3>
            <p className="text-slate-400 font-bold text-sm mb-6">¿Eliminar permanentemente esta cita?</p>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Motivo Obligatorio</label>
                <textarea 
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-bold min-h-[100px]"
                  placeholder="Explique el motivo de la eliminación..."
                  value={motivoEliminacion}
                  onChange={(e) => setMotivoEliminacion(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => setShowEliminarModal(false)}
                  className="px-6 py-4 bg-slate-900 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleForceDelete}
                  disabled={submittingAction || !motivoEliminacion}
                  className="px-6 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-600/20 disabled:opacity-50"
                >
                  {submittingAction ? 'ELIMINAR AHORA' : 'CONFIRMAR'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;
