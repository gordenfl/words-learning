#!/bin/bash

# Words Learning App - Quick Start Script

echo "========================================="
echo "  Words Learning App - Quick Start"
echo "========================================="
echo ""

# Check if Docker is installed
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "✓ Docker detected"
    echo ""
    echo "Choose how to start the application:"
    echo "1) Docker (recommended - includes database)"
    echo "2) Local development"
    read -p "Enter choice [1-2]: " choice
    
    if [ "$choice" == "1" ]; then
        echo ""
        echo "Starting with Docker..."
        docker-compose up -d
        echo ""
        echo "✓ Services started!"
        echo ""
        echo "Backend API: http://localhost:3000"
        echo "Health check: http://localhost:3000/api/health"
        echo ""
        echo "To view logs: docker-compose logs -f"
        echo "To stop: docker-compose down"
        exit 0
    fi
fi

# Local development setup
echo ""
echo "Starting local development setup..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found. Please install Node.js 16+ first."
    exit 1
fi
echo "✓ Node.js $(node -v)"

# Check MongoDB
if ! command -v mongod &> /dev/null && ! pgrep -x mongod > /dev/null; then
    echo "⚠ MongoDB not found or not running"
    echo "Please install and start MongoDB:"
    echo "  macOS: brew install mongodb-community && brew services start mongodb-community"
    echo "  Linux: sudo apt install mongodb && sudo systemctl start mongod"
    echo "  Windows: Download from https://www.mongodb.com/try/download/community"
    read -p "Press Enter if MongoDB is already running, or Ctrl+C to exit..."
fi

# Install backend dependencies
if [ ! -d "backend/node_modules" ]; then
    echo ""
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Create .env if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo ""
    echo "Creating backend/.env file..."
    cat > backend/.env << EOF
PORT=3000
MONGODB_URI=mongodb://localhost:27017/words-learning
JWT_SECRET=$(openssl rand -base64 32)
EOF
    echo "✓ Environment file created"
fi

# Start backend
echo ""
echo "Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

echo ""
echo "========================================="
echo "  Backend started successfully!"
echo "========================================="
echo ""
echo "Backend API: http://localhost:3000"
echo "Health check: http://localhost:3000/api/health"
echo ""
echo "To start the mobile app:"
echo "  1. Open a new terminal"
echo "  2. cd mobile"
echo "  3. npm install (first time only)"
echo "  4. npm start"
echo ""
echo "Press Ctrl+C to stop the backend server"
echo ""

# Wait for Ctrl+C
wait $BACKEND_PID

