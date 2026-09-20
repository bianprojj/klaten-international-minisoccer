import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedAdminFromToken, getAdminPanelPath, isAdminRoleAllowed } from "@/lib/admin-auth";
import ScheduleManagerClient from "../schedule/ScheduleManagerClient";

export const dynamic = "force-dynamic";

export default async function ManagerScheduleSlotsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-session")?.value ?? "";
  const admin = await getAuthenticatedAdminFromToken(token);

  if (!admin) {
    redirect("/manager/login");
  }

  if (!isAdminRoleAllowed(admin.role, ["manager", "super_admin"])) {
    redirect(`${getAdminPanelPath(admin.role)}/login`);
  }

  return <ScheduleManagerClient adminName={admin.name} />;
}