import React, { useState, useEffect, useRef } from 'react';

const SearchAndFilter = ({ vehiculos, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [placaFilter, setPlacaFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [anioFilter, setAnioFilter] = useState('');
  const [marcaFilter, setMarcaFilter] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const panelRef = useRef(null);

  // Extract unique values for dynamic selects
  const uniqueTipos = [...new Set(vehiculos.map(v => v.tipo).filter(Boolean))];
  const uniqueAnios = [...new Set(vehiculos.map(v => v.anio).filter(Boolean))].sort((a, b) => b - a);
  const uniqueMarcas = [...new Set(vehiculos.map(v => v.marca).filter(Boolean))].sort();

  // Check if any filter is active (excluding search term?)
  const hasActiveFilters = placaFilter || tipoFilter || anioFilter || marcaFilter;

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange({
      searchTerm,
      placaFilter,
      tipoFilter,
      anioFilter,
      marcaFilter
    });
  }, [searchTerm, placaFilter, tipoFilter, anioFilter, marcaFilter, onFilterChange]);

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
    setPlacaFilter('');
    setTipoFilter('');
    setAnioFilter('');
    setMarcaFilter('');
    setShowFiltersPanel(false);
  };

  const removeFilter = (filterType) => {
    switch (filterType) {
      case 'search':
        setSearchTerm('');
        break;
      case 'placa':
        setPlacaFilter('');
        break;
      case 'tipo':
        setTipoFilter('');
        break;
      case 'anio':
        setAnioFilter('');
        break;
      case 'marca':
        setMarcaFilter('');
        break;
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Search and Filters Row */}
      <div className="flex items-center gap-3 w-full">
        {/* General Search */}
        <div className="flex-1 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 h-[42px] bg-[#1a1d27] border border-[#2a2d3a] rounded-xl text-[#F8FAFC] placeholder-[#94A3B8] focus:border-purple-500/50 focus:outline-none transition-all"
          />
        </div>

        {/* Filters Button */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`flex items-center gap-2 h-[42px] px-4 bg-[#1a1d27] border rounded-xl text-[#F8FAFC] text-sm font-medium focus:outline-none transition-all ${
              hasActiveFilters ? 'border-purple-600' : 'border-[#2a2d3a]'
            }`}
          >
            <div className="relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-600 rounded-full" />
              )}
            </div>
            <span>Filters</span>
          </button>

          {/* Filters Panel */}
          {showFiltersPanel && (
            <div className="absolute right-0 top-full mt-2 w-[300px] bg-[#0f1117] border border-[#2a2d3a] rounded-2xl shadow-2xl z-50 p-4">
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
                {/* Plate Filter */}
                <div className="space-y-1">
                  <label className="text-[#6b7080] text-[11px] font-bold uppercase tracking-widest">
                    Plate
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ABC123"
                    value={placaFilter}
                    onChange={(e) => setPlacaFilter(e.target.value.toUpperCase())}
                    className="w-full h-[42px] px-4 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl text-[#F8FAFC] placeholder-[#94A3B8] focus:border-purple-500/50 focus:outline-none transition-all uppercase"
                  />
                </div>

                {/* Type Filter */}
                <div className="space-y-1">
                  <label className="text-[#6b7080] text-[11px] font-bold uppercase tracking-widest">
                    Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTipoFilter('')}
                      className={`flex-1 h-[42px] rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        !tipoFilter
                          ? 'bg-purple-600/10 border border-purple-600/30 text-purple-400'
                          : 'bg-[#1a1d27] border border-[#2a2d3a] text-[#94A3B8] hover:border-white/20'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setTipoFilter('Moto')}
                      className={`flex-1 h-[42px] rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        tipoFilter === 'Moto'
                          ? 'bg-purple-600/10 border border-purple-600/30 text-purple-400'
                          : 'bg-[#1a1d27] border border-[#2a2d3a] text-[#94A3B8] hover:border-white/20'
                      }`}
                    >
                      Motorcycle
                    </button>
                    <button
                      onClick={() => setTipoFilter('Auto')}
                      className={`flex-1 h-[42px] rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        tipoFilter === 'Auto'
                          ? 'bg-purple-600/10 border border-purple-600/30 text-purple-400'
                          : 'bg-[#1a1d27] border border-[#2a2d3a] text-[#94A3B8] hover:border-white/20'
                      }`}
                    >
                      Car
                    </button>
                  </div>
                </div>

                {/* Brand Filter */}
                <div className="space-y-1">
                  <label className="text-[#6b7080] text-[11px] font-bold uppercase tracking-widest">
                    Brand
                  </label>
                  <select
                    value={marcaFilter}
                    onChange={(e) => setMarcaFilter(e.target.value)}
                    className="w-full h-[42px] px-4 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl text-[#F8FAFC] focus:border-purple-500/50 focus:outline-none transition-all"
                  >
                    <option value="">All brands</option>
                    {uniqueMarcas.map(marca => (
                      <option key={marca} value={marca}>{marca}</option>
                    ))}
                  </select>
                </div>

                {/* Year Filter */}
                <div className="space-y-1">
                  <label className="text-[#6b7080] text-[11px] font-bold uppercase tracking-widest">
                    Year
                  </label>
                  <select
                    value={anioFilter}
                    onChange={(e) => setAnioFilter(e.target.value)}
                    className="w-full h-[42px] px-4 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl text-[#F8FAFC] focus:border-purple-500/50 focus:outline-none transition-all"
                  >
                    <option value="">All years</option>
                    {uniqueAnios.map(anio => (
                      <option key={anio} value={anio}>{anio}</option>
                    ))}
                  </select>
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
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 border border-purple-600/20 text-purple-400 text-xs font-bold uppercase tracking-wider rounded-full">
              Search: {searchTerm}
              <button onClick={() => removeFilter('search')} className="hover:text-purple-300 transition-colors">×</button>
            </span>
          )}
          {placaFilter && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 border border-purple-600/20 text-purple-400 text-xs font-bold uppercase tracking-wider rounded-full">
              Plate: {placaFilter}
              <button onClick={() => removeFilter('placa')} className="hover:text-purple-300 transition-colors">×</button>
            </span>
          )}
          {tipoFilter && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 border border-purple-600/20 text-purple-400 text-xs font-bold uppercase tracking-wider rounded-full">
              Type: {tipoFilter}
              <button onClick={() => removeFilter('tipo')} className="hover:text-purple-300 transition-colors">×</button>
            </span>
          )}
          {anioFilter && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 border border-purple-600/20 text-purple-400 text-xs font-bold uppercase tracking-wider rounded-full">
              Year: {anioFilter}
              <button onClick={() => removeFilter('anio')} className="hover:text-purple-300 transition-colors">×</button>
            </span>
          )}
          {marcaFilter && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 border border-purple-600/20 text-purple-400 text-xs font-bold uppercase tracking-wider rounded-full">
              Brand: {marcaFilter}
              <button onClick={() => removeFilter('marca')} className="hover:text-purple-300 transition-colors">×</button>
            </span>
          )}
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

export default SearchAndFilter;
