import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { API_BASE_URL } from '../apiConfig';

const ActivityLogPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [filter, setFilter] = useState('TODOS');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (filter !== 'TODOS') {
        // Enviar el tipo de entidad mapeado correctamente
        const entityMap = {
          'CITAS': 'cita',
          'PAGOS': 'pago',
          'USUARIOS': 'usuario',
          'SERVICIOS': 'servicio',
          'EMPLEADOS': 'empleado'
        };
        params.append('entityType', entityMap[filter] || filter.toLowerCase());
      }

      const response = await fetch(`${API_BASE_URL}/activity?${params.toString()}`);
      const data = await response.json();
      
      setActivities(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const getBadgeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'cita': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'pago': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'usuario': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'servicio': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'empleado': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'usuario': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'empleado': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'sistema': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const timeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now - past;
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInMins < 1) return 'ahora mismo';
    if (diffInMins < 60) return `hace ${diffInMins} min`;
    
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `hace ${diffInHours} h`;
    
    return formatDate(dateString);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handleExport = async (type) => {
    const setExporting = type === 'excel' ? setExportingExcel : setExportingPdf;
    setExporting(true);
    
    try {
      const params = new URLSearchParams({
        limit: '1000',
      });
      if (filter !== 'TODOS') {
        const entityMap = {
          'CITAS': 'cita',
          'PAGOS': 'pago',
          'USUARIOS': 'usuario',
          'SERVICIOS': 'servicio',
          'EMPLEADOS': 'empleado'
        };
        params.append('entityType', entityMap[filter] || filter.toLowerCase());
      }

      const response = await fetch(`${API_BASE_URL}/activity?${params.toString()}`);
      const data = await response.json();
      const allActivities = data.data || [];
      
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `actividad-motoexpert-${dateStr}`;

      if (type === 'excel') {
        const worksheet = XLSX.utils.json_to_sheet(allActivities.map(act => ({
          Fecha: formatDate(act.createdAt),
          Acción: act.action.replace(/_/g, ' '),
          Descripción: act.description,
          Tipo: act.entityType.toUpperCase(),
          'Realizado por': act.performedBy,
          Rol: act.performedByRole.toUpperCase()
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Actividad');
        XLSX.writeFile(workbook, `${filename}.xlsx`);
      } else {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('MOTOEXPERT — Actividad Reciente', 14, 22);
        doc.setFontSize(10);
        doc.text(`Fecha de exportación: ${new Date().toLocaleString()}`, 14, 30);
        if (filter !== 'TODOS') {
          doc.text(`Filtro: ${filter}`, 14, 35);
        }
        
        autoTable(doc, {
          startY: filter !== 'TODOS' ? 40 : 35,
          head: [['Fecha', 'Acción', 'Descripción', 'Tipo', 'Realizado por', 'Rol']],
          body: allActivities.map(act => [
            formatDate(act.createdAt),
            act.action.replace(/_/g, ' '),
            act.description,
            act.entityType.toUpperCase(),
            act.performedBy,
            act.performedByRole.toUpperCase()
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [37, 99, 235] }
        });
        doc.save(`${filename}.pdf`);
      }
    } catch (error) {
      console.error('Error exporting activities:', error);
      alert('Error al exportar actividades');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#020617] min-h-screen animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent italic uppercase tracking-tighter">
            Actividad Reciente
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Historial de acciones del sistema en tiempo real</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => handleExport('excel')}
            disabled={exportingExcel || loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] rounded-2xl transition-all font-mono text-[10px] uppercase tracking-widest disabled:opacity-50"
          >
            {exportingExcel ? (
              <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            {exportingExcel ? 'Excel...' : 'Excel'}
          </button>

          <button 
            onClick={() => handleExport('pdf')}
            disabled={exportingPdf || loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] rounded-2xl transition-all font-mono text-[10px] uppercase tracking-widest disabled:opacity-50"
          >
            {exportingPdf ? (
              <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            )}
            {exportingPdf ? 'PDF...' : 'PDF'}
          </button>

          <button 
            onClick={fetchActivities}
            className="flex items-center gap-2 px-6 py-2.5 bg-white/[0.03] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] rounded-2xl transition-all font-mono text-[10px] uppercase tracking-widest"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-3 px-6 py-3 bg-white/[0.03] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] rounded-2xl transition-all font-mono text-[10px] uppercase tracking-widest shadow-xl"
          >
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {filter === 'TODOS' ? 'Filtrar' : `Filtrar: ${filter}`}
            <svg className={`w-3 h-3 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showFilters && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setShowFilters(false)}></div>
              <div className="absolute top-full left-0 mt-3 w-56 bg-[#0B1220] border border-white/[0.08] rounded-[1.5rem] shadow-2xl z-[70] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-2 grid gap-1">
                  {['TODOS', 'CITAS', 'PAGOS', 'USUARIOS', 'SERVICIOS', 'EMPLEADOS'].map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setFilter(f);
                        setPage(1);
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        filter === f 
                          ? 'bg-purple-600/10 text-purple-400 border-l-2 border-purple-500' 
                          : 'text-slate-500 hover:bg-white/[0.03] hover:text-slate-300 border-l-2 border-transparent'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-sm shadow-2xl">
        {loading && activities.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">Cargando historial...</p>
          </div>
        ) : activities.length > 0 ? (
          <div className="divide-y divide-slate-800/50">
            {activities.map((activity) => (
              <div key={activity.id} className="p-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-white/[0.02] transition-all group">
                <div className="flex-shrink-0">
                  <div className={`px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${getBadgeColor(activity.entityType)}`}>
                    {activity.entityType}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{activity.action.replace(/_/g, ' ')}</span>
                    <span className="text-slate-700">•</span>
                    <span className="text-[10px] text-slate-500 italic flex items-center gap-1.5">
                      Por {activity.performedBy}
                      <span className="text-slate-700">|</span>
                      <span className={`px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-widest ${getRoleBadgeColor(activity.performedByRole)}`}>
                        {activity.performedByRole || 'SISTEMA'}
                      </span>
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 font-medium line-clamp-2">{activity.description}</p>
                </div>

                <div className="flex-shrink-0 text-right">
                  <p className="text-[10px] font-mono text-slate-500 uppercase group-hover:text-slate-400 transition-colors">{timeAgo(activity.createdAt)}</p>
                  <p className="text-[9px] text-slate-600 mt-1">{formatDate(activity.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 bg-slate-800/30 rounded-full flex items-center justify-center mb-6 border border-slate-700/50">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 italic">Sin Actividad</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">No hay registros de actividad para los filtros seleccionados aún.</p>
          </div>
        )}

        {totalPages > 0 && (
          <div className="p-6 border-t border-slate-800 bg-slate-900/80 flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-white/[0.03] px-4 py-2 rounded-xl border border-white/[0.05]">
                Mostrando <span className="text-white font-bold">{Math.min((page - 1) * limit + 1, total)}</span> – <span className="text-white font-bold">{Math.min(page * limit, total)}</span> de <span className="text-white font-bold">{total}</span> actividades
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest ml-2">Filas:</span>
                <select 
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  className="bg-slate-800 border border-white/10 text-white text-[10px] font-mono uppercase px-3 py-1.5 rounded-xl outline-none focus:border-[#2563EB] transition-all cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1 || loading}
                className="h-10 px-4 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-20 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                Anterior
              </button>

              <div className="flex items-center gap-1 mx-2">
                {getPageNumbers().map(num => (
                  <button
                    key={num}
                    onClick={() => setPage(num)}
                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                      page === num 
                        ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-500/20' 
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages || loading}
                className="h-10 px-4 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-20 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 transition-all flex items-center gap-2"
              >
                Siguiente
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogPage;
