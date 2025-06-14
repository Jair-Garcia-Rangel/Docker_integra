import connect from "../middlewares/db.mjs";

async function obtenerVehiculosPorUsuario(usuarioId) {
  const db = await connect();
  try {
    const sql = `
      SELECT v.*, u.usuario as nombre_usuario 
      FROM vehiculos v 
      INNER JOIN usuario u ON v.usuario_id = u.id 
      WHERE v.usuario_id = ?
      ORDER BY v.created_at DESC
    `;
    const [rows] = await db.execute(sql, [usuarioId]);
    return Promise.resolve(rows);
  } catch (error) {
    console.error("Error al obtener vehículos:", error);
    return Promise.reject("Error al obtener vehículos");
  } finally {
    db.end();
  }
}

async function crearVehiculo({ placa, color, modelo, version, usuario_id }) {
  const db = await connect();
  try {
    const sql = `
      INSERT INTO vehiculos (placa, color, modelo, version, usuario_id) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(sql, [placa, color, modelo, version, usuario_id]);
    
    // Retornar el vehículo creado
    const vehiculoCreado = {
      id: result.insertId,
      placa,
      color,
      modelo,
      version,
      usuario_id
    };
    
    return Promise.resolve(vehiculoCreado);
  } catch (error) {
    console.error("Error al crear vehículo:", error);
    return Promise.reject(error);
  } finally {
    db.end();
  }
}

async function actualizarVehiculo(id, { placa, color, modelo, version, usuario_id }) {
  const db = await connect();
  try {
    const sql = `
      UPDATE vehiculos 
      SET placa = ?, color = ?, modelo = ?, version = ? 
      WHERE id = ? AND usuario_id = ?
    `;
    const [result] = await db.execute(sql, [placa, color, modelo, version, id, usuario_id]);
    
    if (result.affectedRows === 0) {
      return Promise.reject("Vehículo no encontrado o no pertenece al usuario");
    }
    
    return Promise.resolve("Vehículo actualizado correctamente");
  } catch (error) {
    console.error("Error al actualizar vehículo:", error);
    return Promise.reject("Error al actualizar vehículo");
  } finally {
    db.end();
  }
}

async function eliminarVehiculo(id, usuarioId) {
  const db = await connect();
  try {
    const sql = "DELETE FROM vehiculos WHERE id = ? AND usuario_id = ?";
    const [result] = await db.execute(sql, [id, usuarioId]);
    
    if (result.affectedRows === 0) {
      return Promise.reject("Vehículo no encontrado o no pertenece al usuario");
    }
    
    return Promise.resolve("Vehículo eliminado correctamente");
  } catch (error) {
    console.error("Error al eliminar vehículo:", error);
    return Promise.reject("Error al eliminar vehículo");
  } finally {
    db.end();
  }
}

export default {
  obtenerVehiculosPorUsuario,
  crearVehiculo,
  actualizarVehiculo,
  eliminarVehiculo
};