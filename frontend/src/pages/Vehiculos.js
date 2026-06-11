import React, { Component} from 'react';
import CustomSelect from '../components/CustomSelect';
import carHeroImg from '../assets/images/1.png';
import vehiculoIcon from '../assets/iconos/coche.png';

import { API_BASE_URL } from '../apiConfig';

class Vehiculos extends Component {
  constructor(props) {
    super(props);
    this.state = {
      vehiculos: [],
      loading: true,
      error: null,
      showForm: false,
      isEditing: false,
      editId: null,
      formData: {
        placa: '',
        tipo: 'Moto',
        marca: '',
        modelo: '',
        anio: '',
        color: '',
        imagen: null,
      },
      formErrors: {},
      isSubmitting: false,
      isDeleting: false,
      deletingId: null,
      filters: {
        searchTerm: '',
        placaFilter: '',
        tipoFilter: '',
        anioFilter: '',
        marcaFilter: ''
      }
    };
  }

  // Filtering logic
  getFilteredVehiculos = () => {
    const { vehiculos, filters } = this.state;
    const { searchTerm, placaFilter, tipoFilter, anioFilter, marcaFilter } = filters;

    return vehiculos.filter(vehiculo => {
      // Search term filter (marca, placa, modelo)
      const matchesSearch = !searchTerm || 
        vehiculo.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehiculo.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehiculo.modelo?.toLowerCase().includes(searchTerm.toLowerCase());

      // Placa filter
      const matchesPlaca = !placaFilter || 
        vehiculo.placa?.toLowerCase().includes(placaFilter.toLowerCase());

      // Tipo filter
      const matchesTipo = !tipoFilter || vehiculo.tipo === tipoFilter;

      // Año filter
      const matchesAnio = !anioFilter || vehiculo.anio === parseInt(anioFilter, 10);

      // Marca filter
      const matchesMarca = !marcaFilter || vehiculo.marca === marcaFilter;

      return matchesSearch && matchesPlaca && matchesTipo && matchesAnio && matchesMarca;
    });
  };

  handleFilterChange = (filters) => {
    this.setState({ filters });
  };

  getStatusForVehiculo = (vehiculo) => {
    const raw = String(vehiculo?.estado || '').toUpperCase();
    if (raw.includes('RESERV') || raw.includes('INACT')) return 'RESERVED';
    if (raw.includes('CRIT') || raw.includes('MANT')) return 'CRITICAL';
    return 'STABLE';
  };

  getStatusUI = (status) => {
    if (status === 'CRITICAL') return { label: 'CRITICAL', color: '#ff4d4d', bar: '#ff4d4d' };
    if (status === 'RESERVED') return { label: 'RESERVED', color: '#94a3b8', bar: '#94a3b8' };
    return { label: 'STABLE', color: '#3ddc84', bar: '#3ddc84' };
  };

  getProgressForStatus = (status) => {
    if (status === 'CRITICAL') return 38;
    if (status === 'RESERVED') return 56;
    return 82;
  };

  getImageUrl = (imagen) => {
    if (!imagen) return null;
    if (imagen.startsWith('http://') || imagen.startsWith('https://')) return imagen;
    // Handle both cases: starts with /uploads or just the filename
    if (imagen.startsWith('/uploads')) return `${API_BASE_URL}${imagen}`;
    if (imagen.startsWith('uploads/')) return `${API_BASE_URL}/${imagen}`;
    if (imagen.startsWith('/')) return `${API_BASE_URL}${imagen}`;
    // If it's just a filename, assume it's in uploads
    return `${API_BASE_URL}/uploads/${imagen}`;
  };

  handleImageError = (e, vehicleId) => {
    e.target.src = carHeroImg;
    e.target.style.opacity = '0.4';
  };

  getBrandDisplay = (marca) => {
    if (!marca) return null;
    const normalizedMarca = marca.trim().toLowerCase();
    // Map common brands to display styles
    const brandStyles = {
      'yamaha': { bg: 'bg-[#003399]/20', border: 'border-[#003399]/30', text: 'text-[#003399]' },
      'honda': { bg: 'bg-[#e50010]/20', border: 'border-[#e50010]/30', text: 'text-[#e50010]' },
      'suzuki': { bg: 'bg-[#0066cc]/20', border: 'border-[#0066cc]/30', text: 'text-[#0066cc]' },
      'kawasaki': { bg: 'bg-[#00a651]/20', border: 'border-[#00a651]/30', text: 'text-[#00a651]' },
      'akt': { bg: 'bg-[#ff6600]/20', border: 'border-[#ff6600]/30', text: 'text-[#ff6600]' },
      'mazda': { bg: 'bg-[#101010]/20', border: 'border-[#101010]/30', text: 'text-[#101010]' },
      'chevrolet': { bg: 'bg-[#ffc61d]/20', border: 'border-[#ffc61d]/30', text: 'text-[#ffc61d]' },
      'toyota': { bg: 'bg-[#eb0a1e]/20', border: 'border-[#eb0a1e]/30', text: 'text-[#eb0a1e]' },
      'ford': { bg: 'bg-[#0033a0]/20', border: 'border-[#0033a0]/30', text: 'text-[#0033a0]' },
    };
    return brandStyles[normalizedMarca] || { bg: 'bg-white/15', border: 'border-white/20', text: 'text-white' };
  };

  componentDidMount() {
    this.fetchVehiculos();
    this.checkPendingAction();
  }

  checkPendingAction = () => {
    const pendingAction = localStorage.getItem('pendingAction');
    if (pendingAction === 'agendar_cita') {
      this.setState({ 
        showForm: true,
        error: 'Debes registrar un vehículo antes de agendar una cita.'
      });
      // Limpiar el error después de unos segundos si se desea, o dejarlo como mensaje informativo
      setTimeout(() => this.setState({ error: null }), 5000);
    }
  };

  fetchVehiculos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/vehiculos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Vehiculos] /vehiculos response imagen:', Array.isArray(data) ? data.map((v) => ({ id: v?.id, imagen: v?.imagen })) : data);
        this.setState({ vehiculos: data, loading: false });
      } else {
        this.setState({ error: 'Error al obtener vehículos', loading: false });
      }
    } catch (err) {
      this.setState({ error: 'No se pudo conectar con el servidor', loading: false });
    }
  };

  handleDelete = async (id) => {
    // Confirmación profesional
    if (!window.confirm('¿Estás seguro de eliminar este vehículo? Esta acción eliminará también todas las citas asociadas y no se puede deshacer.')) {
      return;
    }

    this.setState({ isDeleting: true, deletingId: id });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/vehiculos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        if (this.props.showToast) {
          this.props.showToast(data.message || 'Vehículo eliminado correctamente', 'success');
        }
        // Actualizar la lista localmente para feedback inmediato
        this.setState(prevState => ({
          vehiculos: prevState.vehiculos.filter(v => v.id !== id),
          isDeleting: false,
          deletingId: null
        }));
      } else {
        console.error('Error al eliminar vehículo:', data);
        const errorMessage = data.message || 'Error al eliminar el vehículo';
        
        if (this.props.showToast) {
          this.props.showToast(errorMessage, 'error');
        } else {
          alert(errorMessage);
        }
        this.setState({ isDeleting: false, deletingId: null });
      }
    } catch (err) {
      console.error('Error de red al eliminar vehículo:', err);
      const networkError = 'Error de conexión con el servidor. Por favor, intenta de nuevo.';
      
      if (this.props.showToast) {
        this.props.showToast(networkError, 'error');
      } else {
        alert(networkError);
      }
      this.setState({ isDeleting: false, deletingId: null });
    }
  };

  handleEdit = (vehiculo) => {
    this.setState({
      showForm: true,
      isEditing: true,
      editId: vehiculo.id,
      formData: {
        placa: vehiculo.placa || '',
        tipo: vehiculo.tipo || 'Moto',
        marca: vehiculo.marca || '',
        modelo: vehiculo.modelo || '',
        anio: vehiculo.anio ? String(vehiculo.anio) : '',
        color: vehiculo.color || '',
        imagen: null, // No cargamos el archivo binario, pero podemos mostrar la URL
      },
      formErrors: {},
    });
  };

  handleCloseForm = () => {
     this.setState({
       showForm: false,
       isEditing: false,
       editId: null,
       isSubmitting: false,
       formData: {
         placa: '',
         tipo: 'Moto',
         marca: '',
         modelo: '',
         anio: '',
         color: '',
         imagen: null,
       },
       formErrors: {},
     });
   };

  handleInputChange = (e) => {
    let { name, value } = e.target;
    
    // Process input values
    if (name === 'placa') {
      value = value.toUpperCase(); // Force uppercase
    } else if (name === 'anio') {
      value = value.replace(/\D/g, ''); // Only numbers
    }

    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        [name]: value
      },
      formErrors: {
        ...prevState.formErrors,
        [name]: null // Clear error when typing
      }
    }));
  };

  validateForm = () => {
    const { formData } = this.state;
    const errors = {};
    const currentYear = new Date().getFullYear();

    // Required fields
    if (!formData.placa.trim()) {
      errors.placa = 'Este campo es requerido';
    } else if (formData.placa.length < 4) {
      errors.placa = 'La placa debe tener al menos 4 caracteres';
    }

    if (!formData.tipo) errors.tipo = 'Este campo es requerido';
    if (!formData.marca.trim()) errors.marca = 'Este campo es requerido';
    if (!formData.modelo.trim()) errors.modelo = 'Este campo es requerido';

    if (formData.anio.trim()) {
      const year = parseInt(formData.anio, 10);
      if (year < 1900 || year > currentYear + 1) {
        errors.anio = `El año debe estar entre 1900 y ${currentYear + 1}`;
      }
    }

    this.setState({ formErrors: errors });
    return Object.keys(errors).length === 0;
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!this.validateForm()) return;

    const { formData, isEditing, editId } = this.state;
    this.setState({ isSubmitting: true });

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) {
        alert('Sesión expirada. Por favor inicia sesión nuevamente.');
        return;
      }

      const fData = new FormData();
      fData.append('placa', formData.placa);
      fData.append('tipo', formData.tipo);
      fData.append('marca', formData.marca.trim());
      fData.append('modelo', formData.modelo.trim());
      fData.append('usuarioId', userId);

      if (formData.anio.trim()) {
        fData.append('anio', formData.anio.trim());
      }
      if (formData.color.trim()) {
        fData.append('color', formData.color.trim());
      }
      if (formData.imagen) {
        fData.append('file', formData.imagen);
      }

      const url = isEditing ? `${API_BASE_URL}/vehiculos/${editId}` : `${API_BASE_URL}/vehiculos`;
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: fData,
      });

      if (response.ok) {
        this.handleCloseForm();
        this.fetchVehiculos();
        
        const successMsg = isEditing ? 'Vehículo actualizado correctamente' : 'Vehículo registrado correctamente';
        if (this.props.showToast) {
          this.props.showToast(successMsg, 'success');
        }

        if (!isEditing) {
          // Check for redirect flag
          const redirectAfterVehicle = localStorage.getItem('redirectAfterVehicle');
          if (redirectAfterVehicle === 'citas' && this.props.setView) {
            localStorage.removeItem('redirectAfterVehicle');
            this.props.setView('citas');
          }
          // Also keep the existing pendingAction check for backward compatibility
          const pendingAction = localStorage.getItem('pendingAction');
          if (pendingAction === 'agendar_cita' && this.props.setView) {
            localStorage.removeItem('pendingAction');
            this.props.setView('citas');
          }
        }
      } else {
        let errorMessage = 'No se pudo procesar la solicitud';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Error al parsear respuesta de error:', parseError);
        }
        alert(`Error: ${errorMessage}`);
        this.setState({ isSubmitting: false });
      }
    } catch (err) {
      console.error('Error al enviar formulario:', err);
      alert('Error de conexión');
      this.setState({ isSubmitting: false });
    }
  };

  render() {
    const { vehiculos, loading, showForm, error } = this.state;
    const filteredVehiculos = this.getFilteredVehiculos();
    const totalVehiculos = Array.isArray(vehiculos) ? vehiculos.length : 0;
    const totalFiltered = Array.isArray(filteredVehiculos) ? filteredVehiculos.length : 0;
    const tipoOptions = [
      { value: '', label: 'Todos los tipos' },
      { value: 'Moto', label: 'Moto' },
      { value: 'Auto', label: 'Auto' },
    ];
    const formTipoOptions = [
      { value: 'Moto', label: 'Moto' },
      { value: 'Auto', label: 'Auto' },
    ];

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#020617]"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#2563EB]"></div></div>;

    return (
      <div className="min-h-screen bg-white dark:bg-[#020617] pb-24 animate-in fade-in duration-700">
        <section className="relative overflow-hidden bg-gradient-to-r from-[#1A2526] via-[#0468BF] to-[#1A2526] px-6 md:px-10 py-10 md:py-14 -mt-16 pt-24 md:pt-28">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.08),transparent_60%)]"></div>
          <div className="relative z-10 max-w-6xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-black text-white">
              Mis vehículos
            </h1>
            <p className="text-white/70 text-sm md:text-base mt-2">
              Gestiona y administra tus vehículos registrados.
            </p>
          </div>
        </section>
        <div className="max-w-7xl mx-auto px-6 pt-8 space-y-6">
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b1220] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                 <img src={vehiculoIcon} alt="vehiculo" className="w-6 h-6" bg="white"/>
                  <div>
                    <div className="text-lg font-black text-slate-900 dark:text-white">Mis vehículos</div>
                    <div className="text-xs text-slate-600 dark:text-[#94A3B8]">
                      Gestiona los vehículos registrados para tus citas y servicios.
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <div className="relative w-full sm:w-[280px]">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={this.state.filters.searchTerm}
                      onChange={(e) => this.setState((prev) => ({ filters: { ...prev.filters, searchTerm: e.target.value } }))}
                      placeholder="Buscar vehículo..."
                      className="w-full h-11 pl-12 pr-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none focus:border-[#2563EB]/50 transition-colors"
                    />
                  </div>

                  <CustomSelect
                    value={this.state.filters.tipoFilter}
                    onChange={(val) => this.setState((prev) => ({ filters: { ...prev.filters, tipoFilter: val } }))}
                    options={tipoOptions}
                    className="w-full sm:w-[170px]"
                  />

                  <button
                    type="button"
                    onClick={() => this.setState({ showForm: !showForm, isEditing: false, editId: null })}
                    className="w-full sm:w-auto h-11 px-5 rounded-2xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-black uppercase tracking-widest transition-colors"
                  >
                    + Registrar vehículo
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="px-6 pt-5">
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
                  {error}
                </div>
              </div>
            )}

            {showForm && (
              <div className="px-6 py-6 border-b border-slate-200 dark:border-white/10">
                <div className="rounded-3xl border border-[#2563EB]/25 bg-[#0b1220] overflow-hidden">
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-black text-white">
                        {this.state.isEditing ? 'Editar vehículo' : 'Registrar nuevo vehículo'}
                      </div>
                      <div className="text-xs text-[#94A3B8]">
                        {this.state.isEditing ? 'Actualiza la información de tu vehículo' : 'Completa la información de tu vehículo'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => this.handleCloseForm()}
                      className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors flex items-center justify-center"
                      aria-label="Cerrar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={this.handleSubmit} className="px-5 pb-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">
                          Marca
                        </label>
                        <input
                          name="marca"
                          value={this.state.formData.marca}
                          onChange={this.handleInputChange}
                          placeholder="Ej. Mazda"
                          className={`w-full h-11 px-4 rounded-2xl bg-white/5 border text-white placeholder:text-white/40 focus:outline-none transition-colors ${
                            this.state.formErrors.marca ? 'border-[#E24B4A]' : 'border-white/10 focus:border-[#2563EB]/50'
                          }`}
                        />
                        {this.state.formErrors.marca && (
                          <div className="text-xs text-[#E24B4A] font-bold">{this.state.formErrors.marca}</div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">
                          Modelo
                        </label>
                        <input
                          name="modelo"
                          value={this.state.formData.modelo}
                          onChange={this.handleInputChange}
                          placeholder="Ej. CX-5"
                          className={`w-full h-11 px-4 rounded-2xl bg-white/5 border text-white placeholder:text-white/40 focus:outline-none transition-colors ${
                            this.state.formErrors.modelo ? 'border-[#E24B4A]' : 'border-white/10 focus:border-[#2563EB]/50'
                          }`}
                        />
                        {this.state.formErrors.modelo && (
                          <div className="text-xs text-[#E24B4A] font-bold">{this.state.formErrors.modelo}</div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">
                          Año
                        </label>
                        <input
                          name="anio"
                          value={this.state.formData.anio}
                          onChange={this.handleInputChange}
                          placeholder="Ej. 2022"
                          className={`w-full h-11 px-4 rounded-2xl bg-white/5 border text-white placeholder:text-white/40 focus:outline-none transition-colors ${
                            this.state.formErrors.anio ? 'border-[#E24B4A]' : 'border-white/10 focus:border-[#2563EB]/50'
                          }`}
                        />
                        {this.state.formErrors.anio && (
                          <div className="text-xs text-[#E24B4A] font-bold">{this.state.formErrors.anio}</div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">
                          Tipo de vehículo
                        </label>
                        <CustomSelect
                          value={this.state.formData.tipo}
                          onChange={(val) => this.setState((prev) => ({ formData: { ...prev.formData, tipo: val } }))}
                          options={formTipoOptions}
                          className={this.state.formErrors.tipo ? 'border-[#E24B4A] rounded-2xl' : ''}
                        />
                        {this.state.formErrors.tipo && (
                          <div className="text-xs text-[#E24B4A] font-bold">{this.state.formErrors.tipo}</div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">
                          Placa
                        </label>
                        <input
                          name="placa"
                          value={this.state.formData.placa}
                          onChange={this.handleInputChange}
                          placeholder="Ej. ABC-123"
                          className={`w-full h-11 px-4 rounded-2xl bg-white/5 border text-white placeholder:text-white/40 focus:outline-none transition-colors uppercase ${
                            this.state.formErrors.placa ? 'border-[#E24B4A]' : 'border-white/10 focus:border-[#2563EB]/50'
                          }`}
                        />
                        {this.state.formErrors.placa && (
                          <div className="text-xs text-[#E24B4A] font-bold">{this.state.formErrors.placa}</div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">
                          Color
                        </label>
                        <input
                          name="color"
                          value={this.state.formData.color}
                          onChange={this.handleInputChange}
                          placeholder="Ej. Gris oscuro"
                          className="w-full h-11 px-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#2563EB]/50 transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">
                          Imagen del vehículo
                        </label>
                        <label className="w-full h-11 px-4 rounded-2xl bg-white/5 border border-white/10 text-white/80 cursor-pointer flex items-center justify-between hover:bg-white/10 transition-colors">
                          <span className="text-sm">Subir imagen</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              this.setState((prev) => ({ formData: { ...prev.formData, imagen: file } }));
                            }}
                          />
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white/50">
                            <path d="M11.25 3.75a.75.75 0 01.75.75v6h6a.75.75 0 010 1.5h-6v6a.75.75 0 01-1.5 0v-6h-6a.75.75 0 010-1.5h6v-6a.75.75 0 01.75-.75z" />
                          </svg>
                        </label>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => this.handleCloseForm()}
                        className="h-11 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-widest transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={this.state.isSubmitting}
                        className="h-11 px-6 rounded-2xl bg-[#2563EB] hover:bg-[#1d4ed8] disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest transition-colors"
                      >
                        {this.state.isSubmitting ? 'Guardando...' : (this.state.isEditing ? 'Actualizar vehículo' : 'Guardar vehículo')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="px-6 py-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-black text-slate-900 dark:text-white">
                  Vehículos registrados ({totalVehiculos})
                </div>
                <div className="text-xs text-slate-600 dark:text-[#94A3B8]">
                  {totalFiltered !== totalVehiculos ? `${totalFiltered} visibles` : ''}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredVehiculos.length > 0 ? (
                  <>
                    {filteredVehiculos.map((v) => (
                      <div key={v.id} className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden">
                        <div className="relative h-28 bg-[#0b1220]">
                          <img 
                            src={this.getImageUrl(v.imagen) || carHeroImg} 
                            alt={v.marca} 
                            onError={(e) => this.handleImageError(e, v.id)}
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                              this.getImageUrl(v.imagen) ? 'opacity-60' : 'opacity-15'
                            }`} 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-[#0b1220]/40 to-transparent" />
                          <div className="absolute top-3 left-3 inline-flex items-center gap-2">
                            {v.marca && (() => {
                              const brandStyle = this.getBrandDisplay(v.marca);
                              return (
                                <span className={`px-2.5 py-1 rounded-full ${brandStyle.bg} ${brandStyle.border} ${brandStyle.text} text-[10px] font-black capitalize`}>
                                  {v.marca}
                                </span>
                              );
                            })()}
                            <span className="px-2.5 py-1 rounded-full bg-[#2563EB]/15 border border-[#2563EB]/20 text-[#60A5FA] text-[10px] font-black">
                              Principal
                            </span>
                          </div>
                          <div className="absolute top-3 right-3 flex items-center gap-2">
                            <button
                              type="button"
                              disabled={this.state.isDeleting && this.state.deletingId === v.id}
                              onClick={() => this.handleDelete(v.id)}
                              className="h-10 w-10 rounded-2xl bg-white dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center disabled:opacity-50"
                            >
                              {this.state.isDeleting && this.state.deletingId === v.id ? (
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                  <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          <div>
                            <div className="text-sm font-black text-slate-900 dark:text-white">
                              {(v.marca || 'Vehículo')}{v.anio ? ` ${v.anio}` : ''}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-[#94A3B8]">
                              {v.placa || '—'} · {v.tipo || '—'}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-[#94A3B8]">
                            <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2">
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Color</div>
                              <div className="mt-1 font-bold text-slate-900 dark:text-white/90 truncate">{v.color || '—'}</div>
                            </div>
                            <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2">
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Modelo</div>
                              <div className="mt-1 font-bold text-slate-900 dark:text-white/90 truncate">{v.modelo || '—'}</div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => this.handleEdit(v)}
                              className="flex-1 h-10 rounded-2xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => this.props.setView?.('citas')}
                              className="flex-1 h-10 rounded-2xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-[11px] font-black uppercase tracking-widest transition-colors"
                            >
                              Agendar cita
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => this.setState({ showForm: true })}
                      className="rounded-3xl border border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-colors p-6 flex flex-col items-center justify-center text-center"
                    >
                      <div className="h-14 w-14 rounded-3xl bg-[#2563EB]/15 border border-[#2563EB]/20 text-[#60A5FA] flex items-center justify-center text-2xl">
                        +
                      </div>
                      <div className="mt-4 text-sm font-black text-slate-900 dark:text-white">Agregar vehículo</div>
                      <div className="mt-1 text-xs text-slate-600 dark:text-[#94A3B8]">
                        Registra uno nuevo para agendar tus servicios
                      </div>
                    </button>
                  </>
                ) : (
                  <div className="col-span-full rounded-3xl border border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 p-10 text-center">
                    <div className="text-sm text-slate-600 dark:text-[#94A3B8]">
                      {totalVehiculos > 0 ? 'No se encontraron vehículos con esos filtros.' : 'Aún no tienes vehículos registrados.'}
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => this.setState({ showForm: true })}
                        className="h-11 px-6 rounded-2xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-black uppercase tracking-widest transition-colors"
                      >
                        + Registrar vehículo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Vehiculos;
