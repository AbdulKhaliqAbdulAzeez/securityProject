#!/bin/bash

# Ensure we exit if something fails initially
set -e

echo "====================================================="
echo " Starting AI-Powered Terraform Architect             "
echo "====================================================="

# 1. Validation: Virtual Environment
if [ ! -d ".venv" ]; then
    echo "Error: Python virtual environment (.venv) not found."
    echo "Please set it up using: python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# 2. Validation: Environment Variables
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. AI features may use fallback values."
    if [ -f ".env.example" ]; then
        echo "Consider copying .env.example to .env and adding your GOOGLE_API_KEY."
    fi
fi

# 3. Validation: Node Modules
if [ ! -d "node_modules" ]; then
    echo "Warning: node_modules not found. Running npm install..."
    npm install
fi

# 3. Validation: Port Conflicts
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

if check_port 8001; then
    echo "Error: Port 8001 (Python API) is already in use."
    echo "Try: lsof -i :8001 and kill the process before restarting."
    exit 1
fi

# 4. Cleanup Next.js lock (prevents "Unable to acquire lock" errors)
if [ -f ".next/dev/lock" ]; then
    echo "-> Clearing stale Next.js dev lock..."
    rm -f .next/dev/lock
fi

# 5. Start Backend
echo "-> Starting Python backend on http://127.0.0.1:8001..."
source .venv/bin/activate
python -m uvicorn backend.api:app --reload --host 127.0.0.1 --port 8001 &
BACKEND_PID=$!

# 6. Start Frontend
echo "-> Starting Next.js frontend (npm run dev)..."
npm run dev &
FRONTEND_PID=$!

# Trap Ctrl+C (SIGINT) to cleanly shut down both servers
cleanup() {
    echo -e "\nShutting down servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    # Clean up any orphaned processes in this shell's process group
    pkill -P $$ 2>/dev/null || true
    exit
}

trap cleanup SIGINT SIGTERM

echo "====================================================="
echo " Servers are running!                                "
echo " - Next.js UI: http://localhost:3003                 "
echo " - Python API: http://127.0.0.1:8001                 "
echo " Press Ctrl+C to stop both servers.                  "
echo "====================================================="

# Wait for all background jobs to finish
wait
