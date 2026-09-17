# Contributing to Klaten Minisoccer

Terima kasih sudah berminat berkontribusi! Dokumentasi ini mengatur alur kerja, standar kode, dan proses pull request.

## 🚀 Quick Start

```bash
# 1. Fork repo ini
# 2. Clone fork Anda
git clone https://github.com/YOUR_USERNAME/klaten-international-minisoccer.git
cd klaten-international-minisoccer

# 3. Install dependencies
npm install

# 4. Setup environment
cp .env.example .env
# Edit .env dengan credentials development Anda

# 5. Setup database
npm run prisma:generate
npm run prisma:db push
npm run prisma:seed

# 6. Start development
npm run dev
```

## 📋 Development Workflow

### 1. Branch Naming

```
# Format: <type>/<short-description>
feature/add-payment-method
fix/booking-timezone-bug
docs/update-readme
refactor/prisma-schema
chore/update-dependencies
```

**Types:**
- `feature` — Fitur baru
- `fix` — Bug fix
- `docs` — Dokumentasi
- `refactor` — Refactoring tanpa perubahan fungsional
- `chore` — Maintenance, deps update, config
- `test` — Test coverage

### 2. Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Examples:**
```
feat(booking): add schedule slot price calculation
fix(auth): resolve bcrypt password verification
docs(readme): add troubleshooting section
refactor(prisma): remove native enums, use strings
```

### 3. Pull Request Process

1. **Create PR** dari branch feature ke `main`
2. **Fill PR template** (otomatis muncul)
3. **Wait for CI** — build, lint, tests harus pass
4. **Code review** — minimal 1 approval
5. **Merge** — squash and merge ke `main`

### 4. PR Requirements

- [ ] Semua test pass (`npm test`)
- [ ] Lint clean (`npm run lint`)
- [ ] Build success (`npm run build`)
- [ ] TypeScript strict mode pass
- [ ] Deskripsi PR jelas dan lengkap
- [ ] Update dokumentasi jika perlu
- [ ] No console.log/debugger di kode produksi

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Requirements

- **Unit tests** untuk logic baru di `lib/`
- **Integration tests** untuk API routes baru
- **Coverage target**: minimal 80% untuk `lib/` files
- **Test naming**: `*.test.ts` atau `*.test.tsx`

### Test Structure

```
tests/
├── unit/
│   ├── lib/
│   │   ├── booking-engine.test.ts
│   │   ├── payment-service.test.ts
│   │   └── validation.test.ts
├── integration/
│   ├── api/
│   │   ├── bookings.test.ts
│   │   └── payments.test.ts
└── fixtures/
    └── test-data.ts
```

## 🎨 Code Style

### TypeScript

- **Strict mode**: enabled (lihat `tsconfig.json`)
- **No `any`**: gunakan proper typing
- **Explicit returns** untuk exported functions
- **Interfaces > Types** untuk object shapes

### ESLint + Prettier

```bash
# Check linting
npm run lint

# Auto-fix
npm run lint -- --fix
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `booking-engine.ts` |
| Components | PascalCase | `BookingForm.tsx` |
| Functions | camelCase | `createBooking()` |
| Types/Interfaces | PascalCase | `BookingData` |
| Constants | UPPER_SNAKE | `MAX_RETRIES` |
| Enums | PascalCase | `BookingStatus` |

### React Components

- **Server Components** by default (App Router)
- **Client Components** hanya saat perlu (`'use client'`)
- **Props interface** di atas component
- **No default exports** untuk components

```tsx
// ✅ Good
interface BookingCardProps {
  booking: Booking;
  onCancel: (id: string) => void;
}

export function BookingCard({ booking, onCancel }: BookingCardProps) {
  return <div>...</div>;
}
```

## 🗄️ Database (Prisma)

### Schema Changes

1. Edit `prisma/schema.prisma`
2. Generate migration:
   ```bash
   npm run prisma:migrate dev --name descriptive_name
   ```
3. Review generated SQL di `prisma/migrations/`
4. Commit migration files

### Seeding

```bash
npm run prisma:seed
```

### Production Deploy

```bash
npm run prisma:deploy
```

## 🔒 Security Guidelines

- **Never commit secrets** — gunakan `.env` (gitignored)
- **Validate all inputs** — gunakan `sanitizeString()`, `sanitizeObject()`
- **Parameterized queries** — Prisma handles this automatically
- **Password hashing** — bcrypt (12 rounds), never SHA256/MD5
- **Rate limiting** — 10 req/5min untuk login endpoints
- **CSRF protection** — required untuk form mutations

## 📦 Dependencies

### Adding Dependencies

```bash
# Production
npm install package-name

# Development
npm install -D package-name
```

### Updating Dependencies

```bash
# Check outdated
npm outdated

# Update (patch/minor)
npm update

# Major updates — review breaking changes first
```

## 📝 Documentation

Update dokumentasi saat:
- Menambah endpoint API baru
- Mengubah schema database
- Menambah config/env baru
- Mengubah alur bisnis

Files to update:
- `README.md` — setup, troubleshooting
- `SYSTEM.md` — architecture, flows
- `DESIGN.md` — UI/UX changes
- `docs/` — detailed guides

## 🚢 Release Process

1. **Version bump** di `package.json` (semver)
2. **Changelog** update di `CHANGELOG.md`
3. **Tag release**: `git tag v1.2.3`
4. **Deploy** via Vercel (auto on merge to main)

## 🐛 Reporting Bugs

Gunakan [GitHub Issues](https://github.com/bianprojj/klaten-international-minisoccer/issues) dengan template:

```
**Deskripsi Bug**
Clear description

**Reproduksi**
1. Step 1
2. Step 2

**Expected Behavior**
What should happen

**Environment**
- OS: [e.g., Windows 11]
- Node: [e.g., 20.10.0]
- Browser: [e.g., Chrome 120]

**Logs/Screenshots**
```

## ✨ Feature Requests

Gunakan GitHub Issues dengan label `enhancement`. Include:
- Use case / problem
- Proposed solution
- Alternatives considered
- Mockups (jika UI)

## 📞 Getting Help

- **Discussions**: GitHub Discussions untuk pertanyaan umum
- **Discord/Slack**: [jika ada]
- **Email**: hello@klatenminisoccer.web.id

---

**Terima kasih sudah berkontribusi!** 🎉