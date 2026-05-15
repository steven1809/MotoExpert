import React, { useState, useEffect } from 'react';

const SearchAndFilter = ({ vehiculos, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [placaFilter, setPlacaFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [anioFilter, setAnioFilter] = useState('');
  const [marcaFilter, setMarcaFilter] = useState('');

  // Extract unique values for dynamic selects
  const uniqueTipos = [...new Set(vehiculos.map(v => v.tipo).filter(Boolean))];
  const uniqueAnios = [...new Set(vehiculos.map(v => v.anio).filter(Boolean))].sort((a, b) => b - a);
  const uniqueMarcas = [...new Set(vehiculos.map(v => v.marca).filter(Boolean))].sort();

  // Check if any filter is active
  const hasActiveFilters = searchTerm || placaFilter || tipoFilter || anioFilter || marcaFilter;

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

  const clearAllFilters = () => {
    setSearchTerm('');
    setPlacaFilter('');
    setTipoFilter('');
    setAnioFilter('');
    setMarcaFilter('');
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* General Search */}
        <div className="lg:col-span-2">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar vehículo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl text-[#F8FAFC] placeholder-[#94A3B8] focus:border-purple-500/50 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Placa Filter */}
        <div>
          <input
            type="text"
            placeholder="Filtrar por placa..."
            value={placaFilter}
            onChange={(e) => setPlacaFilter(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl text-[#F8FAFC] placeholder-[#94A3B8] focus:border-purple-500/50 focus:outline-none transition-all uppercase"
          />
        </div>

        {/* Tipo Filter */}
        <div>
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="w-full px-4 py-3 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl text-[#F8FAFC] focus:border-purple-500/50 focus:outline-none transition-all"
          >
            <option value="">Todos los tipos</option>
            {uniqueTipos.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>

        {/* Año Filter */}
        <div>
          <select
            value={anioFilter}
            onChange={(e) => setAnioFilter(e.target.value)}
            className="w-full px-4 py-3 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl text-[#F8FAFC] focus:border-purple-500/50 focus:outline-none transition-all"
          >
            <option value="">Todos los años</option>
            {uniqueAnios.map(anio => (
              <option key={anio} value={anio}>{anio}</option>
            ))}
          </select>
        </div>

        {/* Marca Filter */}
        <div>
          <select
            value={marcaFilter}
            onChange={(e) => setMarcaFilter(e.target.value)}
            className="w-full px-4 py-3 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl text-[#F8FAFC] focus:border-purple-500/50 focus:outline-none transition-all"
          >
            <option value="">Todas las marcas</option>
            {uniqueMarcas.map(marca => (
              <option key={marca} value={marca}>{marca}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {searchTerm && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 border border-purple-600/20 text-purple-400 text-xs font-bold uppercase tracking-wider rounded-full">
              Búsqueda: {searchTerm}
              <button onClick={() => removeFilter('search')} className="hover:text-purple-300 transition-colors">×</button>
            </span>
          )}
          {placaFilter && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 border border-purple-600/20 text-purple-400 text-xs font-bold uppercase tracking-wider rounded-full">
              Placa: {placaFilter}
              <button onClick={() => removeFilter('placa')} className="hover:text-purple-300 transition-colors">×</button>
            </span>
          )}
          {tipoFilter && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 border border-purple-600/20 text-purple-400 text-xs font-bold uppercase tracking-wider rounded-full">
              Tipo: {tipoFilter}
              <button onClick={() => removeFilter('tipo')} className="hover:text-purple-300 transition-colors">×</button>
            </span>
          )}
          {anioFilter && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 border border-purple-600/20 text-purple-400 text-xs font-bold uppercase tracking-wider rounded-full">
              Año: {anioFilter}
              <button onClick={() => removeFilter('anio')} className="hover:text-purple-300 transition-colors">×</button>
            </span>
          )}
          {marcaFilter && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 border border-purple-600/20 text-purple-400 text-xs font-bold uppercase tracking-wider rounded-full">
              Marca: {marcaFilter}
              <button onClick={() => removeFilter('marca')} className="hover:text-purple-300 transition-colors">×</button>
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="ml-auto text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;
