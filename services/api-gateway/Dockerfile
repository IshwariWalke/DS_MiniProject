FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 4000

ENV PORT=4000 \
    COORDINATOR_HTTP=http://coordinator:4001 \
    REDIS_HOST=redis \
    REDIS_PORT=6379

CMD ["node", "src/index.js"]
