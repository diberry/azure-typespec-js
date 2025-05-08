# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production stage
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only production dependencies and built files from builder stage
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Expose application port
EXPOSE 3000

# Switch to non-root user
USER appuser

# Start the application
CMD ["node", "dist/index.js"]