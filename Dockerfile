# FROM node:18-alpine AS deps

# # Install dependencies only when needed

# WORKDIR /app
# RUN apk add --no-cache libc6-compat
# COPY package*.json ./
# COPY tsconfig.json .env* ./
# COPY . .
# RUN npm install




# FROM node:18-alpine AS builder

# WORKDIR /app
# COPY --from=deps /app/src/ ./src/
# COPY --from=deps /app/node_modules ./node_modules
# COPY --from=deps /app/package*.json ./
# COPY --from=deps /app/tsconfig.json .env* ./
# COPY --from=deps /app/.env* ./
# COPY . .
# RUN npm run build




# FROM node:18-alpine AS runner

# WORKDIR /app

# COPY --from=deps /app/node_modules ./node_modules
# COPY --from=deps /app/package*.json ./
# COPY --from=deps /app/tsconfig.json .env* ./
# COPY --from=builder /app/dist ./dist/
# COPY --from=deps /app/.env* ./
# COPY . .

# EXPOSE 3000

# CMD ["node", "--env-file=.env", "dist/server.js"]













# FROM node:lts-alpine as deps

# # Install dependencies only when needed
# WORKDIR /app
# RUN apk add --no-cache libc6-compat
# COPY package*.json ./
# COPY tsconfig.json .env* ./
# COPY prisma ./prisma
# RUN npx prisma generate
# RUN npm ci
# COPY . .

# RUN npm run build

# EXPOSE 3000

# CMD ["node", "--env-file=.env", "dist/server.js"]

# ──────────────── BUILD STAGE ────────────────
FROM node:20-slim AS build

ENV PUPPETEER_SKIP_DOWNLOAD=true

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


# ──────────────── FINAL STAGE ────────────────
FROM node:20-slim

ENV PUPPETEER_SKIP_DOWNLOAD=true

WORKDIR /app

# Dependências necessárias pro Chromium funcionar
RUN apt-get update && apt-get install -y \
  chromium \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libx11-6 \
  libxcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxrandr2 \
  wget \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

COPY --from=build /app/dist ./dist
COPY package*.json ./
RUN npm install --omit=dev

# Caminho para o WhatsApp-Web.js encontrar o Chromium
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"

EXPOSE 3002
CMD ["node", "dist/server.js"]