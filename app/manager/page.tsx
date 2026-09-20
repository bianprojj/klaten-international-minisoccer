import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedAdminFromToken, getAdminPanelPath, isAdminRoleAllowed } from "@/lib/admin-auth";
import { getAdminSummary, getDefaultAdminSummary } from "@/lib/admin-dashboard";
import AdminDashboard from "@/components/admin-dashboard";
import AdminResourceManager from "@/components/admin-resource-manager";
import VenueFeatureManager from "@/components/venue-feature-manager";
import VenueGalleryManager from "@/components/venue-gallery-manager";
import ScheduleManagerClient from "@/app/manager/schedule/ScheduleManagerClient";
import BookingManagerClient from "@/app/manager/bookings/BookingManagerClient";
import PaymentManagerClient from "@/app/manager/payments/PaymentManagerClient";

export const dynamic = "force-dynamic";

export default async function ManagerPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-session")?.value ?? "";

  let admin = null;
  try {
    admin = await getAuthenticatedAdminFromToken(token);
  } catch (error) {
    console.error("[MANAGER] Authentication check failed:", error);
    redirect("/manager/login");
  }

  if (!admin) {
    redirect("/manager/login");
  }

  if (!isAdminRoleAllowed(admin.role, ["manager"])) {
    redirect(`${getAdminPanelPath(admin.role)}/login`);
  }

  const summary = await getAdminSummary().catch((error) => {
    console.error("[MANAGER] Unable to load dashboard summary:", error);
    return getDefaultAdminSummary();
  });

  try {
    return (
      <>
        <AdminDashboard admin={admin} summary={summary} />
<BookingManagerClient adminName={admin.name} useMain={false} />
<PaymentManagerClient adminName={admin.name} useMain={false} />
<ScheduleManagerClient adminName={admin.name} />
        <AdminResourceManager resource="invoices" canManage={admin.permissions.canManageInvoices} adminName={admin.name} />
        <AdminResourceManager resource="reviews" canManage={admin.permissions.canManageReviews} adminName={admin.name} />
        <AdminResourceManager resource="settings" canManage={admin.permissions.canManageSettings} adminName={admin.name} />
        <VenueFeatureManager />
        <VenueGalleryManager />
      </>
    );
  } catch (error) {
    console.error("[MANAGER] Unable to render dashboard:", error);
    return (
      <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-amber-500/20 bg-[color:var(--surface)] p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Dashboard unavailable</p>
          <h1 className="mt-4 text-balance text-3xl font-semibold leading-tight text-[color:var(--foreground)]">The admin dashboard could not be rendered.</h1>
          <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
            A temporary data issue prevented the dashboard from loading correctly. Please refresh the page or try again shortly.
          </p>
        </div>
      </main>
    );
  }
}
