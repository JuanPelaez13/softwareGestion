"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { getAllUsers } from "@/lib/tasks"
import { getUserProjects } from "@/lib/projects"
import { FolderKanban, Mail, Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function TeamPage() {
  const searchParams = useSearchParams()
  const selectedUserId = searchParams.get("user") ? Number.parseInt(searchParams.get("user")!, 10) : null

  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [userProjects, setUserProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Cargar todos los usuarios
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true)
        const usersResult = await getAllUsers()
        if (usersResult.success) {
          setUsers(usersResult.users)

          // Si hay un usuario seleccionado en la URL, establecerlo
          if (selectedUserId) {
            const user = usersResult.users.find((u: any) => u.id === selectedUserId)
            if (user) {
              setSelectedUser(user)
            }
          }
        } else {
          setError(usersResult.error || "Error al cargar usuarios")
        }
      } catch (error) {
        console.error("Error loading users:", error)
        setError("Error al cargar usuarios")
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [selectedUserId])

  // Cargar proyectos del usuario seleccionado
  useEffect(() => {
    const loadUserProjects = async () => {
      if (!selectedUser) return

      try {
        setIsLoading(true)
        const projectsResult = await getUserProjects(selectedUser.id)
        if (projectsResult.success) {
          setUserProjects(projectsResult.projects)
        } else {
          setError(projectsResult.error || "Error al cargar proyectos")
        }
      } catch (error) {
        console.error("Error loading user projects:", error)
        setError("Error al cargar proyectos del usuario")
      } finally {
        setIsLoading(false)
      }
    }

    loadUserProjects()
  }, [selectedUser])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Equipo</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{users.length} usuarios registrados</span>
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="mb-8 grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {users.map((user) => (
          <Link
            key={user.id}
            href={`/dashboard/team?user=${user.id}`}
            className={`flex flex-col items-center p-4 rounded-lg border ${
              selectedUser?.id === user.id ? "border-green-500 bg-green-50" : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div
              className={`mb-2 flex h-16 w-16 items-center justify-center rounded-full ${
                selectedUser?.id === user.id ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
              } text-xl font-medium`}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-center font-medium text-gray-800">{user.name}</h3>
            <p className="text-center text-xs text-gray-500">{user.email}</p>
          </Link>
        ))}
      </div>

      {/* Detalles del usuario seleccionado */}
      {selectedUser && (
        <div className="mt-8">
          <div className="mb-6 flex items-center">
            <div className="mr-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl font-medium text-green-600">
              {selectedUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{selectedUser.name}</h2>
              <p className="text-gray-500">{selectedUser.email}</p>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <h3 className="mb-2 font-medium text-gray-700">Información de contacto</h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="mr-2 h-4 w-4 text-gray-400" />
                  {selectedUser.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                  Miembro desde {new Date(selectedUser.created_at || Date.now()).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <h3 className="mb-2 font-medium text-gray-700">Estadísticas</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Proyectos</span>
                  <span className="font-medium text-gray-800">{userProjects.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Proyectos activos</span>
                  <span className="font-medium text-gray-800">
                    {userProjects.filter((p) => p.status === "active").length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Proyectos completados</span>
                  <span className="font-medium text-gray-800">
                    {userProjects.filter((p) => p.status === "completed").length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <h3 className="mb-4 flex items-center text-xl font-bold text-gray-800">
            <FolderKanban className="mr-2 h-5 w-5 text-gray-500" />
            Proyectos ({userProjects.length})
          </h3>

          {userProjects.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        project.status === "active"
                          ? "bg-green-100 text-green-800"
                          : project.status === "completed"
                            ? "bg-blue-100 text-blue-800"
                            : project.status === "on_hold"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {project.status === "active"
                        ? "Activo"
                        : project.status === "completed"
                          ? "Completado"
                          : project.status === "on_hold"
                            ? "En espera"
                            : "Cancelado"}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        project.priority === "urgent"
                          ? "bg-red-100 text-red-800"
                          : project.priority === "high"
                            ? "bg-orange-100 text-orange-800"
                            : project.priority === "medium"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {project.priority === "urgent"
                        ? "Urgente"
                        : project.priority === "high"
                          ? "Alta"
                          : project.priority === "medium"
                            ? "Media"
                            : "Baja"}
                    </span>
                  </div>

                  <h3 className="mb-2 text-lg font-medium text-gray-800">{project.name}</h3>
                  {project.description && (
                    <p className="mb-4 text-sm text-gray-600 line-clamp-2">{project.description}</p>
                  )}

                  {(project.total_tasks > 0 || project.total_tasks === 0) && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Progreso</span>
                        <span>
                          {project.completed_tasks}/{project.total_tasks} tareas
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full ${
                            project.completed_tasks === project.total_tasks
                              ? "bg-green-500"
                              : project.completed_tasks / project.total_tasks >= 0.75
                                ? "bg-teal-500"
                                : project.completed_tasks / project.total_tasks >= 0.5
                                  ? "bg-yellow-500"
                                  : project.completed_tasks / project.total_tasks >= 0.25
                                    ? "bg-orange-500"
                                    : "bg-red-500"
                          }`}
                          style={{
                            width: `${
                              project.total_tasks > 0 ? (project.completed_tasks / project.total_tasks) * 100 : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {project.start_date && (
                        <span>
                          {new Date(project.start_date).toLocaleDateString()} -{" "}
                          {project.end_date ? new Date(project.end_date).toLocaleDateString() : "Sin fecha fin"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-green-600 hover:text-green-700">
                      <span className="mr-1 text-sm">Ver detalles</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-gray-500">Este usuario no tiene proyectos asignados</p>
            </div>
          )}
        </div>
      )}

      {!selectedUser && (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-gray-500">Selecciona un usuario para ver sus proyectos</p>
        </div>
      )}
    </div>
  )
}
