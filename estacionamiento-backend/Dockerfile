FROM node:18

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos del backend
COPY . .

# Instalar dependencias
RUN npm install

# Exponer el puerto que usas (ej: 3000)
EXPOSE 3000

# Comando para correr tu app
CMD ["node", "./src/index.mjs"]
