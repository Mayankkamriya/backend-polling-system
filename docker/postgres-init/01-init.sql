-- PostgreSQL initialization script for Polling API
-- This script runs when the PostgreSQL container is first created

-- Create database (if not exists)
SELECT 'CREATE DATABASE polling_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'polling_db')\gexec

-- Connect to the polling database
\c polling_db;

-- Create extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Set timezone
SET timezone = 'UTC';

-- Create indexes for better performance (will be created by Prisma migrations, but good to have)
-- These will be ignored if tables don't exist yet

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE polling_db TO polling_user;
GRANT ALL ON SCHEMA public TO polling_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO polling_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO polling_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO polling_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO polling_user;

-- Log successful initialization
SELECT 'PostgreSQL database initialized successfully for Polling API' AS status;
