# Klaten Minisoccer

Booking lapangan single-venue. Next.js 15 + Prisma + Supabase Postgres + Midtrans.

## Stack
- `Next.js 15.5.20`, `React 18.3.1`
- `Prisma 4.16.2`, Postgres Supabase
- `Midtrans` Snap, `Resend`, `Cloudinary`
- `Tailwind 4`, deploy `Vercel`

## Perintah
```bash
npm install
npm run dev
npm run build
npm run vercel-build
npm run ci:check-env
```

## Env
Lihat `.env.example`. Wajib: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `RESEND_API_KEY`.

Detail: `SYSTEM.md`
