# SOP Manager

SOP Manager is a multi-tenant SaaS web application for creating, managing, approving, and tracking Standard Operating Procedures (SOPs) across departments. Built with Next.js 16, MongoDB, and NextAuth.js.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4, Headless UI, Heroicons
- **Backend**: Next.js API Routes (Route Handlers)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js (Credentials Provider) with bcrypt password hashing

## Prerequisites

- Node.js 20.9+ (LTS)
- MongoDB (local or Atlas)

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your MONGODB_URI and NEXTAUTH_SECRET
   ```

3. **Seed the database**
   ```bash
   npm run seed
   ```
   Creates default admin user (username: `admin`, password: `admin`), 8 departments, and 8 role definitions.

4. **Run development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Migration from SopMaster-1 (SQLite)

To migrate existing data from SopMaster-1:

```bash
# Dry run (no writes)
npm run migrate -- --dry-run

# Full migration (requires SQLite path)
SQLITE_PATH=/path/to/SopMaster-1/sop.db npm run migrate
# Or: npm run migrate -- /path/to/sop.db
```

## Default Login

- **Username**: admin
- **Password**: admin
- **Role**: Super Admin (full access)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run seed` - Seed database with default data
- `npm run migrate` - Migrate from SopMaster-1 SQLite
