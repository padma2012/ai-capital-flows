FROM node:20-slim

WORKDIR /app

# Copy everything including pre-built dist and node_modules/better-sqlite3
COPY . .

# Install only the two lightweight runtime deps (no native compilation)
RUN npm install rss-parser dotenv --no-save --ignore-scripts

EXPOSE 5000

CMD ["node", "dist/index.cjs"]
