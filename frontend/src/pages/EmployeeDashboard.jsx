import React, { useState, useEffect } from 'react';
import EmpleadoHeader from '../components/empleado/EmpleadoHeader';
import EmpleadoMetrics from '../components/empleado/EmpleadoMetrics';
import CurrentService from '../components/empleado/CurrentService';
import MiJornadaHoy from '../components/empleado/MiJornadaHoy';
import ProximosServicios from '../components/empleado/ProximosServicios';
import HistorialReciente from '../components/empleado/HistorialReciente';
import MiRendimiento from '../components/empleado/MiRendimiento';

import { API_BASE_URL } from '../apiConfig';

const EmpleadoDashboard = ({ activeTab: propActiveTab }) => {
  const [loading, setLoading] = useState(true);
  const employeeInfo = {
    nombre: localStorage.getItem('userName') || 'Empleado',
    especialidad: 'Especialista Premium',
    foto: localStorage.getItem('userPicture') || null
  };
  const [stats, setStats] = useState({
    today: 0,
    completed: 0,
    pending: 0,
    completedPercent: 0,
    pendingPercent: 0,
    rating: 4.9,
    reviews: 58
  });
  const [currentService, setCurrentService] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingServices, setUpcomingServices] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      const response = await fetch(`${API_BASE_URL}/citas`, { headers });
      if (response.ok) {
        const data = await response.json();
        
        // El backend ya debería filtrar por empleado si el rol es correcto, 
        // pero aseguramos que tenemos los datos del usuario logueado.
        const myAppointments = Array.isArray(data)
          ? data
          : (data?.data || data?.services || data?.appointments || []);
        
        // Usamos la fecha local para filtrar "hoy"
        const now = new Date();
        const todayStr = now.getFullYear() + '-' + 
                        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(now.getDate()).padStart(2, '0');
        
        const todayApts = (Array.isArray(myAppointments) ? myAppointments : []).filter(c => {
          const citaFecha = c.fecha.includes('T') ? c.fecha.split('T')[0] : c.fecha;
          return citaFecha === todayStr;
        });
        
        const completed = todayApts.filter(c => c.estado === 'FINALIZADO').length;
        const pending = todayApts.filter(c => c.estado === 'PENDIENTE').length;
        const total = todayApts.length;

        setStats({
          today: total,
          completed,
          pending,
          completedPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
          pendingPercent: total > 0 ? Math.round((pending / total) * 100) : 0,
          rating: 4.9,
          reviews: 58
        });

        // Set current service (first one in progress)
        const inProgress = (Array.isArray(myAppointments) ? myAppointments : []).find(c => c.estado === 'EN PROCESO');
        if (inProgress) {
          setCurrentService({
            id: inProgress.id,
            nombre: inProgress.servicio?.nombre || 'Servicio General',
            vehiculo: `${inProgress.vehiculo?.marca || ''} ${inProgress.vehiculo?.modelo || ''}`,
            cliente: inProgress.usuario?.nombre || 'Cliente',
            horario: `${inProgress.hora_inicio} - ${inProgress.hora_fin}`,
            duracion: `${inProgress.servicio?.duration_minutes || 60} min`,
            vehiculoImagen: inProgress.vehiculo?.foto_url,
            tasks: [
              { name: 'Diagnóstico inicial', status: 'completed' },
              { name: 'Desarmado / Limpieza', status: 'in-progress' },
              { name: 'Reparación / Cambio de piezas', status: 'pending' },
              { name: 'Prueba de funcionamiento', status: 'pending' },
              { name: 'Limpieza final', status: 'pending' }
            ]
          });
        } else {
          setCurrentService(null);
        }

        // Set timeline for today
        setTodayAppointments(todayApts.map(c => ({
          time: c.hora_inicio.substring(0, 5),
          service: c.servicio?.nombre || 'Servicio',
          vehicle: `${c.vehiculo?.marca || ''} ${c.vehiculo?.modelo || ''}`,
          status: c.estado === 'EN PROCESO' ? 'in-progress' : 'pending'
        })));

        // Upcoming services
        setUpcomingServices((Array.isArray(myAppointments) ? myAppointments : []).filter(c => c.estado === 'PENDIENTE').slice(0, 3).map(c => ({
          time: c.hora_inicio.substring(0, 5),
          name: c.servicio?.nombre || 'Servicio',
          vehicle: c.vehiculo?.modelo || 'Unidad',
          countdown: 'Próximamente',
          image: c.vehiculo?.foto_url || "https://images.unsplash.com/photo-1558981403-c5f91cbba527?auto=format&fit=crop&q=80&w=200"
        })));

        // Recent history
        setRecentHistory((Array.isArray(myAppointments) ? myAppointments : []).filter(c => c.estado === 'FINALIZADO').slice(0, 3).map(c => ({
          name: c.servicio?.nombre || 'Servicio',
          vehicle: c.vehiculo?.modelo || 'Unidad',
          date: 'Ayer, 03:30 PM', // Simplified for demo
          rating: '5.0',
          image: "https://images.unsplash.com/photo-1558981403-c5f91cbba527?auto=format&fit=crop&q=80&w=200"
        })));

        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0f1e]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Cargando tu panel de trabajo...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-200 font-sans selection:bg-purple-500/30">
      <main className="p-8 max-w-[1600px] mx-auto">
        <EmpleadoHeader 
          employeeName={employeeInfo.nombre} 
          assignedToday={stats.today} 
        />

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-8">
            <EmpleadoMetrics stats={stats} />
            <CurrentService service={currentService} />
            <ProximosServicios services={upcomingServices} />
          </div>

          <div className="lg:w-96 space-y-8">
            <MiJornadaHoy appointments={todayAppointments} />
            <MiRendimiento 
              stats={{
                totalMonthly: 126,
                satisfaction: 98,
                rating: 4.9,
                effectiveTime: '12h 35m'
              }}
              achievements={[
                { name: 'Experto en Lavado', icon: '🛡️', color: 'from-blue-600 to-indigo-700', description: '50 servicios de lavado' },
                { name: 'Cliente Feliz', icon: '👑', color: 'from-yellow-500 to-orange-600', description: '25 reseñas positivas' },
                { name: 'Dedicación', icon: '🌿', color: 'from-green-500 to-emerald-600', description: '7 días seguidos' }
              ]}
            />
            <HistorialReciente services={recentHistory} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmpleadoDashboard;
