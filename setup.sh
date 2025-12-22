#!/bin/bash

# 🚀 LenDen Quick Setup Script
# This script will set up the entire project automatically

echo "🔐 LenDen - Secure User Profile & Access Control System"
echo "================================================="
echo ""

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$MAJOR_VERSION" -lt 16 ]; then
    print_error "Node.js version $NODE_VERSION is not supported. Please install Node.js 16+ and try again."
    exit 1
fi

print_status "Node.js version $NODE_VERSION is compatible"

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    print_warning "MongoDB is not running. Please start MongoDB before proceeding."
    print_info "Start MongoDB with: sudo systemctl start mongod"
    print_info "Or using Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest"
fi

# Setup Backend
print_info "Setting up backend..."
cd backend

if [ ! -f "package.json" ]; then
    print_error "Backend package.json not found. Make sure you're in the correct directory."
    exit 1
fi

# Install backend dependencies
print_info "Installing backend dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install backend dependencies"
    exit 1
fi

print_status "Backend dependencies installed successfully"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_info "Creating backend .env file..."
    cat > .env << EOL
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/lenden
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRE=24h
ENCRYPTION_SECRET=$(openssl rand -hex 16)
CLIENT_URL=http://localhost:3000
BCRYPT_ROUNDS=12
DEBUG=true
EOL
    print_status "Backend .env file created with secure random secrets"
else
    print_warning "Backend .env file already exists - skipping creation"
fi

# Setup Frontend
print_info "Setting up frontend..."
cd ../frontend

if [ ! -f "package.json" ]; then
    print_error "Frontend package.json not found. Make sure you're in the correct directory."
    exit 1
fi

# Install frontend dependencies
print_info "Installing frontend dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install frontend dependencies"
    exit 1
fi

print_status "Frontend dependencies installed successfully"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_info "Creating frontend .env file..."
    cat > .env << EOL
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_APP_NAME=LenDen
REACT_APP_VERSION=1.0.0
EOL
    print_status "Frontend .env file created"
else
    print_warning "Frontend .env file already exists - skipping creation"
fi

# Go back to root directory
cd ..

# Create start script
print_info "Creating convenient start scripts..."

cat > start-dev.sh << 'EOL'
#!/bin/bash
echo "🚀 Starting LenDen in development mode..."

# Function to kill background processes on script exit
cleanup() {
    echo "Stopping development servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "Starting frontend server..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "🎉 Development servers started!"
echo "Backend API: http://localhost:3001/api"
echo "Frontend App: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for background processes
wait
EOL

chmod +x start-dev.sh

cat > test-all.sh << 'EOL'
#!/bin/bash
echo "🧪 Running all tests..."

echo "Testing backend..."
cd backend
npm test

echo ""
echo "Testing frontend..."
cd ../frontend
npm test -- --coverage --watchAll=false

echo ""
echo "✅ All tests completed!"
EOL

chmod +x test-all.sh

print_status "Convenient scripts created:"
print_info "  • ./start-dev.sh - Start both backend and frontend"
print_info "  • ./test-all.sh - Run all tests"

# Final setup completion
echo ""
echo "🎉 Setup completed successfully!"
echo ""
print_status "Next steps:"
echo "  1. Start MongoDB (if not already running)"
echo "  2. Run: ./start-dev.sh"
echo "  3. Open http://localhost:3000 in your browser"
echo ""
print_info "For manual setup:"
echo "  Backend: cd backend && npm run dev"
echo "  Frontend: cd frontend && npm start"
echo ""
print_warning "Make sure MongoDB is running before starting the application!"
echo ""
echo "📖 Check README.md for detailed documentation"