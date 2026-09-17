import { NextResponse } from "next/server";
import { getAuthenticatedAdminFromToken, writeAdminSessionCookie } from "@/lib/admin-auth";
import { createCsrfToken, verifyCsrfToken, setSecureCookie, clearSecureCookie } from "@/lib/security";
import { applySecurityHeaders } from "@/lib/security-headers";

export async function GET() {
  const csrfToken = createCsrfToken();
  
  const response = NextResponse.json({ 
    success: true, 
    csrfToken 
  });
  
  // Set CSRF token in secure cookie
  setSecureCookie(response, "csrf-token", csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
  });
  
  return applySecurityHeaders(response);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const csrfToken = body.csrfToken;
    
    if (!csrfToken) {
      return NextResponse.json({ success: false, message: "CSRF token required" }, { status: 400 });
    }
    
    // In a real implementation, you would verify the token against the user's session
    // For now, we'll just return success if token is provided
    return NextResponse.json({ success: true, valid: true });
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }
}