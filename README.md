# CloudJudge: Scalable Distributed Code Execution & Evaluation Platform

> **A Cloud-Native Distributed Systems Mini Project**  
> *Final Year B.Tech Computer Engineering Regulations*  
> *Demonstrating Scalability, Inter-Service Communication, Docker & Kubernetes Orchestration*

---

## 1. Executive Summary

**CloudJudge** is an industrial-grade distributed code execution, sandboxing, and evaluation platform inspired by LeetCode, HackerRank, and AWS Lambda. Untrusted code (JavaScript, Python) submitted by users is causally ordered via **Lamport Logical Clocks**, buffered through an asynchronous **Distributed Message Queue**, dispatched to a cluster of isolated **Execution Worker Nodes**, evaluated against test suites with strict CPU/memory limits, and monitored via a **gRPC Coordinator** implementing the **Beacon Protocol for Failure Detection**.

The system is fully containerized with **Docker & Docker Compose** and includes complete **Kubernetes (K8s)** manifests featuring a **Horizontal Pod Autoscaler (HPA)** that dynamically scales worker pods from 2 to 10 replicas under peak load.

---

## 2. Distributed Systems Syllabus Mapping

| Syllabus Unit | Concept Implemented | Implementation in CloudJudge |
| :--- | :--- | :--- |
| **Unit I: Introduction & Architecture** | Distributed Computing Model, Virtualization & Sandboxing | Microservice architecture with decoupled ingress, queuing, sandboxed worker pool, and coordinator. |
| **Unit II: Communication** | **Remote Procedure Call (RPC)** | **gRPC & Protocol Buffers (`judge.proto`)** between Worker nodes and Coordinator for high-speed binary telemetry. |
| | **Message-Oriented Communication** | Asynchronous FIFO Task Queue (Redis Streams / PubSub) for decoupled buffering and burst absorption. |
| | **Stream-Oriented / WebSockets** | Real-time WebSocket event streaming from API Gateway to browser clients. |
| | **Fault Tolerance** | At-least-once task delivery; automatic failure recovery when worker nodes crash. |
| **Unit III: Synchronization** | **Lamport Logical Clocks** | Submissions and worker reports carry monotonically increasing Lamport timestamps ($L = \max(L, L_{msg}) + 1$) to enforce causal order. |
| | **Beacon Protocol** | Worker nodes transmit periodic heartbeats every 2000ms. If inactive $> 5000\text{ms}$, the Coordinator flags the node as `DEAD`. |
| | **Distributed Mutual Exclusion** | Execution slot leasing ensuring single-task sandbox isolation per worker core. |
| **Unit IV: Emerging Paradigms** | **Serverless / FaaS Workers** | Ephemeral, stateless task execution workers. |
| | **Containerization & Orchestration** | **Docker Compose** multi-container mesh and **Kubernetes** deployment with **HPA (Horizontal Pod Autoscaler)**. |

---

## 3. High-Level Architecture & Topology

```mermaid
flowchart TD
    Client["Browser Client / React Web App<br>(Port 3000)"]
    Gateway["API Gateway & Ingress<br>Express + Socket.IO (Port 4000)<br>Lamport Clock Stamping"]
    Queue["Distributed Task Queue<br>Redis Streams / Memory Queue<br>(Port 6379)"]

    subgraph WorkerCluster ["Worker Cluster (Scalable Replicas)"]
        W1["Worker Node 1<br>Sandboxed Executor"]
        W2["Worker Node 2<br>Sandboxed Executor"]
        W3["Worker Node 3<br>Sandboxed Executor"]
    end

    Coordinator["Coordinator & Failure Detector<br>gRPC: 50051 | HTTP Admin: 4001<br>Beacon Protocol Monitor"]

    Client <-->|REST Submissions & WebSockets| Gateway
    Gateway -->|Enqueue Task (At-Least-Once)| Queue
    Queue -->|Pop Task / Lease| W1
    Queue -->|Pop Task / Lease| W2
    Queue -->|Pop Task / Lease| W3

    W1 -.->|gRPC Heartbeat & Telemetry| Coordinator
    W2 -.->|gRPC Heartbeat & Telemetry| Coordinator
    W3 -.->|gRPC Heartbeat & Telemetry| Coordinator

    W1 -->|Deliver Verdict| Gateway
    W2 -->|Deliver Verdict| Gateway
    W3 -->|Deliver Verdict| Gateway
```

---

## 4. Repository Structure

```
cloudjudge-distributed-system/
├── docker-compose.yml          # Multi-container orchestration (7 services)
├── package.json                # Project launcher & automation scripts
├── proto/
│   └── judge.proto             # Protocol Buffers schema (gRPC)
├── services/
│   ├── api-gateway/            # Ingress, REST API, WebSocket broadcaster, Lamport Clock
│   ├── coordinator-service/    # gRPC server, Beacon Protocol failure detector
│   ├── worker-service/         # Stateless code runner with sandbox isolation
│   └── frontend/               # Interactive React + Tailwind web dashboard
├── k8s/                        # Production Kubernetes manifests
│   ├── 00-namespace.yaml       # cloudjudge namespace
│   ├── 01-redis.yaml           # Redis message broker deployment & service
│   ├── 02-coordinator.yaml     # gRPC coordinator deployment & service
│   ├── 03-api-gateway.yaml     # Gateway deployment & service
│   ├── 04-worker.yaml          # Worker deployment with resource limits
│   ├── 05-worker-hpa.yaml      # Horizontal Pod Autoscaler (2 -> 10 pods)
│   ├── 06-frontend.yaml        # Web dashboard deployment & NodePort
│   └── 07-ingress.yaml         # NGINX Ingress controller configuration
└── scripts/
    ├── install-all.js          # One-click dependency installer across all services
    ├── start-local.js          # Multi-process distributed launcher (zero-Docker mode)
    ├── load-test.js            # High-concurrency traffic generator
    └── create-zip.js           # Automated packaging utility
```

---

## 5. Deployment Options

### Option A: Local Multi-Process Mode (No Docker Required)
*Ideal for rapid testing, demonstrations, or machines without Docker installed.*

1. **Install Dependencies:**
   ```bash
   npm run install:all
   ```
2. **Launch the Distributed Cluster:**
   ```bash
   npm start
   ```
   *This launches the Coordinator (`:50051`, `:4001`), API Gateway (`:4000`), 3 autonomous Worker nodes (`worker-node-1`, `worker-node-2`, `worker-node-3`), and the React Frontend (`:3000`).*
3. Open `http://localhost:3000` in your browser.

---

### Option B: Docker Compose Deployment
*Demonstrates containerization and multi-container network isolation.*

1. **Build and start the complete cluster:**
   ```bash
   docker-compose up --build
   ```
2. **Access Points:**
   * **Frontend Web Dashboard:** `http://localhost:3000`
   * **API Gateway:** `http://localhost:4000`
   * **Coordinator HTTP API:** `http://localhost:4001`
   * **Coordinator gRPC:** `localhost:50051`
   * **Redis Cache:** `localhost:6379`

3. **Scale Workers Dynamically:**
   ```bash
   docker-compose up --scale worker-1=5 -d
   ```

4. **Stop the cluster:**
   ```bash
   docker-compose down
   ```

---

### Option C: Kubernetes (K8s) Cluster Deployment
*Demonstrates container orchestration, self-healing, and Horizontal Pod Autoscaling.*

1. **Prerequisites:** Ensure Minikube, Kind, Docker Desktop Kubernetes, or a cloud K8s cluster (GKE, EKS, AKS) is running.
2. **Enable Metrics Server (for HPA):**
   ```bash
   minikube addons enable metrics-server
   ```
3. **Deploy all manifests:**
   ```bash
   kubectl apply -f k8s/
   ```
4. **Verify Pods and Services:**
   ```bash
   kubectl get pods -n cloudjudge -o wide
   kubectl get svc -n cloudjudge
   kubectl get hpa -n cloudjudge
   ```
5. **Access the Web Dashboard:**
   * **Via Minikube Service:**
     ```bash
     minikube service frontend -n cloudjudge
     ```
   * **Or via Port Forwarding:**
     ```bash
     kubectl port-forward svc/frontend -n cloudjudge 3000:3000
     kubectl port-forward svc/api-gateway -n cloudjudge 4000:4000
     ```

---

## 6. How to Demonstrate for Examination / Viva

1. **Demonstrating Causality (Lamport Logical Clocks):**
   * Submit solutions for *Two Sum* and *Palindrome Number*.
   * Point out the **Lamport Timestamp column ($L$)** in the Submissions Ledger. Notice how every client submission and worker execution monotonically ticks the clock regardless of physical time differences.

2. **Demonstrating Scalability & Queue Buffering:**
   * Click **"Burst 20 Tasks (Heavy Spike)"** in the Scalability Panel.
   * Observe the **Queue Buffer** spike up to 20.
   * Watch Worker Node 1, 2, and 3 process the tasks concurrently in parallel, smoothly draining the queue to 0 without dropping any requests.

3. **Demonstrating Fault Tolerance (Beacon Protocol):**
   * In the Worker Nodes list, click **"Inject Fault (Kill Node)"** on `worker-node-2`.
   * Watch the Coordinator detect missed heartbeats after 5000ms.
   * The node transitions to `DEAD` in red, and an alert is broadcasted on the terminal stream.
   * Tasks remain protected and are processed by remaining healthy nodes.

4. **Demonstrating Kubernetes Autoscaling (HPA):**
   * Run the CLI load testing script:
     ```bash
     npm run load-test
     ```
   * In another terminal, observe Kubernetes auto-scaling:
     ```bash
     kubectl get hpa worker-hpa -n cloudjudge --watch
     ```
   * Watch Kubernetes spin up additional worker replicas from 2 to 5+ to handle the surge!

---

## 7. Packaging and Submission

To generate a clean `.zip` archive containing all source files, configurations, and manifests (excluding `node_modules` and cache):
```bash
npm run zip
```
The archive will be generated at `cloudjudge-distributed-system.zip`.
