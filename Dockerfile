FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM python:3.11-slim
WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
COPY image_samples/ ./image_samples/
COPY tutorial/ ./tutorial/
COPY manifest.json .

# HF Spaces runs as user 1000; ensure /data is writable for SQLite
RUN mkdir -p /data && chmod 777 /data

EXPOSE 7860

# PORT is injected by HF Spaces (7860); falls back to 8080 elsewhere
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
