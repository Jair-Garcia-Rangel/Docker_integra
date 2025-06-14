import connect from "../middlewares/db.mjs";

async function crearCliente(usuario, contrasenia) {
  const db = await connect();
  try {
    const sql = "INSERT INTO cliente (usuario, contrasenia) VALUES (?, ?)";
    const [result] = await db.execute(sql, [usuario, contrasenia]);
    return Promise.resolve("Cliente creado correctamente");
  } catch (error) {
    console.error("Error en crearCliente:", error);
    return Promise.reject("Error al crear cliente");
  } finally {
    db.end();
  }
}

export default {
  crearCliente,
};
