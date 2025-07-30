# Claude Code Project Context

## Project Overview

This is a **Post Number API** project - a RESTful API service that provides Japanese address information based on postal codes (zip codes). The project is built with a modern containerized architecture using Docker.

## Tech Stack

- **Backend**: Node.js 18+ with TypeScript and Express.js
- **Database**: PostgreSQL 15+ with full-text search capabilities
- **Reverse Proxy**: Nginx 1.24+ with rate limiting and security headers
- **Containerization**: Docker with Docker Compose
- **Development Tools**: ESLint, Prettier, Jest, Nodemon
- **Data Source**: Japanese Postal Service CSV data (`utf_ken_all.csv`)

## Project Structure

```
post-number-api/
├── src/                    # TypeScript source code
│   ├── config/            # Configuration management
│   ├── controllers/       # Route controllers (future)
│   ├── middlewares/       # Express middlewares
│   ├── models/           # Data models (future)
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic (future)
│   └── utils/            # Utility functions
├── tests/                 # Test files
├── scripts/              # Utility scripts (CSV import)
├── migrations/           # Database migrations (future)
├── nginx/                # Nginx configuration files
├── postgres/             # PostgreSQL initialization scripts
├── docker-compose.yml    # Production Docker Compose
├── docker-compose.override.yml # Development overrides
└── Dockerfile           # Multi-stage Node.js container
```

## Development Commands

```bash
# Development server with hot reload
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test

# Type checking
npm run typecheck

# Linting (uses legacy ESLint config)
npm run lint
npm run lint:fix

# Code formatting
npm run format
```

## Docker Commands

```bash
# Start development environment
docker compose up -d

# View logs
docker compose logs -f app

# Stop environment
docker compose down

# Reset environment (removes volumes)
docker compose down -v

# Access application container
docker compose exec app sh

# Access database
docker compose exec db psql -U postgres -d post_number_api_dev
```

## Database Schema

### `addresses` table
- `id` (SERIAL PRIMARY KEY)
- `zipcode` (VARCHAR(7)) - 7-digit postal code
- `prefecture` (VARCHAR(50)) - Prefecture name
- `city` (VARCHAR(100)) - City name  
- `town` (VARCHAR(200)) - Town/district name (nullable)
- `created_at`, `updated_at` (TIMESTAMP)

### `import_logs` table
- Tracks CSV import operations
- Records filename, date, count, and status

## API Endpoints (Current)

- `GET /health` - Health check endpoint with database monitoring
- `GET /v1` - API information endpoint

## Planned API Endpoints (From Design Doc)

- `GET /v1/address/:zipcode` - Get address by postal code
- `GET /v1/address/search` - Search addresses with filters

## Environment Variables

Key environment variables (see `.env.example`):
- `NODE_ENV` - Environment (development/production)
- `PORT` - Application port (default: 3000)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database config
- `LOG_LEVEL` - Logging level (debug/info/warn/error)

## CSV Data Import

To import Japanese postal code data:
1. Place `utf_ken_all.csv` in the `docs/` directory
2. Run: `./scripts/import-csv.sh` or `docker-compose exec app ./scripts/import-csv.sh`

## Testing

- **Framework**: Jest with TypeScript support
- **Current tests**: Health check endpoint tests, database connection tests
- **Coverage**: Run `npm run test:coverage`
- **Test files**: Located in `tests/` directory
- **Mocking**: Database operations are mocked for testing

## Code Quality

- **ESLint**: Configured with TypeScript and Prettier integration
- **Prettier**: Code formatting with 2-space indentation
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **Git hooks**: Not yet configured (potential improvement)

## Known Issues & Workarounds

1. **ESLint v9**: Currently using legacy config with `ESLINT_USE_FLAT_CONFIG=false` flag
2. **Docker Compose**: README mentions both `docker-compose` and `docker compose` commands

## Development Status

✅ **Completed:**
- Docker environment setup
- Basic Express application structure
- Database initialization scripts
- Development tooling configuration
- Documentation
- Database connection layer with initialization and health monitoring
- Application lifecycle management (startup/shutdown)
- Health check endpoint with database monitoring

🚧 **TODO/Next Steps:**
- Create address search endpoints
- Add rate limiting middleware  
- Implement comprehensive error handling
- Add API documentation (OpenAPI/Swagger)
- Set up CI/CD pipeline
- Add more comprehensive tests

## Git Workflow

- **Main branch**: `main`
- **Feature branches**: `feature-{issue-number}` (e.g., `feature-8`)
- **Current branch**: `feature-8` (Database connection layer implementation)

## Deployment

The project supports multiple deployment environments:
- **Development**: Uses `docker-compose.override.yml` for hot reloading
- **Production**: Uses optimized Docker builds with multi-stage Dockerfile
- **Environment configs**: `.env.example` and `.env.production.example`

## Performance Considerations

- Database indexes on `zipcode`, `prefecture`, and `city` columns
- Nginx caching and compression enabled
- Connection pooling configured for PostgreSQL
- Rate limiting: 100 requests/minute per IP

## Security

- Helmet.js for security headers
- CORS configuration
- SQL injection prevention (parameterized queries)
- Non-root user in Docker containers
- Environment variable management for secrets