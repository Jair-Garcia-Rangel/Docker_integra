import connect from "../middlewares/db.mjs";

// Precios base para los servicios
const PRECIOS = {
  autolavado: {
    lavado_exterior: 50,
    lavado_interior: 40,
    encerado: 80,
    aspirado: 30,
    limpieza_llantas: 25,
    aromatizante: 15
  },
  estacionamiento: {
    por_hora: 15,
    tiempo_completo: 100
  }
};

async function obtenerReservasPorUsuario(usuarioId) {
  const db = await connect();
  try {
    const sql = `
      SELECT 
        r.*,
        v.placa,
        v.color,
        v.modelo,
        v.version,
        ra.lavado_exterior,
        ra.lavado_interior,
        ra.encerado,
        ra.aspirado,
        ra.limpieza_llantas,
        ra.aromatizante,
        ra.subtotal as subtotal_autolavado,
        re.tipo_tarifa,
        re.horas_estimadas,
        re.hora_salida,
        re.subtotal as subtotal_estacionamiento
      FROM reservas r
      INNER JOIN vehiculos v ON r.vehiculo_id = v.id
      LEFT JOIN reservas_autolavado ra ON r.id = ra.reserva_id
      LEFT JOIN reservas_estacionamiento re ON r.id = re.reserva_id
      WHERE r.usuario_id = ?
      ORDER BY r.created_at DESC
    `;
    const [rows] = await db.execute(sql, [usuarioId]);
    return Promise.resolve(rows);
  } catch (error) {
    console.error("Error al obtener reservas:", error);
    return Promise.reject("Error al obtener reservas");
  } finally {
    db.end();
  }
}

async function crearReserva({ usuario_id, vehiculo_id, fecha, hora, tipo_servicio, autolavado, estacionamiento }) {
  const db = await connect();
  
  try {
    await db.beginTransaction();

    // Calcular total
    let total = 0;
    let subtotalAutolavado = 0;
    let subtotalEstacionamiento = 0;

    // Calcular subtotal autolavado
    if (tipo_servicio === 'autolavado' || tipo_servicio === 'ambos') {
      subtotalAutolavado = calcularSubtotalAutolavado(autolavado);
      total += subtotalAutolavado;
    }

    // Calcular subtotal estacionamiento
    if (tipo_servicio === 'estacionamiento' || tipo_servicio === 'ambos') {
      subtotalEstacionamiento = calcularSubtotalEstacionamiento(estacionamiento);
      total += subtotalEstacionamiento;
    }

    // Insertar reserva principal
    const sqlReserva = `
      INSERT INTO reservas (usuario_id, vehiculo_id, fecha, hora, tipo_servicio, total)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [resultReserva] = await db.execute(sqlReserva, [
      usuario_id, vehiculo_id, fecha, hora, tipo_servicio, total
    ]);

    const reservaId = resultReserva.insertId;

    // Insertar detalles de autolavado si aplica
    if (tipo_servicio === 'autolavado' || tipo_servicio === 'ambos') {
      const sqlAutolavado = `
        INSERT INTO reservas_autolavado 
        (reserva_id, lavado_exterior, lavado_interior, encerado, aspirado, limpieza_llantas, aromatizante, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await db.execute(sqlAutolavado, [
        reservaId,
        autolavado.lavado_exterior || false,
        autolavado.lavado_interior || false,
        autolavado.encerado || false,
        autolavado.aspirado || false,
        autolavado.limpieza_llantas || false,
        autolavado.aromatizante || false,
        subtotalAutolavado
      ]);
    }

    // Insertar detalles de estacionamiento si aplica
    if (tipo_servicio === 'estacionamiento' || tipo_servicio === 'ambos') {
      const sqlEstacionamiento = `
        INSERT INTO reservas_estacionamiento 
        (reserva_id, tipo_tarifa, horas_estimadas, hora_salida, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `;
      await db.execute(sqlEstacionamiento, [
        reservaId,
        estacionamiento.tipo_tarifa,
        estacionamiento.horas_estimadas || null,
        estacionamiento.hora_salida || null,
        subtotalEstacionamiento
      ]);
    }

    await db.commit();

    return Promise.resolve({
      id: reservaId,
      usuario_id,
      vehiculo_id,
      fecha,
      hora,
      tipo_servicio,
      total
    });
  } catch (error) {
    await db.rollback();
    console.error("Error al crear reserva:", error);
    return Promise.reject(error);
  } finally {
    db.end();
  }
}

function calcularSubtotalAutolavado(autolavado) {
  let subtotal = 0;
  
  if (autolavado.lavado_exterior) subtotal += PRECIOS.autolavado.lavado_exterior;
  if (autolavado.lavado_interior) subtotal += PRECIOS.autolavado.lavado_interior;
  if (autolavado.encerado) subtotal += PRECIOS.autolavado.encerado;
  if (autolavado.aspirado) subtotal += PRECIOS.autolavado.aspirado;
  if (autolavado.limpieza_llantas) subtotal += PRECIOS.autolavado.limpieza_llantas;
  if (autolavado.aromatizante) subtotal += PRECIOS.autolavado.aromatizante;
  
  return subtotal;
}

function calcularSubtotalEstacionamiento(estacionamiento) {
  if (estacionamiento.tipo_tarifa === 'tiempo_completo') {
    return PRECIOS.estacionamiento.tiempo_completo;
  } else {
    const horas = estacionamiento.horas_estimadas || 1;
    return horas * PRECIOS.estacionamiento.por_hora;
  }
}

async function actualizarEstadoReserva(reservaId, estado, usuarioId) {
  const db = await connect();
  try {
    const sql = `
      UPDATE reservas 
      SET estado = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND usuario_id = ?
    `;
    const [result] = await db.execute(sql, [estado, reservaId, usuarioId]);
    
    if (result.affectedRows === 0) {
      return Promise.reject("Reserva no encontrada o no pertenece al usuario");
    }
    
    return Promise.resolve("Estado actualizado correctamente");
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    return Promise.reject("Error al actualizar estado de reserva");
  } finally {
    db.end();
  }
}

async function eliminarReserva(reservaId, usuarioId) {
  const db = await connect();
  try {
    const sql = "DELETE FROM reservas WHERE id = ? AND usuario_id = ?";
    const [result] = await db.execute(sql, [reservaId, usuarioId]);
    
    if (result.affectedRows === 0) {
      return Promise.reject("Reserva no encontrada o no pertenece al usuario");
    }
    
    return Promise.resolve("Reserva eliminada correctamente");
  } catch (error) {
    console.error("Error al eliminar reserva:", error);
    return Promise.reject("Error al eliminar reserva");
  } finally {
    db.end();
  }
}

async function obtenerReservasConfirmadas() {
  const db = await connect();
  try {
    const sql = `
      SELECT 
        r.*,
        u.nombre AS nombre_usuario,
        u.apellidos AS apellidos_usuario,
        v.placa,
        v.color,
        v.modelo,
        v.version,
        ra.lavado_exterior,
        ra.lavado_interior,
        ra.encerado,
        ra.aspirado,
        ra.limpieza_llantas,
        ra.aromatizante,
        ra.subtotal AS autolavado_subtotal,
        re.tipo_tarifa AS estacionamiento_tipo_tarifa,
        re.horas_estimadas AS estacionamiento_horas_estimadas,
        re.hora_salida AS estacionamiento_hora_salida,
        re.subtotal AS estacionamiento_subtotal
      FROM reservas r
      INNER JOIN usuario u ON r.usuario_id = u.id
      INNER JOIN vehiculos v ON r.vehiculo_id = v.id
      LEFT JOIN reservas_autolavado ra ON r.id = ra.reserva_id
      LEFT JOIN reservas_estacionamiento re ON r.id = re.reserva_id
      WHERE r.estado = 'confirmada'
      ORDER BY r.created_at DESC
    `;
    const [rows] = await db.execute(sql);
    return Promise.resolve(rows);
  } catch (error) {
    console.error("Error al obtener reservas confirmadas:", error);
    return Promise.reject("Error al obtener reservas confirmadas");
  } finally {
    db.end();
  }
}

async function actualizarEstadoReservaComoEmpleado(reservaId, estado) {
  const db = await connect();
  try {
    const sql = `
      UPDATE reservas 
      SET estado = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    const [result] = await db.execute(sql, [estado, reservaId]);
    if (result.affectedRows === 0) {
      return Promise.reject("Reserva no encontrada");
    }
    return Promise.resolve("Estado actualizado correctamente");
  } catch (error) {
    console.error("Error al actualizar estado (empleado):", error);
    return Promise.reject("Error al actualizar estado de reserva");
  } finally {
    db.end();
  }
}



export default {
  obtenerReservasPorUsuario,
  crearReserva,
  actualizarEstadoReserva,
  eliminarReserva,
  obtenerReservasConfirmadas,
  actualizarEstadoReservaComoEmpleado,
  
};