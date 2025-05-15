import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/auth"
import { getUserProjects } from "@/lib/projects"
import { BarChart3, CheckSquare, Clock, FolderKanban, PlusCircle, Calendar, Bell, Users, Zap } from "lucide-react"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const projectsResult = await getUserProjects()
  const projects = projectsResult.success ? projectsResult.projects : []

  // Contar proyectos por estado
  const activeProjects = projects.filter((p) => p.status === "active").length
  const completedProjects = projects.filter((p) => p.status === "completed").length
  const onHoldProjects = projects.filter((p) => p.status === "on_hold").length

  // Determinar si es un usuario administrador
  const isAdmin = session.user.email === "admin@edusqa.com"

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Bienvenido a tu centro de gestión de proyectos</p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="flex items-center rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Nuevo Proyecto
        </Link>
      </div>

      {isAdmin && (
        <div className="mb-6 rounded-md bg-blue-50 p-4 text-blue-800">
          <div className="flex">
            <Zap className="mr-2 h-5 w-5 flex-shrink-0" />
            <div>
              <h3 className="font-medium">Modo Administrador</h3>
              <p className="mt-1 text-sm">Tienes acceso a funciones administrativas adicionales.</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3">
              <FolderKanban className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Proyectos</h3>
              <p className="text-2xl font-bold">{projects.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckSquare className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Proyectos Activos</h3>
              <p className="text-2xl font-bold">{activeProjects}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-full bg-purple-100 p-3">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">En Espera</h3>
              <p className="text-2xl font-bold">{onHoldProjects}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-full bg-yellow-100 p-3">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Completados</h3>
              <p className="text-2xl font-bold">{completedProjects}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Proyectos Recientes</h2>
            <Link href="/dashboard/projects" className="text-sm font-medium text-green-600 hover:text-green-700">
              Ver todos
            </Link>
          </div>

          {projects.length > 0 ? (
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
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {projects.slice(0, 5).map((project) => (
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
                      <td className="whitespace-nowrap px-6 py-4">
                        <Link
                          href={`/dashboard/projects/${project.id}/edit`}
                          className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-500"
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
              {projects.length > 5 && (
                <div className="bg-gray-50 px-6 py-3 text-right">
                  <Link href="/dashboard/projects" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Ver todos los proyectos
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
              <h3 className="mb-2 text-lg font-medium">No tienes proyectos aún</h3>
              <p className="mb-4 text-gray-500">Comienza creando tu primer proyecto</p>
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

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Actividad Reciente</h2>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="mr-4 mt-1 rounded-full bg-green-100 p-2">
                  <FolderKanban className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Nuevo proyecto creado</p>
                  <p className="text-xs text-gray-500">Hace 2 días</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mr-4 mt-1 rounded-full bg-blue-100 p-2">
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Tarea completada</p>
                  <p className="text-xs text-gray-500">Hace 3 días</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mr-4 mt-1 rounded-full bg-purple-100 p-2">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Nuevo miembro añadido</p>
                  <p className="text-xs text-gray-500">Hace 5 días</p>
                </div>
              </div>

              <Link href="#" className="block text-center text-sm font-medium text-green-600 hover:text-green-700">
                Ver toda la actividad
              </Link>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Próximos Eventos</h2>
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="mr-4 mt-1 rounded-full bg-yellow-100 p-2">
                    <Calendar className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Reunión de equipo</p>
                    <p className="text-xs text-gray-500">Mañana, 10:00 AM</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="mr-4 mt-1 rounded-full bg-red-100 p-2">
                    <Bell className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Fecha límite del proyecto</p>
                    <p className="text-xs text-gray-500">En 3 días</p>
                  </div>
                </div>

                <Link href="#" className="block text-center text-sm font-medium text-green-600 hover:text-green-700">
                  Ver calendario
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
