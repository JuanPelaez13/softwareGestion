"use server"

import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { query } from "@/lib/db"

// Tipo para el usuario
type User = {
  id: number
  name: string
  email: string
}

// Función para registrar un usuario
export async function registerUser({
  name,
  email,
  password,
}: {
  name: string
  email: string
  password: string
}) {
  try {
    // Verificar si el correo ya está registrado
    const existingUsers = (await query("SELECT * FROM users WHERE email = ?", [email])) as any[]

    if (existingUsers.length > 0) {
      return {
        success: false,
        error: "Este correo electrónico ya está registrado",
      }
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insertar el usuario en la base de datos
    const result = (await query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [
      name,
      email,
      hashedPassword,
    ])) as any

    return {
      success: true,
      userId: result.insertId,
    }
  } catch (error) {
    console.error("Error al registrar usuario:", error)
    return {
      success: false,
      error: "Error al registrar usuario",
    }
  }
}

// Función para iniciar sesión
export async function loginUser({
  email,
  password,
}: {
  email: string
  password: string
}) {
  try {
    // Buscar el usuario por correo
    const users = (await query("SELECT * FROM users WHERE email = ?", [email])) as any[]

    if (users.length === 0) {
      return {
        success: false,
        error: "Credenciales inválidas",
      }
    }

    const user = users[0]

    // Verificar la contraseña
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return {
        success: false,
        error: "Credenciales inválidas",
      }
    }

    // Crear sesión
    const session = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    }

    // Guardar sesión en cookie - IMPORTANTE: Usar await con cookies()
    const cookieStore = await cookies()
    cookieStore.set({
      name: "session",
      value: JSON.stringify(session),
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 semana
    })

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error al iniciar sesión:", error)
    return {
      success: false,
      error: "Error al iniciar sesión",
    }
  }
}
