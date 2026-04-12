'use client';

import Link from 'next/link';
import { Shield, Heart, Users, Code, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotreModelePage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="border-b border-gray-200">
                <nav className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Retour à l'accueil
                    </Link>
                </nav>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Hero */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                        Notre Modèle
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Comment Cardz.dev reste 100% gratuit tout en protégeant votre vie privée
                    </p>
                </div>

                {/* Principle */}
                <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-8 mb-12 border border-blue-200">
                    <div className="flex items-start gap-4">
                        <Heart className="w-12 h-12 text-red-500 flex-shrink-0 mt-1" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                Notre Conviction
                            </h2>
                            <p className="text-lg text-gray-700 leading-relaxed mb-4">
                                Nous croyons que <strong>l'éducation est un bien commun, pas une marchandise</strong>.
                                L'accès aux outils d'apprentissage ne devrait pas dépendre de votre capacité à payer un abonnement mensuel.
                            </p>
                            <p className="text-lg text-gray-700 leading-relaxed">
                                Cardz.dev est né de la frustration face à la monétisation agressive des plateformes existantes,
                                qui transforment des fonctionnalités pédagogiques essentielles en produits de luxe.
                            </p>
                        </div>
                    </div>
                </div>

                {/* How we're funded */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">
                        Comment sommes-nous financés ?
                    </h2>

                    <div className="space-y-6">
                        <div className="border-l-4 border-green-500 pl-6 py-2">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <Code className="w-6 h-6 text-green-600" />
                                Projet Open Source
                            </h3>
                            <p className="text-gray-700 leading-relaxed">
                                Cardz.dev est développé comme un projet à code ouvert. Cela signifie que tout le monde peut
                                voir comment l'application fonctionne, vérifier qu'il n'y a pas de collecte de données cachée,
                                et contribuer à son amélioration.
                            </p>
                        </div>

                        <div className="border-l-4 border-blue-500 pl-6 py-2">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <Users className="w-6 h-6 text-blue-600" />
                                Soutien communautaire
                            </h3>
                            <p className="text-gray-700 leading-relaxed">
                                Les utilisateurs qui le souhaitent peuvent soutenir le projet via des dons volontaires
                                (Patreon, Ko-fi, GitHub Sponsors). Ces contributions nous aident à couvrir les coûts d'hébergement
                                et de développement, sans jamais conditionner l'accès aux fonctionnalités.
                            </p>
                        </div>

                        <div className="border-l-4 border-purple-500 pl-6 py-2">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Sponsors éthiques (futur)
                            </h3>
                            <p className="text-gray-700 leading-relaxed">
                                À l'avenir, nous pourrions accepter des parrainages d'organisations alignées avec nos valeurs
                                (fondations éducatives, universités, ONG). Ces partenariats seront toujours transparents,
                                et ne donneront jamais accès aux données utilisateurs.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Zero Resale Commitment */}
                <div className="bg-gray-900 text-white rounded-2xl p-8 mb-12">
                    <div className="flex items-start gap-4">
                        <Shield className="w-12 h-12 text-green-400 flex-shrink-0 mt-1" />
                        <div>
                            <h2 className="text-2xl font-bold mb-4">
                                Engagement "Zéro Revente"
                            </h2>
                            <p className="text-lg text-gray-300 leading-relaxed mb-4">
                                Vos emails, vos données d'apprentissage, vos statistiques de révision ne sont <strong>jamais</strong>,
                                au grand jamais, vendus ou partagés avec des publicitaires, des agrégateurs de données, ou toute autre tierce partie commerciale.
                            </p>
                            <p className="text-lg text-gray-300 leading-relaxed mb-4">
                                Les données que vous créez vous appartiennent.
                                Vous pouvez les exporter à tout moment (formats Anki, CSV), et les supprimer définitivement si vous le souhaitez.
                            </p>
                            <div className="inline-flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-full border border-green-500/50">
                                <Shield className="w-5 h-5 text-green-400" />
                                <span className="font-semibold">Conformité RGPD & COPPA</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Why Trust Us */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">
                        Pourquoi nous faire confiance ?
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                            <h3 className="font-bold text-lg mb-2">Code Open Source</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                Le code de Cardz.dev est public. N'importe quel développeur peut auditer notre code
                                et vérifier qu'il n'y a pas de pratiques douteuses.
                            </p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                            <h3 className="font-bold text-lg mb-2">Hébergement UE</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                Toutes vos données sont stockées dans l'Union Européenne, soumises au RGPD,
                                la législation la plus stricte au monde en matière de protection des données.
                            </p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                            <h3 className="font-bold text-lg mb-2">Transparence financière</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                Nous publions régulièrement nos rapports financiers (coûts d'hébergement, dons reçus)
                                pour prouver que nous n'avons aucune source de revenus cachée.
                            </p>
                        </div>
                        <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                            <h3 className="font-bold text-lg mb-2">Communauté avant tout</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                Chaque décision importante (nouvelles fonctionnalités, partenariats) est soumise à la
                                communauté via des sondages et consultations publiques.
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">
                        Questions fréquentes
                    </h2>

                    <div className="space-y-4">
                        <div className="border border-gray-200 rounded-xl p-6">
                            <h3 className="font-bold text-lg mb-2">
                                Pourquoi ne pas simplement faire une version payante "Premium" ?
                            </h3>
                            <p className="text-gray-700 leading-relaxed">
                                Parce que cela créerait une inégalité d'accès à l'apprentissage. Les fonctionnalités
                                que nous offrons (répétition espacée, IA, analytics) ne devraient pas être des privilèges
                                réservés à ceux qui peuvent payer. Nous préférons un modèle où tout le monde a accès aux
                                mêmes outils, quels que soient ses moyens.
                            </p>
                        </div>

                        <div className="border border-gray-200 rounded-xl p-6">
                            <h3 className="font-bold text-lg mb-2">
                                Et si le projet n'est plus viable financièrement ?
                            </h3>
                            <p className="text-gray-700 leading-relaxed">
                                En cas d'arrêt du projet, nous nous engageons à donner un préavis de 6 mois minimum,
                                permettre l'export total de toutes les données, et publier le code dans son intégralité
                                pour que la communauté puisse continuer à l'héberger si elle le souhaite.
                            </p>
                        </div>

                        <div className="border border-gray-200 rounded-xl p-6">
                            <h3 className="font-bold text-lg mb-2">
                                Puis-je contribuer au projet ?
                            </h3>
                            <p className="text-gray-700 leading-relaxed">
                                Absolument ! Que ce soit par un don financier, en signalant des bugs, en proposant des
                                idées de fonctionnalités, en contribuant au code, ou simplement en partageant Cardz.dev
                                autour de vous, chaque contribution compte.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-center text-white">
                    <h2 className="text-2xl font-bold mb-4">
                        Rejoignez le mouvement
                    </h2>
                    <p className="text-lg mb-6 max-w-2xl mx-auto">
                        À chaque fois que vous choisissez Cardz.dev plutôt qu'une alternative payante,
                        vous votez pour un internet plus équitable et une éducation accessible à tous.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/register">
                            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                                Créer un compte gratuit
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                                Retour à l'accueil
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 py-8 mt-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
                    <p>© {new Date().getFullYear()} Cardz.dev - L'éducation comme un droit, pas un privilège</p>
                </div>
            </footer>
        </div>
    );
}
