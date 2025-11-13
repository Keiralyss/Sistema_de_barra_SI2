# ---- Etapa 1: Construcción ----
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (usando npm ci si existe package-lock.json)
RUN npm ci

# Copiar el resto del proyecto y construir
COPY . .
RUN npm run build

# ---- Etapa 2: Servir con Nginx ----
FROM nginx:alpine AS production
# Borrar contenido por defecto de nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar el build desde la primera etapa
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
