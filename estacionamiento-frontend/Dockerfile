FROM node:18

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos
COPY . .

# Instalar dependencias y compilar el frontend
RUN npm install
RUN npm run build

# Servir el build con Nginx
FROM nginx:stable-alpine
COPY --from=0 /app/dist /usr/share/nginx/html

# Exponer el puerto del servidor
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
