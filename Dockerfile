# Use a stable Python base
FROM python:3.10-slim

# Install system dependencies for face_recognition (dlib) and OpenCV
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    libboost-python-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create persistent directories
RUN mkdir -p faces instance

# Expose the port Railway uses
EXPOSE 5000

# Run the app with Gunicorn
# Using --timeout 120 because face-recognition can be heavy
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--timeout", "120", "app:app"]
