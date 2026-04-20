FROM node:20-slim

# Install build tools needed for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./

# Install all deps including rebuilding better-sqlite3 natively
RUN npm ci --ignore-scripts=false

# Copy the rest of the app (pre-built dist, data.db, etc.)
COPY . .

EXPOSE 5000

CMD ["node", "dist/index.cjs"]
