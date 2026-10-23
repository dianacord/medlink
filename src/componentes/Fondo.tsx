/** Formas orgánicas azul muy claro en las esquinas, como en el diseño de bienvenida. */
export function Fondo() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-white">
      <svg className="absolute -top-10 -left-16 w-64 sm:w-96" viewBox="0 0 300 300">
        <path d="M0 0h260c10 70-30 140-100 175C95 208 40 230 0 290Z" fill="#eef5fd" />
      </svg>
      <svg className="absolute -right-10 -bottom-6 w-80 sm:w-[30rem]" viewBox="0 0 400 260">
        <path d="M400 0v260H40c30-60 90-95 170-110C300 132 360 80 400 0Z" fill="#f3f8fe" />
      </svg>
    </div>
  )
}
