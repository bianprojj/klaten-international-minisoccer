import Link from "next/link";
import { AdminSummary } from "@/lib/admin-dashboard";
import { AuthenticatedAdmin } from "@/lib/admin-auth";

export default function AdminDashboard({
  admin,
  summary,
}: {
  admin: AuthenticatedAdmin;
  summary: AdminSummary;
}) {
  // Quick access removed: RBAC provides in-page CRUD/viewer access for each role.

  return (
    <main className="flex-1 overflow-x-clip px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <div className="rounded-2xl border border-white/10 bg-[color:var(--surface-strong)] p-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">Admin dashboard</p>
              <h1 className="mt-2 text-balance text-2xl font-semibold leading-tight text-[color:var(--foreground)] sm:text-3xl">Dashboard</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Authenticated session active
                </span>
              </div>
              <nav aria-label="Admin sections" className="mt-4 flex flex-wrap gap-2">
                {admin.permissions.canReadFields || admin.permissions.canManageFields ? (
                  <a href="#schedule-slots" className="rounded-full bg-white/5 px-3 py-1 text-sm text-[color:var(--foreground)] hover:bg-white/10">Fields</a>
                ) : null}
                {admin.role !== "staff" && (admin.permissions.canReadBookings || admin.permissions.canManageBookings) ? (
                  <a href="#bookings" className="rounded-full bg-white/5 px-3 py-1 text-sm text-[color:var(--foreground)] hover:bg-white/10">Bookings</a>
                ) : null}
                {admin.role !== "staff" && (admin.permissions.canReadPayments || admin.permissions.canManagePayments) ? (
                  <a href="#payments" className="rounded-full bg-white/5 px-3 py-1 text-sm text-[color:var(--foreground)] hover:bg-white/10">Payments</a>
                ) : null}
                {admin.permissions.canReadInvoices ? (
                  <a href="#invoices" className="rounded-full bg-white/5 px-3 py-1 text-sm text-[color:var(--foreground)] hover:bg-white/10">Invoices</a>
                ) : null}
                {admin.permissions.canReadReviews ? (
                  <a href="#reviews" className="rounded-full bg-white/5 px-3 py-1 text-sm text-[color:var(--foreground)] hover:bg-white/10">Reviews</a>
                ) : null}
                {admin.permissions.canManageSettings ? (
                  <a href="#settings" className="rounded-full bg-white/5 px-3 py-1 text-sm text-[color:var(--foreground)] hover:bg-white/10">Settings</a>
                ) : null}
                {admin.permissions.canManageSchedule ? (
                  <a href="#schedule-slots" className="rounded-full bg-white/5 px-3 py-1 text-sm text-[color:var(--foreground)] hover:bg-white/10">Schedule slots</a>
                ) : null}
                {admin.permissions.canManageAdmins ? (
                  <a href="#users" className="rounded-full bg-white/5 px-3 py-1 text-sm text-[color:var(--foreground)] hover:bg-white/10">Admin users</a>
                ) : null}
                {admin.permissions.canViewReports && admin.role === "super_admin" ? (
                  <a href="#audit-logs" className="rounded-full bg-white/5 px-3 py-1 text-sm text-[color:var(--foreground)] hover:bg-white/10">Audit logs</a>
                ) : null}
                {admin.role === "staff" && admin.permissions.canReadBookings ? (
                  <a href="#staff-bookings" className="rounded-full bg-white/5 px-3 py-1 text-sm text-[color:var(--foreground)] hover:bg-white/10">Staff bookings</a>
                ) : null}
                {admin.role === "staff" && admin.permissions.canReadPayments ? (
                  <a href="#staff-payments" className="rounded-full bg-white/5 px-3 py-1 text-sm text-[color:var(--foreground)] hover:bg-white/10">Staff payments</a>
                ) : null}
              </nav>
            </div>
            <Link
              href={
                admin.role === "super_admin"
                  ? "/superadmin/login"
                  : admin.role === "manager"
                  ? "/manager/login"
                  : "/staff/login"
              }
              className="btn-secondary"
            >
              Back to sign in
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {admin.permissions.canViewReports ? (
            <>
              <div className="glass-panel rounded-2xl p-5 sm:p-6">
                <p className="text-sm text-[color:var(--muted)]">Revenue today</p>
                <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)] sm:text-3xl">Rp {summary.revenueToday.toLocaleString("id-ID")}</p>
              </div>
              <div className="glass-panel rounded-2xl p-5 sm:p-6">
                <p className="text-sm text-[color:var(--muted)]">Revenue this month</p>
                <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)] sm:text-3xl">Rp {summary.revenueThisMonth.toLocaleString("id-ID")}</p>
              </div>
              <div className="glass-panel rounded-2xl p-5 sm:p-6">
                <p className="text-sm text-[color:var(--muted)]">Bookings today</p>
                <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)] sm:text-3xl">{summary.bookingsToday}</p>
              </div>
              <div className="glass-panel rounded-2xl p-5 sm:p-6">
                <p className="text-sm text-[color:var(--muted)]">Bookings this month</p>
                <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)] sm:text-3xl">{summary.bookingsThisMonth}</p>
              </div>
            </>
          ) : (
            <div className="glass-panel rounded-2xl p-5 sm:p-6 sm:col-span-2 xl:col-span-4">
              <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Report access restricted</h2>
              <p className="mt-3 text-sm text-[color:var(--muted)]">
                Your current role does not include report access. Use the permitted actions above to manage bookings, verify payments, or collaborate with your team.
              </p>
            </div>
          )}
        </div>

        {!admin.permissions.canViewReports ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="glass-panel rounded-2xl p-5 sm:p-6">
              <p className="text-sm text-[color:var(--muted)]">Bookings today</p>
              <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)] sm:text-3xl">{summary.bookingsToday}</p>
            </div>
            <div className="glass-panel rounded-2xl p-5 sm:p-6">
              <p className="text-sm text-[color:var(--muted)]">Bookings this month</p>
              <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)] sm:text-3xl">{summary.bookingsThisMonth}</p>
            </div>
            <div className="glass-panel rounded-2xl p-5 sm:p-6">
              <p className="text-sm text-[color:var(--muted)]">Pending bookings</p>
              <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)] sm:text-3xl">{summary.pendingBookings}</p>
            </div>
            {admin.permissions.canReadPayments ? (
              <div className="glass-panel rounded-2xl p-5 sm:p-6">
                <p className="text-sm text-[color:var(--muted)]">Pending payments</p>
                <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)] sm:text-3xl">{summary.pendingPayments}</p>
              </div>
            ) : null}
          </div>
        ) : null}

          {/* Quick access removed — RBAC exposes CRUD/viewer sections inline per role */}

        {admin.permissions.canViewReports ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass-panel rounded-2xl p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Peak hours</h2>
              <div className="mt-4 space-y-3">
                {summary.peakHours.length > 0 ? (
                  summary.peakHours.map((entry) => (
                    <div key={entry.hour} className="flex items-center justify-between gap-2 rounded-2xl bg-white/5 px-4 py-3 text-sm text-[color:var(--muted)]">
                      <span>{entry.hour}</span>
                      <span className="font-medium text-[color:var(--foreground)]">{entry.bookings} bookings</span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-[color:var(--muted)]">
                    Belum ada data booking untuk ditampilkan.
                  </p>
                )}
              </div>
            </div>
            <div className="glass-panel rounded-2xl p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Customer analytics</h2>
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/5 px-4 py-3 text-sm text-[color:var(--muted)]">
                  <span>Total customers</span>
                  <span className="font-medium text-[color:var(--foreground)]">{summary.customerStats.totalCustomers}</span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/5 px-4 py-3 text-sm text-[color:var(--muted)]">
                  <span>Active customers</span>
                  <span className="font-medium text-[color:var(--foreground)]">{summary.customerStats.activeCustomers}</span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/5 px-4 py-3 text-sm text-[color:var(--muted)]">
                  <span>New customers this month</span>
                  <span className="font-medium text-[color:var(--foreground)]">{summary.customerStats.newCustomersThisMonth}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
