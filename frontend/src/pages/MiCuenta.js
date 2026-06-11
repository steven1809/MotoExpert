import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MoreVertical, Trash2, UserRound } from 'lucide-react';
import FaceAuthModal from '../components/FaceAuthModal';
import { useWebAuthn } from '../hooks/useWebAuthn';
import { API_BASE_URL, fixImageUrl } from '../apiConfig';
import { t } from '../styles/theme';
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

const MiCuenta = ({ setView }) => {
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFaceAuth, setShowFaceAuth] = useState(false);
  const [isFaceRegistered, setIsFaceRegistered] = useState(false);
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const [bannerMenuOpen, setBannerMenuOpen] = useState(false);

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
  
  const [bannerImage, setBannerImage] = useState(
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200"
  );

  useEffect(() => {
    if (profile.fotoBanner) {
      setBannerImage(profile.fotoBanner);
    }
  }, [profile.fotoBanner]);

  useEffect(() => {
    if (profile.email) {
      const registered = !!localStorage.getItem(`faceDescriptor_${profile.email}`);
      setIsFaceRegistered(registered);
    }
  }, [profile.email, showFaceAuth]);

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

  // --- AYUDANTES ---

  const showNotification = useCallback((msg, type = 'success', duration = 3000) => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), duration);
  }, []);

  const handleFaceSuccess = useCallback(() => {
    setShowFaceAuth(false);
    const currentToken = localStorage.getItem('token');
    const currentEmail = profile.email;
    if (currentToken && currentEmail) {
      localStorage.setItem(`faceToken_${currentEmail}`, currentToken);
      localStorage.setItem(`faceRole_${currentEmail}`, localStorage.getItem('role') || 'user');
      localStorage.setItem(`faceUserId_${currentEmail}`, localStorage.getItem('userId') || '');
      localStorage.setItem(`faceUserName_${currentEmail}`, localStorage.getItem('userName') || '');
      localStorage.setItem(`facePicture_${currentEmail}`, localStorage.getItem('userPicture') || '');
    }
    showNotification("¡Rostro vinculado correctamente!");
  }, [showNotification, profile.email]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = { 'Authorization': `Bearer ${token}` };
    const API_URL = API_BASE_URL;

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
          rawDate: new Date(c.fecha),
          canRate: (c.estado === 'FINALIZADO' || c.estado === 'Completado') && !c.rated
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
  }, [showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const { registerBiometric } = useWebAuthn();

  // --- CARGA DE SEGURIDAD (MOCK PERSISTENTE EN LOCALSTORAGE) ---
  useEffect(() => {
    const savedSecurity = localStorage.getItem('user_security_settings');
    if (savedSecurity) {
      setSecurity(JSON.parse(savedSecurity));
    }
  }, []);

  const handleToggleBiometric = async (val) => {
    if (val) {
      try {
        const res = await registerBiometric();
        if (res.success) {
          updateSecurity({ fingerprint: true });
          showNotification(res.message);
        }
      } catch (err) {
        showNotification(err.message, "error");
      }
    } else {
      if (window.confirm("¿Estás seguro de desactivar el acceso biométrico?")) {
        updateSecurity({ fingerprint: false });
        showNotification("Acceso biométrico desactivado");
      }
    }
  };

  const updateSecurity = (newSettings) => {
    const updated = { ...security, ...newSettings };
    setSecurity(updated);
    localStorage.setItem('user_security_settings', JSON.stringify(updated));
  };

  const mainVehicle = useMemo(() => vehicles.find(v => v.principal) || vehicles[0], [vehicles]);

  // --- ACCIONES ---

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const API_URL = API_BASE_URL;

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
    const API_URL = API_BASE_URL;

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
          setBannerImage(updatedUser.banner);
          showNotification("Banner actualizado");
        }
        fetchData();
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
    const API_URL = API_BASE_URL;

    const formData = new FormData();
    formData.append('marca', newVehicle.marca);
    formData.append('modelo', newVehicle.modelo);
    formData.append('anio', newVehicle.año);
    formData.append('placa', newVehicle.placa);
    formData.append('usuarioId', userId);
    
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
        fetchData();
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
    const API_URL = API_BASE_URL;

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
    const API_URL = API_BASE_URL;
    const userEmail = localStorage.getItem('userEmail');

    try {
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
    <div className={`min-h-screen ${t('bgPage')} pb-20`}>
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

      <div className="w-full">
        <section className={`relative w-full overflow-hidden ${t('bgCard')}`}>
          {bannerImage && (
            <img
              src={fixImageUrl(bannerImage)}
              className="absolute inset-0 w-full h-full object-cover opacity-25"
              alt="Banner"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f1b2d]/90 via-[#1a2d4a]/70 to-[#0f1b2d]/90" />
          <div className="absolute inset-0 backdrop-blur-[2px]" />

          <div className="relative w-full px-4 md:px-8 pt-16 pb-10">
            <div className="absolute top-3 right-3 z-[60]">
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setBannerMenuOpen((v) => !v);
                }}
                aria-label="Opciones de banner"
                aria-haspopup="menu"
                aria-expanded={bannerMenuOpen}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {bannerMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[55]"
                    onClick={() => setBannerMenuOpen(false)}
                  />
                  <div
                    className="absolute right-0 mt-2 w-52 rounded-lg bg-[#1e2a3a] text-white border border-white/10 overflow-hidden z-[60]"
                    role="menu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="w-full px-4 py-3 text-left text-sm font-bold hover:bg-white/5 transition-colors inline-flex items-center gap-3"
                      role="menuitem"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBannerMenuOpen(false);
                        fileInputRef.current?.click();
                      }}
                    >
                      <UserRound className="w-4 h-4" />
                      <span>Cambiar foto de perfil</span>
                    </button>
                    <button
                      type="button"
                      className="w-full px-4 py-3 text-left text-sm font-bold hover:bg-white/5 transition-colors inline-flex items-center gap-3"
                      role="menuitem"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBannerMenuOpen(false);
                        bannerInputRef.current?.click();
                      }}
                    >
                      <Camera className="w-4 h-4" />
                      <span>Cambiar banner</span>
                    </button>
                    <button
                      type="button"
                      className="w-full px-4 py-3 text-left text-sm font-bold hover:bg-white/5 transition-colors inline-flex items-center gap-3"
                      role="menuitem"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBannerMenuOpen(false);
                        setBannerImage(null);
                        setProfile((prev) => ({ ...prev, fotoBanner: null }));
                        showNotification("BANNER ELIMINADO", "success", 2500);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar banner</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col md:flex-row md:items-end gap-8">
              <div className="relative group/avatar cursor-pointer" onClick={() => fileInputRef.current.click()}>
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-white dark:bg-[#161b22] border-4 border-white dark:border-[#0f1b2d] overflow-hidden flex items-center justify-center text-5xl font-black text-[#1e90ff] relative">
                  {profile.fotoPerfil ? (
                    <img src={fixImageUrl(profile.fotoPerfil)} className="w-full h-full object-cover rounded-full" alt="Avatar" />
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
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h1 className={`text-4xl md:text-5xl font-black tracking-tight truncate ${t('textPrimary')}`}>
                    {profile.nombre}
                  </h1>
                  <span className="text-yellow-400 text-2xl">★</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="w-full px-4 md:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-10">
            <div className="lg:col-span-7 space-y-10">
              <section className={`border-b ${t('border')} pb-10`}>
                <div className="flex items-center justify-between gap-4">
                  <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] ${t('textLabel')}`}>
                    Información Personal
                  </h3>
                  <button
                    onClick={() => { setEditForm({ ...profile }); setShowEditProfile(true); }}
                    className={`text-[10px] font-black uppercase tracking-widest hover:underline ${t('accentText')}`}
                    type="button"
                  >
                    Editar Perfil
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { label: 'Nombre Completo', value: profile.nombre },
                    { label: 'Correo Electrónico', value: profile.email, color: t('accentText') },
                    { label: 'Teléfono', value: profile.telefono },
                    { label: 'Dirección de Residencia', value: profile.direccion }
                  ].map((field, i) => (
                    <div key={i} className={`border-b ${t('border')} pb-4`}>
                      <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${t('textLabel')}`}>
                        {field.label}
                      </label>
                      <p className={`text-sm font-black ${field.color || t('textPrimary')}`}>
                        {field.value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className={`border-b ${t('border')} pb-10`}>
                <div className="flex items-center justify-between gap-4">
                  <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] ${t('textLabel')}`}>
                    Vehículos
                  </h3>
                </div>

                {vehicles.length > 0 ? (
                  <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[400px] overflow-y-auto pr-2 pb-2">
                      {vehicles.map((v) => {
                        const isPrincipal = Boolean(v.principal || (mainVehicle && v.id === mainVehicle.id));
                        return (
                          <div key={v.id} className={`${t('bgCard')} border ${t('border')} rounded-xl overflow-hidden`}>
                            <div className={`relative h-40 overflow-hidden ${t('bgEmpty')}`}>
                              <img src={fixImageUrl(v.imagen)} alt={v.nombre} className="w-full h-full object-cover opacity-90" />
                              {isPrincipal && (
                                <div className={`absolute top-3 left-3 text-[9px] font-black uppercase px-3 py-1 tracking-wider text-white ${t('accentBg')} rounded-full`}>
                                  PRINCIPAL
                                </div>
                              )}
                            </div>
                            <div className="p-5">
                              <div className={`text-sm font-black uppercase tracking-tight ${t('textPrimary')}`}>{v.nombre}</div>
                              <div className="mt-3 grid grid-cols-2 gap-6">
                                <div>
                                  <div className={`text-[9px] font-black uppercase tracking-widest ${t('textLabel')}`}>Placa</div>
                                  <div className={`text-sm font-black ${t('textPrimary')}`}>{v.placa}</div>
                                </div>
                                <div>
                                  <div className={`text-[9px] font-black uppercase tracking-widest ${t('textLabel')}`}>Año</div>
                                  <div className={`text-sm font-black ${t('textPrimary')}`}>{v.año}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className={`mt-6 py-10 border ${t('border')} text-center`}>
                    <p className={`text-sm font-bold mb-4 ${t('textSecondary')}`}>No tienes vehículos registrados</p>
                    <button
                      onClick={() => setShowAddVehicle(true)}
                      className={`px-5 py-2.5 text-white text-xs font-black uppercase tracking-wider transition-colors ${t('accentBg')} ${t('accentHover')}`}
                      type="button"
                    >
                      Agregar Vehículo
                    </button>
                  </div>
                )}
              </section>
            </div>

            <aside className={`lg:col-span-3 `}>
              <section className={`border-b ${t('border')} pb-10`}>
                <div className="flex items-center justify-between gap-4">
                  <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] ${t('textLabel')}`}>
                    Logros
                  </h3>
                </div>

                <div className="mt-6 space-y-5">
                  {achievements.map((ach) => (
                    <div key={ach.id} className={`border ${t('border')} p-5`}>
                      <div className="flex items-start gap-4">
                        <div className={`text-3xl ${!ach.unlocked && 'grayscale opacity-40'}`}>{ach.icon}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-4">
                            <div className={`text-sm font-black uppercase tracking-tight truncate ${t('textPrimary')}`}>
                              {ach.title}
                            </div>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${t('textSecondary')}`}>
                              {ach.progress}%
                            </div>
                          </div>
                          <div className={`mt-2 text-xs font-bold ${t('textSecondary')}`}>
                            {ach.description}
                          </div>
                          <div className={`mt-4 h-2 w-full overflow-hidden ${t('progressBg')}`}>
                            <div
                              className={`h-full transition-all duration-500 ${t('progressFill')}`}
                              style={{ width: `${ach.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>

      {/* --- MODALES --- */}
      <Modal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} title="Editar Perfil">
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <Input label="Nombre Completo" value={editForm.nombre} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })} required />
          <Input label="Correo Electrónico" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} required />
          <Input label="Teléfono" value={editForm.telefono} onChange={e => setEditForm({ ...editForm, telefono: e.target.value })} />
          <Input label="Dirección" value={editForm.direccion} onChange={e => setEditForm({ ...editForm, direccion: e.target.value })} />
          <button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg">
            Guardar Cambios
          </button>
        </form>
      </Modal>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default MiCuenta;
