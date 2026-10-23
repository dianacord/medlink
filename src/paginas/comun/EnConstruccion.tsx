/** Pantalla provisional mientras se construyen las fases 4 a 6. */
export default function EnConstruccion({ titulo }: { titulo: string }) {
  return (
    <section>
      <h1 className="text-3xl font-bold tracking-tight">{titulo}</h1>
      <p className="mt-2 text-gris">Pantalla en construcción.</p>
    </section>
  )
}
