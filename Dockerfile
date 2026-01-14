# --- Stage 1: Build Client ---
FROM node:current-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
ARG VITE_BASE_PATH
ENV VITE_BASE_PATH=$VITE_BASE_PATH
RUN npm run build

# --- Stage 2: Build Server ---
FROM node:current-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# --- Stage 3: Production ---
FROM node:current-alpine
WORKDIR /app

# Copy server built files
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/package*.json ./server/
COPY --from=server-build /app/server/node_modules ./server/node_modules

# Copy client built files to server's public directory
# Note: The server expects static files in ../public relative to dist/index.js
# So we place them in /app/server/public
COPY --from=client-build /app/client/dist ./server/public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start server
WORKDIR /app/server
CMD ["node", "dist/index.js"]
