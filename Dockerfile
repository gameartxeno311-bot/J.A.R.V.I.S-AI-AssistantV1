FROM node:24-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY tsconfig.json ./
COPY src ./src
COPY public ./public

RUN npm run build
RUN mkdir -p /data /app/workspace

ENV NODE_ENV=production
ENV PORT=10000
ENV DATABASE_PATH=/data/jarvis.sqlite
ENV ALLOWED_FILESYSTEM_ROOTS=/app/workspace

EXPOSE 10000

CMD ["node", "dist/server.js"]
