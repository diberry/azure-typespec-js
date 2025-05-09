# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./

# Create the tsp-output/server directory structure
RUN mkdir -p tsp-output/server

# Copy server package.json 
COPY tsp-output/server/package*.json ./tsp-output/server/

# Install dependencies
RUN npm i --force --no-package-lock
RUN cd tsp-output/server && npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN cd tsp-output/server && npm run build

#---------------------------------------------------------------

# Stage 2: Runtime stage
FROM node:18-alpine AS runtime

# Set NODE_ENV to production for better performance
ENV NODE_ENV=production

WORKDIR /app

# Copy only the server package files
COPY tsp-output/server/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy all necessary files from the builder stage
# This includes the compiled JavaScript, any static assets, etc.
COPY --from=builder /app/tsp-output/server/dist ./dist
COPY --from=builder /app/tsp-output/server/src/generated ./dist/src/generated

# Set default port and expose it
ENV PORT=3000
EXPOSE 3000

# Run the application
CMD ["npm", "start"]