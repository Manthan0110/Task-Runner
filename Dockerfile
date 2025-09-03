# Use Python 3.11 (not 3.13)
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system deps (for psycopg2, cryptography, etc.)
RUN apt-get update && apt-get install -y \
    gcc libpq-dev build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for caching)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Expose port
EXPOSE 8000

# Run FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--app-dir", "api"]
