import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';

const FILTER_OPTIONS = ['Todos', 'Express', 'Premium', 'Detailing', 'Interior', 'Exterior'];

export default function ServiceSearchBar() {
  const [query, setQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(() => new Set(['Todos']));
  const [appliedFilters, setAppliedFilters] = useState(() => new Set(['Todos']));

  const appliedActive = useMemo(() => {
    const next = Array.from(appliedFilters).filter((f) => f !== 'Todos');
    next.sort((a, b) => FILTER_OPTIONS.indexOf(a) - FILTER_OPTIONS.indexOf(b));
    return next;
  }, [appliedFilters]);

  const activeCount = appliedActive.length;

  const openDropdown = () => {
    setDraftFilters(new Set(appliedFilters));
    setDropdownOpen(true);
  };

  const closeDropdown = () => {
    setDraftFilters(new Set(appliedFilters));
    setDropdownOpen(false);
  };

  const toggleFilter = (label) => {
    setDraftFilters((prev) => {
      const next = new Set(prev);

      if (label === 'Todos') {
        return new Set(['Todos']);
      }

      next.delete('Todos');
      if (next.has(label)) next.delete(label);
      else next.add(label);

      if (next.size === 0) return new Set(['Todos']);
      return next;
    });
  };

  const clearAll = () => {
    const reset = new Set(['Todos']);
    setDraftFilters(reset);
    setAppliedFilters(reset);
  };

  const apply = () => {
    setAppliedFilters(new Set(draftFilters));
    setDropdownOpen(false);
  };

  const removeApplied = (label) => {
    setAppliedFilters((prev) => {
      const next = new Set(prev);
      next.delete(label);
      if (next.size === 0) return new Set(['Todos']);
      return next;
    });

    setDraftFilters((prev) => {
      const next = new Set(prev);
      next.delete(label);
      if (next.size === 0) return new Set(['Todos']);
      return next;
    });
  };

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1b4b] to-[#00c8e0] p-6 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.10),transparent_60%)]" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar servicio..."
                className="w-full h-12 pl-12 pr-4 rounded-full bg-white text-slate-900 placeholder:text-slate-500 outline-none border border-white/70 focus:border-white"
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => (dropdownOpen ? closeDropdown() : openDropdown())}
                className="h-12 px-4 rounded-full bg-[#1a56db] hover:bg-[#1649be] text-white font-bold inline-flex items-center gap-2 shadow-lg shadow-black/10 transition-colors"
                aria-haspopup="menu"
                aria-expanded={dropdownOpen}
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>Filtros</span>
                {activeCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-white/20 border border-white/30 text-[12px] font-black">
                    {activeCount}
                  </span>
                )}
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[55]" onClick={closeDropdown} />
                  <div className="absolute right-0 mt-3 w-[320px] max-w-[90vw] z-[60] rounded-3xl bg-[#0b1220] border border-white/10 shadow-2xl overflow-hidden">
                    <div className="p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 px-3 py-2">
                        Categorías
                      </div>
                      <div className="space-y-1">
                        {FILTER_OPTIONS.map((label) => {
                          const selected = draftFilters.has(label);
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => toggleFilter(label)}
                              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-colors ${
                                selected
                                  ? 'bg-white/10 text-white'
                                  : 'text-white/80 hover:bg-white/5'
                              }`}
                            >
                              <span>{label}</span>
                              <span className={`w-6 h-6 inline-flex items-center justify-center rounded-xl border ${
                                selected ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 text-white/20'
                              }`}>
                                {selected && <Check className="w-4 h-4" />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="h-px bg-white/10" />

                    <div className="p-4 flex items-center justify-between gap-3 bg-black/20">
                      <button
                        type="button"
                        onClick={clearAll}
                        className="flex-1 h-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-black text-xs uppercase tracking-widest transition-colors"
                      >
                        Limpiar
                      </button>
                      <button
                        type="button"
                        onClick={apply}
                        className="flex-1 h-11 rounded-2xl bg-[#1a56db] hover:bg-[#1649be] text-white font-black text-xs uppercase tracking-widest transition-colors"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {appliedActive.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {appliedActive.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 h-9 pl-4 pr-2 rounded-full bg-white/15 border border-white/20 text-white text-sm font-bold"
                >
                  {label}
                  <button
                    type="button"
                    onClick={() => removeApplied(label)}
                    className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 inline-flex items-center justify-center transition-colors"
                    aria-label={`Quitar ${label}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

