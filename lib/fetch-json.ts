/* eslint-disable @typescript-eslint/no-explicit-any */
export async function fetchJson(input: RequestInfo, init?: RequestInit): Promise<{ res: Response; data: any }> {
  const res = await fetch(input, init);
  const text = await res.text();
  try { return { res, data: text ? JSON.parse(text) : {} }; } catch { return { res, data: {} }; }
}

export function apiMessage(data: any, fallback: string): string {
  return typeof data.message === "string" && data.message.length > 0 ? data.message : fallback;
}
