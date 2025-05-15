import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image src="/edusqa-logo.png" alt="EDU SQA Logo" width={180} height={75} />
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-green-600">
              Iniciar Sesión
            </Link>
            <Link
              href="/login/register"
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Registrarse
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="flex flex-col items-center justify-center py-24 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-800 sm:text-5xl md:text-6xl">
                Gestión de Proyectos Simplificada
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-center text-xl text-gray-600">
                Optimiza la gestión de tus proyectos con nuestra plataforma intuitiva y potente. Diseñada
                específicamente para las necesidades de EDU SQA SAS.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/login/register"
                  className="flex items-center rounded-md bg-green-600 px-8 py-3 text-center font-medium text-white shadow-sm hover:bg-green-700"
                >
                  Comenzar Ahora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="rounded-md border border-gray-300 bg-white px-8 py-3 text-center font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Iniciar Sesión
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
        <div className="flex items-center gap-2">
          <Image src="/edusqa-logo.png" alt="EDU SQA Logo" width={150} height={60} />
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
