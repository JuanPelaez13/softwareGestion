import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  const cookieStore = cookies()

  // Eliminar la cookie de sesión
  cookieStore.delete("session")

  // Redirigir a la página de inicio
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
}
