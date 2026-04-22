# --- Stage 1: Build Environment ---
FROM node:24-alpine AS builder
WORKDIR /app

# Handle build-time environment variables for the client
ARG VITE_BASE_PATH
ENV VITE_BASE_PATH=$VITE_BASE_PATH

# Copy workspace configuration and package manifests
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build client and server using workspaces
# Vite build for client, TSC for server
RUN npm run build -w client
RUN npm run build -w server

# --- Stage 2: Production Dependencies ---
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
RUN npm ci --omit=dev -w server

# --- Stage 3: Final Production Image ---
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy built server files
COPY --from=builder /app/server/dist ./server/dist
# Copy built client files to server's public directory
COPY --from=builder /app/client/dist ./server/public

# The server expects to be run from inside the server directory
WORKDIR /app/server
EXPOSE 3000

CMD ["node", "dist/index.js"]
