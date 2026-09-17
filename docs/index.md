# Klaten Minisoccer — Documentation

> Complete developer documentation for the Klaten Minisoccer booking platform

---

## 📚 Documentation Index

### 🚀 Getting Started
- [Quick Start (5 min)](01-getting-started/quickstart.md) — Clone to running in 5 minutes
- [Prerequisites](01-getting-started/prerequisites.md) — Required tools & accounts
- [Local Development](01-getting-started/local-development.md) — Dev workflow, debugging
- [Troubleshooting](01-getting-started/troubleshooting.md) — Common issues & fixes

### 🏗️ Architecture
- [Overview](02-architecture/overview.md) — High-level system diagram
- [Data Flow](02-architecture/data-flow.md) — Booking → Payment → Invoice
- [Database Schema](02-architecture/database-schema.md) — ER diagram & tables
- [Authentication](02-architecture/authentication.md) — JWT, sessions, roles
- [ADRs](02-architecture/adr/) — Architecture Decision Records

### 📡 API Reference
- [OpenAPI Spec](03-api-reference/openapi.yaml) — Machine-readable spec
- [Admin API](03-api-reference/admin-api.md) — `/api/admin/*` endpoints
- [Public API](03-api-reference/public-api.md) — Booking, fields, payments
- [Webhooks](03-api-reference/webhooks.md) — Midtrans, Supabase

### 🎨 Frontend
- [Component Library](04-frontend/component-library.md) — All React components
- [Design System](04-frontend/design-system.md) — Tokens, colors, spacing
- [Routing](04-frontend/routing.md) — App Router structure
- [State Management](04-frontend/state-management.md) — Server/client components
- [Styling Guide](04-frontend/styling-guide.md) — Tailwind v4, CSS variables

### ⚙️ Backend
- [Prisma Guide](05-backend/prisma-guide.md) — Schema, migrations, seeding
- [Auth Service](05-backend/services/auth-service.md) — JWT, bcrypt, sessions
- [Payment Service](05-backend/services/payment-service.md) — Midtrans integration
- [Booking Engine](05-backend/services/booking-engine.md) — Slot logic, conflicts
- [Notifications](05-backend/services/notification-service.md) — Email, Resend
- [Audit Log](05-backend/services/audit-log.md) — Activity tracking

### ☁️ Infrastructure
- [Deployment](06-infrastructure/deployment.md) — Vercel, Supabase, CI/CD
- [Environment](06-infrastructure/environment.md) — All env vars
- [CI/CD](06-infrastructure/ci-cd.md) — GitHub Actions workflows
- [Monitoring](06-infrastructure/monitoring.md) — Analytics, logs, alerts
- [Security](06-infrastructure/security.md) — CSP, rate limit, auth

### 🧪 Testing
- [Unit Testing](07-testing/unit-testing.md) — Jest, React Testing Library
- [Integration Testing](07-testing/integration-testing.md) — API route tests
- [E2E Testing](07-testing/e2e-testing.md) — Playwright (planned)
- [Test Data](07-testing/test-data.md) — Fixtures, factories

### 🛠️ Operations
- [Runbook](08-operations/runbook.md) — Incident response, common tasks
- [Backup/Restore](08-operations/backup-restore.md) — Supabase, Prisma
- [Scaling](08-operations/scaling.md) — Vercel limits, Supabase pooling
- [Rollback](08-operations/rollback.md) — Vercel, DB migrations

### 🤝 Contributing
- [Contributing Guide](../CONTRIBUTING.md) — PR process, code style
- [Code Style](09-contributing/code-style.md) — ESLint, Prettier, TS
- [Git Workflow](09-contributing/git-workflow.md) — Branches, commits
- [Release Process](09-contributing/release-process.md) — Versioning, deploy

### 📖 Reference
- [Glossary](10-reference/glossary.md) — Domain terms
- [FAQ](10-reference/faq.md) — Common dev questions
- [Changelog](../AI_ACTIVITIES.md) — Version history

---

## 🔗 Quick Links

| Resource | Link |
|----------|------|
| **Repository** | [GitHub](https://github.com/bianprojj/klaten-international-minisoccer) |
| **Live Demo** | [klatenminisoccer.web.id](https://klatenminisoccer.web.id) |
| **API Docs** | [docs/api/README.md](api/README.md) |
| **TypeDoc** | [Generated API Docs](api/) |
| **Issues** | [GitHub Issues](https://github.com/bianprojj/klaten-international-minisoccer/issues) |

---

## 📄 Key Files

| File | Purpose |
|------|---------|
| `README.md` | Quick start, setup, troubleshooting |
| `SYSTEM.md` | Architecture, flows, env, database |
| `DESIGN.md` | Design tokens, components, UI rules |
| `AI_ACTIVITIES.md` | Change log, decisions, history |
| `CONTRIBUTING.md` | PR process, code style, workflow |
| `prisma/schema.prisma` | Database schema |
| `next.config.ts` | Next.js config, headers, CSP |
| `middleware.ts` | Auth, rate limiting, redirects |

---

## 🏷️ Version

**Current**: v0.1.0  
**Last Updated**: 2026-09-18  
**Maintainers**: [@bianprojj](https://github.com/bianprojj)

---

> 📝 **Note**: This documentation is a living document. Update it alongside code changes. See [Contributing](../CONTRIBUTING.md#-documentation) for guidelines.