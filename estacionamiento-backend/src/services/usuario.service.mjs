import connect from "../middlewares/db.mjs"

async function obtenerClientes() {
  const db = await connect();
  try {
    const [rows] = await db.execute("SELECT * FROM cliente");
    return Promise.resolve(rows);
  } catch (error) {
    console.log("Error:", error);
    return Promise.reject("Error al obtener clientes");
  } finally {
    db.end();
  }
}

async function crearCliente(nombre, apellidos, telefono, email) {
  const db = await connect();
  try {
    const sql = "INSERT INTO cliente (nombre, apellidos, telefono, email) VALUES (?, ?, ?, ?)";
    const [result] = await db.execute(sql, [nombre, apellidos, telefono, email]);
    return Promise.resolve("Cliente creado correctamente");
  } catch (error) {
    console.log("Error:", error);
    return Promise.reject("Error al crear cliente");
  } finally {
    db.end();
  }
}

async function actualizarCliente(id, nombre, apellidos, telefono, email) {
  const db = await connect();
  try {
    const sql = "UPDATE cliente SET nombre = ?, apellidos = ?, telefono = ?, email = ? WHERE id = ?";
    const [result] = await db.execute(sql, [nombre, apellidos, telefono, email, id]);
    return Promise.resolve("Cliente actualizado correctamente");
  } catch (error) {
    console.log("Error:", error);
    return Promise.reject("Error al actualizar cliente");
  } finally {
    db.end();
  }
}

async function eliminarCliente(id) {
  const db = await connect();
  try {
    const sql = "DELETE FROM cliente WHERE id = ?";
    const [result] = await db.execute(sql, [id]);
    return Promise.resolve("Cliente eliminado correctamente");
  } catch (error) {
    console.log("Error:", error);
    return Promise.reject("Error al eliminar cliente");
  } finally {
    db.end();
  }
}

// ✅ FUNCIÓN CORREGIDA PARA REGISTRO COMPLETO
async function crearRegistro({ nombre, apellidos, telefono, usuario, contrasenia }) {
  const db = await connect();
  try {
    // Verificar si el usuario ya existe
    const checkSql = "SELECT id FROM usuario WHERE usuario = ?";
    const [existing] = await db.execute(checkSql, [usuario]);
    
    if (existing.length > 0) {
      throw new Error('El usuario ya existe');
    }

    // Insertar nuevo usuario con todos los campos
    const sql = "INSERT INTO usuario (nombre, apellidos, telefono, usuario, contrasenia) VALUES (?, ?, ?, ?, ?)";
    const [result] = await db.execute(sql, [nombre, apellidos, telefono, usuario, contrasenia]);
    
    return { 
      id: result.insertId, 
      nombre, 
      apellidos, 
      telefono, 
      usuario 
    };
  } catch (error) {
    console.error('Error en crearRegistro:', error);
    throw error;
  } finally {
    await db.end();
  }
}

// ✅ FUNCIÓN CORREGIDA PARA LOGIN
async function buscarUsuario(usuario, contrasenia) {
  const db = await connect();
  try {
    const sql = "SELECT id, nombre, apellidos, telefono, usuario, tipo_usuario FROM usuario WHERE usuario = ? AND contrasenia = ?";
    const [rows] = await db.execute(sql, [usuario, contrasenia]);
    return rows.length ? rows[0] : null;
  } catch (error) {
    console.error('Error en buscarUsuario:', error);
    throw error;
  } finally {
    await db.end();
  }
}


export default {
  obtenerClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
  buscarUsuario,
  crearRegistro,
}