"use client"

type ProjectTimelineChartProps = {
  data: {
    name: string
    inicio: number
    fin: number
    status: string
    priority: string
  }[]
}

export function ProjectTimelineChart({ data }: ProjectTimelineChartProps) {
  // Si no hay datos, mostrar un mensaje
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No hay datos disponibles</p>
      </div>
    )
  }

  // Convertir los datos para el gráfico de Gantt
  const ganttData = data.map((project) => {
    const startDate = new Date(project.inicio)
    const endDate = new Date(project.fin)
    const duration = endDate.getTime() - startDate.getTime()

    return {
      name: project.name,
      inicio: startDate.toLocaleDateString(),
      fin: endDate.toLocaleDateString(),
      duracion: Math.ceil(duration / (1000 * 60 * 60 * 24)), // duración en días
      status: project.status,
      priority: project.priority,
    }
  })

  // Función para obtener el color según la prioridad
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-purple-500"
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-blue-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="h-full overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proyecto</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha Inicio
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha Fin
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Duración (días)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Línea de Tiempo
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {ganttData.map((project, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.inicio}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.fin}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.duracion}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${
                    project.status === "active"
                      ? "bg-green-100 text-green-800"
                      : project.status === "completed"
                        ? "bg-blue-100 text-blue-800"
                        : project.status === "on_hold"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                  }`}
                >
                  {project.status === "active"
                    ? "Activo"
                    : project.status === "completed"
                      ? "Completado"
                      : project.status === "on_hold"
                        ? "En Espera"
                        : "Cancelado"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="w-64 bg-gray-200 h-6 rounded-full overflow-hidden">
                  <div
                    className={`${getPriorityColor(project.priority)} h-full rounded-full`}
                    style={{
                      width: `${Math.min(100, (project.duracion / 240) * 100)}%`,
                    }}
                  ></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
