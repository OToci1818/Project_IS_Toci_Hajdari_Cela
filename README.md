# Project Toci Hajdari Cela

Software Engineering Project - Web Application

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Prisma ORM with SQLite
- **HTTP Client**: Axios
- **Container**: Docker

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Docker (optional)

### Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Docker

```bash
# Development with hot reload
docker-compose up dev

# Production build
docker-compose up app
```

## Project Structure

```
src/
├── app/              # Next.js App Router
│   ├── api/          # API routes
│   └── page.tsx      # Pages
├── components/       # React components
├── lib/              # Utilities (prisma, axios)
└── types/            # TypeScript types
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio

## Authors

Toci, Hajdari, Cela
