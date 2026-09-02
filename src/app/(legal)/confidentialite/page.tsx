import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — KoyaPay",
};

export default function ConfidentialitePage() {
  return (
    <article className="space-y-4 text-[14px] leading-relaxed text-ink">
      <h1 className="font-display text-2xl font-semibold">Politique de confidentialité</h1>
      <p className="text-ink-soft text-sm">Dernière mise à jour : septembre 2026 · République du Bénin</p>

      <p>
        La présente politique décrit comment <strong>KoyaPay</strong> collecte, utilise et protège
        les données personnelles dans le cadre de son service de gestion de paie.
      </p>

      <h2 className="font-display text-lg font-semibold pt-2">1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement est l’exploitant de la plateforme KoyaPay.
        <br />
        Contact : <a href="mailto:koyaapay@gmail.com">koyaapay@gmail.com</a> — +229 01 62 43 47 07
      </p>

      <h2 className="font-display text-lg font-semibold pt-2">2. Données collectées</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Compte employeur</strong> : nom, email, téléphone, informations d’entreprise
          (adresse, logo, cachet, etc.)
        </li>
        <li>
          <strong>Employés</strong> : identité, numéro Mobile Money / WhatsApp, salaire et variables
          de paie, statut CNSS le cas échéant
        </li>
        <li>
          <strong>Usage technique</strong> : logs de connexion, données nécessaires au fonctionnement
          de l’hébergement et de la sécurité
        </li>
        <li>
          <strong>Paiements</strong> : références de transaction auprès de l’agrégateur (ex. FedaPay),
          sans stockage des secrets bancaires complets côté KoyaPay
        </li>
      </ul>

      <h2 className="font-display text-lg font-semibold pt-2">3. Finalités</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Création et gestion du compte</li>
        <li>Préparation des paies, dépôts, suivi des versements</li>
        <li>Génération de bulletins</li>
        <li>Support client et prévention de la fraude</li>
        <li>Respect des obligations légales applicables</li>
      </ul>

      <h2 className="font-display text-lg font-semibold pt-2">4. Base et durée</h2>
      <p>
        Les données sont traitées pour l’exécution du service demandé par l’utilisateur et, le cas
        échéant, pour nos intérêts légitimes de sécurité. Elles sont conservées pendant la durée
        d’utilisation du compte puis archivées ou supprimées selon les besoins légaux et
        opérationnels (notamment historiques de paie).
      </p>

      <h2 className="font-display text-lg font-semibold pt-2">5. Destinataires</h2>
      <p>
        Les données peuvent être accessibles à : l’équipe KoyaPay habilitée ; les prestataires
        techniques (hébergement, base de données, email) ; les prestataires de paiement et
        opérateurs Mobile Money lorsque cela est nécessaire au versement ; les autorités si la loi
        l’exige.
      </p>

      <h2 className="font-display text-lg font-semibold pt-2">6. Sous-traitants courants</h2>
      <p>
        Selon la configuration : hébergement applicatif (ex. Vercel), base de données et
        authentification (ex. Supabase), agrégateur de paiement (ex. FedaPay), et le cas échéant
        services de messagerie.
      </p>

      <h2 className="font-display text-lg font-semibold pt-2">7. Sécurité</h2>
      <p>
        Mesures raisonnables : accès authentifié, contrôles d’accès par compte (RLS), communications
        HTTPS, limitation des accès internes. Aucun système n’est infaillible ; signalez tout
        incident suspect à koyaapay@gmail.com.
      </p>

      <h2 className="font-display text-lg font-semibold pt-2">8. Droits</h2>
      <p>
        Selon le droit applicable, vous pouvez demander l’accès, la rectification, la suppression ou
        la limitation du traitement de vos données, et vous opposer à certains traitements, en
        écrivant à koyaapay@gmail.com. L’employeur reste responsable des données de ses employés
        qu’il saisit dans KoyaPay.
      </p>

      <h2 className="font-display text-lg font-semibold pt-2">9. Cookies</h2>
      <p>
        Le service utilise des cookies ou stockage local nécessaires à la session et au
        fonctionnement (authentification). Pas de publicité tierce par défaut.
      </p>

      <h2 className="font-display text-lg font-semibold pt-2">10. Modifications</h2>
      <p>
        Cette politique peut être mise à jour. La date en tête de page fait foi. L’usage continu du
        service après publication vaut prise de connaissance.
      </p>

      <p className="text-ink-soft text-xs pt-4">
        Document d’information générale. Un accompagnement juridique peut être utile pour une
        conformité renforcée (CNIL locale / cadre béninois de protection des données).
      </p>
    </article>
  );
}
