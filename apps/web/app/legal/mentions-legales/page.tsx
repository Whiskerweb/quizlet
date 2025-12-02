import { Navbar } from '@/components/layout/Navbar';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Mentions légales – CARDZ',
  description: 'Mentions légales de CARDZ',
};

export default function MentionsLegalesPage() {
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
            Mentions légales
          </h1>
          <p className="text-gray-600">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Éditeur du site</h2>
            <p>
              Le site CARDZ est édité par :
            </p>
            <p className="pl-4 border-l-4 border-brand-primary">
              CARDZ<br />
              Application web de révision<br />
              Email : contact@cardz.app
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Directeur de publication</h2>
            <p>
              Le directeur de publication est le responsable de l'édition du site CARDZ.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Hébergement</h2>
            <p>
              Le site CARDZ est hébergé par :
            </p>
            <p className="pl-4 border-l-4 border-brand-primary">
              Vercel Inc.<br />
              340 S Lemon Ave #4133<br />
              Walnut, CA 91789<br />
              États-Unis
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Propriété intellectuelle</h2>
            <p>
              L'ensemble du contenu du site CARDZ (textes, images, logos, icônes, etc.) est la propriété exclusive de CARDZ, sauf mention contraire. Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable de CARDZ.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Protection des données personnelles</h2>
            <p>
              Les données personnelles collectées sur le site CARDZ sont traitées conformément à notre{' '}
              <Link href="/legal/politique-confidentialite" className="text-brand-primary hover:underline">
                Politique de confidentialité
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies</h2>
            <p>
              Le site CARDZ utilise des cookies pour améliorer l'expérience utilisateur. En utilisant le site, vous acceptez l'utilisation de cookies conformément à notre politique de confidentialité.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation de responsabilité</h2>
            <p>
              CARDZ s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur le site. Cependant, CARDZ ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition sur le site.
            </p>
            <p>
              En conséquence, CARDZ décline toute responsabilité pour tout dommage résultant d'une imprécision ou d'une omission, ou pour tout dommage résultant d'une intrusion frauduleuse d'un tiers ayant entraîné une modification des informations mises à disposition sur le site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Droit applicable</h2>
            <p>
              Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux français seront seuls compétents.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact</h2>
            <p>
              Pour toute question concernant les présentes mentions légales, vous pouvez nous contacter à l'adresse suivante : contact@cardz.app
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}




