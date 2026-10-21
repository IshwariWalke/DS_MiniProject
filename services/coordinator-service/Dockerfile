FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY src ./src
COPY ../../proto ./proto

EXPOSE 4001 50051

ENV HTTP_PORT=4001 \
    GRPC_PORT=50051 \
    PROTO_PATH=/app/proto/judge.proto

CMD ["node", "src/index.js"]
