# ==========================================
# Stage 1: Builder
# ==========================================
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies (gcc and libpq-dev are needed to compile packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Create a virtual environment so we can cleanly copy it later
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies into the virtual environment
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ==========================================
# Stage 2: Final / Production
# ==========================================
FROM python:3.12-slim

WORKDIR /app

# Install ONLY the runtime dependency (libpq5), not the heavy development headers
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy the compiled virtual environment from the builder stage
COPY --from=builder /opt/venv /opt/venv

# Ensure the virtual environment is used
ENV PATH="/opt/venv/bin:$PATH"

# Copy the actual application code
COPY . .

EXPOSE 8000

# Consider running as a non-root user for better security
# RUN useradd -m appuser && chown -R appuser /app
# USER appuser

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]