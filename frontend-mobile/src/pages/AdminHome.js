import React, { useState, useEffect, useCallback } from 'react';
import { Users, DollarSign, Wrench, UserCheck, Plus, Search, ChevronRight, BarChart3, Settings } from 'lucide-react';
import api from '../services/api';
import '../styles/global.css';

const AdminHome = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    usuarios: 0,
    ingresos: 0,
    enProceso: 0,
    especialistas: 0
  });

  const fetchAdminData = useCallback(async () => {
    try {
      const [usersRes, citasRes, empRes] = await Promise.all([
        api.get('/auth'),
        api.get('/citas'),
        api.get('/empleados')
      ]);

      const users = usersRes.data;
      const citas = citasRes.data.data || citasRes.data;
      const emps = empRes.data;

      setStats({
        usuarios: users.length,
        ingresos: 12450, // Mocked as in desktop
        enProceso: citas.filter(c => c.estado === 'EN PROCESO').length,
        especialistas: emps.filter(e => e.estado === 'activo').length
      });

    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <p style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Panel de Control</p>
          <h1 style={{ fontSize: '26px', color: '#0F172A', fontStyle: 'italic' }}>Administración</h1>
        </div>
        <div style={{ width: '48px', height: '48px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Settings size={22} color="#64748B" />
        </div>
      </header>

      {/* Admin Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
        <div className="card" style={{ padding: '20px', border: 'none', backgroundColor: 'white' }}>
          <Users size={20} color="#2563EB" style={{ marginBottom: '10px' }} />
          <p style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>{stats.usuarios}</p>
          <p style={{ fontSize: '10px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Clientes</p>
        </div>
        <div className="card" style={{ padding: '20px', border: 'none', backgroundColor: 'white' }}>
          <DollarSign size={20} color="#059669" style={{ marginBottom: '10px' }} />
          <p style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>${stats.ingresos.toLocaleString()}</p>
          <p style={{ fontSize: '10px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Ingresos</p>
        </div>
        <div className="card" style={{ padding: '20px', border: 'none', backgroundColor: 'white' }}>
          <Wrench size={20} color="#EA580C" style={{ marginBottom: '10px' }} />
          <p style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>{stats.enProceso}</p>
          <p style={{ fontSize: '10px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>En Proceso</p>
        </div>
        <div className="card" style={{ padding: '20px', border: 'none', backgroundColor: 'white' }}>
          <UserCheck size={20} color="#9333EA" style={{ marginBottom: '10px' }} />
          <p style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>{stats.especialistas}</p>
          <p style={{ fontSize: '10px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Personal Activo</p>
        </div>
      </div>

      {/* Quick Actions */}
      <section style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '12px', color: '#64748B', marginBottom: '15px', letterSpacing: '0.1em' }}>Acciones Rápidas</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button style={{ width: '100%', padding: '18px 25px', backgroundColor: '#2563EB', color: 'white', borderRadius: '24px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Plus size={20} />
              <span style={{ fontWeight: '800', fontSize: '14px', textTransform: 'uppercase' }}>Nueva Cita / Servicio</span>
            </div>
            <ChevronRight size={18} />
          </button>
          <button style={{ width: '100%', padding: '18px 25px', backgroundColor: 'white', color: '#0F172A', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Users size={20} color="#2563EB" />
              <span style={{ fontWeight: '800', fontSize: '14px', textTransform: 'uppercase' }}>Gestionar Clientes</span>
            </div>
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* Reports Shortcut */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ fontSize: '12px', color: '#64748B', letterSpacing: '0.1em' }}>Reportes Recientes</h3>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB' }}>Ver todos</span>
        </div>
        <div className="card" style={{ padding: '20px', border: 'none', backgroundColor: '#F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '44px', height: '44px', backgroundColor: '#E0E7FF', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={20} color="#4338CA" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Resumen de Ventas</p>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>Últimos 30 días</p>
            </div>
            <ChevronRight size={18} color="#CBD5E1" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminHome;
