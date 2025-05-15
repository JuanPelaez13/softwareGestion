import mysql from "mysql2/promise"
import { ensureAdminUser } from "@/lib/auth"

// Crear un pool de conexiones para reutilizarlas
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 10,
})

// Función para ejecutar consultas SQL
export async function query(sql: string, params: any[] = []) {
  try {
    const [results] = await pool.execute(sql, params)
    return results
  } catch (error) {
    console.error("Error ejecutando consulta SQL:", error)
    throw error
  }
}

// Función para inicializar la base de datos (crear tablas si no existen)
export async function initializeDatabase() {
  try {
    // Crear tabla de usuarios si no existe
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Crear tabla de proyectos si no existe
    await query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('active', 'completed', 'on_hold', 'cancelled') DEFAULT 'active',
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        start_date DATE,
        end_date DATE,
        owner_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Crear tabla de grupos de tareas (fases) si no existe
    await query(`
      CREATE TABLE IF NOT EXISTS task_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(20) DEFAULT 'blue',
        position INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `)

    // Crear tabla de tareas si no existe
    await query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        group_id INT,
        parent_id INT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('to_do', 'in_progress', 'review', 'completed') DEFAULT 'to_do',
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        start_date DATE,
        due_date DATE,
        assigned_to INT,
        position INT NOT NULL DEFAULT 0,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (group_id) REFERENCES task_groups(id) ON DELETE SET NULL,
        FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Crear tabla de comentarios de tareas si no existe
    await query(`
      CREATE TABLE IF NOT EXISTS task_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Asegurar que existe el usuario administrador
    await ensureAdminUser()

    console.log("Base de datos inicializada correctamente")
  } catch (error) {
    console.error("Error inicializando la base de datos:", error)
    throw error
  }
}
