import { NextRequest, NextResponse } from "next/server";
import { fedapayFetch } from "@/lib/fedapay";

/**
 * Crée une transaction FedaPay (collecte) pour le dépôt de masse salariale
 * et renvoie l'URL de paiement.
 *
 * Body: {
 *   amount: number (FCFA entier),
 *   description: string,
 *   email: string,
 *   firstname?: string,
 *   lastname?: string,
 *   phone?: string,
 *   payrollId?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.FEDAPAY_SECRET_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "FedaPay non configuré. Ajoutez FEDAPAY_SECRET_KEY (et optionnellement FEDAPAY_ENV=sandbox|live) sur Vercel.",
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const amount = Math.round(Number(body.amount) || 0);
    if (amount < 100) {
      return NextResponse.json({ ok: false, error: "Montant invalide" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://koyapayapp.vercel.app";
    const callback = `${appUrl}/payroll/return?payroll=${encodeURIComponent(body.payrollId || "")}`;

    const phoneRaw = String(body.phone || "").replace(/\D/g, "");
    const phoneNumber =
      phoneRaw.length >= 8
        ? {
            number: phoneRaw.startsWith("229") ? phoneRaw.slice(3) : phoneRaw,
            country: "BJ",
          }
        : undefined;

    const txPayload: Record<string, unknown> = {
      description: body.description || "Dépôt paie KoyaPay",
      amount,
      currency: { iso: "XOF" },
      callback_url: callback,
      customer: {
        firstname: body.firstname || "Employeur",
        lastname: body.lastname || "KoyaPay",
        email: body.email || "koyaapay@gmail.com",
        ...(phoneNumber ? { phone_number: phoneNumber } : {}),
      },
    };

    if (body.payrollId) {
      txPayload.custom_metadata = { payroll_id: body.payrollId };
    }

    const created = await fedapayFetch("/transactions", {
      method: "POST",
      body: JSON.stringify(txPayload),
    });

    // Réponse FedaPay souvent sous clé v1/transaction
    const tx = created["v1/transaction"] || created.transaction || created;
    const id = tx.id;
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Réponse FedaPay invalide", raw: created },
        { status: 502 }
      );
    }

    const tokenRes = await fedapayFetch(`/transactions/${id}/token`, { method: "POST" });
    const tokenData = tokenRes["v1/token"] || tokenRes;
    const url = tokenData.url || tokenData.token_url;

    if (!url) {
      return NextResponse.json(
        { ok: false, error: "Lien de paiement introuvable", raw: tokenRes },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      transactionId: id,
      paymentUrl: url,
      token: tokenData.token,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Erreur FedaPay" },
      { status: 500 }
    );
  }
}
