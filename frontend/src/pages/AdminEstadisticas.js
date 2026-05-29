import React, { useState, useEffect, useCallback } from 'react';
import StatsCard from '../components/stats/StatsCard';
import StatsTable from '../components/stats/StatsTable';
import StatsChart from '../components/stats/StatsChart';
import DateRangePicker from '../components/stats/DateRangePicker';
import DetailModal from '../components/stats/DetailModal';
import { API_BASE_URL } from '../apiConfig';

const AdminEstadisticas = ({ setView, showToast }) => {
  const [activePeriod, setActivePeriod] = useState('today');
  const [currentStats, setCurrentStats] = useState(null);
  const [summary, setSummary] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailDate, setDetailDate] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [chartData, setChartData] = useState([]);
  const [detailPage, setDetailPage] = useState(1);

  const getToken = () => localStorage.getItem('token');

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/stats/summary`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
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
          setCurrentStats(data);
        }
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      showToast?.('Error al cargar estadísticas', 'error');
    }
    setLoading(false);
  }, [customFrom, customTo, showToast]);

  const fetchDetail = useCallback(async (date, page = 1) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/stats/detail?date=${date}&page=${page}&limit=10`, {
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
  }, [activePeriod, fetchStats]);

  const handleCardClick = (period) => {
    let date = new Date();
    if (period === 'yesterday') {
      date.setDate(date.getDate() - 1);
    }
    const dateStr = date.toISOString().split('T')[0];
    setDetailDate(dateStr);
    setDetailPage(1);
    fetchDetail(dateStr, 1);
    setShowDetail(true);
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      setActivePeriod('custom');
    }
  };

  const displayStats = currentStats || summary?.today || {};

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Estadísticas</h1>
          <p className="text-gray-400">Visualiza el rendimiento del negocio</p>
        </div>

        {/* Period Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
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
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activePeriod === period.key
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Ingresos Hoy"
            value={`$${summary?.today?.totalIngresos?.toLocaleString() || 0}`}
            icon="💰"
            color="green"
            onClick={() => handleCardClick('today')}
          />
          <StatsCard
            title="Ingresos Ayer"
            value={`$${summary?.yesterday?.totalIngresos?.toLocaleString() || 0}`}
            icon="💵"
            color="blue"
            onClick={() => handleCardClick('yesterday')}
          />
          <StatsCard
            title="Ingresos Mes"
            value={`$${summary?.month?.totalIngresos?.toLocaleString() || 0}`}
            icon="📊"
            color="purple"
          />
          <StatsCard
            title="Ingresos Año"
            value={`$${summary?.year?.totalIngresos?.toLocaleString() || 0}`}
            icon="📈"
            color="cyan"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Servicios Realizados"
            value={displayStats.serviciosRealizados || 0}
            icon="✅"
            color="green"
          />
          <StatsCard
            title="Servicios Cancelados"
            value={displayStats.serviciosCancelados || 0}
            icon="❌"
            color="red"
          />
          <StatsCard
            title="Técnico Más Activo"
            value={displayStats.tecnicoMasActivo?.nombre || 'N/A'}
            icon="👨‍🔧"
            color="yellow"
          />
          <StatsCard
            title="Servicio Más Vendido"
            value={displayStats.servicioMasVendido?.nombre || 'N/A'}
            icon="⭐"
            color="purple"
          />
        </div>

        {/* Date Range Picker */}
        <div className="mb-8">
          <DateRangePicker
            from={customFrom}
            to={customTo}
            onFromChange={setCustomFrom}
            onToChange={setCustomTo}
            onApply={handleCustomApply}
          />
        </div>

        {/* Chart */}
        <div className="mb-8">
          <StatsChart data={chartData} title="Ingresos por Período" />
        </div>

        {/* Detail Table */}
        {showDetail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                Detalle del {detailDate}
              </h2>
              <button
                onClick={() => setShowDetail(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Ocultar
              </button>
            </div>
            <StatsTable
              data={detailData?.data}
              onRowClick={setSelectedItem}
              loading={loading}
            />
            {detailData && detailData.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => {
                    const newPage = detailPage - 1;
                    if (newPage >= 1) {
                      setDetailPage(newPage);
                      fetchDetail(detailDate, newPage);
                    }
                  }}
                  disabled={detailPage <= 1}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-gray-400">
                  Página {detailPage} de {detailData.totalPages}
                </span>
                <button
                  onClick={() => {
                    const newPage = detailPage + 1;
                    if (newPage <= detailData.totalPages) {
                      setDetailPage(newPage);
                      fetchDetail(detailDate, newPage);
                    }
                  }}
                  disabled={detailPage >= detailData.totalPages}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
};

export default AdminEstadisticas;
