import { Navbar } from '@/components/layout/Navbar';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Conditions Générales d\'Utilisation – CARDZ',
  description: 'Conditions Générales d\'Utilisation de CARDZ',
};

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-brand-primary hover:text-brand-primary/80 transition-colors mb-6">
            <BookOpen className="h-5 w-5" />
            <span className="font-semibold">Retour à l'accueil</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-gray-600">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Objet</h2>
            <p>
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de l'application CARDZ, une plateforme de révision gratuite permettant de créer et d'étudier des cardz (cartes de révision) et de jouer à des mini-jeux éducatifs.
            </p>
            <p>
              L'utilisation de CARDZ implique l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Accès au service</h2>
            <p>
              CARDZ est une application 100% gratuite, sans publicité et sans abonnement. L'accès au service est libre et gratuit pour tous les utilisateurs.
            </p>
            <p>
              Pour utiliser certaines fonctionnalités de CARDZ, vous devez créer un compte en fournissant :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Une adresse email valide</li>
              <li>Un nom d'utilisateur (minimum 3 caractères)</li>
              <li>Un mot de passe sécurisé (minimum 6 caractères)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Utilisation du service</h2>
            <p>
              Vous vous engagez à utiliser CARDZ conformément à sa destination et dans le respect des présentes CGU. Il est strictement interdit de :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Utiliser l'application à des fins illégales ou frauduleuses</li>
              <li>Publier du contenu diffamatoire, injurieux, obscène ou contraire aux bonnes mœurs</li>
              <li>Violer les droits de propriété intellectuelle de tiers</li>
              <li>Tenter d'accéder de manière non autorisée aux systèmes de CARDZ</li>
              <li>Perturber le fonctionnement de l'application</li>
              <li>Créer plusieurs comptes pour contourner les limitations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Contenu utilisateur</h2>
            <p>
              Vous conservez tous les droits sur le contenu que vous créez sur CARDZ (sets, cardz, dossiers). En publiant du contenu, vous garantissez que :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Vous êtes le propriétaire ou avez l'autorisation d'utiliser ce contenu</li>
              <li>Le contenu ne viole aucun droit de tiers</li>
              <li>Le contenu est conforme à la législation en vigueur</li>
            </ul>
            <p className="mt-4">
              CARDZ se réserve le droit de supprimer tout contenu qui ne respecterait pas ces conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Propriété intellectuelle</h2>
            <p>
              L'application CARDZ, son design, son code source, ses fonctionnalités et tous les éléments qui la composent sont la propriété exclusive de CARDZ et sont protégés par les lois sur la propriété intellectuelle.
            </p>
            <p>
              Vous n'êtes pas autorisé à reproduire, copier, modifier, distribuer ou exploiter l'application CARDZ sans autorisation écrite préalable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Disponibilité du service</h2>
            <p>
              CARDZ s'efforce d'assurer une disponibilité continue du service. Cependant, nous ne pouvons garantir une disponibilité à 100% en raison de :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintenances programmées ou d'urgence</li>
              <li>Pannes techniques</li>
              <li>Cas de force majeure</li>
            </ul>
            <p className="mt-4">
              CARDZ se réserve le droit d'interrompre temporairement l'accès au service pour maintenance ou mise à jour.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation de responsabilité</h2>
            <p>
              CARDZ est fourni "tel quel" sans garantie d'aucune sorte. Nous ne garantissons pas que :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Le service répondra à toutes vos attentes</li>
              <li>Le service sera ininterrompu, sécurisé ou exempt d'erreurs</li>
              <li>Les résultats obtenus seront exacts ou fiables</li>
            </ul>
            <p className="mt-4">
              CARDZ ne pourra être tenu responsable des dommages directs ou indirects résultant de l'utilisation ou de l'impossibilité d'utiliser l'application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Protection des données</h2>
            <p>
              Le traitement de vos données personnelles est régi par notre{' '}
              <Link href="/legal/politique-confidentialite" className="text-brand-primary hover:underline">
                Politique de confidentialité
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Modification des CGU</h2>
            <p>
              CARDZ se réserve le droit de modifier les présentes CGU à tout moment. Les modifications seront publiées sur cette page avec une date de mise à jour. Il est de votre responsabilité de consulter régulièrement ces conditions.
            </p>
            <p>
              Votre utilisation continue de CARDZ après la publication des modifications constitue votre acceptation des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Résiliation</h2>
            <p>
              Vous pouvez supprimer votre compte à tout moment depuis les paramètres de votre profil. CARDZ se réserve également le droit de suspendre ou supprimer votre compte en cas de violation des présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Droit applicable et juridiction</h2>
            <p>
              Les présentes CGU sont régies par le droit français. En cas de litige, et après tentative de résolution amiable, les tribunaux français seront seuls compétents.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact</h2>
            <p>
              Pour toute question concernant les présentes CGU, vous pouvez nous contacter à : contact@cardz.app
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}




