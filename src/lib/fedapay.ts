const SANDBOX = "https://sandbox-api.fedapay.com/v1";
const LIVE = "https://api.fedapay.com/v1";

export function fedapayBaseUrl() {
  return process.env.FEDAPAY_ENV === "live" ? LIVE : SANDBOX;
}

export function fedapaySecret() {
  return process.env.FEDAPAY_SECRET_KEY || "";
}

export async function fedapayFetch(path: string, init: RequestInit = {}) {
  const key = fedapaySecret();
  if (!key) throw new Error("FEDAPAY_SECRET_KEY manquante");

  const res = await fetch(`${fedapayBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error?.message ||
      data?.v1?.message ||
      `Erreur FedaPay HTTP ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}
