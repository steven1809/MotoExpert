import React, { Component } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class Vehiculos extends Component {
  constructor(props) {
    super(props);
    this.state = {
      vehiculos: [],
      loading: true,
      refreshing: false,
      error: null,
      showForm: false,
      formData: {
        marca: '',
        modelo: '',
        anio: '',
        placa: '',
        color: '',
        tipo: 'Moto' // Valor por defecto
      }
    };
  }

  componentDidMount() {
    this.fetchVehiculos(true);
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

  fetchVehiculos = async (initial = false) => {
    if (initial) {
      this.setState({ loading: true });
    } else {
      this.setState({ refreshing: true });
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/vehiculos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        this.setState({ vehiculos: [], error: 'No se pudo conectar con el servidor' });
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        this.setState({ vehiculos: [], error: 'No se pudo conectar con el servidor' });
        return;
      }

      const data = await response.json();
      this.setState({ vehiculos: Array.isArray(data) ? data : [], error: null });
    } catch (err) {
      this.setState({ vehiculos: [], error: 'No se pudo conectar con el servidor' });
    } finally {
      if (initial) this.setState({ loading: false });
      this.setState({ refreshing: false });
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
    const { name, value } = e.target;
    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        [name]: value
      }
    }));
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { formData } = this.state;

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) {
        alert('Sesión expirada. Por favor inicia sesión nuevamente.');
        return;
      }

      const dataToSend = {
        ...formData,
        usuarioId: parseInt(userId, 10),
        anio: formData.anio ? parseInt(formData.anio, 10) : undefined
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
          formData: { marca: '', modelo: '', anio: '', placa: '', color: '', tipo: 'Moto' }
        });
        this.fetchVehiculos();
        alert('Vehículo registrado con éxito');

        // Verificar si hay una acción pendiente de agendamiento
        const pendingAction = localStorage.getItem('pendingAction');
        if (pendingAction === 'agendar_cita') {
          // No limpiamos pendingAction aquí, lo haremos en Citas.js
          // Pero sí redirigimos
          if (this.props.setView) {
            this.props.setView('citas');
          }
        }
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'No se pudo crear el vehículo'}`);
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  render() {
    const { vehiculos, loading, refreshing, showForm, formData, error } = this.state;

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[420px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--mx-blue)]"></div>
        </div>
      );
    }

    return (
      <div className="mx-container py-10 space-y-12">
        <section className="mx-card bg-white border-[var(--mx-border)] p-8 mx-diagonal-cut overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-8 relative">
              <div className="absolute -top-10 -left-2 mx-h1 text-[160px] leading-none text-[var(--mx-text)] opacity-[0.06] select-none pointer-events-none" aria-hidden="true">
                01
              </div>
              <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Flota</div>
              <h1 className="mx-h1 text-[72px] sm:text-[86px] text-[var(--mx-text)]">
                MIS<br />
                <span className="text-[var(--mx-blue)]">VEHÍCULOS</span>
              </h1>
              <div className="mt-4 text-[14px] text-[var(--mx-text-2)] max-w-[70ch]">
                Registra y administra tus unidades para agilizar citas y seguimiento.
              </div>
            </div>

            <div className="lg:col-span-4">
              <button
                onClick={() => this.setState({ showForm: !showForm })}
                className={`w-full mx-btn ${showForm ? 'mx-btn-outline' : 'mx-btn-primary'} py-4 text-[11px]`}
              >
                {showForm ? 'Cerrar' : 'Añadir vehículo'}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="mx-card bg-white border border-[rgba(193,18,31,0.35)] p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[#C1121F]">{error}</div>
              <button onClick={() => this.fetchVehiculos(false)} className="mx-btn mx-btn-outline px-4 py-2 text-[11px]" disabled={refreshing}>
                {refreshing ? 'Reintentando…' : 'Reintentar'}
              </button>
            </div>
          </div>
        )}

        {showForm && (
          <div className="mx-card bg-white border-[var(--mx-border)] p-8">
            <div className="flex items-center gap-6">
              <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">Registro</div>
              <div className="h-[2px] flex-1 bg-[var(--mx-blue)] opacity-20" />
              <div className="mx-h1 text-[40px] leading-none text-[var(--mx-text)] opacity-[0.18]">02</div>
            </div>

            <form onSubmit={this.handleSubmit} className="mt-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Placa</label>
                  <input name="placa" value={formData.placa} onChange={this.handleInputChange} placeholder="ABC-123" className="w-full px-4 py-3 border border-[var(--mx-border)] rounded-[8px] bg-white text-[var(--mx-text)] outline-none focus:border-[var(--mx-blue)] tracking-[0.12em] uppercase" required />
                </div>

                <div className="space-y-2">
                  <label className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Tipo</label>
                  <select name="tipo" value={formData.tipo} onChange={this.handleInputChange} className="w-full px-4 py-3 border border-[var(--mx-border)] rounded-[8px] bg-white text-[var(--mx-text)] outline-none focus:border-[var(--mx-blue)] tracking-[0.12em] uppercase">
                    <option value="Moto">Moto</option>
                    <option value="Auto">Auto</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Marca</label>
                  <input name="marca" value={formData.marca} onChange={this.handleInputChange} placeholder="Ej: Ducati" className="w-full px-4 py-3 border border-[var(--mx-border)] rounded-[8px] bg-white text-[var(--mx-text)] outline-none focus:border-[var(--mx-blue)]" required />
                </div>

                <div className="space-y-2">
                  <label className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Modelo</label>
                  <input name="modelo" value={formData.modelo} onChange={this.handleInputChange} placeholder="Ej: Panigale V4" className="w-full px-4 py-3 border border-[var(--mx-border)] rounded-[8px] bg-white text-[var(--mx-text)] outline-none focus:border-[var(--mx-blue)]" required />
                </div>

                <div className="space-y-2">
                  <label className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Año</label>
                  <input name="anio" type="number" value={formData.anio} onChange={this.handleInputChange} placeholder="2024" className="w-full px-4 py-3 border border-[var(--mx-border)] rounded-[8px] bg-white text-[var(--mx-text)] outline-none focus:border-[var(--mx-blue)]" required />
                </div>

                <div className="space-y-2">
                  <label className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Color</label>
                  <input name="color" value={formData.color} onChange={this.handleInputChange} placeholder="Ej: Azul" className="w-full px-4 py-3 border border-[var(--mx-border)] rounded-[8px] bg-white text-[var(--mx-text)] outline-none focus:border-[var(--mx-blue)]" required />
                </div>
              </div>

              <button type="submit" className="w-full mx-btn mx-btn-primary py-4 text-[11px]">
                Guardar
              </button>
            </form>
          </div>
        )}

        <section className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">Registrados</div>
            <div className="h-[2px] flex-1 bg-[var(--mx-blue)] opacity-20" />
            <div className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">{vehiculos.length}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehiculos.length > 0 ? (
              vehiculos.map((v, idx) => (
                <div key={v.id} className="mx-card mx-card-hover-up bg-white border-[var(--mx-border)] p-7 relative overflow-hidden">
                  <div className="absolute top-6 right-6 mx-h1 text-[54px] leading-none text-[var(--mx-blue)] opacity-[0.10] pointer-events-none">
                    {String(idx + 1).padStart(2, '0')}
                  </div>

                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <div className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">{v.tipo || 'Vehículo'}</div>
                      <div className="mt-2 mx-subtitle text-[14px] tracking-[0.12em] uppercase text-[var(--mx-text)] truncate">
                        {v.marca} {v.modelo}
                      </div>
                      <div className="mt-2 text-[12px] text-[var(--mx-text-2)]">{v.placa} · {v.anio} · {v.color}</div>
                    </div>
                    <button onClick={() => this.handleDelete(v.id)} className="mx-btn mx-btn-outline px-4 py-2 text-[11px]">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full">
                <div className="mx-card bg-white border-[var(--mx-border)] p-10 text-center">
                  <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">Sin registros</div>
                  <div className="mt-3 text-[13px] text-[var(--mx-text-2)]">No se detectan unidades registradas.</div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }
}

export default Vehiculos;
