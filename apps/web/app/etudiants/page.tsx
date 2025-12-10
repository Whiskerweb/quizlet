'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import {
    ArrowRight,
    Brain,
    Zap,
    Target,
    Users,
    TrendingUp,
    Sparkles,
    BookOpen,
    Trophy,
    Clock,
    Star,
    CheckCircle,
    Menu,
    X,
    BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import BlurText from '@/components/BlurText';
import DotGrid from '@/components/DotGrid';
import StatCard from '@/components/landing/StatCard';
import TimelineStep from '@/components/landing/TimelineStep';
import FeatureCard from '@/components/landing/FeatureCard';
import SchemaMarkup from '@/components/landing/SchemaMarkup';

export default function EtudiantsPage() {
    const [isVisible, setIsVisible] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const faqs = [
        {
            question: "C'est vraiment 100% gratuit ?",
            answer: "Oui, absolument. Pas d'abonnement, pas de fonctionnalités cachées, pas d'essai limité. Toutes les fonctionnalités sont disponibles gratuitement pour tous."
        },
        {
            question: "Comment fonctionne la répétition espacée ?",
            answer: "Notre algorithme identifie automatiquement les cartes que tu maîtrises moins bien et te les propose plus fréquemment. Plus tu révises, plus l'algorithme s'adapte pour maximiser ta rétention à long terme."
        },
        {
            question: "Puis-je utiliser Cardz hors ligne ?",
            answer: "Oui, Cardz fonctionne comme une Progressive Web App (PWA). Tu peux réviser même sans connexion internet, et tes progrès se synchronisent automatiquement quand tu te reconnectes."
        },
        {
            question: "Puis-je importer mes cartes depuis d'autres plateformes ?",
            answer: "Oui, Cardz supporte l'import depuis Anki, Quizlet (CSV) et d'autres formats standards. Tu peux aussi copier-coller tes cours directement."
        },
        {
            question: "Comment créer mes premières flashcards ?",
            answer: "Clique sur 'Créer mes flashcards', inscris-toi en 30 secondes, puis crée un nouveau set. Tu peux ajouter des cartes manuellement ou importer un fichier existant."
        },
        {
            question: "Cardz est-il adapté pour tous les types d'études ?",
            answer: "Absolument ! Que tu prépares le bac, des examens universitaires, des concours ou que tu apprennes une langue, Cardz s'adapte à tous les contenus."
        }
    ];

    return (
        <>
            {/* Enhanced Schema.org Markup */}
            <SchemaMarkup
                type="EducationalApplication"
                data={{
                    name: 'Cardz',
                    description: 'Plateforme gratuite de flashcards intelligentes avec répétition espacée pour réviser et réussir tes examens',
                    applicationCategory: 'EducationalApplication',
                    offers: {
                        '@type': 'Offer',
                        price: '0',
                        priceCurrency: 'EUR'
                    },
                    operatingSystem: 'Web, iOS, Android, Windows, Mac',
                    educationalUse: 'Révision, mémorisation, apprentissage actif',
                    audience: {
                        '@type': 'EducationalAudience',
                        educationalRole: 'student'
                    },
                }}
            />

            <div className="min-h-screen bg-white">
                {/* Header */}
                <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
                    <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16 sm:h-20">
                            <Link href="/" className="flex items-center space-x-2 group">
                                <div className="w-10 h-10 flex items-center justify-center transition-opacity group-hover:opacity-80">
                                    <Image
                                        src="/images/logo.png"
                                        alt="CARDZ Logo"
                                        width={40}
                                        height={40}
                                        className="object-contain"
                                        priority
                                    />
                                </div>
                                <span className="text-xl sm:text-2xl font-bold text-gray-900">CARDZ</span>
                            </Link>

                            {/* Desktop Navigation */}
                            <div className="hidden md:flex items-center space-x-4">
                                <Link href="/enseignants" className="px-4 py-2 text-sm text-gray-700 hover:text-brand-primary transition-colors">
                                    Pour les enseignants
                                </Link>
                                <Link href="/login">
                                    <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:border-brand-primary hover:text-brand-primary">
                                        Se connecter
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button size="sm" className="bg-brand-primary hover:bg-brand-primaryDark">
                                        S'inscrire
                                    </Button>
                                </Link>
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                className="md:hidden p-2 text-gray-700"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>

                        {/* Mobile Menu */}
                        {isMobileMenuOpen && (
                            <div className="md:hidden py-4 border-t border-gray-200">
                                <div className="flex flex-col space-y-2">
                                    <Link href="/enseignants" className="px-4 py-2 text-gray-700 hover:text-brand-primary hover:bg-gray-50 rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>
                                        Pour les enseignants
                                    </Link>
                                    <Link href="/login" className="px-4 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button variant="outline" className="w-full border-gray-300">Se connecter</Button>
                                    </Link>
                                    <Link href="/register" className="px-4 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button className="w-full bg-brand-primary">S'inscrire</Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </nav>
                </header>

                <main>
                    {/* Hero Section */}
                    <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden pt-20 sm:pt-28 lg:pt-36 pb-24 sm:pb-32">
                        {/* Background Elements */}
                        <div className="absolute inset-0 opacity-30">
                            <DotGrid
                                dotSize={6}
                                gap={20}
                                baseColor="#93C5FD"
                                activeColor="#60A5FA"
                                proximity={100}
                                shockRadius={200}
                                shockStrength={3}
                                resistance={750}
                                returnDuration={1.5}
                            />
                        </div>
                        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-secondaryTeal/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <BlurText
                                        text="RÉVISE PLUS EFFICACEMENT"
                                        delay={150}
                                        animateBy="words"
                                        direction="top"
                                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight max-w-5xl mx-auto"
                                    />
                                </motion.div>

                                <motion.p
                                    className="text-xl sm:text-2xl md:text-3xl text-gray-700 mb-4 max-w-3xl mx-auto leading-relaxed"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                >
                                    100% Gratuit. Sans Publicité.
                                </motion.p>

                                <motion.p
                                    className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                                    transition={{ duration: 0.6, delay: 0.3 }}
                                >
                                    La plateforme de flashcards intelligentes créée par et pour les étudiants
                                </motion.p>

                                <motion.div
                                    className="flex flex-col sm:flex-row justify-center gap-4 mb-16"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                >
                                    <Link href="/register">
                                        <Button size="lg" className="bg-brand-primary hover:bg-brand-primaryDark px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all">
                                            Créer mes flashcards
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                    <Link href="/search">
                                        <Button variant="outline" size="lg" className="border-gray-300 px-8 py-6 text-lg hover:border-brand-primary hover:text-brand-primary">
                                            Explorer des sets publics
                                        </Button>
                                    </Link>
                                </motion.div>
                            </div>
                        </div>
                    </section>

                    {/* Features Section */}
                    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                                    Comment Cardz t'aide à Réussir
                                </h2>
                                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                    Des outils pensés pour maximiser ta mémorisation et ta réussite
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <FeatureCard
                                    icon={Brain}
                                    title="Répétition Espacée Intelligente"
                                    description="Notre algorithme adaptatif identifie automatiquement tes points faibles et optimise tes révisions pour une rétention maximale."
                                    index={0}
                                />
                                <FeatureCard
                                    icon={Zap}
                                    title="Quiz Adaptatifs"
                                    description="Des questions qui s'ajustent à ton niveau en temps réel. Plus tu progresses, plus les défis s'adaptent."
                                    index={1}
                                />
                                <FeatureCard
                                    icon={BarChart3}
                                    title="Statistiques Détaillées"
                                    description="Suis ta progression avec des graphiques clairs. Identifie tes forces et ce qui nécessite plus de révision."
                                    index={2}
                                />
                                <FeatureCard
                                    icon={Sparkles}
                                    title="Import Facile"
                                    description="Importe tes cartes depuis Anki, Quizlet ou d'autres formats. Compatibilité maximale pour démarrer rapidement."
                                    index={3}
                                />
                                <FeatureCard
                                    icon={Target}
                                    title="Modes d'Étude Variés"
                                    description="Flashcards classiques, QCM, écriture libre, match... Alterne les formats pour ne jamais t'ennuyer."
                                    index={4}
                                />
                                <FeatureCard
                                    icon={Trophy}
                                    title="Gamification Motivante"
                                    description="XP, niveaux, séries de révision. Transforme tes révisions en un défi personnel stimulant."
                                    index={5}
                                />
                            </div>
                        </div>
                    </section>

                    {/* How it Works - Timeline */}
                    <section className="py-24 bg-white">
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                                    Comment ça marche ?
                                </h2>
                                <p className="text-xl text-gray-600">
                                    Commence à réviser en quelques minutes
                                </p>
                            </div>

                            <div className="space-y-0">
                                <TimelineStep
                                    number="1"
                                    icon={BookOpen}
                                    title="Crée tes flashcards"
                                    description="Saisis tes notions manuellement ou importe depuis Anki/Quizlet. Organise tes cartes par matière et par thème."
                                    index={0}
                                />
                                <TimelineStep
                                    number="2"
                                    icon={Brain}
                                    title="Révise intelligemment"
                                    description="Notre algorithme te présente les bonnes cartes au bon moment. Concentre-toi sur ce que tu maîtrises le moins."
                                    index={1}
                                />
                                <TimelineStep
                                    number="3"
                                    icon={TrendingUp}
                                    title="Progresse et mesure"
                                    description="Consulte tes statistiques, visualise ta courbe de progression, et ajuste ta stratégie de révision."
                                    index={2}
                                />
                                <TimelineStep
                                    number="4"
                                    icon={Trophy}
                                    title="Réussis tes exams"
                                    description="Grâce à la répétition espacée, tes connaissances sont ancrées dans ta mémoire à long terme."
                                    index={3}
                                    isLast
                                />
                            </div>
                        </div>
                    </section>

                    {/* Why Cardz */}
                    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                                    Pourquoi Choisir Cardz
                                </h2>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                                <motion.div
                                    className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200"
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0 }}
                                >
                                    <CheckCircle className="w-6 h-6 text-brand-primary flex-shrink-0 mt-1" />
                                    <div>
                                        <h3 className="font-bold text-gray-900 mb-2">100% Gratuit, Aucune Limite</h3>
                                        <p className="text-gray-600 text-sm">Toutes les fonctionnalités sans abonnement ni restriction. Crée autant de cartes que tu veux.</p>
                                    </div>
                                </motion.div>

                                <motion.div
                                    className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200"
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <CheckCircle className="w-6 h-6 text-brand-primary flex-shrink-0 mt-1" />
                                    <div>
                                        <h3 className="font-bold text-gray-900 mb-2">Algorithme Scientifique</h3>
                                        <p className="text-gray-600 text-sm">Basé sur la recherche en neurosciences pour optimiser ta mémorisation à long terme.</p>
                                    </div>
                                </motion.div>

                                <motion.div
                                    className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200"
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <CheckCircle className="w-6 h-6 text-brand-primary flex-shrink-0 mt-1" />
                                    <div>
                                        <h3 className="font-bold text-gray-900 mb-2">Disponible Partout</h3>
                                        <p className="text-gray-600 text-sm">Révise sur ton ordi, ton téléphone, ou tablette. Synchronisation automatique et mode hors ligne.</p>
                                    </div>
                                </motion.div>

                                <motion.div
                                    className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200"
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <CheckCircle className="w-6 h-6 text-brand-primary flex-shrink-0 mt-1" />
                                    <div>
                                        <h3 className="font-bold text-gray-900 mb-2">Par et Pour les Étudiants</h3>
                                        <p className="text-gray-600 text-sm">Créé par des étudiants qui connaissent tes besoins. Interface intuitive et sans distraction.</p>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </section>

                    {/* FAQ */}
                    <section className="py-24 bg-white">
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                                    Questions Fréquentes
                                </h2>
                            </div>

                            <div className="space-y-4">
                                {faqs.map((faq, index) => (
                                    <div
                                        key={index}
                                        className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-brand-primary/50 transition-colors"
                                    >
                                        <button
                                            className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                                            onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                        >
                                            <span className="text-lg font-semibold text-gray-900 flex-1">
                                                {faq.question}
                                            </span>
                                            <motion.div
                                                animate={{ rotate: openFaq === index ? 180 : 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <ArrowRight className="w-5 h-5 text-gray-500 transform rotate-90" />
                                            </motion.div>
                                        </button>
                                        {openFaq === index && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="px-6 pb-6"
                                            >
                                                <p className="text-gray-600 leading-relaxed">
                                                    {faq.answer}
                                                </p>
                                            </motion.div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Final CTA */}
                    <section className="py-24 bg-gradient-to-br from-brand-primary/10 via-white to-brand-secondaryTeal/10">
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                                Prêt à Réviser Autrement ?
                            </h2>
                            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                                Commence à réviser plus efficacement dès aujourd'hui
                            </p>
                            <Link href="/register">
                                <Button size="lg" className="bg-brand-primary hover:bg-brand-primaryDark px-12 py-7 text-xl shadow-xl hover:shadow-2xl transition-all">
                                    Créer mon compte gratuit
                                    <ArrowRight className="ml-2 h-6 w-6" />
                                </Button>
                            </Link>
                            <p className="text-sm text-gray-500 mt-6">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Inscription en 30 secondes · Aucune carte bancaire requise
                            </p>
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer className="bg-gray-900 text-white py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Image src="/images/logo.png" alt="CARDZ" width={24} height={24} />
                                    <span className="text-xl font-bold">CARDZ</span>
                                </div>
                                <p className="text-sm text-gray-400">
                                    La plateforme de flashcards intelligentes. 100% gratuite, créée par et pour les étudiants.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">Produit</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li><Link href="/enseignants" className="hover:text-white transition-colors">Pour les enseignants</Link></li>
                                    <li><Link href="/search" className="hover:text-white transition-colors">Explorer</Link></li>
                                    <li><Link href="/notre-modele" className="hover:text-white transition-colors">Notre modèle</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">Ressources</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li><Link href="/register" className="hover:text-white transition-colors">S'inscrire</Link></li>
                                    <li><Link href="/login" className="hover:text-white transition-colors">Se connecter</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">Légal</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li><Link href="/legal/politique-confidentialite" className="hover:text-white transition-colors">Confidentialité</Link></li>
                                    <li><Link href="/legal/cgu" className="hover:text-white transition-colors">CGU</Link></li>
                                    <li><Link href="/legal/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
                            <p>© {new Date().getFullYear()} Cardz. Tous droits réservés.</p>
                            <p className="mt-2">Fait avec ❤️ pour la réussite de tous les étudiants</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
