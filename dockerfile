# ---- Etapa 1: Builder ----
# Instala dependencias y compila el código TypeScript
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---- Etapa 2: Producción ----
# Crea la imagen final y ligera que se ejecutará en Render
FROM node:20-alpine AS production
WORKDIR /usr/src/app
# Copia el código compilado y el package.json desde la etapa anterior
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./
# Instala solo las dependencias de producción
RUN npm install --omit=dev
# Comando para iniciar la aplicación
CMD ["node", "dist/main"]
