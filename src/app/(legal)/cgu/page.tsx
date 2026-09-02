import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales d’utilisation — KoyaPay",
};

export default function CguPage() {
  return (
    <article className="space-y-4 text-[14px] leading-relaxed text-ink">
      <h1 className="font-display text-2xl font-semibold">Conditions générales d’utilisation</h1>
      <p className="text-ink-soft text-sm">Dernière mise à jour : septembre 2026 · République du Bénin</p>

      <p>
        Les présentes Conditions générales d’utilisation (CGU) régissent l’accès et l’usage de la
        plateforme <strong>KoyaPay</strong> (site et application), service de simplification de la
        paie et du versement de salaires via Mobile Money, édité par l’exploitant de KoyaPay
        (ci-après « KoyaPay », « nous »).
      </p>

      <h2 className="font-display text-lg font-semibold pt-2">1. Objet du service</h2>
      <p>
        KoyaPay permet aux employeurs et structures de gérer une liste d’employés, de préparer des
        paies, de centraliser un dépôt, et de suivre le versement des salaires. Certaines fonctions
        (paiements réels, envoi WhatsApp) dépendent de prestataires tiers et de la configuration du
        compte.
      </p>

      <h2 className="font-display text-lg font-semibold pt-2">2. Inscription et compte</h2>
      <p>
        L’utilisateur garantit l’exactitude des informations fournies (identité, entreprise,
        coordonnées). Il est responsable de la confidentialité de ses identifiants et de toute
        activité réalisée depuis son compte. KoyaPay peut suspendre un compte en cas d’usage
        frauduleux, abusif ou contraire à la loi.
      </p>

      <h2 className="font-display text-lg font-semibold pt-2">3. Obligations de l’utilisateur</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Utiliser le service conformément à la législation béninoise et aux présentes CGU</li>
        <li>Disposer des droits nécessaires pour traiter les données de ses employés</li>
        <li>Vérifier les montants, numéros Mobile Money et dates avant tout dépôt ou validation</li>
        <li>Ne pas tenter de contourner la sécurité ou d’accéder aux données d’autrui</li>
      </ul>

      <h2 className="font-display text-lg font-semibold pt-2">4. Paiements et frais</h2>
      <p>
        Les frais KoyaPay et, le cas échéant, les frais des opérateurs ou de l’agrégateur de
        paiement (ex. FedaPay) sont indiqués dans l’interface avant validation. Les paiements sont
        traités par des prestataires de paiement ; KoyaPay n’est pas une banque. En cas d’échec de
        versement, les règles d’affichage et de relance de la plateforme s’appliquent, sans préjudice
        des recours auprès de l’opérateur.
      </p>

      <h2 className="font-display text-lg font-semibold pt-2">5. Bulletins et documents</h2>
      <p>
        Les bulletins générés sont des documents d’information produits pour le compte de
        l’employeur. L’employeur reste responsable de la conformité sociale et fiscale de sa paie
        (CNSS, déclarations, etc.).
      </p>

      <h2 className="font-display text-lg font-semibold pt-2">6. Disponibilité</h2>
      <p>
        KoyaPay s’efforce d’assurer une disponibilité continue du service, sans garantie d’absence
        d’interruption (maintenance, force majeure, défaillance d’un tiers).
      </p>

      <h2 className="font-display text-lg font-semibold pt-2">7. Propriété intellectuelle</h2>
      <p>
        Marques, logos, interface et contenus de KoyaPay sont protégés. Toute reproduction non
        autorisée est interdite.
      </p>

      <h2 className="font-display text-lg font-semibold pt-2">8. Responsabilité</h2>
      <p>
        Dans les limites autorisées par la loi, la responsabilité de KoyaPay est limitée aux
        dommages directs prouvés résultant d’une faute de la plateforme, à l’exclusion des dommages
        indirects. KoyaPay n’est pas responsable des erreurs de saisie de l’utilisateur ni des
        défaillances des réseaux Mobile Money ou prestataires de paiement.
      </p>

      <h2 className="font-display text-lg font-semibold pt-2">9. Résiliation</h2>
      <p>
        L’utilisateur peut cesser d’utiliser le service à tout moment. KoyaPay peut résilier ou
        suspendre l’accès en cas de manquement grave aux CGU ou à la loi.
      </p>

      <h2 className="font-display text-lg font-semibold pt-2">10. Droit applicable</h2>
      <p>
        Les présentes CGU sont régies par le droit béninois. Tout litige relevant des tribunaux
        compétents du Bénin, sous réserve des règles d’ordre public.
      </p>

      <h2 className="font-display text-lg font-semibold pt-2">11. Contact</h2>
      <p>
        Email : <a href="mailto:koyaapay@gmail.com">koyaapay@gmail.com</a>
        <br />
        Téléphone / WhatsApp : +229 01 62 43 47 07
      </p>

      <p className="text-ink-soft text-xs pt-4">
        Ce document constitue un cadre contractuel de base. Pour une activité commerciale avancée,
        un conseil juridique local peut être sollicité afin d’adapter les clauses.
      </p>
    </article>
  );
}
