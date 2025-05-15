import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rutas que requieren autenticación
const protectedRoutes = ["/dashboard"]

// Rutas para usuarios no autenticados
const authRoutes = ["/login", "/register"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get("session")
  const isAuthenticated = !!sessionCookie

  // Redirigir a usuarios autenticados que intentan acceder a rutas de autenticación
  if (isAuthenticated && authRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Redirigir a usuarios no autenticados que intentan acceder a rutas protegidas
  if (!isAuthenticated && protectedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
}
