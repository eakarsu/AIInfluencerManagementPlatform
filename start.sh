#!/bin/bash

# AI Influencer Management Platform - Start Script
# This script sets up and starts the entire application

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║     AI Influencer Management Platform                ║"
echo "║     Starting Application...                          ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to kill process on a port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}Killing process on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    # Kill any remaining processes on our ports
    kill_port 3001
    kill_port 3000
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Step 1: Check for .env file
echo -e "${BLUE}[1/7] Checking environment configuration...${NC}"
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found. Creating default .env file...${NC}"
    cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/influencer_platform
JWT_SECRET=influencer-platform-secret-key-2024
OPENROUTER_API_KEY=your-openrouter-key-here
OPENROUTER_MODEL=anthropic/claude-haiku-4.5
BACKEND_PORT=3001
FRONTEND_PORT=3000
EOF
fi
echo -e "${GREEN}✓ Environment configuration ready${NC}"

# Step 2: Clean up ports
echo -e "${BLUE}[2/7] Cleaning up ports...${NC}"
kill_port 3000
kill_port 3001
echo -e "${GREEN}✓ Ports 3000 and 3001 are free${NC}"

# Step 3: Check PostgreSQL
echo -e "${BLUE}[3/7] Checking PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL client not found. Please install PostgreSQL.${NC}"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -q 2>/dev/null; then
    echo -e "${YELLOW}PostgreSQL is not running. Attempting to start...${NC}"
    if command -v brew &> /dev/null; then
        brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    fi
    sleep 2
    if ! pg_isready -q 2>/dev/null; then
        echo -e "${RED}Could not start PostgreSQL. Please start it manually.${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ PostgreSQL is running${NC}"

# Step 4: Create database if not exists
echo -e "${BLUE}[4/7] Setting up database...${NC}"
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'influencer_platform'" 2>/dev/null | grep -q 1 || \
    psql -U postgres -c "CREATE DATABASE influencer_platform" 2>/dev/null || \
    createdb influencer_platform 2>/dev/null || true
echo -e "${GREEN}✓ Database ready${NC}"

# Step 5: Install dependencies
echo -e "${BLUE}[5/7] Installing dependencies...${NC}"
echo -e "  Installing backend dependencies..."
cd "$SCRIPT_DIR/backend"
npm install --silent 2>&1 | tail -1
echo -e "  Installing frontend dependencies..."
cd "$SCRIPT_DIR/frontend"
npm install --silent 2>&1 | tail -1
cd "$SCRIPT_DIR"
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 6: Seed database
echo -e "${BLUE}[6/7] Seeding database with sample data...${NC}"
cd "$SCRIPT_DIR/backend"
node seed.js
cd "$SCRIPT_DIR"
echo -e "${GREEN}✓ Database seeded with sample data${NC}"

# Step 7: Start services with hot reload
echo -e "${BLUE}[7/7] Starting services with hot reload...${NC}"

# Start backend with nodemon for hot reload
echo -e "  Starting backend on port 3001..."
cd "$SCRIPT_DIR/backend"
npx nodemon server.js &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

# Wait for backend to be ready
sleep 2

# Start frontend with Vite (has built-in HMR)
echo -e "  Starting frontend on port 3000..."
cd "$SCRIPT_DIR/frontend"
npx vite --port 3000 --host &
FRONTEND_PID=$!
cd "$SCRIPT_DIR"

echo ""
echo -e "${PURPLE}╔══════════════════════════════════════════════════════╗"
echo -e "║  ${GREEN}Application is starting!${PURPLE}                            ║"
echo -e "║                                                      ║"
echo -e "║  ${BLUE}Frontend:${NC}  http://localhost:3000${PURPLE}                   ║"
echo -e "║  ${BLUE}Backend:${NC}   http://localhost:3001${PURPLE}                   ║"
echo -e "║                                                      ║"
echo -e "║  ${YELLOW}Login credentials:${PURPLE}                                  ║"
echo -e "║  ${NC}Email:    admin@influencer.io${PURPLE}                       ║"
echo -e "║  ${NC}Password: password123${PURPLE}                               ║"
echo -e "║  ${NC}(Use 'Quick Login' button to auto-fill)${PURPLE}             ║"
echo -e "║                                                      ║"
echo -e "║  ${YELLOW}Hot reload enabled - changes auto-refresh${PURPLE}           ║"
echo -e "║  ${NC}Press Ctrl+C to stop all services${PURPLE}                   ║"
echo -e "╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Wait for either process to exit
wait $BACKEND_PID $FRONTEND_PID
