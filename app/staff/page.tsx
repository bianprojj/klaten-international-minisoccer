import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedAdminFromToken, getAdminPanelPath, isAdminRoleAllowed } from "@/lib/admin-auth";
import { getAdminSummary, getDefaultAdminSummary } from "@/lib/admin-dashboard";
import AdminDashboard from "@/components/admin-dashboard";
import StaffBookingViewer from "@/app/staff/bookings/StaffBookingViewer";
import StaffPaymentViewer from "@/app/staff/payments/StaffPaymentViewer";
import AdminResourceManager from "@/components/admin-resource-manager";
import VenueFeatureManager from "@/components/venue-feature-manager";
import VenueGalleryManager from "@/components/venue-gallery-manager";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-session")?.value ?? "";

  let admin = null;
  try {
    admin = await getAuthenticatedAdminFromToken(token);
  } catch (error) {
    console.error("[STAFF] Authentication check failed:", error);
    redirect("/staff/login");
  }

  if (!admin) {
    redirect("/staff/login");
  }

  if (!isAdminRoleAllowed(admin.role, ["staff"])) {
    redirect(`${getAdminPanelPath(admin.role)}/login`);
  }

  const summary = await getAdminSummary().catch((error) => {
    console.error("[STAFF] Unable to load dashboard summary:", error);
    return getDefaultAdminSummary();
  });

  try {
    return (
      <>
        <AdminDashboard admin={admin} summary={summary} />
        <StaffBookingViewer adminName={admin.name} useMain={false} />
        <StaffPaymentViewer adminName={admin.name} useMain={false} />
        <AdminResourceManager resource="invoices" canManage={admin.permissions.canManageInvoices} adminName={admin.name} />
        <VenueFeatureManager canManage={admin.permissions.canManageFeatures} canRead={admin.permissions.canReadFeatures} />
        <VenueGalleryManager canManage={admin.permissions.canManageGallery} canRead={admin.permissions.canReadGallery} />
      </>
    );
  } catch (error) {
    console.error("[STAFF] Unable to render dashboard:", error);
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
