export const lightTheme = {
  // ─── Fondos ───────────────────────────────────────────────
  bgPage:        'bg-[#F4F6FA]',       // gris muy suave, como el fondo del dashboard
  bgCard:        'bg-white',           // cards blancas puras
  bgCardHover:   'hover:bg-slate-50',
  bgEmpty:       'bg-slate-50',
  bgSidebar:     'bg-white',           // sidebar blanco
  bgIconBox:     'bg-[#0468BF]/10',    // caja de ícono azul suave
 
  // ─── Sombras (reemplaza bordes con sombra sutil como el diseño) ──
  shadow:        'shadow-sm',
  shadowCard:    'shadow-[0_1px_4px_rgba(0,0,0,0.08)]',
 
  // ─── Bordes ───────────────────────────────────────────────
  border:        'border-gray-200',
  borderDashed:  'border-gray-300',
 
  // ─── Textos ───────────────────────────────────────────────
  textPrimary:   'text-gray-900',      // títulos y datos
  textSecondary: 'text-gray-500',      // subtítulos, labels
  textMuted:     'text-gray-400',      // hints, placeholders
  textLabel:     'text-gray-500',
 
  // ─── Acento principal ─────────────────────────────────────
  accentText:    'text-[#0468BF]',
  accentBg:      'bg-[#0468BF]',
  accentHover:   'hover:bg-[#035ca8]',
 
  // ─── Badges / estados ─────────────────────────────────────
  badgePrimary:  'bg-[#0468BF]/10 text-[#0468BF] border border-[#0468BF]/20',
  badgeSuccess:  'bg-emerald-50 text-emerald-600 border border-emerald-200',
  badgeWarning:  'bg-amber-50 text-amber-600 border border-amber-200',
  badgeDanger:   'bg-red-50 text-red-500 border border-red-200',
 
  // ─── Estados de cita (como el diseño) ─────────────────────
  statusEnProceso: 'text-[#0468BF] bg-[#0468BF]/10',
  statusPendiente: 'text-amber-600 bg-amber-50',
  statusCompletado:'text-emerald-600 bg-emerald-50',
 
  // ─── Notificaciones ───────────────────────────────────────
  notifUnread:   'bg-[#05AFF2]/08 border-[#05AFF2]/30',
  notifRead:     'bg-slate-50 border-gray-200',
 
  // ─── Progreso / Nivel ─────────────────────────────────────
  progressBg:    'bg-gray-200',
  progressFill:  'bg-gradient-to-r from-[#0468BF] to-[#05AFF2]',
 
  // ─── Sidebar nav item activo ──────────────────────────────
  navActive:     'bg-[#0468BF]/08 text-[#0468BF] font-semibold',
  navInactive:   'text-gray-600 hover:bg-gray-100',
};

export const darkTheme = {
  // ─── Fondos ───────────────────────────────────────────────
  bgPage:        'dark:bg-[#020617]',
  bgCard:        'dark:bg-[#0B1220]/60',
  bgCardHover:   'dark:hover:bg-[#0D2632]',
  bgEmpty:       'dark:bg-[#023373]/40',
  bgIconBox:     'dark:bg-white/10',

  // ─── Bordes ───────────────────────────────────────────────
  border:        'dark:border-white/10',
  borderDashed:  'dark:border-white/10',

  // ─── Textos ───────────────────────────────────────────────
  textPrimary:   'dark:text-[#F8FAFC]',
  textSecondary: 'dark:text-[#94A3B8]',
  textMuted:     'dark:text-white/50',
  textLabel:     'dark:text-[#6b7080]',

  // ─── Acento (cyan) ────────────────────────────────────────
  accentText:    'dark:text-[#05AFF2]',

  // ─── Badges / estado ──────────────────────────────────────
  badgePrimary:  'dark:bg-[#0468BF]/15 dark:text-[#05AFF2] dark:border-[#0468BF]/20',

  // ─── Notificaciones ───────────────────────────────────────
  notifUnread:   'dark:bg-white/10 dark:border-white/20',
  notifRead:     'dark:bg-white/5 dark:border-white/10',

  // ─── Progreso / Nivel ─────────────────────────────────────
  progressBg:    'dark:bg-white/10',
  progressFill:  'bg-gradient-to-r from-[#0468BF] to-[#05AFF2]',
};

export const t = (...keys) =>
  keys.map(k => `${lightTheme[k] ?? ''} ${darkTheme[k] ?? ''}`.trim()).join(' ');