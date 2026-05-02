#!/bin/bash

# Ensure we exit if something fails initially
set -e

echo "====================================================="
echo " Starting AI-Powered Terraform Architect             "
echo "====================================================="

# Check if .venv exists
if [ ! -d ".venv" ]; then
    echo "Error: Python virtual environment (.venv) not found."
    echo "Please set it up using: python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# 1. Start the Python FastAPI Backend in the background
echo "-> Starting Python backend on http://127.0.0.1:8000..."
source .venv/bin/activate
python -m uvicorn backend.api:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# 2. Start the Next.js Frontend in the background
echo "-> Starting Next.js frontend (npm run dev)..."
npm run dev &
FRONTEND_PID=$!

# Trap Ctrl+C (SIGINT) to cleanly shut down both servers
trap "echo -e '\nShutting down servers...'; kill $BACKEND_PID 2>/dev/null; kill $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

echo "====================================================="
echo " Servers are running!                                "
echo " - Next.js UI: http://localhost:3000                 "
echo " - Python API: http://127.0.0.1:8000                 "
echo " Press Ctrl+C to stop both servers.                  "
echo "====================================================="

# Wait for all background jobs to finish (keeps the script alive)
wait
