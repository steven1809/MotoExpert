import React, { useState, useEffect, useCallback } from 'react';
import StatsCard from '../components/stats/StatsCard';
import StatsTable from '../components/stats/StatsTable';
import StatsChart from '../components/stats/StatsChart';
import DateRangePicker from '../components/stats/DateRangePicker';
import DetailModal from '../components/stats/DetailModal';
import { API_BASE_URL } from '../apiConfig';

// SVG Icons
const DollarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ServiceIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const TrendingIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const AdminEstadisticas = ({ setView, showToast }) => {
  // Limpiar datos antiguos de localStorage
  useEffect(() => {
    localStorage.removeItem('adminStats_activePeriod');
    localStorage.removeItem('adminStats_currentStats');
    localStorage.removeItem('adminStats_summary');
    localStorage.removeItem('adminStats_chartData');
  }, []);

  const [activePeriod, setActivePeriod] = useState('today');
  const [currentStats, setCurrentStats] = useState(null);
  const [summary, setSummary] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailDate, setDetailDate] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return today;
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [chartData, setChartData] = useState([]);
  const [detailPage, setDetailPage] = useState(1);

  const getToken = () => localStorage.getItem('token');

  const getDateRangeForPeriod = (period) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    switch (period) {
      case 'today':
        return { from: today, to: today };
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        return { from: yesterdayStr, to: yesterdayStr };
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return { from: weekStart.toISOString().split('T')[0], to: today };
      case 'month':
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        return { from: monthStart, to: today };
      case 'year':
        return { from: `${now.getFullYear()}-01-01`, to: today };
      case 'custom':
        return { from: customFrom, to: customTo };
      default:
        return { from: today, to: today };
    }
  };

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/stats/summary`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Datos summary:', data);
        setSummary(data);
        const chart = [
          { label: 'Hoy', value: data.today?.totalIngresos || 0 },
          { label: 'Ayer', value: data.yesterday?.totalIngresos || 0 },
          { label: 'Mes', value: data.month?.totalIngresos || 0 },
        ];
        setChartData(chart);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  }, []);

  const fetchStats = useCallback(async (period) => {
    setLoading(true);
    try {
      let endpoint = '';
      switch (period) {
        case 'today':
          endpoint = 'today';
          break;
        case 'yesterday':
          endpoint = 'yesterday';
          break;
        case 'week':
          endpoint = 'week';
          break;
        case 'month':
          endpoint = 'month';
          break;
        case 'year':
          endpoint = 'year';
          break;
        case 'custom':
          if (customFrom && customTo) {
            const res = await fetch(`${API_BASE_URL}/admin/stats/range?from=${customFrom}&to=${customTo}`, {
              headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.ok) {
              const data = await res.json();
              setCurrentStats(data);
            }
            setLoading(false);
            return;
          }
          break;
      }

      if (endpoint) {
        const res = await fetch(`${API_BASE_URL}/admin/stats/${endpoint}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          console.log(`Datos ${endpoint}:`, data);
          setCurrentStats(data);
        }
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      showToast?.('Error al cargar estadísticas', 'error');
    }
    setLoading(false);
  }, [customFrom, customTo, showToast]);

  const fetchDetail = useCallback(async (from, to, page = 1) => {
    try {
      let url;
      if (from === to) {
        url = `${API_BASE_URL}/admin/stats/detail?date=${from}&page=${page}&limit=10`;
      } else {
        url = `${API_BASE_URL}/admin/stats/detail?from=${from}&to=${to}&page=${page}&limit=10`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDetailData(data);
      }
    } catch (err) {
      console.error('Error fetching detail:', err);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchStats('today');
  }, [fetchSummary, fetchStats]);

  useEffect(() => {
    fetchStats(activePeriod);
    // Cargar el detalle para el período activo
    const { from, to } = getDateRangeForPeriod(activePeriod);
    setDetailDate(from);
    setDetailPage(1);
    fetchDetail(from, to, 1);
  }, [activePeriod, fetchStats, fetchDetail]);

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      setActivePeriod('custom');
    }
  };

  const displayStats = currentStats || summary?.today || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-[clamp(2rem,4vw,2.5rem)] font-bold text-slate-50 mb-2 tracking-tight">
            Estadísticas
          </h1>
          <p className="text-slate-400 text-lg">
            Visualiza el rendimiento del negocio
          </p>
        </div>

        {/* Period Filters */}
        <div className="flex flex-wrap gap-3 mb-12 p-1.5 bg-slate-800/50 rounded-2xl border border-slate-700/50">
          {[
            { key: 'today', label: 'Hoy' },
            { key: 'yesterday', label: 'Ayer' },
            { key: 'week', label: 'Esta Semana' },
            { key: 'month', label: 'Este Mes' },
            { key: 'year', label: 'Este Año' },
          ].map((period) => (
            <button
              key={period.key}
              onClick={() => setActivePeriod(period.key)}
              className={`px-6 py-3.5 rounded-xl font-medium transition-all duration-300 ${
                activePeriod === period.key
                  ? 'bg-slate-700 text-white border border-slate-600'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50 border border-transparent'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatsCard
            title="Ingresos Hoy"
            value={`$${summary?.today?.totalIngresos?.toLocaleString() || 0}`}
            icon={<DollarIcon />}
            onClick={() => {
              setActivePeriod('today');
            }}
          />
          <StatsCard
            title="Ingresos Ayer"
            value={`$${summary?.yesterday?.totalIngresos?.toLocaleString() || 0}`}
            icon={<DollarIcon />}
            onClick={() => {
              setActivePeriod('yesterday');
            }}
          />
          <StatsCard
            title="Ingresos Mes"
            value={`$${summary?.month?.totalIngresos?.toLocaleString() || 0}`}
            icon={<TrendingIcon />}
          />
          <StatsCard
            title="Ingresos Año"
            value={`$${summary?.year?.totalIngresos?.toLocaleString() || 0}`}
            icon={<TrendingIcon />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatsCard
            title="Servicios Realizados"
            value={displayStats.serviciosRealizados || 0}
            icon={<CheckIcon />}
          />
          <StatsCard
            title="Servicios Cancelados"
            value={displayStats.serviciosCancelados || 0}
            icon={<XIcon />}
          />
          <StatsCard
            title="Técnico Más Activo"
            value={displayStats.tecnicoMasActivo?.nombre || 'N/A'}
            icon={<UserIcon />}
          />
          <StatsCard
            title="Servicio Más Vendido"
            value={displayStats.servicioMasVendido?.nombre || 'N/A'}
            icon={<ServiceIcon />}
          />
        </div>

        {/* Date Range Picker */}
        <div className="mb-12 bg-slate-800/70 border border-slate-700/50 rounded-2xl p-8">
          <h3 className="text-lg font-semibold text-slate-50 mb-6">Rango Personalizado</h3>
          <DateRangePicker
            from={customFrom}
            to={customTo}
            onFromChange={setCustomFrom}
            onToChange={setCustomTo}
            onApply={handleCustomApply}
          />
        </div>

        {/* Chart */}
        <div className="mb-12 bg-slate-800/70 border border-slate-700/50 rounded-2xl p-8">
          <h3 className="text-lg font-semibold text-slate-50 mb-6">Ingresos por Período</h3>
          <StatsChart data={chartData} title="" />
        </div>

        {/* Detail Table - siempre visible */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-50">
              Detalle de {
                activePeriod === 'today' ? 'Hoy' :
                activePeriod === 'yesterday' ? 'Ayer' :
                activePeriod === 'week' ? 'Esta Semana' :
                activePeriod === 'month' ? 'Este Mes' :
                activePeriod === 'year' ? 'Este Año' : 'Rango Personalizado'
              }
            </h3>
          </div>
          
          <StatsTable
            data={detailData?.data}
            onRowClick={setSelectedItem}
            loading={loading}
          />
          
          {detailData && detailData.totalPages > 1 && (
            <div className="flex justify-center gap-3 pt-6">
              <button
                onClick={() => {
                  const newPage = detailPage - 1;
                  if (newPage >= 1) {
                    setDetailPage(newPage);
                    const { from, to } = getDateRangeForPeriod(activePeriod);
                    fetchDetail(from, to, newPage);
                  }
                }}
                disabled={detailPage <= 1}
                className="px-5 py-2.5 bg-slate-700/50 hover:bg-slate-700/70 disabled:opacity-30 disabled:cursor-not-allowed text-slate-100 rounded-xl transition-all duration-300 border border-slate-600/50"
              >
                Anterior
              </button>
              <span className="px-5 py-2.5 text-slate-300">
                Página {detailPage} de {detailData.totalPages}
              </span>
              <button
                onClick={() => {
                  const newPage = detailPage + 1;
                  if (newPage <= detailData.totalPages) {
                    setDetailPage(newPage);
                    const { from, to } = getDateRangeForPeriod(activePeriod);
                    fetchDetail(from, to, newPage);
                  }
                }}
                disabled={detailPage >= detailData.totalPages}
                className="px-5 py-2.5 bg-slate-700/50 hover:bg-slate-700/70 disabled:opacity-30 disabled:cursor-not-allowed text-slate-100 rounded-xl transition-all duration-300 border border-slate-600/50"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>

      <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
};

export default AdminEstadisticas;
