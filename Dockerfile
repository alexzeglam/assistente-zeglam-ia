FROM node:22-alpine



WORKDIR /app



# Instalar dependências de build

RUN apk add --no-cache python3 make g++



# Copiar package files

COPY package.json pnpm-lock.yaml ./



# Instalar pnpm e dependências

RUN npm install -g pnpm && pnpm install --frozen-lockfile



# Copiar código

COPY . .



# Build

RUN pnpm run build



# Remover arquivos desnecessários

RUN rm -rf /app/client/src /app/server/*.ts /app/drizzle



# Variáveis de ambiente

ENV NODE_ENV=production



EXPOSE 3000



CMD ["node", "dist/server/_core/index.js"]
