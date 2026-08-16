# ============================================
# Salifz Backend - Dockerfile
# ============================================

FROM node:18-alpine

# Metadata
LABEL maintainer="Salifz Team"
LABEL version="3.0.0"

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

# Expose port
EXPOSE 8088

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8088/api/v1/health || exit 1

# Start command
CMD ["node", "index.js"]
