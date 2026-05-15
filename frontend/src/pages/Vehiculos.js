import React, { Component } from 'react';
import SearchAndFilter from '../components/SearchAndFilter';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class Vehiculos extends Component {
  constructor(props) {
    super(props);
    this.state = {
      vehiculos: [],
      loading: true,
      error: null,
      showForm: false,
      formData: {
        documentType: '',
        documentNumber: '',
        placa: '',
        tipo: 'motorcycle', // Valor por defecto
        brand: '',
        year: '',
        color: '',
        model: ''
      },
      formErrors: {},
      isSubmitting: false,
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
        this.setState({ vehiculos: data, loading: false });
      } else {
        this.setState({ error: 'Error al obtener vehículos', loading: false });
      }
    } catch (err) {
      this.setState({ error: 'No se pudo conectar con el servidor', loading: false });
    }
  };

  handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este vehículo?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/vehiculos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        this.fetchVehiculos();
      } else {
        alert('Error al eliminar el vehículo');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  handleInputChange = (e) => {
    let { name, value } = e.target;
    
    // Process input values
    if (name === 'documentNumber') {
      value = value.replace(/\D/g, ''); // Only numbers
    } else if (name === 'placa') {
      value = value.toUpperCase(); // Force uppercase
    } else if (name === 'year') {
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
    if (!formData.documentType.trim()) errors.documentType = 'This field is required';
    if (!formData.documentNumber.trim()) {
      errors.documentNumber = 'This field is required';
    } else if (formData.documentNumber.length < 5) {
      errors.documentNumber = 'Document number must be at least 5 digits';
    }

    if (!formData.placa.trim()) {
      errors.placa = 'This field is required';
    } else if (formData.placa.length < 4) {
      errors.placa = 'Plate must be at least 4 characters';
    }

    if (!formData.tipo) errors.tipo = 'This field is required';
    if (!formData.brand.trim()) errors.brand = 'This field is required';
    
    if (!formData.year.trim()) {
      errors.year = 'This field is required';
    } else {
      const year = parseInt(formData.year, 10);
      if (year < 1990 || year > currentYear + 1) {
        errors.year = `Year must be between 1990 and ${currentYear + 1}`;
      }
    }

    this.setState({ formErrors: errors });
    return Object.keys(errors).length === 0;
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!this.validateForm()) return;

    const { formData } = this.state;
    this.setState({ isSubmitting: true });

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) {
        alert('Sesión expirada. Por favor inicia sesión nuevamente.');
        return;
      }

      const dataToSend = {
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
        placa: formData.placa,
        tipo: formData.tipo === 'motorcycle' ? 'Moto' : 'Auto',
        marca: formData.brand,
        anio: parseInt(formData.year, 10),
        color: formData.color.trim() || null,
        modelo: formData.model.trim() || null,
        usuarioId: parseInt(userId, 10)
      };

      const response = await fetch(`${API_BASE_URL}/vehiculos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        this.setState({
          showForm: false,
          formData: {
            documentType: '',
            documentNumber: '',
            placa: '',
            tipo: 'motorcycle',
            brand: '',
            year: '',
            color: '',
            model: ''
          },
          formErrors: {},
          isSubmitting: false
        });
        this.fetchVehiculos();
        if (this.props.showToast) {
          this.props.showToast('Unit registered successfully', 'success');
        }

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
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'No se pudo crear el vehículo'}`);
        this.setState({ isSubmitting: false });
      }
    } catch (err) {
      alert('Error de conexión');
      this.setState({ isSubmitting: false });
    }
  };

  render() {
    const { vehiculos, loading, showForm, formData, error } = this.state;
    const filteredVehiculos = this.getFilteredVehiculos();

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#020617]"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#2563EB]"></div></div>;

    return (
      <div className="space-y-12 animate-in fade-in duration-700 pb-32 bg-white dark:bg-[#020617]">
        <header className="relative py-20 px-10 overflow-hidden rounded-[3rem] border border-slate-200 dark:border-white/5 mx-6 mt-6 bg-slate-100 dark:bg-[#111827]">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />
          <div className="relative z-10 text-center space-y-4">
            <div className="inline-block px-4 py-1 rounded-full bg-purple-600/10 border border-purple-600/20 text-purple-500 text-[10px] font-black uppercase tracking-[0.3em]">Fleet Management</div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-[#F8FAFC] italic tracking-tighter uppercase leading-none">
              Mi <span className="text-purple-500">Vehiculos</span>
            </h1>
            <p className="text-slate-500 dark:text-[#94A3B8] text-lg font-medium max-w-xl mx-auto italic">Administra tus unidades para agilizar tus servicios premium.</p>
          </div>
        </header>

        <div className="container mx-auto px-6 space-y-12">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC] italic uppercase tracking-tighter flex items-center">
                <span className="w-2 h-2 bg-purple-600 rounded-full mr-4 animate-pulse" />
                Unidades Registradas
              </h2>
              <button
                onClick={() => this.setState({ showForm: !showForm })}
                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-purple-600/20 transition-all active:scale-95"
              >
                {showForm ? 'Cerrar Registro' : 'Añadir Unidad VIP'}
              </button>
            </div>
            
            {/* Search and Filters */}
            <SearchAndFilter 
              vehiculos={vehiculos} 
              onFilterChange={this.handleFilterChange} 
            />
          </div>

          {error && (
            <div className="p-6 bg-red-950/20 border border-red-500/20 rounded-[2rem] text-red-400 text-sm font-bold italic uppercase tracking-widest text-center animate-in zoom-in duration-300">
              ⚠️ {error}
            </div>
          )}

          {/* Modal Form */}
          {showForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-[#0f1117] border border-[#2a2d3a] p-8 rounded-[2.5rem] shadow-2xl max-w-[560px] w-full mx-4 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                <div className="text-center space-y-2 mb-8">
                  <h2 className="text-2xl font-black text-[#F8FAFC] italic uppercase tracking-tighter">
                    Register New Unit
                  </h2>
                  <p className="text-[#94A3B8] text-sm">
                    Complete all fields to add your vehicle to the fleet
                  </p>
                </div>

                <form onSubmit={this.handleSubmit} className="space-y-6">
                  {/* Section 1: Owner Information */}
                  <div className="space-y-4">
                    <h3 className="text-[#6b7080] text-[11px] font-bold uppercase tracking-[0.08em]">
                      Owner Information
                    </h3>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">
                        Document type
                      </label>
                      <select
                        name="documentType"
                        value={this.state.formData.documentType}
                        onChange={this.handleInputChange}
                        className={`w-full h-[42px] px-4 bg-[#1a1d27] border rounded-xl text-[#F8FAFC] text-sm focus:outline-none transition-all ${
                          this.state.formErrors.documentType ? 'border-[#E24B4A]' : 'border-[#2a2d3a] focus:border-[#2563EB]'
                        }`}
                      >
                        <option value="">Select...</option>
                        <option value="CC">CC - Cédula de Ciudadanía</option>
                        <option value="CE">CE - Cédula de Extranjería</option>
                        <option value="NIT">NIT</option>
                        <option value="Pasaporte">Pasaporte</option>
                      </select>
                      {this.state.formErrors.documentType && (
                        <p className="text-[#E24B4A] text-xs font-bold">{this.state.formErrors.documentType}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">
                        Document number
                      </label>
                      <input
                        type="text"
                        name="documentNumber"
                        value={this.state.formData.documentNumber}
                        onChange={this.handleInputChange}
                        placeholder="Enter document number"
                        className={`w-full h-[42px] px-4 bg-[#1a1d27] border rounded-xl text-[#F8FAFC] text-sm focus:outline-none transition-all ${
                          this.state.formErrors.documentNumber ? 'border-[#E24B4A]' : 'border-[#2a2d3a] focus:border-[#2563EB]'
                        }`}
                      />
                      {this.state.formErrors.documentNumber && (
                        <p className="text-[#E24B4A] text-xs font-bold">{this.state.formErrors.documentNumber}</p>
                      )}
                    </div>
                  </div>

                  {/* Section 2: Vehicle Details */}
                  <div className="space-y-4">
                    <h3 className="text-[#6b7080] text-[11px] font-bold uppercase tracking-[0.08em]">
                      Vehicle Details
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Plate */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">
                          License plate
                        </label>
                        <input
                          type="text"
                          name="placa"
                          value={this.state.formData.placa}
                          onChange={this.handleInputChange}
                          placeholder="e.g. ABC123"
                          className={`w-full h-[42px] px-4 bg-[#1a1d27] border rounded-xl text-[#F8FAFC] text-sm focus:outline-none transition-all ${
                            this.state.formErrors.placa ? 'border-[#E24B4A]' : 'border-[#2a2d3a] focus:border-[#2563EB]'
                          }`}
                        />
                        {this.state.formErrors.placa && (
                          <p className="text-[#E24B4A] text-xs font-bold">{this.state.formErrors.placa}</p>
                        )}
                      </div>

                      {/* Type */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">
                          Type
                        </label>
                        <select
                          name="tipo"
                          value={this.state.formData.tipo}
                          onChange={this.handleInputChange}
                          className={`w-full h-[42px] px-4 bg-[#1a1d27] border rounded-xl text-[#F8FAFC] text-sm focus:outline-none transition-all ${
                            this.state.formErrors.tipo ? 'border-[#E24B4A]' : 'border-[#2a2d3a] focus:border-[#2563EB]'
                          }`}
                        >
                          <option value="motorcycle">Motorcycle</option>
                          <option value="car">Car</option>
                        </select>
                        {this.state.formErrors.tipo && (
                          <p className="text-[#E24B4A] text-xs font-bold">{this.state.formErrors.tipo}</p>
                        )}
                      </div>

                      {/* Brand */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">
                          Brand
                        </label>
                        <input
                          type="text"
                          name="brand"
                          value={this.state.formData.brand}
                          onChange={this.handleInputChange}
                          placeholder="e.g. Yamaha, Honda, Toyota"
                          className={`w-full h-[42px] px-4 bg-[#1a1d27] border rounded-xl text-[#F8FAFC] text-sm focus:outline-none transition-all ${
                            this.state.formErrors.brand ? 'border-[#E24B4A]' : 'border-[#2a2d3a] focus:border-[#2563EB]'
                          }`}
                        />
                        {this.state.formErrors.brand && (
                          <p className="text-[#E24B4A] text-xs font-bold">{this.state.formErrors.brand}</p>
                        )}
                      </div>

                      {/* Year */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">
                          Year
                        </label>
                        <input
                          type="text"
                          name="year"
                          value={this.state.formData.year}
                          onChange={this.handleInputChange}
                          placeholder={`e.g. ${new Date().getFullYear()}`}
                          className={`w-full h-[42px] px-4 bg-[#1a1d27] border rounded-xl text-[#F8FAFC] text-sm focus:outline-none transition-all ${
                            this.state.formErrors.year ? 'border-[#E24B4A]' : 'border-[#2a2d3a] focus:border-[#2563EB]'
                          }`}
                        />
                        {this.state.formErrors.year && (
                          <p className="text-[#E24B4A] text-xs font-bold">{this.state.formErrors.year}</p>
                        )}
                      </div>

                      {/* Color */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">
                          Color
                        </label>
                        <input
                          type="text"
                          name="color"
                          value={this.state.formData.color}
                          onChange={this.handleInputChange}
                          placeholder="e.g. Black, White, Red"
                          className="w-full h-[42px] px-4 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl text-[#F8FAFC] text-sm focus:outline-none focus:border-[#2563EB] transition-all"
                        />
                      </div>

                      {/* Model */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">
                          Model / Reference
                        </label>
                        <input
                          type="text"
                          name="model"
                          value={this.state.formData.model}
                          onChange={this.handleInputChange}
                          placeholder="e.g. MT-07, Civic, NX4"
                          className="w-full h-[42px] px-4 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl text-[#F8FAFC] text-sm focus:outline-none focus:border-[#2563EB] transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={this.state.isSubmitting}
                      className="w-full px-8 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-[#2a2d3a] disabled:text-[#6b7080] disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-purple-600/20 transition-all active:scale-95"
                    >
                      {this.state.isSubmitting ? 'Registering...' : 'Register unit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => this.setState({ 
                        showForm: false, 
                        formData: {
                          documentType: '',
                          documentNumber: '',
                          placa: '',
                          tipo: 'motorcycle',
                          brand: '',
                          year: '',
                          color: '',
                          model: ''
                        },
                        formErrors: {} 
                      })}
                      className="w-full px-8 py-4 bg-[#2a2d3a] hover:bg-[#3a3d4a] text-[#94A3B8] font-black text-xs uppercase tracking-[0.2em] rounded-2xl border border-[#2a2d3a] transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Listado de Vehículos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVehiculos.length > 0 ? (
              filteredVehiculos.map(v => (
                (() => {
                  const status = this.getStatusForVehiculo(v);
                  const ui = this.getStatusUI(status);
                  const progress = this.getProgressForStatus(status);
                  return (
                    <div key={v.id} className="bg-[#131318] border border-white/[0.08] p-7 rounded-xl shadow-sm space-y-5 relative overflow-hidden">
                      <div className="absolute top-5 right-5 flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.12em] border border-white/[0.08]" style={{ color: ui.color }}>
                          {ui.label}
                        </span>
                        <button
                          onClick={() => this.handleDelete(v.id)}
                          className="w-9 h-9 rounded-xl bg-[#0a0a0d] border border-white/[0.08] text-[#ff4d4d] hover:bg-[#ff4d4d]/10 transition-colors flex items-center justify-center"
                          aria-label="Eliminar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex items-start gap-4 pr-20">
                        <div className="w-12 h-12 rounded-lg bg-[#0a0a0d] border border-white/[0.08] flex items-center justify-center text-white font-mono text-[11px] uppercase tracking-[0.12em]">
                          {String(v.tipo || 'Unidad').slice(0, 4)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-white font-extrabold uppercase tracking-tight text-xl truncate">
                            {v.marca || 'Vehículo'}
                          </h3>
                          <p className="text-slate-400 text-sm truncate">
                            {v.modelo || 'Sin modelo'}{v.anio ? ` · ${v.anio}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: ui.bar }} />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="px-3 py-2 rounded-xl bg-[#1e1e28] border border-white/[0.08]">
                          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400">PLATE</div>
                          <div className="text-white font-semibold mt-0.5 truncate">{v.placa || '-'}</div>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-[#1e1e28] border border-white/[0.08]">
                          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400">TYPE</div>
                          <div className="text-white font-semibold mt-0.5 truncate">{v.tipo || '-'}</div>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-[#1e1e28] border border-white/[0.08]">
                          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400">COLOR</div>
                          <div className="text-white font-semibold mt-0.5 truncate">{v.color || '-'}</div>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-[#1e1e28] border border-white/[0.08]">
                          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400">YEAR</div>
                          <div className="text-white font-semibold mt-0.5 truncate">{v.anio || '-'}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ))
            ) : (
              <div className="col-span-full py-32 text-center bg-slate-100 dark:bg-[#111827] rounded-[3rem] border border-dashed border-slate-200 dark:border-white/5">
                <p className="text-slate-500 dark:text-[#94A3B8] italic font-medium">
                  {vehiculos.length > 0 ? 'No se encontraron vehículos con esos filtros' : 'No se detectan unidades registradas en su perfil.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default Vehiculos;
