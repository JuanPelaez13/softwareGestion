"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createProject } from "@/lib/projects"
import { ArrowLeft } from "lucide-react"

export default function NewProjectPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

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
      })

      if (result.success) {
        router.push("/dashboard/projects")
        router.refresh()
      } else {
        setError(result.error || "Error al crear el proyecto")
      }
    } catch (error) {
      setError("Ocurrió un error al crear el proyecto")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center">
        <Link href="/dashboard/projects" className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
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
            <Link
              href="/dashboard/projects"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Link>
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
