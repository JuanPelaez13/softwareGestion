import Link from "next/link"
import { getUserProjects } from "@/lib/projects"
import { PlusCircle, Search } from "lucide-react"

export default async function ProjectsPage() {
  const projectsResult = await getUserProjects()
  const projects = projectsResult.success ? projectsResult.projects : []

  // Añadir logging para depuración
  console.log("Resultado de getUserProjects:", projectsResult)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Proyectos</h1>
        {/* Botón "Nuevo Proyecto" en la página de proyectos */}
        <Link
          href="/dashboard/projects/new"
          className="flex items-center rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Nuevo Proyecto
        </Link>
      </div>

      <div className="mb-6 flex items-center rounded-md border bg-white px-4 py-2 shadow-sm">
        <Search className="mr-2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar proyectos..."
          className="w-full border-none bg-transparent outline-none"
        />
      </div>

      {projects && projects.length > 0 ? (
        <div className="overflow-hidden rounded-lg border bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Nombre
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Estado
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Prioridad
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Fecha Inicio
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Fecha Fin
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Creado
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Propietario
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {project.name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
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
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        project.priority === "low"
                          ? "bg-gray-100 text-gray-800"
                          : project.priority === "medium"
                            ? "bg-blue-100 text-blue-800"
                            : project.priority === "high"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-red-100 text-red-800"
                      }`}
                    >
                      {project.priority === "low"
                        ? "Baja"
                        : project.priority === "medium"
                          ? "Media"
                          : project.priority === "high"
                            ? "Alta"
                            : "Urgente"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {project.start_date ? new Date(project.start_date).toLocaleDateString() : "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {project.end_date ? new Date(project.end_date).toLocaleDateString() : "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(project.created_at).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {project.owner_name || (project.is_owner ? "Tú" : "Desconocido")}
                    {!project.is_owner && <span className="ml-2 text-xs text-blue-600">(Colaborador)</span>}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <Link
                      href={`/dashboard/projects/${project.id}/edit`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                      title="Editar proyecto"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-pencil"
                      >
                        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
          <h3 className="mb-2 text-lg font-medium">No tienes proyectos aún</h3>
          <p className="mb-4 text-gray-500">Comienza creando tu primer proyecto</p>
          {/* Botón "Nuevo Proyecto" cuando no hay proyectos */}
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Nuevo Proyecto
          </Link>
        </div>
      )}
    </div>
  )
}
