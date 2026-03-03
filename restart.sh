#!/bin/bash
set -e

WORKDIR="$(cd "$(dirname "$0")" && pwd)"
CLOUDFLARED="/tmp/cloudflared"
PORT=7788

echo "==> Stopping existing processes..."
pkill -f "uvicorn backend.main" 2>/dev/null && echo "    uvicorn stopped" || echo "    uvicorn not running"
pkill -f "cloudflared tunnel" 2>/dev/null && echo "    cloudflared stopped" || echo "    cloudflared not running"
sleep 1

echo "==> Starting uvicorn on port $PORT..."
cd "$WORKDIR"
nohup python3 -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT > /tmp/uvicorn.log 2>&1 &
UVICORN_PID=$!
echo "    PID $UVICORN_PID"

# Wait for uvicorn to be ready
for i in $(seq 1 10); do
  sleep 1
  if curl -s -o /dev/null http://localhost:$PORT/; then
    echo "    uvicorn ready"
    break
  fi
done

echo "==> Starting Cloudflare tunnel..."
if [ ! -f "$CLOUDFLARED" ]; then
  echo "    Downloading cloudflared..."
  curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o $CLOUDFLARED
  chmod +x $CLOUDFLARED
fi

nohup $CLOUDFLARED tunnel --url http://localhost:$PORT --no-autoupdate > /tmp/cloudflared.log 2>&1 &
CF_PID=$!
echo "    PID $CF_PID"

echo "==> Waiting for tunnel URL..."
for i in $(seq 1 20); do
  sleep 2
  URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/cloudflared.log 2>/dev/null | head -1)
  if [ -n "$URL" ]; then
    break
  fi
done

echo ""
echo "============================================"
echo "  Study URL:  $URL"
echo "  Data CSV:   $URL/api/results/csv?key=colorturingtest2025"
echo "  Summary:    $URL/api/results/summary?key=colorturingtest2025"
echo "============================================"
echo ""
echo "NOTE: Update Done.jsx share URL if this changed:"
echo "  STUDY_URL = '$URL'"
echo "  Then: cd frontend && npm run build"
