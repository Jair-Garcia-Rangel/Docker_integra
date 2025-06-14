import "rootpath"; 
import express from "express"; 
import cors from "cors"; 
import morgan from "morgan"; 
import bodyParser from "body-parser"; 
//Archivos de configuracion propios 
import config from "./middlewares/config.mjs"; 
import errorHandler from "./middlewares/error-handler.mjs"; 

// Controladores
import UsuarioController from "./controllers/usuario.controller.mjs";
import VehiculoController from "./controllers/vehiculos.controller.mjs"; // NUEVO
import dotenv from 'dotenv';
import ReservaController from "./controllers/reservas.controller.mjs";

// se instancia el servidor 
const app = express(); 
dotenv.config();

//libreria en tiempo de desarrollo para poder ver el tipo de peticion que te estan mandando 
app.use(morgan("dev")); 
app.use(bodyParser.urlencoded({ extended: false })); 
app.use(bodyParser.json()); 
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'usuario_id'],
  credentials: true,
})); 

//se establecen las rutas
app.use("/usuario", UsuarioController);
app.use("/vehiculos", VehiculoController); // NUEVA RUTA
app.use("/reservas", ReservaController);


app.use(errorHandler); 

// inicia el servidor 
app.listen(config.PORT, function () { 
  console.log("Server listening on port ", config.PORT); 
});
