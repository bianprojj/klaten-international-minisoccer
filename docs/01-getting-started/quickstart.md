# Quick Start Guide

> **Target**: 5 menit dari clone ke running app

---

## 📋 Prerequisites Checklist

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org/) |
| pnpm (recommended) | 8+ | `npm i -g pnpm` |
| Git | 2.40+ | [git-scm.com](https://git-scm.com/) |
| Supabase CLI | latest | `npm i -g supabase` |
| Vercel CLI | latest | `npm i -g vercel` |

**Accounts needed:**
- [ ] GitHub
- [ ] Supabase (Postgres)
- [ ] Vercel
- [ ] Midtrans (Sandbox)
- [ ] Cloudinary
- [ ] Resend

---

## ⚡ 5-Minute Setup

### 1. Clone & Install (1 menit)

```bash
git clone https://github.com/bianprojj/klaten-international-minisoccer.git
cd klaten-international-minisoccer
pnpm install
```

### 2. Environment Setup (1 menit)

```bash
cp .env.example .env
```

Edit `.env` dengan credentials **development** Anda:

```env
# Database (Supabase local/dev)
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
DIRECT_URL="postgresql://postgres:postgres@localhost:54322/postgres"

# Auth
JWT_SECRET="dev-secret-change-in-production-min-32-chars"
ADMIN_EMAIL="admin@local.dev"
ADMIN_PASSWORD="admin123"

# Midtrans Sandbox
MIDTRANS_IS_PRODUCTION="false"
MIDTRANS_CLIENT_KEY="Mid-client-xxx"
MIDTRANS_SERVER_KEY="Mid-server-xxx"

# Cloudinary
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"

# Resend (optional for dev)
RESEND_API_KEY="re_xxx"
RESEND_FROM_EMAIL="dev@local.dev"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
```

### 3. Database Setup (1 menit)

```bash
# Option A: Supabase Local (recommended for dev)
supabase start
npm run prisma:generate
npm run prisma:db push
npm run prisma:seed

# Option B: Remote Supabase
# Update DATABASE_URL/DIRECT_URL di .env ke remote
npm run prisma:generate
npm run prisma:db push
npm run prisma:seed
```

### 4. Start Dev Server (30 detik)

```bash
pnpm dev
```

### 5. Verify (30 detik)

| URL | Expected |
|-----|----------|
| `http://localhost:3000` | Homepage dengan hero, features, gallery |
| `http://localhost:3000/book` | Booking form dengan time slots |
| `http://localhost:3000/superadmin/login` | Admin login page |

**Login Superadmin:**
- Email: `superadmin1@klatenminisoccer.id`
- Password: `SuperAdmin@123!`

---

## 🔧 Common Dev Tasks

### Database Operations

```bash
# Generate Prisma Client (after schema changes)
pnpm prisma:generate

# Push schema changes (dev only)
pnpm prisma:db push

# Create migration
pnpm prisma:migrate dev --name descriptive_name

# Open Prisma Studio
pnpm prisma:studio

# Reset database (careful!)
pnpm prisma:migrate reset
```

### Running Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

### Linting & Formatting

```bash
# Check
pnpm lint

# Auto-fix
pnpm lint -- --fix
```

### Build

```bash
# Production build
pnpm build

# Vercel build
pnpm vercel-build
```

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| `EPERM` error on Windows | Stop dev server (`Ctrl+C`), then rebuild |
| Prisma Client not found | Run `pnpm prisma:generate` |
| DB connection failed | Check Supabase is running (`supabase status`) |
| Midtrans webhook 404 | Check `MIDTRANS_NOTIFICATION_URL` in .env |
| CSP errors in console | Check `next.config.ts` CSP policy |

---

## 📚 Next Steps

- [Architecture Overview](../02-architecture/overview.md)
- [API Reference](../03-api-reference/admin-api.md)
- [Component Library](../04-frontend/component-library.md)
- [Deployment Guide](../06-infrastructure/deployment.md)