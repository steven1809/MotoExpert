import React, { useState, useEffect } from 'react';
import EmpleadoHeader from '../components/empleado/EmpleadoHeader';
import EmpleadoMetrics from '../components/empleado/EmpleadoMetrics';
import CurrentService from '../components/empleado/CurrentService';
import MiJornadaHoy from '../components/empleado/MiJornadaHoy';
import ProximosServicios from '../components/empleado/ProximosServicios';
import HistorialReciente from '../components/empleado/HistorialReciente';
import MiRendimiento from '../components/empleado/MiRendimiento';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const EmpleadoDashboard = ({ showToast, activeTab: propActiveTab }) => {
  const [activeTab, setActiveTab] = useState(propActiveTab || 'inicio');
  const [loading, setLoading] = useState(true);
  const [employeeInfo, setEmployeeInfo] = useState({
    nombre: localStorage.getItem('userName') || 'Empleado',
    especialidad: 'Especialista Premium',
    foto: localStorage.getItem('userPicture') || null
  });
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
    if (propActiveTab) {
      setActiveTab(propActiveTab);
    }
  }, [propActiveTab]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    const employeeId = localStorage.getItem('userId');
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      const response = await fetch(`${API_BASE_URL}/citas`, { headers });
      if (response.ok) {
        const data = await response.json();
        
        // Filter appointments for this specific employee
        const myAppointments = data.filter(c => c.empleado?.usuario?.id === parseInt(employeeId) || c.empleadoId === parseInt(employeeId));
        
        const today = new Date().toISOString().split('T')[0];
        const todayApts = myAppointments.filter(c => c.fecha.split('T')[0] === today);
        
        const completed = todayApts.filter(c => c.estado === 'FINALIZADO').length;
        const pending = todayApts.filter(c => c.estado !== 'FINALIZADO').length;
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
        const inProgress = myAppointments.find(c => c.estado === 'EN PROCESO');
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
              { name: 'Lavado exterior', status: 'completed' },
              { name: 'Aspirado interior', status: 'completed' },
              { name: 'Encerado', status: 'in-progress' },
              { name: 'Limpieza de vidrios', status: 'pending' },
              { name: 'Limpieza de rines y llantas', status: 'pending' },
              { name: 'Revisión final', status: 'pending' }
            ]
          });
        }

        // Set timeline for today
        setTodayAppointments(todayApts.map(c => ({
          time: c.hora_inicio.substring(0, 5),
          service: c.servicio?.nombre || 'Servicio',
          vehicle: `${inProgress?.vehiculo?.marca || ''} ${c.vehiculo?.modelo || ''}`,
          status: c.estado === 'EN PROCESO' ? 'in-progress' : 'pending'
        })));

        // Upcoming services
        setUpcomingServices(myAppointments.filter(c => c.estado === 'PENDIENTE').slice(0, 3).map(c => ({
          time: c.hora_inicio.substring(0, 5),
          name: c.servicio?.nombre || 'Servicio',
          vehicle: c.vehiculo?.modelo || 'Unidad',
          countdown: 'En 1h 6m', // Simplified for demo
          image: "https://images.unsplash.com/photo-1558981403-c5f91cbba527?auto=format&fit=crop&q=80&w=200"
        })));

        // Recent history
        setRecentHistory(myAppointments.filter(c => c.estado === 'FINALIZADO').slice(0, 3).map(c => ({
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

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
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
