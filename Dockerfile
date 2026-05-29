FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies (no chromadb = no build-essential needed)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/main.py .

# Copy chroma_db SQLite file (used directly via sqlite3)
COPY backend/chroma_db/ ./chroma_db/

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
