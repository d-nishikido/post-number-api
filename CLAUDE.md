# CLAUDE.md - Project Guidelines for Claude

## Project Overview
This is a Postal Code API (post-number-api) project that provides a RESTful API to retrieve address information based on postal codes in Japan. The system imports data from Japan Post's public CSV file (utf_ken_all.csv) and stores it in a PostgreSQL database for fast retrieval.

## Project Structure
- `/input/` - Input directory for data files
- `/docs/` - Documentation including design documents and CSV data
  - `address_api_design_doc.md` - Comprehensive design document
  - `utf_ken_all.csv` - Japan Post postal code data

## Technology Stack
- **Language**: TypeScript 5.0+
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Database**: PostgreSQL 15+
- **Container**: Docker 24+ with Docker Compose 2.0+
- **Reverse Proxy**: Nginx 1.24+

## API Endpoints
Base URL: `https://api.example.com/v1`

| Method | Path | Description |
|---|---|---|
| GET | /health | Health check |
| GET | /address/:zipcode | Search by postal code |
| GET | /address/search | Search by address |

## Database Schema
### addresses table
- id (SERIAL, PRIMARY KEY)
- zipcode (VARCHAR(7), NOT NULL) - 7-digit postal code
- prefecture (VARCHAR(50), NOT NULL) - Prefecture name
- city (VARCHAR(100), NOT NULL) - City/ward/town name
- town (VARCHAR(200), NULL) - Town area name
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### import_logs table
- id (SERIAL, PRIMARY KEY)
- filename (VARCHAR(255), NOT NULL)
- import_date (TIMESTAMP, NOT NULL)
- record_count (INTEGER, NOT NULL)
- status (VARCHAR(20), NOT NULL)

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow existing code conventions
- Use parameterized queries to prevent SQL injection
- Implement proper error handling with appropriate HTTP status codes

### Testing Strategy
- **Unit Tests**: Jest (run on commit)
- **Integration Tests**: Supertest (run on PR)
- **Performance Tests**: k6 (run before deployment)
- **Security Tests**: OWASP ZAP (weekly)

### Performance Requirements
- Response time: < 100ms (95th percentile)
- Concurrent connections: 1000
- Throughput: 1000 req/sec

### Security Measures
- SQL injection prevention through parameterized queries
- Rate limiting: 100 req/min/IP
- HTTPS enforcement
- Input validation and sanitization

## Common Commands
```bash
# Development
npm install          # Install dependencies
npm run dev         # Start development server
npm run build       # Build TypeScript
npm test           # Run tests
npm run lint       # Run linter
npm run typecheck  # Type checking

# Docker
docker compose up -d    # Start all services
docker compose down     # Stop all services
docker compose logs -f  # View logs

# Database
npm run db:migrate     # Run migrations
npm run db:seed        # Import initial data
```

## CI/CD Pipeline
Git Push → Build → Test → Deploy to Staging → Test → Deploy to Production

## Important Notes
- Always validate postal code format (7 digits)
- Use ORM or parameterized queries for database operations
- Implement proper logging for access and errors
- Monitor performance metrics and error rates
- Follow Blue-Green deployment strategy
- Data source: Japan Post's utf_ken_all.csv (updated monthly)