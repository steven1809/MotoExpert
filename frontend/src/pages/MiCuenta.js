import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import correoIcon from '../assets/iconos/correo.png';
import telefonoIcon from '../assets/iconos/telefono.png';
import ubicacionIcon from '../assets/iconos/ubicacion.png';

// --- COMPONENTES REUTILIZABLES ---

const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#1c2333] rounded-[2rem] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{title}</h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {children}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Input = ({ label, error, ...props }) => (
  <div className="space-y-1.5 w-full">
    {label && (
      <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">
        {label}
      </label>
    )}
    <input
      {...props}
      className={`w-full h-12 px-4 bg-white dark:bg-[#1c2333] border ${
        error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
      } rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#3b82f6] transition-all text-sm font-medium`}
    />
    {error && <p className="text-[10px] text-red-500 font-bold pl-1">{error}</p>}
  </div>
);

const Toggle = ({ enabled, onChange, label }) => (
  <div className="flex items-center justify-between py-2">
    {label && <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>}
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        enabled ? 'bg-[#3b82f6]' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const Toast = ({ message, type = 'success', onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200]"
  >
    <div className={`px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 ${
      type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
    }`}>
      <span className="text-sm font-black uppercase tracking-widest">{message}</span>
      {type === 'success' && <span>✓</span>}
    </div>
  </motion.div>
);

const MiCuenta = () => {
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  // --- GESTIÓN DE ESTADO ---
  
  // 1. Información Personal
  const [profile, setProfile] = useState({
    nombre: localStorage.getItem('userName') || '',
    email: localStorage.getItem('userEmail') || '',
    telefono: '',
    direccion: '',
    fotoPerfil: localStorage.getItem('userPicture') || null,
    fotoBanner: null,
    memberSince: 'Mayo 2023'
  });
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({ ...profile });

  // 2. Vehículos
  const [vehicles, setVehicles] = useState([]);
  const [showVehiclesList, setShowVehiclesList] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ marca: '', modelo: '', año: '', placa: '', color: '', km: '', imagen: '' });

  // 3. Métodos de Pago
  const [payments, setPayments] = useState([
    { id: 1, tipo: "VISA", ultimos4: "4582", titular: "Carlos Ramirez", predeterminado: true },
    { id: 2, tipo: "MASTERCARD", ultimos4: "9120", titular: "Carlos Ramirez", predeterminado: false }
  ]);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [activePaymentMenu, setActivePaymentMenu] = useState(null);
  const [newPayment, setNewPayment] = useState({ tipo: 'VISA', numero: '', titular: '', vencimiento: '', cvv: '', predeterminado: false });
  const [showCVV, setShowCVV] = useState(false);

  // 4. Actividad
  const [activities, setActivities] = useState([]);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all');

  // 6. Logros
  const [achievements, setAchievements] = useState([
    { id: 1, icon: "🥉", title: "Cliente frecuente", description: "5 citas completadas", unlocked: false, progress: 0 },
    { id: 2, icon: "🏆", title: "Experto en detalles", description: "10 servicios premium", unlocked: false, progress: 0 },
    { id: 3, icon: "🛡️", title: "Miembro desde hace", description: "1 año", unlocked: false, progress: 0 },
    { id: 4, icon: "💎", title: "Amante del auto", description: "5 vehículos registrados", unlocked: false, progress: 0 },
    { id: 5, icon: "👍", title: "Dio su opinión", description: "5 reseñas publicadas", unlocked: false, progress: 0 },
    { id: 6, icon: "👑", title: "Cliente Gold", description: "Nivel actual", unlocked: false, progress: 0 }
  ]);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);

  // --- CARGA DE DATOS REALES ---

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = { 'Authorization': `Bearer ${token}` };
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    try {
      // 1. Cargar Perfil
      const profileRes = await fetch(`${API_URL}/usuarios/me`, { headers });
      let profileData = null;
      if (profileRes.ok) {
        profileData = await profileRes.json();
        const mappedProfile = {
          nombre: profileData.nombre,
          email: profileData.email,
          telefono: profileData.telefono || 'No registrado',
          direccion: profileData.direccion || 'No registrada',
          fotoPerfil: profileData.picture || null,
          fotoBanner: profileData.banner || null,
          memberSince: new Date(profileData.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
        };
        setProfile(mappedProfile);
        setEditForm(mappedProfile);
        if (mappedProfile.fotoPerfil) {
          localStorage.setItem('userPicture', mappedProfile.fotoPerfil);
        }
      }

      // 2. Cargar Vehículos
      const vehiclesRes = await fetch(`${API_URL}/vehiculos`, { headers });
      let vehiclesData = [];
      if (vehiclesRes.ok) {
        vehiclesData = await vehiclesRes.json();
        setVehicles(vehiclesData.map((v, index) => ({
          id: v.id,
          nombre: `${v.marca} ${v.modelo}`,
          año: v.anio,
          placa: v.placa,
          km: 0, 
          imagen: v.imagen || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600",
          principal: index === 0
        })));
      }

      // 3. Cargar Actividad (Citas y Reseñas)
      const appointmentsRes = await fetch(`${API_URL}/citas`, { headers });
      let appointmentsData = [];
      if (appointmentsRes.ok) {
        const res = await appointmentsRes.json();
        appointmentsData = res.data || [];
      }

      const ratingsRes = await fetch(`${API_URL}/ratings`, { headers });
      let ratingsData = [];
      if (ratingsRes.ok) {
        ratingsData = await ratingsRes.json();
        const userId = localStorage.getItem('userId');
        ratingsData = ratingsData.filter(r => String(r.usuario?.id) === String(userId));
      }

      // Combinar todo el historial
      const historyItems = [
        ...appointmentsData.map(c => ({
          id: `cita-${c.id}`,
          tipo: 'servicio',
          descripcion: `${c.servicio?.nombre || 'Servicio'} - ${c.vehiculo?.placa || ''}`,
          fecha: new Date(c.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          estado: c.estado,
          rawDate: new Date(c.fecha)
        })),
        ...ratingsData.map(r => ({
          id: `rating-${r.id}`,
          tipo: 'reseña',
          descripcion: `Calificaste: ${r.cita?.servicio?.nombre || 'Servicio'} (${r.serviceRating}★)`,
          fecha: new Date(r.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
          estado: 'Publicado',
          rawDate: new Date(r.createdAt)
        })),
        ...vehiclesData.map(v => ({
          id: `vehiculo-${v.id}`,
          tipo: 'vehiculo',
          descripcion: `Registraste: ${v.marca} ${v.modelo} (${v.placa})`,
          fecha: new Date(v.createdAt || Date.now()).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
          estado: '',
          rawDate: new Date(v.createdAt || Date.now())
        }))
      ].sort((a, b) => b.rawDate - a.rawDate);

      setActivities(historyItems);

      // 4. Calcular Logros
      const completedCitas = appointmentsData.filter(c => c.estado === 'FINALIZADO').length;
      const premiumServices = appointmentsData.filter(c => c.estado === 'FINALIZADO' && c.servicio?.nombre?.toLowerCase().includes('premium')).length;
      const numVehicles = vehiclesData.length;
      const numRatings = ratingsData.length;
      const monthsActive = profileData ? Math.floor((Date.now() - new Date(profileData.createdAt)) / (1000 * 60 * 60 * 24 * 30)) : 0;

      setAchievements(prev => prev.map(ach => {
        let progress = 0;
        switch(ach.id) {
          case 1: progress = (completedCitas / 5) * 100; break;
          case 2: progress = (premiumServices / 10) * 100; break;
          case 3: progress = (monthsActive / 12) * 100; break;
          case 4: progress = (numVehicles / 5) * 100; break;
          case 5: progress = (numRatings / 5) * 100; break;
          case 6: progress = (completedCitas / 20) * 100; break;
          default: break;
        }
        progress = Math.min(100, Math.max(0, progress));
        return { ...ach, progress: Math.round(progress), unlocked: progress >= 100 };
      }));

    } catch (error) {
      console.error("Error cargando datos:", error);
      showNotification("Error al cargar información");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 5. Seguridad
  const [security, setSecurity] = useState({
    lastPasswordUpdate: "Nunca",
    twoFactor: false,
    fingerprint: false,
    activeDevices: 1
  });
  const [devices, setDevices] = useState([
    { id: 1, nombre: "Este dispositivo", so: "Navegador Web", ultimaConexion: "Ahora" }
  ]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [showDevicesModal, setShowDevicesModal] = useState(false);

  // --- CARGA DE SEGURIDAD (MOCK PERSISTENTE EN LOCALSTORAGE) ---
  useEffect(() => {
    const savedSecurity = localStorage.getItem('user_security_settings');
    if (savedSecurity) {
      setSecurity(JSON.parse(savedSecurity));
    }
  }, []);

  const updateSecurity = (newSettings) => {
    const updated = { ...security, ...newSettings };
    setSecurity(updated);
    localStorage.setItem('user_security_settings', JSON.stringify(updated));
  };

  // --- AYUDANTES ---

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const mainVehicle = useMemo(() => vehicles.find(v => v.principal) || vehicles[0], [vehicles]);

  // --- ACCIONES ---

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    try {
      const res = await fetch(`${API_URL}/usuarios/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: editForm.nombre,
          email: editForm.email,
          telefono: editForm.telefono,
          direccion: editForm.direccion
        })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setProfile({
          ...profile,
          nombre: updatedUser.nombre,
          email: updatedUser.email,
          telefono: updatedUser.telefono || 'No registrado',
          direccion: updatedUser.direccion || 'No registrada'
        });
        localStorage.setItem('userName', updatedUser.nombre);
        localStorage.setItem('userEmail', updatedUser.email);
        setShowEditProfile(false);
        showNotification("Cambios guardados correctamente");
      } else {
        showNotification("Error al actualizar perfil", "error");
      }
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      showNotification("Error de conexión", "error");
    }
  };

  const handleSetPrincipalVehicle = (id) => {
    setVehicles(vehicles.map(v => ({ ...v, principal: v.id === id })));
    showNotification("Vehículo principal actualizado");
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    const formData = new FormData();
    formData.append('file', file);

    const endpoint = type === 'profile' ? 'upload-photo' : 'upload-banner';

    try {
      const res = await fetch(`${API_URL}/usuarios/${userId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const updatedUser = await res.json();
        if (type === 'profile') {
          setProfile({ ...profile, fotoPerfil: updatedUser.picture });
          localStorage.setItem('userPicture', updatedUser.picture);
          showNotification("Foto de perfil actualizada");
        } else {
          setProfile({ ...profile, fotoBanner: updatedUser.banner });
          showNotification("Banner actualizado");
        }
        fetchData(); // Refrescar actividades y demás
      } else {
        showNotification("Error al subir la imagen", "error");
      }
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      showNotification("Error de conexión", "error");
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    const formData = new FormData();
    formData.append('marca', newVehicle.marca);
    formData.append('modelo', newVehicle.modelo);
    formData.append('anio', newVehicle.año);
    formData.append('placa', newVehicle.placa);
    formData.append('usuarioId', userId);
    // km y color no parecen estar en el DTO original pero se podrían agregar si el backend lo soporta
    
    try {
      const res = await fetch(`${API_URL}/vehiculos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const v = await res.json();
        const vehicle = {
          id: v.id,
          nombre: `${v.marca} ${v.modelo}`,
          año: v.anio,
          placa: v.placa,
          km: 0,
          imagen: v.imagen || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600",
          principal: vehicles.length === 0
        };
        setVehicles([...vehicles, vehicle]);
        setNewVehicle({ marca: '', modelo: '', año: '', placa: '', color: '', km: '', imagen: '' });
        setShowAddVehicle(false);
        showNotification("Vehículo agregado con éxito");
        fetchData(); // Refrescar actividades
      } else {
        showNotification("Error al agregar vehículo", "error");
      }
    } catch (error) {
      console.error("Error agregando vehículo:", error);
      showNotification("Error de conexión", "error");
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este vehículo?")) return;
    
    const token = localStorage.getItem('token');
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    try {
      const res = await fetch(`${API_URL}/vehiculos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setVehicles(vehicles.filter(v => v.id !== id));
        showNotification("Vehículo eliminado");
      } else {
        showNotification("Error al eliminar vehículo", "error");
      }
    } catch (error) {
      console.error("Error eliminando vehículo:", error);
      showNotification("Error de conexión", "error");
    }
  };

  const formatCardNumber = (val) => {
    const v = val.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) return parts.join(' ');
    return val;
  };

  const handleAddPayment = (e) => {
    e.preventDefault();
    const last4 = newPayment.numero.replace(/\s/g, '').slice(-4);
    const payment = {
      id: Date.now(),
      tipo: newPayment.tipo,
      ultimos4: last4,
      titular: newPayment.titular,
      predeterminado: newPayment.predeterminado || payments.length === 0
    };

    if (payment.predeterminado) {
      setPayments(payments.map(p => ({ ...p, predeterminado: false })).concat(payment));
    } else {
      setPayments([...payments, payment]);
    }

    setNewPayment({ tipo: 'VISA', numero: '', titular: '', vencimiento: '', cvv: '', predeterminado: false });
    setShowAddPayment(false);
    showNotification("Método de pago agregado");
  };

  const handleDeletePayment = (id) => {
    setPayments(payments.filter(p => p.id !== id));
    showNotification("Método de pago eliminado");
  };

  const handleSetDefaultPayment = (id) => {
    setPayments(payments.map(p => ({ ...p, predeterminado: p.id === id })));
    setActivePaymentMenu(null);
    showNotification("Pago predeterminado actualizado");
  };

  const filteredActivities = useMemo(() => {
    if (activityFilter === 'all') return activities;
    return activities.filter(a => a.tipo === activityFilter);
  }, [activities, activityFilter]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      alert("Las contraseñas no coinciden");
      return;
    }
    if (passwordForm.new.length < 8) {
      alert("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    
    const token = localStorage.getItem('token');
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const userEmail = localStorage.getItem('userEmail');

    try {
      // Usamos el endpoint de reset-password con el OTP simulado '123456'
      // ya que no hay un endpoint directo de 'change-password' en el controlador actual
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          identifier: userEmail,
          otp: '123456',
          password: passwordForm.new,
          confirmPassword: passwordForm.confirm
        })
      });

      if (res.ok) {
        updateSecurity({ lastPasswordUpdate: new Date().toLocaleDateString('es-ES', { month: 'short', day: '2-digit', year: 'numeric' }) });
        setShowPasswordModal(false);
        setPasswordForm({ current: '', new: '', confirm: '' });
        showNotification("Contraseña actualizada con éxito");
      } else {
        const error = await res.json();
        alert(error.message || "Error al actualizar contraseña");
      }
    } catch (error) {
      console.error("Error cambiando contraseña:", error);
      showNotification("Error de conexión", "error");
    }
  };

  const handleLogoutDevice = (id) => {
    if (id === 1) {
      alert("No puedes cerrar la sesión activa desde aquí. Usa el botón Salir.");
      return;
    }
    const newDevices = devices.filter(d => d.id !== id);
    setDevices(newDevices);
    updateSecurity({ activeDevices: newDevices.length });
    showNotification("Sesión cerrada en el dispositivo");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d1117] transition-colors duration-500 pb-20">
      {/* Inputs de archivo ocultos */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => handleFileUpload(e, 'profile')} 
      />
      <input 
        type="file" 
        ref={bannerInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => handleFileUpload(e, 'banner')} 
      />

      {loading && (
        <div className="fixed inset-0 z-[300] bg-white/80 dark:bg-[#0d1117]/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest animate-pulse">Cargando información...</p>
        </div>
      )}
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* --- CABECERA / BANNER --- */}
        <div className="relative group">
          <div 
            className="h-48 md:h-64 bg-gradient-to-br from-blue-600 to-blue-900 rounded-[2.5rem] overflow-hidden shadow-xl shadow-blue-500/10 cursor-pointer relative"
            onClick={() => bannerInputRef.current.click()}
          >
            <img 
              src={profile.fotoBanner || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200"} 
              className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" 
              alt="Banner" 
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center text-white">
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs font-bold uppercase tracking-widest">Cambiar Banner</span>
              </div>
            </div>
          </div>
          
          <div className="absolute -bottom-12 left-10 flex flex-col md:flex-row items-end gap-6">
            <div className="relative group/avatar cursor-pointer" onClick={() => fileInputRef.current.click()}>
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-white dark:bg-[#161b22] border-4 border-white dark:border-[#0d1117] shadow-2xl overflow-hidden flex items-center justify-center text-5xl font-black text-blue-600 relative">
                {profile.fotoPerfil ? (
                  <img src={profile.fotoPerfil} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  profile.nombre.charAt(0)
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                   <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-2 right-2 w-8 h-8 bg-emerald-500 border-4 border-white dark:border-[#161b22] rounded-full shadow-lg" />
            </div>
            
            <div className="pb-4 space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">{profile.nombre}</h1>
                <span className="text-yellow-500 text-2xl">★</span>
              </div>
              <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Cliente desde {profile.memberSince}
              </p>
              <div className="flex flex-wrap items-center gap-4 md:gap-8 text-sm font-bold text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-2"><img src={correoIcon} className="w-4 h-4 opacity-50" alt="" />{profile.email}</span>
                <span className="flex items-center gap-2"><img src={telefonoIcon} className="w-4 h-4 opacity-50" alt="" />{profile.telefono}</span>
                <span className="flex items-center gap-2"><img src={ubicacionIcon} className="w-4 h-4 opacity-50" alt="" />Medellín, CO</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- GRID PRINCIPAL --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-16">
          
          {/* SECCIÓN 1: INFORMACIÓN PERSONAL */}
          <div className="bg-white dark:bg-[#1c2333] rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Información Personal</h3>
              <button 
                onClick={() => { setEditForm({...profile}); setShowEditProfile(true); }}
                className="text-[10px] font-black text-[#3b82f6] uppercase tracking-widest hover:underline"
              >
                Editar Perfil
              </button>
            </div>
            
            <div className="space-y-6 flex-1">
              {[
                { label: 'Nombre Completo', value: profile.nombre },
                { label: 'Correo Electrónico', value: profile.email, color: 'text-[#3b82f6]' },
                { label: 'Teléfono', value: profile.telefono },
                { label: 'Dirección de Residencia', value: profile.direccion }
              ].map((field, i) => (
                <div key={i}>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">{field.label}</label>
                  <p className={`text-sm font-black ${field.color || 'text-gray-900 dark:text-white'}`}>{field.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN 2: VEHÍCULO PRINCIPAL */}
          <div className="bg-white dark:bg-[#1c2333] rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Vehículo Principal</h3>
              <button onClick={() => setShowVehiclesList(true)} className="text-[10px] font-black text-[#3b82f6] uppercase tracking-widest hover:underline">Ver Todos</button>
            </div>
            
            {mainVehicle ? (
              <div className="flex-1 flex flex-col">
                <div className="aspect-video rounded-3xl overflow-hidden mb-6 bg-gray-100 dark:bg-[#161b22] group relative">
                  <img src={mainVehicle.imagen} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Car" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-blue-600/20">Principal</span>
                  </div>
                </div>
                <div className="text-center">
                  <h4 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">{mainVehicle.nombre}</h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 mb-6">
                    Año {mainVehicle.año} • {mainVehicle.km.toLocaleString()} KM
                  </p>
                  <div className="inline-block px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-xs font-black tracking-[0.2em] shadow-xl uppercase italic">
                    {mainVehicle.placa}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 text-center space-y-4">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sin vehículos registrados</p>
                <button onClick={() => setShowAddVehicle(true)} className="text-xs font-black text-[#3b82f6] uppercase tracking-widest">+ Agregar Vehículo</button>
              </div>
            )}
          </div>

          {/* SECCIÓN 3: MÉTODOS DE PAGO */}
          <div className="bg-white dark:bg-[#1c2333] rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Métodos de Pago</h3>
              <button onClick={() => setShowAddPayment(true)} className="p-2.5 bg-[#3b82f6] text-white rounded-xl shadow-lg hover:scale-110 transition-transform">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
            
            <div className="space-y-4 flex-1">
              {payments.map((p) => (
                <div key={p.id} className="group relative bg-gray-50 dark:bg-[#161b22] p-5 rounded-3xl border border-transparent hover:border-[#3b82f6]/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-white dark:bg-[#1c2333] rounded-lg flex items-center justify-center border border-gray-100 dark:border-gray-800 shadow-sm font-black text-[8px] italic text-[#3b82f6]">
                        {p.tipo}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight">**** {p.ultimos4}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{p.titular}</p>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <button 
                        onClick={() => setActivePaymentMenu(activePaymentMenu === p.id ? null : p.id)}
                        className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/></svg>
                      </button>
                      
                      <AnimatePresence>
                        {activePaymentMenu === p.id && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1c2333] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-2 z-20"
                          >
                            {!p.predeterminado && (
                              <button onClick={() => handleSetDefaultPayment(p.id)} className="w-full px-4 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#161b22]">Predeterminada</button>
                            )}
                            <button onClick={() => handleDeletePayment(p.id)} className="w-full px-4 py-2 text-left text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">Eliminar tarjeta</button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  {p.predeterminado && (
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-[#3b82f6]/10 text-[#3b82f6] rounded-lg text-[9px] font-black uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full animate-pulse" />
                      Predeterminada
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* --- GRID INFERIOR --- */}
          
          {/* SECCIÓN 4: ACTIVIDAD RECIENTE */}
          <div className="bg-white dark:bg-[#1c2333] rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col lg:col-span-1">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actividad Reciente</h3>
              <button onClick={() => setShowActivitiesModal(true)} className="text-[10px] font-black text-[#3b82f6] uppercase tracking-widest hover:underline">Ver Todo</button>
            </div>
            
            <div className="space-y-6 flex-1">
              {activities.length > 0 ? (
                activities.slice(0, 4).map((a) => (
                  <div key={a.id} className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm ${
                      a.tipo === 'servicio' ? 'bg-emerald-500/10 text-emerald-500' :
                      a.tipo === 'reseña' ? 'bg-blue-500/10 text-blue-500' :
                      a.tipo === 'vehiculo' ? 'bg-purple-500/10 text-purple-500' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>
                      {a.tipo === 'servicio' ? '🛠️' : a.tipo === 'reseña' ? '⭐' : a.tipo === 'vehiculo' ? '🚗' : '📅'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 dark:text-white truncate tracking-tight">{a.descripcion}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{a.fecha}</p>
                    </div>
                    {a.estado && (
                      <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                        a.estado === 'Completado' ? 'bg-emerald-500/10 text-emerald-500' :
                        a.estado === 'Publicado' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {a.estado}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sin actividad reciente</p>
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 5: SEGURIDAD DE LA CUENTA */}
          <div className="bg-white dark:bg-[#1c2333] rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col lg:col-span-1">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Seguridad de la Cuenta</h3>
            </div>
            
            <div className="space-y-6 flex-1">
              <div className="flex items-center justify-between group cursor-pointer" onClick={() => setShowPasswordModal(true)}>
                <div className="space-y-0.5">
                  <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight">Contraseña</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Última actualización: {security.lastPasswordUpdate}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-[#161b22] flex items-center justify-center text-gray-400 group-hover:bg-[#3b82f6] group-hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>

              <div className="h-px bg-gray-100 dark:bg-gray-800" />

              <Toggle 
                enabled={security.twoFactor} 
                onChange={(val) => {
                  if (!val && !window.confirm("¿Estás seguro de desactivar la autenticación de dos pasos?")) return;
                  updateSecurity({ twoFactor: val });
                  showNotification(val ? "2FA Activado" : "2FA Desactivado");
                }} 
                label="Autenticación de dos pasos" 
              />
              
              <Toggle 
                enabled={security.fingerprint} 
                onChange={(val) => {
                  if (!val && !window.confirm("¿Estás seguro de desactivar el acceso biométrico?")) return;
                  updateSecurity({ fingerprint: val });
                  showNotification(val ? "Huella Activada" : "Huella Desactivada");
                }} 
                label="Acceso por Huella Digital" 
              />

              <div className="h-px bg-gray-100 dark:bg-gray-800" />

              <div className="flex items-center justify-between group cursor-pointer" onClick={() => setShowDevicesModal(true)}>
                <div className="space-y-0.5">
                  <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight">Dispositivos Activos</p>
                  <p className="text-[10px] font-bold text-[#3b82f6] uppercase">{security.activeDevices} dispositivos en línea</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-[#161b22] flex items-center justify-center text-gray-400 group-hover:bg-[#3b82f6] group-hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 6: LOGROS */}
          <div className="bg-white dark:bg-[#1c2333] rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col lg:col-span-1">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tus Logros</h3>
              <button onClick={() => setShowAchievementsModal(true)} className="text-[10px] font-black text-[#3b82f6] uppercase tracking-widest hover:underline">Ver Todos</button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 flex-1">
              {achievements.slice(0, 6).map((ach) => (
                <div key={ach.id} className="flex flex-col items-center text-center p-3 rounded-2xl bg-gray-50 dark:bg-[#161b22] border border-transparent hover:border-[#3b82f6]/30 transition-all">
                  <div className={`text-2xl mb-2 ${!ach.unlocked && 'grayscale opacity-30'}`}>{ach.icon}</div>
                  <p className="text-[9px] font-black text-gray-900 dark:text-white leading-none uppercase tracking-tighter mb-1">{ach.title}</p>
                  <div className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[#3b82f6] rounded-full" style={{ width: `${ach.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* --- MODALES --- */}

      {/* Modal Editar Perfil */}
      <Modal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} title="Editar Perfil">
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <Input label="Nombre Completo" value={editForm.nombre} onChange={e => setEditForm({...editForm, nombre: e.target.value})} required />
          <Input label="Correo Electrónico" type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required />
          <Input label="Teléfono" value={editForm.telefono} onChange={e => setEditForm({...editForm, telefono: e.target.value})} required />
          <Input label="Dirección" value={editForm.direccion} onChange={e => setEditForm({...editForm, direccion: e.target.value})} required />
          <button type="submit" className="w-full h-14 bg-[#3b82f6] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 mt-4 hover:scale-[1.02] transition-transform">
            Guardar Cambios
          </button>
        </form>
      </Modal>

      {/* Modal Vehículos */}
      <Modal isOpen={showVehiclesList} onClose={() => setShowVehiclesList(false)} title="Mis Vehículos">
        <div className="space-y-4">
          {vehicles.map(v => (
            <div key={v.id} onClick={() => handleSetPrincipalVehicle(v.id)} className={`group relative p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-5 ${
              v.principal ? 'bg-blue-600/5 border-[#3b82f6]' : 'bg-gray-50 dark:bg-[#161b22] border-transparent hover:border-gray-200 dark:hover:border-gray-700'
            }`}>
              <div className="w-24 h-16 rounded-2xl overflow-hidden bg-white dark:bg-[#1c2333]">
                <img src={v.imagen} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">{v.nombre}</h4>
                  <div className="flex items-center gap-2">
                    {v.principal && <span className="text-[9px] font-black bg-[#3b82f6] text-white px-2 py-1 rounded-lg uppercase tracking-widest">Principal</span>}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteVehicle(v.id); }}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{v.año} • {v.placa} • {v.km.toLocaleString()} KM</p>
              </div>
            </div>
          ))}
          <button onClick={() => { setShowVehiclesList(false); setShowAddVehicle(true); }} className="w-full h-14 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-xs font-black uppercase tracking-[0.2em] mt-4 shadow-xl">
            + Agregar Nuevo Vehículo
          </button>
        </div>
      </Modal>

      {/* Modal Agregar Vehículo */}
      <Modal isOpen={showAddVehicle} onClose={() => setShowAddVehicle(false)} title="Nuevo Vehículo">
        <form onSubmit={handleAddVehicle} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Marca" placeholder="Ej: Toyota" value={newVehicle.marca} onChange={e => setNewVehicle({...newVehicle, marca: e.target.value})} required />
            <Input label="Modelo" placeholder="Ej: TXL" value={newVehicle.modelo} onChange={e => setNewVehicle({...newVehicle, modelo: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Año" type="number" placeholder="2025" value={newVehicle.año} onChange={e => setNewVehicle({...newVehicle, año: e.target.value})} required />
            <Input label="Placa" placeholder="ABC123" value={newVehicle.placa} onChange={e => setNewVehicle({...newVehicle, placa: e.target.value.toUpperCase()})} required />
          </div>
          <Input label="Kilometraje" type="number" placeholder="12000" value={newVehicle.km} onChange={e => setNewVehicle({...newVehicle, km: e.target.value})} required />
          <Input label="URL de Imagen (Opcional)" placeholder="https://..." value={newVehicle.imagen} onChange={e => setNewVehicle({...newVehicle, imagen: e.target.value})} />
          <button type="submit" className="w-full h-14 bg-[#3b82f6] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 mt-4">
            Registrar Vehículo
          </button>
        </form>
      </Modal>

      {/* Modal Agregar Pago */}
      <Modal isOpen={showAddPayment} onClose={() => setShowAddPayment(false)} title="Nuevo Método de Pago">
        <form onSubmit={handleAddPayment} className="space-y-6">
          <div className="flex gap-4">
            {['VISA', 'MASTERCARD', 'AMEX'].map(type => (
              <button 
                key={type}
                type="button"
                onClick={() => setNewPayment({...newPayment, tipo: type})}
                className={`flex-1 py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                  newPayment.tipo === type ? 'bg-[#3b82f6]/5 border-[#3b82f6] text-[#3b82f6]' : 'bg-gray-50 dark:bg-[#161b22] border-transparent text-gray-400'
                }`}
              >
                <span className="text-[8px] font-black italic tracking-tighter">{type}</span>
                <span className="text-[10px] font-black uppercase tracking-widest">{type}</span>
              </button>
            ))}
          </div>
          <Input label="Número de Tarjeta" placeholder="0000 0000 0000 0000" value={newPayment.numero} onChange={e => setNewPayment({...newPayment, numero: formatCardNumber(e.target.value)})} maxLength={19} required />
          <Input label="Nombre del Titular" placeholder="CARLOS RAMIREZ" value={newPayment.titular} onChange={e => setNewPayment({...newPayment, titular: e.target.value.toUpperCase()})} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Vencimiento (MM/AA)" placeholder="12/28" value={newPayment.vencimiento} onChange={e => {
              let v = e.target.value.replace(/[^0-9]/g, '');
              if (v.length >= 2) v = v.substring(0,2) + '/' + v.substring(2,4);
              setNewPayment({...newPayment, vencimiento: v});
            }} maxLength={5} required />
            <div className="relative">
              <Input label="CVV" type={showCVV ? "text" : "password"} placeholder="***" value={newPayment.cvv} onChange={e => setNewPayment({...newPayment, cvv: e.target.value.replace(/[^0-9]/g, '')})} maxLength={4} required />
              <button type="button" onClick={() => setShowCVV(!showCVV)} className="absolute right-4 top-9 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              </button>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer p-1">
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${newPayment.predeterminado ? 'bg-[#3b82f6] border-[#3b82f6]' : 'border-gray-200 dark:border-gray-700'}`}>
              <input type="checkbox" className="hidden" checked={newPayment.predeterminado} onChange={e => setNewPayment({...newPayment, predeterminado: e.target.checked})} />
              {newPayment.predeterminado && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Establecer como predeterminada</span>
          </label>
          <button type="submit" className="w-full h-14 bg-[#3b82f6] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 mt-4">Guardar Tarjeta</button>
        </form>
      </Modal>

      {/* Modal Actividades */}
      <Modal isOpen={showActivitiesModal} onClose={() => setShowActivitiesModal(false)} title="Historial Completo">
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
          {[
            { id: 'all', label: 'Todo' },
            { id: 'servicio', label: 'Servicios' },
            { id: 'reseña', label: 'Reseñas' },
            { id: 'vehiculo', label: 'Vehículos' },
            { id: 'cita', label: 'Citas' }
          ].map(filter => (
            <button 
              key={filter.id} 
              onClick={() => setActivityFilter(filter.id)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activityFilter === filter.id ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-500/20' : 'bg-gray-100 dark:bg-[#161b22] text-gray-400'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="space-y-6">
          {filteredActivities.length > 0 ? (
            filteredActivities.map(a => (
              <div key={a.id} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-[#161b22]">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm ${
                  a.tipo === 'servicio' ? 'bg-emerald-500/10 text-emerald-500' :
                  a.tipo === 'reseña' ? 'bg-blue-500/10 text-blue-500' :
                  a.tipo === 'vehiculo' ? 'bg-purple-500/10 text-purple-500' :
                  'bg-amber-500/10 text-amber-500'
                }`}>
                  {a.tipo === 'servicio' ? '🛠️' : a.tipo === 'reseña' ? '⭐' : a.tipo === 'vehiculo' ? '🚗' : '📅'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{a.descripcion}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{a.fecha}</p>
                </div>
                {a.estado && (
                  <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                    a.estado === 'Completado' ? 'bg-emerald-500/10 text-emerald-500' :
                    a.estado === 'Publicado' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-amber-500/10 text-amber-500'
                  }`}>
                    {a.estado}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No se encontraron actividades</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Contraseña */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Cambiar Contraseña">
        <form onSubmit={handleChangePassword} className="space-y-6">
          <Input label="Contraseña Actual" type="password" value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} required />
          <Input label="Nueva Contraseña" type="password" value={passwordForm.new} onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} required />
          <Input label="Confirmar Nueva Contraseña" type="password" value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} required />
          <button type="submit" className="w-full h-14 bg-[#3b82f6] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 mt-4">Actualizar Contraseña</button>
        </form>
      </Modal>

      {/* Modal Dispositivos */}
      <Modal isOpen={showDevicesModal} onClose={() => setShowDevicesModal(false)} title="Dispositivos Activos">
        <div className="space-y-4">
          {devices.map(d => (
            <div key={d.id} className="p-5 rounded-[2rem] bg-gray-50 dark:bg-[#161b22] flex items-center justify-between border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1c2333] flex items-center justify-center text-2xl shadow-sm">
                  {d.nombre.includes('iPhone') ? '📱' : d.nombre.includes('MacBook') ? '💻' : '🌐'}
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{d.nombre}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{d.so} • {d.ultimaConexion}</p>
                </div>
              </div>
              <button onClick={() => handleLogoutDevice(d.id)} className="px-4 py-2 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all">Cerrar Sesión</button>
            </div>
          ))}
        </div>
      </Modal>

      {/* Modal Logros */}
      <Modal isOpen={showAchievementsModal} onClose={() => setShowAchievementsModal(false)} title="Logros y Progreso">
        <div className="space-y-6">
          {achievements.map(ach => (
            <div key={ach.id} className="p-6 rounded-[2.5rem] bg-gray-50 dark:bg-[#161b22] border border-transparent">
              <div className="flex items-center gap-6 mb-4">
                <div className={`text-4xl ${!ach.unlocked && 'grayscale opacity-30'}`}>{ach.icon}</div>
                <div className="flex-1">
                  <p className="text-lg font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">{ach.title}</p>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{ach.description}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${ach.unlocked ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'}`}>
                    {ach.unlocked ? 'Desbloqueado' : 'Bloqueado'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progreso</span>
                  <span className="text-[10px] font-black text-[#3b82f6] uppercase tracking-widest">{ach.progress}%</span>
                </div>
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${ach.progress}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full bg-gradient-to-r from-blue-500 to-blue-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Notificación Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default MiCuenta;
