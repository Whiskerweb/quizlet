'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import {
    ArrowRight,
    Users,
    BarChart3,
    Clock,
    Shield,
    Zap,
    CheckCircle,
    Menu,
    X,
    BookOpen,
    Target,
    TrendingUp,
    Download,
    Sparkles,
    Globe,
    School
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import BlurText from '@/components/BlurText';
import DotGrid from '@/components/DotGrid';
import StatCard from '@/components/landing/StatCard';
import TimelineStep from '@/components/landing/TimelineStep';
import FeatureCard from '@/components/landing/FeatureCard';
import TrustBadges from '@/components/landing/TrustBadges';
import SchemaMarkup from '@/components/landing/SchemaMarkup';

export default function EnseignantsPage() {
    const [isVisible, setIsVisible] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const faqs = [
        {
            question: "Combien coûte Cardz pour les enseignants ?",
            answer: "Cardz est 100% gratuit pour tous les enseignants, quelle que soit la taille de votre classe. Pas d'abonnement, pas de limite d'élèves, toutes les fonctionnalités incluses."
        },
        {
            question: "Comment mes élèves accèdent-ils à mes sets ?",
            answer: "Vous créez un set et le partagez avec un code simple. Les élèves entrent le code, pas besoin qu'ils créent un compte. Vous pouvez aussi créer une classe et inviter vos élèves par email."
        },
        {
            question: "Puis-je voir les progrès individuels de mes élèves ?",
            answer: "Oui, le tableau de bord vous montre les statistiques de chaque élève : temps passé, taux de réussite par notion, questions difficiles. Vous pouvez exporter ces données en CSV."
        },
        {
            question: "Est-ce conforme RGPD pour mes élèves mineurs ?",
            answer: "Absolument. Cardz est hébergé en UE, conforme RGPD et COPPA. Nous ne collectons que le strict minimum de données, jamais de données sensibles. Aucune donnée n'est vendue ou partagée."
        },
        {
            question: "Puis-je intégrer Cardz avec Google Classroom ou Teams ?",
            answer: "Oui, l'import de listes de classe depuis Google Classroom et Teams est disponible. L'export des notes vers votre LMS est aussi supporté."
        },
        {
            question: "Comment créer des quiz rapidement ?",
            answer: "Saisissez vos questions directement dans l'interface ou importez depuis vos fichiers existants (Anki, Quizlet, CSV). Vous pouvez ensuite éditer et personnaliser."
        }
    ];

    return (
        <>
            {/* Enhanced Schema.org Markup */}
            <SchemaMarkup
                type="SoftwareApplication"
                data={{
                    name: 'Cardz pour Enseignants',
                    description: 'Plateforme gratuite d\'évaluation formative et de gestion de classe avec quiz en direct, analytics et conformité RGPD',
                    applicationCategory: 'EducationalApplication',
                    offers: {
                        '@type': 'Offer',
                        price: '0',
                        priceCurrency: 'EUR'
                    },
                    operatingSystem: 'Web',
                    audience: {
                        '@type': 'EducationalAudience',
                        educationalRole: 'teacher'
                    },
                    featureList: [
                        'Quiz en direct illimités',
                        'Tableau de bord analytique',
                        'Intégration Google Classroom',
                        'Conformité RGPD',
                        'Classes illimitées'
                    ],
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
                                <div className="flex items-center gap-2">
                                    <span className="text-xl sm:text-2xl font-bold text-gray-900">CARDZ</span>
                                    <span className="text-sm text-gray-600 hidden sm:inline">pour Enseignants</span>
                                </div>
                            </Link>

                            {/* Desktop Navigation */}
                            <div className="hidden md:flex items-center space-x-4">
                                <Link href="/etudiants" className="px-4 py-2 text-sm text-gray-700 hover:text-brand-primary transition-colors">
                                    Pour les étudiants
                                </Link>
                                <Link href="/login">
                                    <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:border-brand-primary hover:text-brand-primary">
                                        Se connecter
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button size="sm" className="bg-brand-primary hover:bg-brand-primaryDark">
                                        Créer un compte enseignant
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
                                    <Link href="/etudiants" className="px-4 py-2 text-gray-700 hover:text-brand-primary hover:bg-gray-50 rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>
                                        Pour les étudiants
                                    </Link>
                                    <Link href="/login" className="px-4 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button variant="outline" className="w-full border-gray-300">Se connecter</Button>
                                    </Link>
                                    <Link href="/register" className="px-4 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button className="w-full bg-brand-primary">Créer un compte enseignant</Button>
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
                                        text="L'ENGAGEMENT EN CLASSE"
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
                                    Sans la Facture.
                                </motion.p>

                                <motion.p
                                    className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                                    transition={{ duration: 0.6, delay: 0.3 }}
                                >
                                    Outil d'évaluation formative 100% gratuit. Classes illimitées, élèves illimités, analytics complets.
                                </motion.p>

                                <motion.div
                                    className="flex flex-col sm:flex-row justify-center gap-4 mb-16"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                >
                                    <Link href="/register">
                                        <Button size="lg" className="bg-brand-primary hover:bg-brand-primaryDark px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all">
                                            Créer ma première classe
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                    <Link href="/search">
                                        <Button variant="outline" size="lg" className="border-gray-300 px-8 py-6 text-lg hover:border-brand-primary hover:text-brand-primary">
                                            Explorer des ressources
                                        </Button>
                                    </Link>
                                </motion.div>

                                <motion.div
                                    className="grid grid-cols-3 gap-8 max-w-3xl mx-auto"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                                    transition={{ duration: 0.6, delay: 0.6 }}
                                >
                                    <div>
                                        <div className="text-3xl md:text-4xl font-bold text-brand-primary">∞</div>
                                        <div className="text-sm text-gray-600 mt-1">Classes</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl md:text-4xl font-bold text-brand-primary">∞</div>
                                        <div className="text-sm text-gray-600 mt-1">Élèves</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl md:text-4xl font-bold text-brand-primary">0€</div>
                                        <div className="text-sm text-gray-600 mt-1">Pour toujours</div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </section>

                    {/* Features Section */}
                    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                                    Évaluation Formative Simplifiée
                                </h2>
                                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                    Des outils pensés pour vous faire gagner du temps et engager vos élèves
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <FeatureCard
                                    icon={Zap}
                                    title="Quiz en Direct Instantanés"
                                    description="Lancez un quiz en un clic. Vos élèves rejoignent avec un code PIN, pas besoin de compte. Résultats en temps réel."
                                    index={0}
                                />
                                <FeatureCard
                                    icon={BarChart3}
                                    title="Analytics Détaillés"
                                    description="Tableau de bord complet : taux de réussite par notion, temps passé, questions difficiles. Identifiez qui a besoin d'aide."
                                    index={1}
                                />
                                <FeatureCard
                                    icon={Globe}
                                    title="Intégration LMS"
                                    description="Import de listes depuis Google Classroom et Teams. Export des notes vers votre système de notation."
                                    index={2}
                                />
                                <FeatureCard
                                    icon={Sparkles}
                                    title="Import Facile"
                                    description="Importez vos questions depuis Anki, Quizlet ou d'autres formats. Compatibilité maximale pour démarrer rapidement."
                                    index={3}
                                />
                                <FeatureCard
                                    icon={Shield}
                                    title="Conformité RGPD"
                                    description="Hébergé en UE, conforme RGPD et COPPA. Vos données et celles de vos élèves sont protégées."
                                    index={4}
                                />
                                <FeatureCard
                                    icon={Download}
                                    title="Export de Données"
                                    description="Exportez vos résultats en CSV, Excel ou vers votre LMS. Compatibilité totale avec vos outils existants."
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
                                    Créez votre première évaluation en quelques minutes
                                </p>
                            </div>

                            <div className="space-y-0">
                                <TimelineStep
                                    number="1"
                                    icon={BookOpen}
                                    title="Créez vos questions"
                                    description="Saisissez vos questions manuellement ou importez depuis Anki, Quizlet et d'autres formats. Organisez par matière et thème."
                                    index={0}
                                />
                                <TimelineStep
                                    number="2"
                                    icon={Users}
                                    title="Invitez vos élèves"
                                    description="Partagez un simple code PIN ou invitez par classe Google Classroom. Vos élèves accèdent sans créer de compte."
                                    index={1}
                                />
                                <TimelineStep
                                    number="3"
                                    icon={TrendingUp}
                                    title="Suivez la progression"
                                    description="Visualisez en temps réel qui a réussi, qui a des difficultés. Consultez les statistiques détaillées par élève et par notion."
                                    index={2}
                                />
                                <TimelineStep
                                    number="4"
                                    icon={Target}
                                    title="Adaptez votre enseignement"
                                    description="Identifiez les concepts mal compris, ajustez vos cours, proposez des remédiations ciblées. Pédagogie différenciée facilitée."
                                    index={3}
                                    isLast
                                />
                            </div>
                        </div>
                    </section>

                    {/* Trust & Security */}
                    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                                    Sécurité et Confidentialité
                                </h2>
                                <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
                                    Conformité totale pour vos élèves et votre établissement
                                </p>
                            </div>

                            <TrustBadges />

                            <div className="mt-12 bg-white border border-gray-200 rounded-2xl p-8 max-w-3xl mx-auto">
                                <div className="flex items-start gap-4">
                                    <Shield className="w-12 h-12 text-brand-primary flex-shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-lg mb-2 text-gray-900">Notre engagement de transparence</h4>
                                        <p className="text-gray-600 leading-relaxed">
                                            Cardz est 100% gratuit car nous croyons que l'accès aux outils pédagogiques ne devrait pas dépendre du budget de l'établissement. Pas de publicité, pas de revente de données, pas de fonctionnalités cachées.
                                        </p>
                                        <Link href="/notre-modele" className="inline-flex items-center gap-2 text-brand-primary font-semibold mt-4 hover:underline">
                                            En savoir plus sur notre modèle
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Why Cardz */}
                    <section className="py-24 bg-white">
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
                                        <h3 className="font-bold text-gray-900 mb-2">100% Gratuit, Sans Limite</h3>
                                        <p className="text-gray-600 text-sm">Pas de plafond d'élèves, pas d'abonnement caché. Toutes les fonctionnalités accessibles gratuitement.</p>
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
                                        <h3 className="font-bold text-gray-900 mb-2">Gain de Temps</h3>
                                        <p className="text-gray-600 text-sm">Import facile depuis vos outils existants. Réutilisez et partagez vos ressources avec vos collègues.</p>
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
                                        <h3 className="font-bold text-gray-900 mb-2">Engagement Élève Maximal</h3>
                                        <p className="text-gray-600 text-sm">Interface ludique, résultats instantanés, gamification. Vos élèves participent activement.</p>
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
                                        <h3 className="font-bold text-gray-900 mb-2">Données Protégées</h3>
                                        <p className="text-gray-600 text-sm">Conformité RGPD et COPPA, hébergement UE. Les données de vos élèves ne sont jamais vendues.</p>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </section>

                    {/* FAQ */}
                    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
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
                                Prêt à Transformer vos Évaluations ?
                            </h2>
                            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                                Commencez à engager vos élèves dès aujourd'hui
                            </p>
                            <Link href="/register">
                                <Button size="lg" className="bg-brand-primary hover:bg-brand-primaryDark px-12 py-7 text-xl shadow-xl hover:shadow-2xl transition-all">
                                    Créer mon compte enseignant
                                    <ArrowRight className="ml-2 h-6 w-6" />
                                </Button>
                            </Link>
                            <p className="text-sm text-gray-500 mt-6">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Configuration en 2 minutes · Aucune carte bancaire requise
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
                                    Des outils pédagogiques accessibles à tous les enseignants, sans distinction de budget.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">Produit</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li><Link href="/etudiants" className="hover:text-white transition-colors">Pour les étudiants</Link></li>
                                    <li><Link href="/search" className="hover:text-white transition-colors">Bibliothèque</Link></li>
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
                            <p className="mt-2">Fait avec ❤️ pour l'éducation accessible</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
