// aqui se realiza la conexion 
// libreria 
import mysql from "mysql2/promise"; 
 
async function connect() { 
    try { 
        const connection = await mysql.createConnection({ 
            host: "localhost", 
            user: "root", 
            password: "", 
            database: "pruebas", //nombre de la base de datos a la cual te estas conectando 
            charset: "utf8mb4" 
        }); 
 
        return connection; 
    } catch (error) { 
        console.error("Error al conectar a la base de datos:", 
error.message); 
        throw error; 
    } 
} 
 
export default connect;