FROM node:20-slim
# server.js shells out to curl for some CDN requests
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
# Cloud Run injects PORT (8080); server.js already reads process.env.PORT
ENV NODE_ENV=production
CMD ["node", "server.js"]
