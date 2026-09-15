"use client";

import { fetchJson } from "@/lib/fetch-json";

import { FormEvent, useRef, useState } from "react";
import { AnimatedCard } from "@/components/animated-card";

export function createRoleLoginPage(targetPath: string, title: string, subtitle: string) {
  return function RoleLoginPage() {
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submitLogin = async (event?: FormEvent<HTMLFormElement>) => {
      if (event) {
        event.preventDefault();
      }
      setLoading(true);
      setError(null);

      const nextEmail = emailRef.current?.value.trim() ?? "";
      const nextPassword = passwordRef.current?.value.trim() ?? "";

      if (!nextEmail || !nextPassword) {
        setError("Email dan password harus diisi.");
        setLoading(false);
        return;
      }

      try {
        const { res: response, data: __body } = await fetchJson("/api/admin/login", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: nextEmail, password: nextPassword }),
        });

        const data = __body;
        if (!response.ok || !data.success) {
          throw new Error(String(data.message ?? "") || "Unable to sign in.");
        }

        if (typeof window !== "undefined") {
          window.location.assign(targetPath);
          window.location.href = targetPath;
        }
      } catch (caught) {
        setError((caught as Error).message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-6 py-16 lg:px-8">
        <div className="mx-auto w-full max-w-lg">
          <AnimatedCard className="p-8">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">{title}</p>
                <h1 className="mt-2 text-4xl font-semibold text-[#1A1F4D]">Masuk ke {subtitle}</h1>
                <p className="mt-3 text-sm text-[color:var(--muted)]">
                  Gunakan akun yang memiliki hak akses untuk role ini. Silakan masukkan email dan password Anda.
                </p>
              </div>

              <form onSubmit={submitLogin} method="post" className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#1A1F4D]">Email</label>
                  <input
                    ref={emailRef}
                    name="email"
                    type="email"
                    autoComplete="email"
                    defaultValue=""
                    placeholder="name@domain.com"
                    className="w-full rounded-3xl border border-[rgba(0,81,54,0.25)] bg-[#FFFFFF] px-4 py-3 text-[#1A1F4D] placeholder:text-[rgba(26,31,77,0.45)] outline-none transition focus:border-[#005136] focus:ring-2 focus:ring-[rgba(0,81,54,0.2)]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#1A1F4D]">Password</label>
                  <input
                    ref={passwordRef}
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    defaultValue=""
                    placeholder="Masukkan password Anda"
                    className="w-full rounded-3xl border border-[rgba(0,81,54,0.25)] bg-[#FFFFFF] px-4 py-3 text-[#1A1F4D] placeholder:text-[rgba(26,31,77,0.45)] outline-none transition focus:border-[#005136] focus:ring-2 focus:ring-[rgba(0,81,54,0.2)]"
                  />
                </div>

                {error ? (
                  <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 text-rose-700">!</span>
                      <div>
                        <p className="font-semibold text-[#1A1F4D]">Terjadi kesalahan</p>
                        <p className="mt-1 text-[0.95rem] text-rose-700">{error}</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full rounded-3xl py-3 text-sm font-semibold disabled:opacity-60"
                >
                  {loading ? "Sedang masuk…" : "Masuk"}
                </button>
              </form>
            </div>
          </AnimatedCard>
        </div>
      </main>
    );
  };
}
