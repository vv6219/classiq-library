@echo off
setlocal EnableDelayedExpansion
title Industrial Multi-Tier Cyber-Physical Warehouse 3D Digital Twin Simulator

echo ==============================================================================
echo   Starting Industrial Multi-Tier Warehouse 3D Digital Twin Simulator
echo   Classiq Quantum Co-Processor ^| Three.js Digital Twin ^| OpenTelemetry
echo ==============================================================================

set "ROOT_DIR=%~dp0"
set "APP_DIR=%ROOT_DIR%applications\logistics\vehicle_routing_problem"
set "VENV_PYTHON=c:\Users\vladimir.dobrouchkin\.gemini\antigravity-ide\scratch\classiq_env\Scripts\python.exe"

if exist "%VENV_PYTHON%" (
    set "PY_CMD=%VENV_PYTHON%"
) else (
    set "PY_CMD=python"
)

echo [*] Starting Backend Dispatch Engine REST API on port 8080...
start "DispatchEngine Backend API" /min cmd /c "cd /d "%APP_DIR%" && "%PY_CMD%" DispatchEngine\main.py --serve-api --port 8080"

timeout /t 2 /nobreak >nul

echo [*] Starting Vite Web Simulator on port 3000...
start "Vite Web Simulator" /min cmd /c "cd /d "%APP_DIR%\web_simulator" && npm run dev"

timeout /t 3 /nobreak >nul

echo [*] Opening Web Simulator in default browser...
start http://127.0.0.1:3000

echo ==============================================================================
echo   Simulator Active:
echo   - 3D Digital Twin & Quantum Studio: http://127.0.0.1:3000
echo   - Interactive REST API Swagger UI:  http://127.0.0.1:8080/docs
echo ==============================================================================
pause
