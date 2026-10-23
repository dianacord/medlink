/** Ilustración plana de la bienvenida: fonendoscopio y calendario sobre una forma azul clara. */
export function Ilustracion({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} role="img" aria-label="Fonendoscopio y calendario">
      <path d="M62 34c40-30 112-22 136 22 26 46 34 104-16 126-46 20-112 14-144-24C12 122 22 62 62 34Z" fill="#eef5fd" />
      {/* Calendario */}
      <g transform="translate(138 82)">
        <rect width="66" height="60" rx="11" fill="#fff" />
        <path d="M0 11A11 11 0 0 1 11 0h44a11 11 0 0 1 11 11v7H0Z" fill="#bfd9f5" />
        <rect x="14" y="-7" width="7" height="14" rx="3.5" fill="#9cc3ee" />
        <rect x="45" y="-7" width="7" height="14" rx="3.5" fill="#9cc3ee" />
        {[0, 1, 2].flatMap((c) =>
          [0, 1].map((f) => <rect key={`${c}${f}`} x={9 + c * 18} y={26 + f * 16} width="12" height="10" rx="2.5" fill="#dceafb" />),
        )}
      </g>
      <path d="M214 62l6-11M222 80l11-6" stroke="#cfe2f7" strokeWidth="5" strokeLinecap="round" />
      {/* Fonendoscopio */}
      <g fill="none" strokeLinecap="round">
        <path d="M80 44c-12 6-15 30-8 46M120 44c12 6 15 30 8 46" stroke="#9cc3ee" strokeWidth="7" />
        <path d="M72 90c8 26 48 26 56 0M100 110v22c0 22 32 24 32 2v-6" stroke="#4a90d9" strokeWidth="7" />
        <circle cx="132" cy="118" r="11" stroke="#4a90d9" strokeWidth="7" fill="#fff" />
      </g>
      <circle cx="80" cy="42" r="6" fill="#4a90d9" />
      <circle cx="120" cy="42" r="6" fill="#4a90d9" />
    </svg>
  )
}
