#!/bin/bash

# Docker Setup Script for Polling API
# This script helps set up the development environment

set -e

echo "🐳 Setting up Docker environment for Polling API..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Function to use the correct docker compose command
docker_compose_cmd() {
    if command -v docker-compose &> /dev/null; then
        docker-compose "$@"
    else
        docker compose "$@"
    fi
}

print_status "Checking Docker daemon..."
if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running. Please start Docker."
    exit 1
fi

print_success "Docker is ready!"

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating .env file from .env.example..."
    cp .env.example .env
    print_warning "Please update .env file with your configuration before proceeding."
fi

# Parse command line arguments
case "${1:-start}" in
    "start"|"up")
        print_status "Starting Docker services..."
        docker_compose_cmd up -d postgres
        
        print_status "Waiting for PostgreSQL to be ready..."
        sleep 10
        
        # Wait for PostgreSQL to be healthy
        until docker_compose_cmd exec postgres pg_isready -U polling_user -d polling_db; do
            print_status "Waiting for PostgreSQL..."
            sleep 2
        done
        
        print_success "PostgreSQL is ready!"
        print_status "Database available at: localhost:5432"
        print_status "Database: polling_db"
        print_status "Username: polling_user"
        print_status "Password: polling_password"
        ;;
        
    "start-dev"|"dev")
        print_status "Starting development environment with all services..."
        docker_compose_cmd --profile dev up -d
        
        print_status "Waiting for services to be ready..."
        sleep 15
        
        print_success "Development environment is ready!"
        print_status "PostgreSQL: localhost:5432"
        print_status "PgAdmin: http://localhost:5050"
        print_status "  Email: admin@polling.local"
        print_status "  Password: admin123"
        print_status "Redis: localhost:6379"
        ;;
        
    "stop"|"down")
        print_status "Stopping Docker services..."
        docker_compose_cmd down
        print_success "Services stopped!"
        ;;
        
    "clean")
        print_warning "This will remove all containers, volumes, and data!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker_compose_cmd down -v --remove-orphans
            docker volume prune -f
            print_success "Environment cleaned!"
        else
            print_status "Operation cancelled."
        fi
        ;;
        
    "logs")
        print_status "Showing Docker logs..."
        docker_compose_cmd logs -f
        ;;
        
    "status")
        print_status "Docker services status:"
        docker_compose_cmd ps
        ;;
        
    "shell"|"psql")
        print_status "Connecting to PostgreSQL shell..."
        docker_compose_cmd exec postgres psql -U polling_user -d polling_db
        ;;
        
    "backup")
        print_status "Creating database backup..."
        mkdir -p backups
        BACKUP_FILE="backups/polling_db_$(date +%Y%m%d_%H%M%S).sql"
        docker_compose_cmd exec postgres pg_dump -U polling_user polling_db > "$BACKUP_FILE"
        print_success "Backup created: $BACKUP_FILE"
        ;;
        
    "restore")
        if [ -z "$2" ]; then
            print_error "Please provide backup file path: ./docker-setup.sh restore <backup_file>"
            exit 1
        fi
        print_status "Restoring database from $2..."
        docker_compose_cmd exec -T postgres psql -U polling_user -d polling_db < "$2"
        print_success "Database restored!"
        ;;
        
    "help"|"-h"|"--help")
        echo "🐳 Docker Setup Script for Polling API"
        echo ""
        echo "Usage: ./docker-setup.sh [command]"
        echo ""
        echo "Commands:"
        echo "  start, up       Start PostgreSQL service"
        echo "  start-dev, dev  Start all development services (PostgreSQL + PgAdmin + Redis)"
        echo "  stop, down      Stop all services"
        echo "  clean           Remove all containers and volumes (⚠️  destructive)"
        echo "  logs            Show service logs"
        echo "  status          Show service status"
        echo "  shell, psql     Connect to PostgreSQL shell"
        echo "  backup          Create database backup"
        echo "  restore <file>  Restore database from backup"
        echo "  help            Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./docker-setup.sh start"
        echo "  ./docker-setup.sh dev"
        echo "  ./docker-setup.sh backup"
        echo "  ./docker-setup.sh restore backups/polling_db_20231212_120000.sql"
        ;;
        
    *)
        print_error "Unknown command: $1"
        print_status "Use './docker-setup.sh help' for available commands"
        exit 1
        ;;
esac
