"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createProject } from "@/lib/projects"
import { getAllUsers } from "@/lib/tasks"
import { ArrowLeft, X, UserPlus } from "lucide-react"

export default function NewProjectPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [users, setUsers] = useState<any[]>([])
  const [selectedCollaborators, setSelectedCollaborators] = useState<number[]>([])
  const [showCollaboratorSelector, setShowCollaboratorSelector] = useState(false)

  useEffect(() => {
    // Cargar usuarios para seleccionar colaboradores
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

    loadUsers()
  }, [])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const status = formData.get("status") as "active" | "completed" | "on_hold" | "cancelled"
    const priority = formData.get("priority") as "low" | "medium" | "high" | "urgent"
    const start_date = formData.get("start_date") as string
    const end_date = formData.get("end_date") as string

    try {
      const result = await createProject({
        name,
        description,
        status,
        priority,
        start_date: start_date || undefined,
        end_date: end_date || undefined,
        collaborators: selectedCollaborators.length > 0 ? selectedCollaborators : undefined,
      })

      if (result.success) {
        // Redirigir directamente a la página de tareas del proyecto
        router.push(`/dashboard/projects/${result.projectId}/tasks`)
      } else {
        setError(result.error || "Error al crear el proyecto")
        setIsLoading(false)
      }
    } catch (error) {
      setError("Ocurrió un error al crear el proyecto")
      console.error(error)
      setIsLoading(false)
    }
  }

  const toggleCollaborator = (userId: number) => {
    setSelectedCollaborators((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const removeCollaborator = (userId: number) => {
    setSelectedCollaborators((prev) => prev.filter((id) => id !== userId))
  }

  // Función para manejar el botón de volver atrás
  const handleGoBack = () => {
    router.back()
  }

  return (
    <div>
      <div className="mb-8 flex items-center">
        <button onClick={handleGoBack} className="mr-4 text-gray-500 hover:text-gray-700" aria-label="Volver atrás">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Nuevo Proyecto</h1>
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
                defaultValue="active"
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
                defaultValue="medium"
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Colaboradores</label>
              <div className="mt-1">
                <button
                  type="button"
                  onClick={() => setShowCollaboratorSelector(!showCollaboratorSelector)}
                  className="flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {showCollaboratorSelector ? "Ocultar selector" : "Añadir colaboradores"}
                </button>
              </div>

              {/* Lista de colaboradores seleccionados */}
              {selectedCollaborators.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedCollaborators.map((userId) => {
                    const user = users.find((u) => u.id === userId)
                    return user ? (
                      <div
                        key={userId}
                        className="flex items-center rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
                      >
                        {user.name}
                        <button
                          type="button"
                          onClick={() => removeCollaborator(userId)}
                          className="ml-1 rounded-full p-1 text-green-600 hover:bg-green-200 hover:text-green-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : null
                  })}
                </div>
              )}

              {/* Selector de colaboradores */}
              {showCollaboratorSelector && (
                <div className="mt-2 max-h-60 overflow-y-auto rounded-md border border-gray-300 bg-white p-2">
                  {users.length > 0 ? (
                    <ul className="space-y-1">
                      {users.map((user) => (
                        <li key={user.id}>
                          <label className="flex items-center space-x-2 rounded-md p-2 hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={selectedCollaborators.includes(user.id)}
                              onChange={() => toggleCollaborator(user.id)}
                              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span>
                              {user.name} ({user.email})
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-sm text-gray-500">No hay usuarios disponibles</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              placeholder="Describe el proyecto..."
            ></textarea>
          </div>

          {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleGoBack}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? "Creando..." : "Crear Proyecto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
