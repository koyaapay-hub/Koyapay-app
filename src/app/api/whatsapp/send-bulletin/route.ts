import { NextRequest, NextResponse } from "next/server";

/**
 * Envoi notification bulletin via WhatsApp Cloud API (Meta).
 *
 * Env Vercel :
 * - WHATSAPP_TOKEN
 * - WHATSAPP_PHONE_NUMBER_ID
 */

function normalizeBjPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("229") && digits.length >= 11) return digits;
  if (digits.length === 10 && digits.startsWith("01")) return "229" + digits;
  if (digits.length === 8) return "229" + digits;
  if (digits.length >= 8) return digits;
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, employeeName, netFcfa, monthLabel, documentLink } = body as {
      to: string;
      employeeName: string;
      netFcfa: string;
      monthLabel: string;
      documentLink?: string;
    };

    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "WhatsApp non configuré. Ajoutez WHATSAPP_TOKEN et WHATSAPP_PHONE_NUMBER_ID sur Vercel.",
        },
        { status: 503 }
      );
    }

    const phone = normalizeBjPhone(to || "");
    if (!phone) {
      return NextResponse.json({ ok: false, error: "Numéro WhatsApp invalide" }, { status: 400 });
    }

    const text =
      `KoyaPay — Bulletin de paie\n` +
      `Bonjour ${employeeName},\n` +
      `Votre salaire ${monthLabel ? "de " + monthLabel + " " : ""}` +
      `(${netFcfa}) a été traité.\n` +
      (documentLink ? `Bulletin : ${documentLink}\n` : "") +
      `Merci.`;

    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: text },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: data?.error?.message || "Erreur Meta API", meta: data },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, meta: data });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
