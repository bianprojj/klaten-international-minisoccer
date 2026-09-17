# Klaten Minisoccer

Booking lapangan single-venue. Next.js 15 + Prisma + Supabase Postgres + Midtrans.

## Stack

- `Next.js 15.5.20`, `React 18.3.1`
- `Prisma 4.16.2`, Postgres Supabase
- `Midtrans` Snap, `Resend`, `Cloudinary`
- `Tailwind 4`, deploy `Vercel`

## Perintah

```bash
# Install dependencies
npm install

# Development server (localhost:3000)
npm run dev

# Production build
npm run build

# Vercel production build
npm run vercel-build

# Environment validation
npm run ci:check-env

# Database operations
npm run prisma:generate      # Generate Prisma Client
npm run prisma:migrate       # Run migrations (dev)
npm run prisma:deploy        # Deploy migrations (prod)
npm run prisma:studio        # Open Prisma Studio
npm run prisma:seed          # Seed database

# Testing
npm test                     # Run all tests
npm run test:watch           # Watch mode
npm run test:coverage        # Coverage report

# Linting
npm run lint                 # Run ESLint
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm/npm/yarn
- Supabase account (Postgres)
- Vercel account (deployment)
- Midtrans account (payment)
- Cloudinary account (media)
- Resend account (email)

### 1. Clone & Install

```bash
git clone https://github.com/bianprojj/klaten-international-minisoccer.git
cd klaten-international-minisoccer
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your credentials (see Environment section below)
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database (development)
npm run prisma:db push

# Or run migrations (production)
npm run prisma:migrate deploy

# Seed initial data
npm run prisma:seed
```

### 4. Start Development

```bash
npm run dev
# Open http://localhost:3000
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

### Required (Production)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Supabase pooled connection | `postgresql://user:pass@host:6543/db?pgbouncer=true` |
| `DIRECT_URL` | Supabase direct connection | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT signing secret (32+ chars) | `openssl rand -base64 32` |
| `MIDTRANS_SERVER_KEY` | Midtrans server key | `Mid-server-xxx` |
| `MIDTRANS_CLIENT_KEY` | Midtrans client key | `Mid-client-xxx` |
| `RESEND_API_KEY` | Resend API key | `re_xxx` |

### Required (Public/Client)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Production URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `MIDTRANS_CLIENT_KEY` | Midtrans client key |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `INVOICE_PDF_ENGINE` | `classic` | `classic` or `legacy` |
| `RATE_LIMIT_MAX` | `60` | Requests per window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Window in ms |
| `ADMIN_EMAIL` | `admin@klatenminisoccer.id` | Default admin email |
| `ADMIN_PASSWORD` | `admin123` | Default admin password |

See `.env.example` for complete list.

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── admin/        # Admin endpoints (protected)
│   │   ├── auth/         # Authentication
│   │   ├── bookings/     # Public booking
│   │   └── payments/     # Payment webhooks
│   ├── (auth)/           # Auth pages (login)
│   ├── admin/            # Superadmin panel
│   ├── manager/          # Manager panel
│   ├── staff/            # Staff panel
│   ├── book/             # Public booking page
│   └── checkout/         # Payment checkout
├── components/           # React components
├── lib/                  # Core business logic
│   ├── admin-auth.ts     # Admin authentication
│   ├── booking-engine.ts # Booking logic
│   ├── payment-service.ts# Payment processing
│   ├── security.ts       # JWT, CSRF, crypto
│   └── prisma.ts         # Prisma client
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── seed.js           # Seed script
│   └── migrations/       # Migration history
├── public/               # Static assets
└── tests/                # Jest tests
```

## Default Admin Accounts

After seeding, these accounts are created:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin1@klatenminisoccer.id` | `SuperAdmin@123!` |
| Manager | `manager1@klatenminisoccer.id` | `Manager@123!` |
| Staff | `staff@klatenminisoccer.id` | `Staff@123!` |

**⚠️ Change passwords on first login!** The system enforces password change for default accounts.

## Admin Panels

- **Superadmin**: `/superadmin` — Full access (users, settings, reports)
- **Manager**: `/manager` — Bookings, payments, fields, content
- **Staff**: `/staff` — View bookings, payments only

## Deployment (Vercel)

1. Connect repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy — Vercel auto-detects Next.js
4. Configure custom domain in Vercel settings

### Required Vercel Env Vars

All variables from `.env` **except** local-only ones.

### Build Command

```bash
prisma generate && next build
```

## Database (Supabase)

### Connection Pooling

- **Pooled (6543)**: `DATABASE_URL` — for application queries
- **Direct (5432)**: `DIRECT_URL` — for migrations

### Migrations

```bash
# Development
npm run prisma:migrate dev --name migration_name

# Production
npm run prisma:migrate deploy
```

### Backup

Supabase provides automated daily backups. For manual backup:

```bash
pg_dump -h <host> -U postgres -d postgres > backup.sql
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Test Structure

```
tests/
├── unit/               # Unit tests (lib functions)
├── integration/        # API route tests
└── fixtures/           # Test data
```

## Common Issues & Troubleshooting

### Prisma Client Not Generated

```bash
npm run prisma:generate
# If EPERM error on Windows, stop dev server first
```

### EPERM Error on Windows (Prisma Lock)

```bash
# Stop dev server, then build
# The query_engine-windows.dll.node gets locked by running process
```

### Database Connection Failed

1. Check `DATABASE_URL` format
2. Verify Supabase project is active (not paused)
3. Check IP allowlist in Supabase dashboard
4. Verify pooled vs direct URL usage

### Build Fails on Vercel

1. Check all env vars are set in Vercel dashboard
2. Verify `prisma generate` runs in build command
3. Check Node.js version compatibility

### Midtrans Webhook Not Receiving

1. Verify `MIDTRANS_NOTIFICATION_URL` matches deployed URL
2. Check Supabase logs for webhook processing
3. Verify Midtrans server key matches environment

### Image Upload Fails (Cloudinary)

1. Verify `CLOUDINARY_URL` format: `cloudinary://api_key:api_secret@cloud_name`
2. Check file size limit (10MB max)
3. Verify allowed mime types: JPEG, PNG, WebP, GIF, BMP

### Email Not Sending (Resend)

1. Verify `RESEND_API_KEY` starts with `re_`
2. Check `RESEND_FROM_EMAIL` domain is verified in Resend
3. Check Resend dashboard for delivery status

### CSP Errors in Console

1. Check `next.config.ts` CSP policy includes required domains
2. Midtrans, Google Analytics, Supabase, Cloudinary must be whitelisted
3. Use `next dev` to see CSP violations in console

## Scripts Reference

| Script | Description |
|--------|-------------|
| `dev` | Start dev server |
| `build` | Production build (prisma generate + next build) |
| `start` | Start production server |
| `vercel-build` | Vercel build (prisma generate + next build) |
| `test` | Run Jest tests |
| `lint` | Run ESLint |
| `ci:check-env` | Validate required env vars |
| `prisma:generate` | Generate Prisma Client |
| `prisma:migrate` | Run migrations (dev) |
| `prisma:deploy` | Deploy migrations (prod) |
| `prisma:studio` | Open Prisma Studio |
| `prisma:seed` | Seed database |

## Security Features

- **Password Hashing**: bcrypt (12 rounds)
- **Rate Limiting**: 10 req/5min per IP (login)
- **Account Lockout**: 5 failed attempts = 15 min lockout
- **CSRF Protection**: HMAC-SHA256 tokens
- **Security Headers**: CSP, HSTS, X-Frame-Options, etc.
- **Password Complexity**: 8+ chars, upper, lower, number, special
- **Force Password Reset**: First login for default accounts

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License — see LICENSE file for details.

## Support

- **Issues**: GitHub Issues
- **Documentation**: See `SYSTEM.md`, `DESIGN.md`, `AI_ACTIVITIES.md`
- **Architecture**: See `docs/` folder (in progress)