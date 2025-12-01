import { Navbar } from '@/components/layout/Navbar';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Politique de confidentialité – CARDZ',
  description: 'Politique de confidentialité de CARDZ',
};

export default function PolitiqueConfidentialitePage() {
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
            Politique de confidentialité
          </h1>
          <p className="text-gray-600">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p>
              CARDZ s'engage à protéger la vie privée de ses utilisateurs. Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et protégeons vos données personnelles lorsque vous utilisez notre application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Données collectées</h2>
            <p>
              Nous collectons les données suivantes lorsque vous utilisez CARDZ :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Données d'identification :</strong> nom d'utilisateur, adresse email, nom et prénom (optionnels)</li>
              <li><strong>Données de connexion :</strong> adresse IP, type de navigateur, système d'exploitation</li>
              <li><strong>Données d'utilisation :</strong> sets créés, cardz étudiées, progression, statistiques</li>
              <li><strong>Données de contenu :</strong> sets, cardz, dossiers créés par l'utilisateur</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Utilisation des données</h2>
            <p>
              Nous utilisons vos données personnelles pour :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fournir et améliorer nos services</li>
              <li>Gérer votre compte utilisateur</li>
              <li>Suivre votre progression et vos statistiques</li>
              <li>Vous contacter concernant votre compte ou nos services</li>
              <li>Assurer la sécurité de notre application</li>
              <li>Respecter nos obligations légales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Partage des données</h2>
            <p>
              CARDZ ne vend pas vos données personnelles à des tiers. Nous pouvons partager vos données uniquement dans les cas suivants :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Avec votre consentement :</strong> lorsque vous choisissez de partager vos sets publiquement</li>
              <li><strong>Prestataires de services :</strong> avec nos hébergeurs et fournisseurs de services techniques (Vercel, Supabase) qui nous aident à faire fonctionner l'application</li>
              <li><strong>Obligations légales :</strong> si la loi nous y oblige</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Stockage et sécurité</h2>
            <p>
              Vos données sont stockées de manière sécurisée sur les serveurs de nos prestataires (Supabase, Vercel). Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte ou destruction.
            </p>
            <p>
              Vos données sont conservées aussi longtemps que nécessaire pour fournir nos services ou conformément aux obligations légales.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Vos droits</h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Droit d'accès :</strong> vous pouvez demander une copie de vos données personnelles</li>
              <li><strong>Droit de rectification :</strong> vous pouvez corriger vos données inexactes</li>
              <li><strong>Droit à l'effacement :</strong> vous pouvez demander la suppression de vos données</li>
              <li><strong>Droit à la portabilité :</strong> vous pouvez récupérer vos données dans un format structuré</li>
              <li><strong>Droit d'opposition :</strong> vous pouvez vous opposer au traitement de vos données</li>
              <li><strong>Droit à la limitation :</strong> vous pouvez demander la limitation du traitement de vos données</li>
            </ul>
            <p className="mt-4">
              Pour exercer ces droits, contactez-nous à : contact@cardz.app
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies</h2>
            <p>
              CARDZ utilise des cookies pour améliorer votre expérience utilisateur. Les cookies sont de petits fichiers texte stockés sur votre appareil. Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela peut affecter certaines fonctionnalités de l'application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Modifications</h2>
            <p>
              Nous pouvons modifier cette politique de confidentialité à tout moment. Les modifications seront publiées sur cette page avec une date de mise à jour. Nous vous encourageons à consulter régulièrement cette page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact</h2>
            <p>
              Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, contactez-nous à : contact@cardz.app
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

