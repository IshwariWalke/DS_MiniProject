# PowerShell script to build all CloudJudge images locally for Kubernetes
$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Building CloudJudge Docker Images for Kubernetes" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "`n[1/4] Building Coordinator Image..." -ForegroundColor Yellow
docker build -t cloudjudge-coordinator:latest -f services/coordinator-service/Dockerfile .

Write-Host "`n[2/4] Building API Gateway Image..." -ForegroundColor Yellow
docker build -t cloudjudge-gateway:latest services/api-gateway

Write-Host "`n[3/4] Building Worker Node Image..." -ForegroundColor Yellow
docker build -t cloudjudge-worker:latest -f services/worker-service/Dockerfile .

Write-Host "`n[4/4] Building Frontend Dashboard Image..." -ForegroundColor Yellow
docker build -t cloudjudge-frontend:latest services/frontend

Write-Host "`n🎉 All 4 images built successfully! Ready for Kubernetes deployment." -ForegroundColor Green
Write-Host "Run: kubectl apply -f k8s/" -ForegroundColor Cyan
