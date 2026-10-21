const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = process.env.PROTO_PATH || path.join(__dirname, '../../../proto/judge.proto');
const COORDINATOR_GRPC = process.env.COORDINATOR_GRPC || 'localhost:50051';

class GrpcJudgeClient {
  constructor() {
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    });
    const judgeProto = grpc.loadPackageDefinition(packageDefinition).judge;
    this.client = new judgeProto.JudgeCoordinator(
      COORDINATOR_GRPC,
      grpc.credentials.createInsecure()
    );
  }

  sendHeartbeat(data) {
    return new Promise((resolve, reject) => {
      this.client.SendHeartbeat(data, (err, response) => {
        if (err) return reject(err);
        resolve(response);
      });
    });
  }

  reportExecution(data) {
    return new Promise((resolve, reject) => {
      this.client.ReportExecutionResult(data, (err, response) => {
        if (err) return reject(err);
        resolve(response);
      });
    });
  }
}

module.exports = GrpcJudgeClient;
