import { jsPDF } from "jspdf";
import { fmtAmount, fmtFcfa } from "./fees";

export type BulletinData = {
  companyName: string;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  directorName?: string | null;
  logoDataUrl?: string | null;
  stampDataUrl?: string | null;
  signatureDataUrl?: string | null;
  employeeName: string;
  mobileMoney: string;
  cnss: boolean;
  /** YYYY-MM (mois de salaire) affiché sous "Bulletin de paie" */
  salaryMonth: string;
  /** YYYY-MM-DD date de paiement */
  paymentDate: string;
  base_salary: number;
  commission: number;
  primes: number;
  transport: number;
  retenues: number;
  other1_label?: string | null;
  other1_amount?: number;
  other2_label?: string | null;
  other2_amount?: number;
  net: number;
};

function moisAnneeFromYm(ym: string): string {
  if (!ym || ym.length < 7) return "";
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  const s = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function dateFr(iso: string): string {
  if (!iso) return "";
  return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function contactLine(phone?: string | null, email?: string | null): string {
  return [phone, email].filter(Boolean).join("  ·  ");
}

function buildLines(data: BulletinData): { label: string; amount: number; negative?: boolean }[] {
  const lines: { label: string; amount: number; negative?: boolean }[] = [];
  if (data.base_salary) lines.push({ label: "Salaire de base", amount: data.base_salary });
  if (data.commission) lines.push({ label: "Commission", amount: data.commission });
  if (data.primes) lines.push({ label: "Primes", amount: data.primes });
  if (data.transport) lines.push({ label: "Transport", amount: data.transport });
  if (data.other1_label && data.other1_amount) {
    lines.push({ label: data.other1_label, amount: data.other1_amount });
  }
  if (data.other2_label && data.other2_amount) {
    lines.push({ label: data.other2_label, amount: data.other2_amount });
  }
  if (data.retenues) lines.push({ label: "Retenues", amount: data.retenues, negative: true });
  return lines;
}

function tryImage(doc: jsPDF, dataUrl: string, x: number, y: number, w: number, h: number) {
  try {
    doc.addImage(dataUrl, "PNG", x, y, w, h);
    return true;
  } catch {
    try {
      doc.addImage(dataUrl, "JPEG", x, y, w, h);
      return true;
    } catch {
      return false;
    }
  }
}

export function downloadBulletin(data: BulletinData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentW = pageW - margin * 2;
  const right = pageW - margin;
  const colAmountX = right - 2; // alignement à droite des montants
  const colLabelX = margin + 2;

  let y = 16;

  // Logo
  if (data.logoDataUrl) {
    tryImage(doc, data.logoDataUrl, margin, y, 16, 16);
  }

  const textLeft = data.logoDataUrl ? margin + 20 : margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 27, 45);
  doc.text(data.companyName || "Entreprise", textLeft, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(91, 100, 114);
  let infoY = y + 10;
  if (data.companyAddress) {
    doc.text(data.companyAddress, textLeft, infoY);
    infoY += 4;
  }
  const contact = contactLine(data.companyPhone, data.companyEmail);
  if (contact) doc.text(contact, textLeft, infoY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 27, 45);
  doc.text("Bulletin de paie", right, y + 5, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(47, 175, 100);
  doc.text(moisAnneeFromYm(data.salaryMonth || data.paymentDate?.slice(0, 7) || ""), right, y + 11, {
    align: "right",
  });

  y = 40;
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.25);
  doc.line(margin, y, right, y);
  y += 8;

  // Infos employé — 2 colonnes
  const mid = pageW / 2 + 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text("Employé", margin, y);
  doc.text("Mobile Money", mid, y);
  y += 4.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 27, 45);
  doc.text(data.employeeName, margin, y);
  doc.text(data.mobileMoney, mid, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text("Statut CNSS", margin, y);
  doc.text("Date de paiement", mid, y);
  y += 4.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 27, 45);
  doc.text(data.cnss ? "Déclaré" : "Non déclaré", margin, y);
  doc.text(dateFr(data.paymentDate), mid, y);
  y += 10;

  // En-tête tableau
  const tableTop = y;
  const headerH = 8;
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, tableTop, contentW, headerH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(91, 100, 114);
  doc.text("ÉLÉMENT", colLabelX, tableTop + 5.2);
  doc.text("MONTANT (en FCFA)", colAmountX, tableTop + 5.2, { align: "right" });
  y = tableTop + headerH + 1;

  const lines = buildLines(data);
  const rowH = 8;
  doc.setFontSize(10);

  lines.forEach((line, idx) => {
    const rowY = y + idx * rowH;
    // ligne séparatrice
    doc.setDrawColor(235, 235, 235);
    doc.setLineWidth(0.2);
    doc.line(margin, rowY + rowH - 1, right, rowY + rowH - 1);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.text(line.label, colLabelX, rowY + 5);

    doc.setFont("helvetica", "bold");
    const amountTxt = line.negative ? "- " + fmtAmount(line.amount) : fmtAmount(line.amount);
    // Texte strictement ASCII + espaces → pas de glyphe bizarre
    doc.text(amountTxt, colAmountX, rowY + 5, { align: "right" });
  });

  y = y + lines.length * rowH + 6;

  // NET PAYÉ
  const netH = 14;
  doc.setFillColor(15, 27, 45);
  doc.roundedRect(margin, y, contentW, netH, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("NET PAYÉ", margin + 4, y + 9);
  doc.setTextColor(47, 175, 100);
  doc.setFontSize(12);
  doc.text(fmtFcfa(data.net), colAmountX, y + 9, { align: "right" });

  y += netH + 16;

  // Cachet juste au-dessus du nom du DG (colonne droite)
  const dg = data.directorName || data.companyName || "";
  const blockX = right - 42;

  if (data.stampDataUrl) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text("Cachet", blockX + 8, y, { align: "center" });
    y += 2;
    tryImage(doc, data.stampDataUrl, blockX + 5, y, 24, 24);
    y += 26;
  }

  if (data.signatureDataUrl) {
    tryImage(doc, data.signatureDataUrl, blockX, y, 36, 14);
    y += 16;
  }

  if (dg) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 27, 45);
    doc.text(dg, right, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text("Directeur Général", right, y + 4.5, { align: "right" });
  }

  // Pied de page
  const footerY = 285;
  doc.setDrawColor(230, 230, 230);
  doc.line(margin, footerY - 6, right, footerY - 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  doc.text(
    "Ce bulletin a été généré par KoyaPay pour le compte de votre entreprise",
    pageW / 2,
    footerY,
    { align: "center" }
  );
  doc.text("+229 01 62 43 47 07  /  koyaapay@gmail.com", pageW / 2, footerY + 4, {
    align: "center",
  });

  const safe = data.employeeName.replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
  doc.save(`Bulletin_${safe}.pdf`);
}
