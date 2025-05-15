"use server"

import { query } from "@/lib/db"

export async function fixDatabaseSchema() {
  try {
    // Verificar si la tabla task_groups existe
    const taskGroupsResult = await query(`SHOW TABLES LIKE 'task_groups'`)
    const taskGroupsTableExists = Array.isArray(taskGroupsResult) && taskGroupsResult.length > 0

    if (!taskGroupsTableExists) {
      // Crear la tabla task_groups si no existe
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
      console.log("Tabla task_groups creada correctamente")
    }

    // Verificar si la tabla tasks existe
    const tasksResult = await query(`SHOW TABLES LIKE 'tasks'`)
    const tasksTableExists = Array.isArray(tasksResult) && tasksResult.length > 0

    if (!tasksTableExists) {
      // Crear la tabla tasks si no existe
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
          due_date DATE,
          assigned_to INT,
          created_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
      `)
      console.log("Tabla tasks creada correctamente")
      return { success: true, message: "Tablas creadas correctamente" }
    }

    // Si la tabla tasks existe, verificar y añadir las columnas necesarias
    const requiredColumns = [
      { name: "group_id", type: "INT", after: "project_id" },
      { name: "parent_id", type: "INT", after: "group_id" },
    ]

    let columnsAdded = false

    for (const col of requiredColumns) {
      const columnResult = await query(`SHOW COLUMNS FROM tasks LIKE '${col.name}'`)
      const columnExists = Array.isArray(columnResult) && columnResult.length > 0

      if (!columnExists) {
        await query(`ALTER TABLE tasks ADD COLUMN ${col.name} ${col.type} AFTER ${col.after}`)
        console.log(`Columna ${col.name} añadida correctamente`)
        columnsAdded = true
      }
    }

    // Verificar si el campo status tiene los valores correctos
    try {
      const statusResult = await query(`
        SELECT COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'tasks' 
        AND COLUMN_NAME = 'status'
      `)

      if (Array.isArray(statusResult) && statusResult.length > 0) {
        const statusType = statusResult[0].COLUMN_TYPE
        if (
          !statusType.includes("'to_do'") ||
          !statusType.includes("'in_progress'") ||
          !statusType.includes("'review'") ||
          !statusType.includes("'completed'")
        ) {
          // Modificar el campo status para tener los valores correctos
          await query(`
            ALTER TABLE tasks 
            MODIFY COLUMN status ENUM('to_do', 'in_progress', 'review', 'completed') DEFAULT 'to_do'
          `)
          console.log("Campo status modificado correctamente")
          columnsAdded = true
        }
      }
    } catch (error) {
      console.error("Error al verificar el campo status:", error)
    }

    // Verificar si el campo priority tiene los valores correctos
    try {
      const priorityResult = await query(`
        SELECT COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'tasks' 
        AND COLUMN_NAME = 'priority'
      `)

      if (Array.isArray(priorityResult) && priorityResult.length > 0) {
        const priorityType = priorityResult[0].COLUMN_TYPE
        if (
          !priorityType.includes("'low'") ||
          !priorityType.includes("'medium'") ||
          !priorityType.includes("'high'") ||
          !priorityType.includes("'urgent'")
        ) {
          // Modificar el campo priority para tener los valores correctos
          await query(`
            ALTER TABLE tasks 
            MODIFY COLUMN priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium'
          `)
          console.log("Campo priority modificado correctamente")
          columnsAdded = true
        }
      }
    } catch (error) {
      console.error("Error al verificar el campo priority:", error)
    }

    if (columnsAdded) {
      return { success: true, message: "Estructura de la base de datos corregida correctamente" }
    } else {
      return { success: true, message: "La estructura de la base de datos ya es correcta" }
    }
  } catch (error) {
    console.error("Error al corregir la estructura de la base de datos:", error)
    return { success: false, error: "Error al corregir la estructura de la base de datos" }
  }
}

// Función para recrear completamente las tablas (usar con precaución)
export async function recreateTaskTables() {
  try {
    // Eliminar las tablas si existen
    await query(`DROP TABLE IF EXISTS tasks`)
    await query(`DROP TABLE IF EXISTS task_groups`)

    // Crear la tabla task_groups
    await query(`
      CREATE TABLE task_groups (
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

    // Crear la tabla tasks - Eliminando la columna start_date
    await query(`
      CREATE TABLE tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        group_id INT,
        parent_id INT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('to_do', 'in_progress', 'review', 'completed') DEFAULT 'to_do',
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        due_date DATE,
        assigned_to INT,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `)

    return { success: true, message: "Tablas recreadas correctamente" }
  } catch (error) {
    console.error("Error al recrear las tablas:", error)
    return { success: false, error: "Error al recrear las tablas" }
  }
}
