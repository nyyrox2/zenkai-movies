FROM node:20-slim
# server.js shells out to curl for some CDN requests
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production PORT=7860
EXPOSE 7860
CMD ["node", "server.js"]
