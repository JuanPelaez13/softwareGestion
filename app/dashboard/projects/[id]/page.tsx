import { notFound } from "next/navigation"
import Link from "next/link"
import { getProjectById } from "@/lib/projects"
import { getTaskGroupsByProject } from "@/lib/tasks"
import { ArrowLeft, Calendar, Clock, Edit, Flag, PlusCircle, CheckSquare, List } from "lucide-react"
import { use } from "react"

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  // Usar React.use para desenvolver params de manera segura
  const unwrappedParams = use(params)
  const projectId = Number.parseInt(unwrappedParams.id)

  if (isNaN(projectId)) {
    notFound()
  }

  const projectResult = getProjectById(projectId)
  const resolvedProjectResult = use(projectResult)

  if (!resolvedProjectResult.success) {
    notFound()
  }

  const project = resolvedProjectResult.project

  // Obtener los grupos de tareas y tareas
  const taskGroupsResult = getTaskGroupsByProject(projectId)
  const resolvedTaskGroupsResult = use(taskGroupsResult)
  const taskGroups = resolvedTaskGroupsResult.success ? resolvedTaskGroupsResult.groups : []

  // Calcular estadísticas de tareas
  let totalTasks = 0
  let completedTasks = 0
  const tasksByStatus = {
    to_do: 0,
    in_progress: 0,
    review: 0,
    completed: 0,
  }

  // Contar solo tareas principales (no subtareas)
  taskGroups.forEach((group) => {
    if (group.tasks) {
      group.tasks.forEach((task) => {
        // Solo contar tareas principales
        if (!task.parent_id) {
          totalTasks++
          if (task.status === "completed") {
            completedTasks++
          }
          tasksByStatus[task.status]++
        }
      })
    }
  })

  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/dashboard/projects" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/dashboard/projects/${project.id}/edit`}
            className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Link>
          <Link
            href={`/dashboard/projects/${project.id}/tasks`}
            className="flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <List className="mr-2 h-4 w-4" />
            Ver Tareas
          </Link>
        </div>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-gray-800">Detalles del Proyecto</h2>

          <div className="space-y-4">
            <div className="flex items-start">
              <div className="mr-2 mt-0.5 text-gray-500">
                <Flag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Estado</p>
                <p className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
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
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="mr-2 mt-0.5 text-gray-500">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Prioridad</p>
                <p className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
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
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="mr-2 mt-0.5 text-gray-500">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Fechas</p>
                <p className="mt-1 text-sm">
                  {project.start_date ? (
                    <>
                      <span className="font-medium">Inicio:</span> {new Date(project.start_date).toLocaleDateString()}
                      {project.end_date && (
                        <>
                          <br />
                          <span className="font-medium">Fin:</span> {new Date(project.end_date).toLocaleDateString()}
                        </>
                      )}
                    </>
                  ) : (
                    "No hay fechas establecidas"
                  )}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium text-gray-500">Descripción</p>
              <p className="mt-1 whitespace-pre-line text-sm text-gray-700">
                {project.description || "Sin descripción"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-gray-800">Progreso</h2>
          <div className="mb-4">
            <div className="mb-2 flex justify-between">
              <span className="text-sm font-medium text-gray-500">Completado</span>
              <span className="text-sm font-medium text-gray-700">{completionPercentage}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div className="h-2 rounded-full bg-green-600" style={{ width: `${completionPercentage}%` }}></div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="rounded-md bg-gray-50 p-3 text-center">
              <p className="text-sm font-medium text-gray-500">Tareas Totales</p>
              <p className="text-2xl font-bold text-gray-800">{totalTasks}</p>
            </div>
            <div className="rounded-md bg-gray-50 p-3 text-center">
              <p className="text-sm font-medium text-gray-500">Completadas</p>
              <p className="text-2xl font-bold text-gray-800">{completedTasks}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Por hacer</span>
              <span className="text-xs font-medium text-gray-700">{tasksByStatus.to_do}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">En progreso</span>
              <span className="text-xs font-medium text-gray-700">{tasksByStatus.in_progress}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">En revisión</span>
              <span className="text-xs font-medium text-gray-700">{tasksByStatus.review}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Completadas</span>
              <span className="text-xs font-medium text-gray-700">{tasksByStatus.completed}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-800">Tareas</h2>
          <Link
            href={`/dashboard/projects/${project.id}/tasks`}
            className="flex items-center rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
          >
            <PlusCircle className="mr-1.5 h-4 w-4" />
            Gestionar Tareas
          </Link>
        </div>

        {taskGroups.length === 0 ? (
          <div className="rounded-md bg-gray-50 p-8 text-center">
            <p className="text-gray-500">No hay tareas creadas para este proyecto</p>
            <Link
              href={`/dashboard/projects/${project.id}/tasks`}
              className="mt-4 inline-flex items-center text-sm font-medium text-green-600 hover:text-green-700"
            >
              <PlusCircle className="mr-1.5 h-4 w-4" />
              Crear la primera tarea
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {taskGroups.slice(0, 3).map((group) => (
              <div
                key={group.id}
                className={`rounded-md border-l-4 ${
                  group.color === "blue"
                    ? "border-blue-500"
                    : group.color === "green"
                      ? "border-green-500"
                      : group.color === "yellow"
                        ? "border-yellow-500"
                        : group.color === "red"
                          ? "border-red-500"
                          : group.color === "purple"
                            ? "border-purple-500"
                            : group.color === "pink"
                              ? "border-pink-500"
                              : group.color === "indigo"
                                ? "border-indigo-500"
                                : "border-teal-500"
                } p-4`}
              >
                <h3 className="mb-2 font-medium text-gray-800">{group.name}</h3>
                {group.tasks && group.tasks.length > 0 ? (
                  <ul className="space-y-2">
                    {group.tasks
                      .filter((task) => !task.parent_id) // Solo mostrar tareas principales
                      .slice(0, 3)
                      .map((task) => (
                        <li key={task.id} className="flex items-center justify-between rounded-md bg-gray-50 p-2">
                          <div className="flex items-center">
                            <CheckSquare
                              className={`mr-2 h-4 w-4 ${
                                task.status === "completed" ? "text-green-500" : "text-gray-400"
                              }`}
                            />
                            <span
                              className={`text-sm ${
                                task.status === "completed" ? "line-through text-gray-500" : "text-gray-800"
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              task.status === "to_do"
                                ? "bg-gray-100 text-gray-800"
                                : task.status === "in_progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : task.status === "review"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                            }`}
                          >
                            {task.status === "to_do"
                              ? "Por hacer"
                              : task.status === "in_progress"
                                ? "En progreso"
                                : task.status === "review"
                                  ? "En revisión"
                                  : "Completado"}
                          </span>
                        </li>
                      ))}
                    {group.tasks.filter((task) => !task.parent_id).length > 3 && (
                      <li className="text-center text-sm text-gray-500">
                        <Link href={`/dashboard/projects/${project.id}/tasks`} className="hover:text-green-600">
                          Ver {group.tasks.filter((task) => !task.parent_id).length - 3} tareas más...
                        </Link>
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No hay tareas en este grupo</p>
                )}
              </div>
            ))}
            {taskGroups.length > 3 && (
              <div className="text-center">
                <Link
                  href={`/dashboard/projects/${project.id}/tasks`}
                  className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-700"
                >
                  Ver todos los grupos ({taskGroups.length})
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
