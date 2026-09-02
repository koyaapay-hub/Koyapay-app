# WhatsApp Business API (Meta) — KoyaPay

## 1. Créer l’app Meta

1. https://developers.facebook.com → Créer une app → type **Business**
2. Ajouter le produit **WhatsApp**
3. WhatsApp → API Setup :
   - **Phone number ID** → variable `WHATSAPP_PHONE_NUMBER_ID`
   - **Token** → variable `WHATSAPP_TOKEN`

## 2. Variables sur Vercel

```
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
```

Puis **Redeploy**.

## 3. Endpoint

`POST /api/whatsapp/send-bulletin`

```json
{
  "to": "0162434707",
  "employeeName": "Samuel ODJO",
  "netFcfa": "12 400 FCFA",
  "monthLabel": "septembre 2026",
  "documentLink": "https://..."
}
```

## 4. PDF en pièce jointe (prochaine itération)

1. Upload média Meta
2. Message type `document`

## 5. Template production

Créer un template Utility `koyapay_bulletin` pour contacter hors fenêtre 24 h.
