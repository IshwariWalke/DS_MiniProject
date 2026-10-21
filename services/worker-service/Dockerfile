FROM node:20-alpine

# Install Python for multi-language execution sandbox
RUN apk add --no-cache python3

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY src ./src
COPY ../../proto ./proto

ENV API_GATEWAY_URL=http://api-gateway:4000 \
    COORDINATOR_GRPC=coordinator:50051 \
    PROTO_PATH=/app/proto/judge.proto

CMD ["node", "src/index.js"]
