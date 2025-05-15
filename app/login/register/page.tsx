"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { registerUser } from "@/lib/actions"

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const result = await registerUser({ name, email, password })

      if (result.success) {
        router.push("/login?registered=true")
      } else {
        setError(result.error || "Error al registrar usuario")
      }
    } catch (error) {
      setError("Ocurrió un error durante el registro")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/edusqa-logo.png" alt="EDU SQA Logo" width={120} height={50} />
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center py-12">
        <div className="mx-auto w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-gray-800">Crear una cuenta</h1>
            <p className="mt-2 text-sm text-gray-600">Ingresa tus datos para registrarte</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                placeholder="Juan Pérez"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                placeholder="nombre@ejemplo.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                  placeholder="********"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-green-600 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? "Registrando..." : "Registrarse"}
            </button>

            <div className="text-center text-sm text-gray-600">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="font-medium text-green-600 hover:text-green-500">
                Iniciar sesión
              </Link>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-2">
          <Image src="/edusqa-logo.png" alt="EDU SQA Logo" width={100} height={40} />
        </div>
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} EDU SQA S.A.S. Todos los derechos reservados.
        </p>
        <div className="flex gap-4">
          <Link href="/terms" className="text-sm text-gray-500 hover:text-green-600">
            Términos
          </Link>
          <Link href="/privacy" className="text-sm text-gray-500 hover:text-green-600">
            Privacidad
          </Link>
        </div>
      </div>
    </footer>
  )
}
