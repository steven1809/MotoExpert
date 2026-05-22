import React, { useState, useEffect, useRef } from 'react';
import CustomSelect from './CustomSelect';

const AppointmentsSearchAndFilter = ({ citas, onFilterChange, searchPlaceholder = "Search by service or vehicle..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');
  const [statusFilters, setStatusFilters] = useState([]);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const panelRef = useRef(null);

  // Extract unique values
  const uniqueServices = [...new Set(citas.map(c => c.servicio?.nombre).filter(Boolean))];
  const today = new Date().toISOString().split('T')[0];

  // Check if any filter is active
  const hasActiveFilters = fromDate || toDate || serviceFilter || vehicleTypeFilter || statusFilters.length > 0;

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange({
      searchTerm,
      fromDate,
      toDate,
      serviceFilter,
      vehicleTypeFilter,
      statusFilters
    });
  }, [searchTerm, fromDate, toDate, serviceFilter, vehicleTypeFilter, statusFilters, onFilterChange]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowFiltersPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clearAllFilters = () => {
    setFromDate('');
    setToDate('');
    setServiceFilter('');
    setVehicleTypeFilter('');
    setStatusFilters([]);
    setShowFiltersPanel(false);
  };

  const removeFilter = (filterType) => {
    if (filterType === 'fromDate') {
      setFromDate('');
      return;
    }
    if (filterType === 'toDate') {
      setToDate('');
      return;
    }
    if (filterType === 'service') {
      setServiceFilter('');
      return;
    }
    if (filterType === 'vehicleType') {
      setVehicleTypeFilter('');
      return;
    }
    if (filterType === 'status') {
      setStatusFilters([]);
    }
  };

  const toggleStatusFilter = (status) => {
    setStatusFilters(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

  const getStatusStyle = (status, isSelected) => {
    const statusMap = {
      'PENDIENTE': {
        bg: 'bg-[#BA7517]/15',
        border: 'border-[#BA7517]',
        text: 'text-[#BA7517]'
      },
      'EN PROCESO': {
        bg: 'bg-[#2563eb]/15',
        border: 'border-[#2563eb]',
        text: 'text-[#2563eb]'
      },
      'FINALIZADO': {
        bg: 'bg-[#1D9E75]/15',
        border: 'border-[#1D9E75]',
        text: 'text-[#1D9E75]'
      },
      'CANCELADO': {
        bg: 'bg-[#E24B4A]/15',
        border: 'border-[#E24B4A]',
        text: 'text-[#E24B4A]'
      }
    };

    const style = statusMap[status] || { bg: 'bg-[#1a1d27]', border: 'border-[#2a2d3a]', text: 'text-[#94A3B8]' };
    
    return {
      className: `px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
        isSelected 
          ? `${style.bg} ${style.border} ${style.text}` 
          : 'bg-[#1a1d27] border-[#2a2d3a] text-[#94A3B8] hover:border-white/20'
      }`
    };
  };

  return (
    <div className="w-full space-y-4">
      {/* Search and Filters Row */}
      <div className="flex items-center gap-3 w-full">
        {/* Search Input */}
        <div className="flex-1 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 h-[42px] bg-[#1a1d27] border border-[#2a2d3a] rounded-xl text-[#F8FAFC] placeholder-[#94A3B8] focus:border-[#2563eb]/50 focus:outline-none transition-all"
          />
        </div>

        {/* Filters Button */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`flex items-center gap-2 h-[42px] px-4 bg-[#1a1d27] border rounded-xl text-[#F8FAFC] text-sm font-medium focus:outline-none transition-all ${
              hasActiveFilters ? 'border-[#2563eb]' : 'border-[#2a2d3a]'
            }`}
          >
            <div className="relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#2563eb] rounded-full" />
              )}
            </div>
            <span>Filters</span>
          </button>

          {/* Filters Panel */}
          {showFiltersPanel && (
            <div className="absolute right-0 top-full mt-2 w-[320px] bg-[#0f1117] border border-[#2a2d3a] rounded-2xl shadow-2xl z-50 p-4">
              {/* Panel Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#F8FAFC] font-medium text-sm">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-[#94A3B8] text-xs font-medium hover:text-[#F8FAFC] transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Panel Content */}
              <div className="space-y-3">
                {/* Date Range */}
                <div className="space-y-1">
                  <label className="text-[#6b7080] text-[11px] font-bold uppercase tracking-widest">
                    Date range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      min={today}
                      max={toDate || undefined}
                      className="w-full h-[42px] px-3 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl text-[#F8FAFC] text-xs focus:border-[#2563eb]/50 focus:outline-none transition-all"
                    />
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      min={fromDate || today}
                      className="w-full h-[42px] px-3 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl text-[#F8FAFC] text-xs focus:border-[#2563eb]/50 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Service Type */}
                <div className="space-y-1">
                  <label className="text-[#6b7080] text-[11px] font-bold uppercase tracking-widest">
                    Service type
                  </label>
                  <CustomSelect
                    value={serviceFilter}
                    onChange={setServiceFilter}
                    options={[
                      { value: '', label: 'All services' },
                      ...uniqueServices.map(service => ({ value: service, label: service }))
                    ]}
                    className="h-[42px]"
                  />
                </div>

                {/* Vehicle Type */}
                <div className="space-y-1">
                  <label className="text-[#6b7080] text-[11px] font-bold uppercase tracking-widest">
                    Vehicle type
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setVehicleTypeFilter('')}
                      className={`flex-1 h-[42px] rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        !vehicleTypeFilter
                          ? 'bg-[#2563eb]/10 border border-[#2563eb]/30 text-[#2563eb]'
                          : 'bg-[#1a1d27] border border-[#2a2d3a] text-[#94A3B8] hover:border-white/20'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setVehicleTypeFilter('Moto')}
                      className={`flex-1 h-[42px] rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        vehicleTypeFilter === 'Moto'
                          ? 'bg-[#2563eb]/10 border border-[#2563eb]/30 text-[#2563eb]'
                          : 'bg-[#1a1d27] border border-[#2a2d3a] text-[#94A3B8] hover:border-white/20'
                      }`}
                    >
                      Motorcycle
                    </button>
                    <button
                      onClick={() => setVehicleTypeFilter('Auto')}
                      className={`flex-1 h-[42px] rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        vehicleTypeFilter === 'Auto'
                          ? 'bg-[#2563eb]/10 border border-[#2563eb]/30 text-[#2563eb]'
                          : 'bg-[#1a1d27] border border-[#2a2d3a] text-[#94A3B8] hover:border-white/20'
                      }`}
                    >
                      Car
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-[#6b7080] text-[11px] font-bold uppercase tracking-widest">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['PENDIENTE', 'EN PROCESO', 'FINALIZADO', 'CANCELADO'].map(status => {
                      const isSelected = statusFilters.includes(status);
                      const { className } = getStatusStyle(status, isSelected);
                      return (
                        <button
                          key={status}
                          onClick={() => toggleStatusFilter(status)}
                          className={className}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Pills */}
      {(searchTerm || hasActiveFilters) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchTerm && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#2563eb]/10 border border-[#2563eb]/30 text-[#2563eb] text-xs font-bold uppercase tracking-wider rounded-full">
              Search: {searchTerm}
              <button onClick={() => setSearchTerm('')} className="hover:text-[#1d4ed8] transition-colors">×</button>
            </span>
          )}
          {fromDate && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#2563eb]/10 border border-[#2563eb]/30 text-[#2563eb] text-xs font-bold uppercase tracking-wider rounded-full">
              From: {new Date(fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              <button onClick={() => removeFilter('fromDate')} className="hover:text-[#1d4ed8] transition-colors">×</button>
            </span>
          )}
          {toDate && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#2563eb]/10 border border-[#2563eb]/30 text-[#2563eb] text-xs font-bold uppercase tracking-wider rounded-full">
              To: {new Date(toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              <button onClick={() => removeFilter('toDate')} className="hover:text-[#1d4ed8] transition-colors">×</button>
            </span>
          )}
          {serviceFilter && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#2563eb]/10 border border-[#2563eb]/30 text-[#2563eb] text-xs font-bold uppercase tracking-wider rounded-full">
              Service: {serviceFilter}
              <button onClick={() => removeFilter('service')} className="hover:text-[#1d4ed8] transition-colors">×</button>
            </span>
          )}
          {vehicleTypeFilter && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#2563eb]/10 border border-[#2563eb]/30 text-[#2563eb] text-xs font-bold uppercase tracking-wider rounded-full">
              Type: {vehicleTypeFilter === 'Moto' ? 'Motorcycle' : 'Car'}
              <button onClick={() => removeFilter('vehicleType')} className="hover:text-[#1d4ed8] transition-colors">×</button>
            </span>
          )}
          {statusFilters.length > 0 && statusFilters.map(status => (
            <span key={status} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#2563eb]/10 border border-[#2563eb]/30 text-[#2563eb] text-xs font-bold uppercase tracking-wider rounded-full">
              Status: {status}
              <button onClick={() => toggleStatusFilter(status)} className="hover:text-[#1d4ed8] transition-colors">×</button>
            </span>
          ))}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="ml-auto text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentsSearchAndFilter;
