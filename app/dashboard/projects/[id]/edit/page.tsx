"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  getProjectById,
  updateProject,
  deleteProject,
  addProjectCollaborator,
  removeProjectCollaborator,
} from "@/lib/projects"
import { getAllUsers } from "@/lib/tasks"
import { ArrowLeft, Trash2, UserPlus, X } from "lucide-react"
import { use } from "react"

export default function EditProjectPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()

  // Usar React.use para desenvolver params de manera segura
  const unwrappedParams = use(params)
  const projectId = Number.parseInt(unwrappedParams.id)

  const [project, setProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Añadir estado para colaboradores
  const [users, setUsers] = useState<any[]>([])
  const [collaborators, setCollaborators] = useState<any[]>([])
  const [showCollaboratorSelector, setShowCollaboratorSelector] = useState(false)

  useEffect(() => {
    async function loadProject() {
      if (isNaN(projectId)) {
        router.push("/dashboard/projects")
        return
      }

      try {
        const result = await getProjectById(projectId)

        if (result.success) {
          setProject(result.project)
          // Guardar los colaboradores
          if (result.project.collaborators) {
            setCollaborators(result.project.collaborators)
          }
        } else {
          router.push("/dashboard/projects")
        }
      } catch (error) {
        console.error("Error loading project:", error)
        router.push("/dashboard/projects")
      } finally {
        setIsLoading(false)
      }
    }

    async function loadUsers() {
      try {
        const result = await getAllUsers()
        if (result.success) {
          setUsers(result.users)
        }
      } catch (error) {
        console.error("Error loading users:", error)
      }
    }

    loadProject()
    loadUsers()
  }, [projectId, router])

  // Función para formatear fechas de manera segura
  const formatDateForInput = (dateValue: any): string => {
    if (!dateValue) return ""

    try {
      // Si es una cadena, intentar convertirla a formato YYYY-MM-DD
      if (typeof dateValue === "string") {
        // Si ya tiene formato ISO, extraer solo la parte de la fecha
        if (dateValue.includes("T")) {
          return dateValue.split("T")[0]
        }

        // Si es una fecha en otro formato, intentar convertirla
        const date = new Date(dateValue)
        if (!isNaN(date.getTime())) {
          return date.toISOString().split("T")[0]
        }
        return dateValue
      }

      // Si es un objeto Date
      if (dateValue instanceof Date) {
        return dateValue.toISOString().split("T")[0]
      }

      // Si es un timestamp numérico
      if (typeof dateValue === "number") {
        const date = new Date(dateValue)
        return date.toISOString().split("T")[0]
      }

      return ""
    } catch (e) {
      console.error("Error formatting date:", e)
      return ""
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError("")

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const status = formData.get("status") as "active" | "completed" | "on_hold" | "cancelled"
    const priority = formData.get("priority") as "low" | "medium" | "high" | "urgent"
    const start_date = formData.get("start_date") as string
    const end_date = formData.get("end_date") as string

    try {
      const result = await updateProject(projectId, {
        name,
        description,
        status,
        priority,
        start_date: start_date || undefined,
        end_date: end_date || undefined,
      })

      if (result.success) {
        router.push(`/dashboard/projects/${projectId}`)
        router.refresh()
      } else {
        setError(result.error || "Error al actualizar el proyecto")
      }
    } catch (error) {
      setError("Ocurrió un error al actualizar el proyecto")
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    setError("")

    try {
      const result = await deleteProject(projectId)

      if (result.success) {
        router.push("/dashboard/projects")
        router.refresh()
      } else {
        setError(result.error || "Error al eliminar el proyecto")
        setIsDeleting(false)
        setShowDeleteConfirm(false)
      }
    } catch (error) {
      setError("Ocurrió un error al eliminar el proyecto")
      console.error(error)
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // Añadir funciones para gestionar colaboradores
  const addCollaborator = async (userId: number) => {
    try {
      const result = await addProjectCollaborator(projectId, userId)
      if (result.success) {
        // Actualizar la lista de colaboradores
        const userToAdd = users.find((u) => u.id === userId)
        if (userToAdd && !collaborators.some((c) => c.id === userId)) {
          setCollaborators([...collaborators, userToAdd])
        }
      } else {
        setError(result.error || "Error al añadir colaborador")
      }
    } catch (error) {
      console.error("Error adding collaborator:", error)
      setError("Error al añadir colaborador")
    }
  }

  const removeCollaborator = async (userId: number) => {
    try {
      const result = await removeProjectCollaborator(projectId, userId)
      if (result.success) {
        // Actualizar la lista de colaboradores
        setCollaborators(collaborators.filter((c) => c.id !== userId))
      } else {
        setError(result.error || "Error al eliminar colaborador")
      }
    } catch (error) {
      console.error("Error removing collaborator:", error)
      setError("Error al eliminar colaborador")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center">
          <Link href={`/dashboard/projects/${projectId}`} className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Editar Proyecto</h1>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar Proyecto
        </button>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre del Proyecto *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={project.name}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                placeholder="Nombre del proyecto"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                id="status"
                name="status"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                defaultValue={project.status}
              >
                <option value="active">Activo</option>
                <option value="completed">Completado</option>
                <option value="on_hold">En Espera</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Prioridad
              </label>
              <select
                id="priority"
                name="priority"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                defaultValue={project.priority}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                Fecha de Inicio
              </label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                defaultValue={formatDateForInput(project.start_date)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              />
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                Fecha de Finalización
              </label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                defaultValue={formatDateForInput(project.end_date)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">Colaboradores</label>

            {project && project.is_owner ? (
              <>
                <div className="mt-1">
                  <button
                    type="button"
                    onClick={() => setShowCollaboratorSelector(!showCollaboratorSelector)}
                    className="flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {showCollaboratorSelector ? "Ocultar selector" : "Gestionar colaboradores"}
                  </button>
                </div>

                {/* Lista de colaboradores actuales */}
                {collaborators.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {collaborators.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                      >
                        {user.name}
                        <button
                          type="button"
                          onClick={() => removeCollaborator(user.id)}
                          className="ml-1 rounded-full p-1 text-blue-600 hover:bg-blue-200 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selector de colaboradores */}
                {showCollaboratorSelector && (
                  <div className="mt-2 max-h-60 overflow-y-auto rounded-md border border-gray-300 bg-white p-2">
                    {users.length > 0 ? (
                      <ul className="space-y-1">
                        {users
                          .filter((user) => !collaborators.some((c) => c.id === user.id))
                          .map((user) => (
                            <li key={user.id}>
                              <button
                                type="button"
                                onClick={() => addCollaborator(user.id)}
                                className="flex w-full items-center justify-between rounded-md p-2 text-left hover:bg-gray-50"
                              >
                                <span>
                                  {user.name} ({user.email})
                                </span>
                                <UserPlus className="h-4 w-4 text-green-600" />
                              </button>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p className="text-center text-sm text-gray-500">No hay usuarios disponibles</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="mt-2">
                {collaborators.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {collaborators.map((user) => (
                      <div key={user.id} className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                        {user.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No hay colaboradores</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Solo el propietario puede gestionar colaboradores</p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={project.description || ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              placeholder="Describe el proyecto..."
            ></textarea>
          </div>

          {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

          <div className="flex justify-end space-x-4">
            <Link
              href={`/dashboard/projects/${projectId}`}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Confirmar eliminación</h3>
            <p className="mb-6 text-sm text-gray-500">
              ¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer y se eliminarán todas
              las tareas asociadas.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
