# Build stage

FROM node:22-alpine AS builder



WORKDIR /app



# Instalar dependências do build

RUN apk add --no-cache python3 make g++



# Copiar package files

COPY package.json pnpm-lock.yaml ./



# Instalar dependências

RUN npm install -g pnpm && pnpm install --frozen-lockfile



# Copiar código

COPY . .



# Build

RUN pnpm run build



# Runtime stage

FROM node:22-alpine



WORKDIR /app



# Instalar apenas o Chromium necessário para Playwright

RUN apk add --no-cache chromium



# Copiar node_modules do builder

COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/client/dist ./client/dist

COPY --from=builder /app/package.json ./package.json



# Variáveis de ambiente para Playwright

ENV NODE_ENV=production

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true

ENV PLAYWRIGHT_BROWSERS_PATH=/app/.cache/ms-playwright



# Criar diretório de cache

RUN mkdir -p /app/.cache/ms-playwright



# Criar symlink para Chromium do sistema

RUN mkdir -p /app/.cache/ms-playwright/chromium-1228/chrome-linux64 && \

    ln -s /usr/bin/chromium /app/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome || true
    


EXPOSE 3000



CMD ["node", "dist/server/_core/index.js"]


