# CMMC Compliance Tracker

A web application for tracking NIST 800-171 compliance and generating System Security Plans (SSP) for CMMC (Cybersecurity Maturity Model Certification) Level 2 certification.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)

## Features

### Dashboard
- **SPRS Score Gauge** - Visual representation of your Supplier Performance Risk System score (-203 to 110)
- **Compliance Donut Chart** - At-a-glance view of implementation status across all practices
- **Control Family Heatmap** - Color-coded grid showing compliance by family (AC, AT, AU, etc.)
- **Level Progress Bars** - Track Level 1 vs Level 2 practice completion
- **POA&M Summary** - Quick view of open, in-progress, and delayed action items
- **Overdue Alerts** - Highlighted list of POA&Ms past their due date
- **Dark Mode** - Toggle between light and dark themes

### Practice Management
- Browse all 110 NIST 800-171 practices organized by control family
- Filter by CMMC Level (1 or 2) and assessment status
- Detailed view for each practice with:
  - Full description and discussion text
  - Assessment status tracking (Not Started, In Progress, Implemented, N/A)
  - Implementation statement editor with template loading
  - POA&M creation and tracking
  - Evidence file uploads

### System Security Plan (SSP) Generation
- **System Info Page** - Configure organization details, key personnel, system architecture, and CUI types
- **Template-Assisted Statements** - Pre-written implementation templates for all Level 1 practices
- **SSP Preview** - Review statistics and warnings before generating
- **Word Export** - Generate formatted .docx documents with:
  - System identification section
  - Control implementation details by family
  - POA&M summary table

### POA&M Management
- Create and track Plans of Action & Milestones
- Priority levels (Low, Medium, High, Critical)
- Status tracking (Open, In Progress, Completed, Delayed, Cancelled)
- Milestone tracking with due dates
- Filter and sort capabilities

### Reports
- SPRS score calculation with gap analysis
- Compliance breakdown by control family
- Exportable reports (print, Word document)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18, React Router 6 |
| Backend | Node.js, Express |
| Database | PostgreSQL 15 |
| ORM | Prisma |
| Document Generation | docx |
| Containerization | Docker |
| CI/CD | GitHub Actions |

## Quick Start with Docker

The easiest way to run the application is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/clucraft/cmmc.git
cd cmmc

# Start all services
docker-compose up -d

# The application will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:5000
```

### Using Pre-built Images

Docker images are automatically built and published to GitHub Container Registry:

```bash
# Pull the latest images
docker pull ghcr.io/clucraft/cmmc/client:latest
docker pull ghcr.io/clucraft/cmmc/server:latest
```

## Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE cmmc;
CREATE USER cmmc WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cmmc TO cmmc;
```

2. Set the database URL environment variable:
```bash
export DATABASE_URL="postgresql://cmmc:your_password@localhost:5432/cmmc"
```

### Server Setup

```bash
cd server

# Install dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Seed the database with NIST 800-171 practices
npm run db:seed

# Start the development server
npm run dev
```

### Client Setup

```bash
cd client

# Install dependencies
npm install

# Start the development server
npm start
```

## Environment Variables

### Server
| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment (development/production) | development |

### Client
| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | Auto-detected |

## API Endpoints

### Practices
- `GET /api/practices` - List all practices
- `GET /api/practices/:id` - Get practice details
- `PUT /api/assessments/:practiceId` - Update assessment

### POA&Ms
- `GET /api/poams` - List all POA&Ms
- `POST /api/poams` - Create POA&M
- `PUT /api/poams/:id` - Update POA&M
- `DELETE /api/poams/:id` - Delete POA&M

### Evidence
- `POST /api/practices/:id/evidence` - Upload evidence file
- `GET /api/evidence/:id/download` - Download evidence file
- `DELETE /api/evidence/:id` - Delete evidence

### Reports
- `GET /api/reports/sprs-score` - Get SPRS score and gaps
- `GET /api/reports/compliance-by-family` - Get compliance by family
- `GET /api/dashboard/stats` - Get dashboard statistics

### System Security Plan
- `GET /api/system-info` - Get system information
- `PUT /api/system-info` - Update system information
- `GET /api/ssp/preview` - Preview SSP data and warnings
- `GET /api/ssp/generate/docx` - Generate SSP Word document

## Project Structure

```
cmmc/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   │   ├── Dashboard.js
│   │   │   ├── Practices.js
│   │   │   ├── PracticeDetail.js
│   │   │   ├── POAMs.js
│   │   │   ├── Reports.js
│   │   │   └── SystemInfo.js
│   │   ├── App.js         # Main app with routing
│   │   └── index.css      # Global styles
│   └── Dockerfile
├── server/                 # Express backend
│   ├── src/
│   │   ├── index.js       # API routes
│   │   └── seed.js        # Database seeder
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── migrations/    # Database migrations
│   └── Dockerfile
├── docker-compose.yml      # Docker orchestration
└── .github/
    └── workflows/
        └── docker-publish.yml  # CI/CD pipeline
```

## Database Schema

### Core Models
- **ControlFamily** - 14 NIST 800-171 control families
- **Practice** - 110 security practices with implementation templates
- **Assessment** - Status and implementation statements per practice
- **POAM** - Plans of Action & Milestones with milestones
- **Evidence** - Uploaded artifacts linked to practices
- **SystemInfo** - Organization and system details for SSP

## Deployment

### Unraid / Self-Hosted

1. Create a `docker-compose.yml` with the configuration from this repo
2. Update passwords and ports as needed
3. Run `docker-compose up -d`

### Updating

```bash
# Pull latest images
docker-compose pull

# Restart services
docker-compose up -d

# Run any new migrations (if needed)
docker-compose exec server npx prisma migrate deploy
```

## CMMC & NIST 800-171 Reference

This application tracks compliance with:
- **NIST SP 800-171 Rev 2** - Protecting Controlled Unclassified Information in Nonfederal Systems
- **CMMC 2.0** - Cybersecurity Maturity Model Certification
  - Level 1: 17 practices (basic cyber hygiene)
  - Level 2: 110 practices (full NIST 800-171)

### SPRS Scoring

The Supplier Performance Risk System (SPRS) score ranges from -203 (no implementation) to 110 (full compliance). Each unimplemented practice deducts points based on its security weight.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- NIST for the 800-171 framework
- DoD for CMMC requirements
- The open source community
