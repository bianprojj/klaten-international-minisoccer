import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createJwt, verifyJwt, setSecureCookie, clearSecureCookie } from "@/lib/security";

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@klatenminisoccer.id";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";

const SEEDED_ADMIN_CREDENTIALS = [
  {
    name: "System Administrator",
    email: DEFAULT_ADMIN_EMAIL.toLowerCase(),
    password: DEFAULT_ADMIN_PASSWORD,
    role: "super_admin" as const,
  },
  {
    name: "Primary Super Admin",
    email: "superadmin1@klatenminisoccer.id",
    password: "SuperAdmin@123!",
    role: "super_admin" as const,
  },
  {
    name: "Booking Manager",
    email: "manager1@klatenminisoccer.id",
    password: "Manager@123!",
    role: "manager" as const,
  },
  {
    name: "Support Staff",
    email: "staff@klatenminisoccer.id",
    password: "Staff@123!",
    role: "staff" as const,
  },
];

// Account lockout configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const failedAttemptsStore = new Map<string, { count: number; lockedUntil: number }>();

function checkAccountLockout(email: string): { allowed: boolean; remainingAttempts: number; lockedUntil?: number } {
  const normalizedEmail = email.toLowerCase().trim();
  const record = failedAttemptsStore.get(normalizedEmail);
  
  if (!record) {
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }
  
  if (record.lockedUntil && record.lockedUntil > Date.now()) {
    return { allowed: false, remainingAttempts: 0, lockedUntil: record.lockedUntil };
  }
  
  if (record.lockedUntil && record.lockedUntil <= Date.now()) {
    // Lockout expired, reset
    failedAttemptsStore.delete(normalizedEmail);
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }
  
  return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS - record.count };
}

function recordFailedAttempt(email: string): void {
  const normalizedEmail = email.toLowerCase().trim();
  const record = failedAttemptsStore.get(normalizedEmail) || { count: 0, lockedUntil: 0 };
  
  record.count += 1;
  
  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  
  failedAttemptsStore.set(email.toLowerCase().trim(), record);
}

function clearFailedAttempts(email: string): void {
  failedAttemptsStore.delete(email.toLowerCase().trim());
}

export function validatePasswordComplexity(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;':\"\\,.<>/?)");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export const ADMIN_ROLES = {
  staff: "staff",
  manager: "manager",
  superAdmin: "super_admin",
} as const;

export type AdminRole = (typeof ADMIN_ROLES)[keyof typeof ADMIN_ROLES];

export interface AdminPermissions {
  canManageFields: boolean;
  canReadFields: boolean;
  canManageBookings: boolean;
  canReadBookings: boolean;
  canManagePayments: boolean;
  canReadPayments: boolean;
  canManageInvoices: boolean;
  canReadInvoices: boolean;
  canManageReviews: boolean;
  canReadReviews: boolean;
  canManageSchedule: boolean;
  canManageCMS: boolean;
  canManageAdmins: boolean;
  canViewReports: boolean;
  canVerifyPayments: boolean;
  canCreateBookings: boolean;
  canManageSettings: boolean;
  canManageFeatures: boolean;
  canReadFeatures: boolean;
  canManageGallery: boolean;
  canReadGallery: boolean;
}

export interface AuthenticatedAdmin {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermissions;
}

function hashSecret(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function normalizeAdminRole(role: string): AdminRole {
  const normalized = role.toLowerCase();
  if (normalized === ADMIN_ROLES.manager) return ADMIN_ROLES.manager;
  if (normalized === ADMIN_ROLES.superAdmin) return ADMIN_ROLES.superAdmin;
  return ADMIN_ROLES.staff;
}

function getDefaultPermissions(role: AdminRole): AdminPermissions {
  switch (role) {
    case ADMIN_ROLES.superAdmin:
      return {
        canManageFields: true,
        canReadFields: true,
        canManageBookings: true,
        canReadBookings: true,
        canManagePayments: true,
        canReadPayments: true,
        canManageInvoices: true,
        canReadInvoices: true,
        canManageReviews: true,
        canReadReviews: true,
        canManageSchedule: true,
        canManageCMS: true,
        canManageAdmins: true,
        canViewReports: true,
        canVerifyPayments: true,
        canCreateBookings: true,
        canManageSettings: true,
        canManageFeatures: true,
        canReadFeatures: true,
        canManageGallery: true,
        canReadGallery: true,
      };
    case ADMIN_ROLES.manager:
      return {
        canManageFields: true,
        canReadFields: true,
        canManageBookings: true,
        canReadBookings: true,
        canManagePayments: true,
        canReadPayments: true,
        canManageInvoices: true,
        canReadInvoices: true,
        canManageReviews: true,
        canReadReviews: true,
        canManageSchedule: true,
        canManageCMS: true,
        canManageAdmins: false,
        canViewReports: false,
        canVerifyPayments: true,
        canCreateBookings: true,
        canManageSettings: true,
        canManageFeatures: true,
        canReadFeatures: true,
        canManageGallery: true,
        canReadGallery: true,
      };
    default:
      return {
        canManageFields: false,
        canReadFields: false,
        canManageBookings: true,
        canReadBookings: true,
        canManagePayments: true,
        canReadPayments: true,
        canManageInvoices: false,
        canReadInvoices: false,
        canManageReviews: false,
        canReadReviews: true,
        canManageSchedule: false,
        canManageCMS: false,
        canManageAdmins: false,
        canViewReports: false,
        canVerifyPayments: false,
        canCreateBookings: true,
        canManageSettings: false,
        canManageFeatures: false,
        canReadFeatures: false,
        canManageGallery: false,
        canReadGallery: false,
      };
  }
}

export function getAdminPanelPath(role: string) {
  const normalizedRole = normalizeAdminRole(role);

  switch (normalizedRole) {
    case ADMIN_ROLES.superAdmin:
      return "/superadmin";
    case ADMIN_ROLES.manager:
      return "/manager";
    default:
      return "/staff";
  }
}

export function isAdminRoleAllowed(role: string, allowedRoles: AdminRole[]) {
  const normalizedRole = normalizeAdminRole(role);
  return allowedRoles.includes(normalizedRole);
}

export function hasAdminPermission(admin: AuthenticatedAdmin | null, permission: keyof AdminPermissions) {
  if (!admin) {
    return false;
  }

  return admin.permissions[permission] === true;
}

async function ensureSeededAdminUsers() {
  for (const seededAdmin of SEEDED_ADMIN_CREDENTIALS) {
    const existing = await prisma.adminUser.findUnique({
      where: { email: seededAdmin.email.toLowerCase() },
    });

    if (!existing) {
      const passwordHash = await hashPassword(seededAdmin.password);
      await prisma.adminUser.create({
        data: {
          name: seededAdmin.name,
          email: seededAdmin.email.toLowerCase(),
          passwordHash,
          role: seededAdmin.role,
          isActive: true,
        },
      });
    }
  }
}

async function ensureDefaultAdminUser() {
  await ensureSeededAdminUsers();
  const passwordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
  const normalizedEmail = DEFAULT_ADMIN_EMAIL.toLowerCase();

  const existing = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return existing;
  }

  return prisma.adminUser.create({
    data: {
      name: "System Administrator",
      email: normalizedEmail,
      passwordHash,
      role: ADMIN_ROLES.superAdmin,
      isActive: true,
    },
  });
}

async function findAdminUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return existing;
  }

  if (normalizedEmail === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
    return ensureDefaultAdminUser();
  }

  const seededAccount = SEEDED_ADMIN_CREDENTIALS.find((account) => account.email.toLowerCase() === normalizedEmail);
  if (seededAccount) {
    await ensureSeededAdminUsers();
    return prisma.adminUser.findUnique({ where: { email: normalizedEmail } });
  }

  return null;
}

export async function authenticateAdmin(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (!normalizedEmail || !normalizedPassword) {
    throw new Error("Admin email and password are required.");
  }

  // Check account lockout
  const lockoutStatus = checkAccountLockout(normalizedEmail);
  if (!lockoutStatus.allowed) {
    const minutesLeft = Math.ceil((lockoutStatus.lockedUntil! - Date.now()) / 60000);
    throw new Error(`Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`);
  }

  const adminUser = await findAdminUserByEmail(normalizedEmail);

  if (!adminUser) {
    recordFailedAttempt(normalizedEmail);
    throw new Error("Admin credentials are invalid.");
  }

  const isPasswordValid = await verifyPassword(normalizedPassword, adminUser.passwordHash);
  if (!isPasswordValid) {
    recordFailedAttempt(normalizedEmail);
    throw new Error("Admin credentials are invalid.");
  }

  // Clear failed attempts on successful login
  clearFailedAttempts(normalizedEmail);

  // Check if user must change password (first login or forced reset)
  const mustChangePassword = adminUser.mustChangePassword === true || adminUser.passwordChangedAt === null;

  const sessionToken = createJwt({
    sub: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    mustChangePassword,
  });

  const tokenHash = hashSecret(sessionToken);

  await prisma.adminSession.create({
    data: {
      adminUserId: adminUser.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    },
  });

  return {
    user: {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      mustChangePassword,
    },
    token: sessionToken,
  };
}

export async function getAuthenticatedAdminFromToken(token: string) {
  if (!token) {
    return null;
  }

  const payload = verifyJwt(token);
  if (!payload || typeof payload.sub !== "string") {
    return null;
  }

  const tokenHash = hashSecret(token);

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { adminUser: true },
  });

  if (!session || !session.adminUser || session.expiresAt < new Date()) {
    return null;
  }

  const adminUser = session.adminUser;
  const role = normalizeAdminRole(adminUser.role);
  const permissions = getDefaultPermissions(role);

  return {
    id: adminUser.id,
    name: adminUser.name,
    email: adminUser.email,
    role,
    permissions,
  };
}

export async function getAuthenticatedAdmin(request: NextRequest) {
  const token = request.cookies.get("admin-session")?.value;
  return getAuthenticatedAdminFromToken(token ?? "");
}

export function writeAdminSessionCookie(response: NextResponse, token: string) {
  setSecureCookie(response, "admin-session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
  });
  return response;
}

export function clearAdminSessionCookie(response: NextResponse) {
  clearSecureCookie(response, "admin-session");
  return response;
}
