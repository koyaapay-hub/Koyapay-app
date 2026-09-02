# FedaPay — KoyaPay

## 1. Compte

1. Créer un compte sur https://fedapay.com
2. Mode **Sandbox** pour les tests
3. Récupérer la **clé secrète API** (Secret key)

## 2. Variables Vercel

```
FEDAPAY_SECRET_KEY=sk_sandbox_...
FEDAPAY_ENV=sandbox
NEXT_PUBLIC_APP_URL=https://koyapayapp.vercel.app
```

Pour la production :
```
FEDAPAY_SECRET_KEY=sk_live_...
FEDAPAY_ENV=live
```

Redeploy après ajout.

## 3. Flux KoyaPay

1. L’employeur prépare la paie (total net + frais)
2. « Confirmer le dépôt » appelle `POST /api/fedapay/deposit`
3. Redirection vers l’URL de paiement FedaPay (MTN / Moov / etc.)
4. Retour sur `/payroll/return`

## 4. Payouts employés (plus tard)

L’API Payouts FedaPay servira à envoyer chaque salaire vers le Mobile Money de l’employé après réception du dépôt.

## 5. Docs officielles

https://docs.fedapay.com
