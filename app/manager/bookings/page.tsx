import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedAdminFromToken, getAdminPanelPath, isAdminRoleAllowed } from "@/lib/admin-auth";
import StaffBookingViewer from "@/app/staff/bookings/StaffBookingViewer";

export const dynamic = "force-dynamic";

export default async function ManagerBookingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-session")?.value ?? "";
  const admin = await getAuthenticatedAdminFromToken(token);

  if (!admin) {
    redirect("/manager/login");
  }

  if (!isAdminRoleAllowed(admin.role, ["manager", "super_admin"])) {
    redirect(`${getAdminPanelPath(admin.role)}/login`);
  }

  return <StaffBookingViewer adminName={admin.name} />;
}
