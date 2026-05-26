# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.ts ./server.ts

# We need ts-node and typescript in production to run the custom server
# unless we pre-compile it. For simplicity on RPi, we'll keep it or use a compiled version.
# Let's add a build step for the server too for better performance.
RUN npm install -g ts-node typescript

EXPOSE 3000

CMD ["npm", "run", "dev"] 
# Note: Using 'dev' here because it runs the ts-node server.ts which we need.
# In a more polished version, we'd compile server.ts to server.js.
