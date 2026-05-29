FROM python:3.12-slim

WORKDIR /app

# Update CA certs
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Force TLS 1.2 — fixes MongoDB Atlas SSL handshake on Render's proxied network
# TLS 1.3 handshake extensions get mangled by Render's NAT/proxy
RUN printf '[openssl_init]\nssl_conf = ssl_sect\n\n[ssl_sect]\nsystem_default = system_default_sect\n\n[system_default_sect]\nMinProtocol = TLSv1.2\nMaxProtocol = TLSv1.2\nCipherString = HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK\n' \
    > /etc/ssl/openssl_mongo.cnf

ENV OPENSSL_CONF=/etc/ssl/openssl_mongo.cnf

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/main.py .

# Copy chroma_db SQLite file
COPY backend/chroma_db/ ./chroma_db/

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
