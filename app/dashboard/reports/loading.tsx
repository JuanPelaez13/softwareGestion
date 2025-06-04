export default function Loading() {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Reportes y Estadísticas</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-64"></div>
          ))}
        </div>
      </div>
    )
  }
  