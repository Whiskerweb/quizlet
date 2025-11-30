'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { 
  BookOpen, 
  FileText, 
  Zap, 
  List, 
  Users, 
  Share2, 
  FolderOpen, 
  TrendingUp,
  Heart,
  MessageCircle,
  Sparkles,
  ArrowRight,
  Check,
  Star,
  Target,
  Clock,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.scroll-animate');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const faqs = [
    {
      question: 'Est-ce que CARDZ est vraiment 100% gratuit ?',
      answer: 'Oui. Il n\'y a pas de version payante, pas de fonctionnalités cachées derrière un abonnement, pas d\'essai limité dans le temps. Tu peux créer, réviser et partager tes sets sans payer.'
    },
    {
      question: 'Y a-t-il de la pub dans l\'app ?',
      answer: 'Non. CARDZ a été pensée pour que tu puisses rester concentré sur tes révisions. Pas de pub en plein milieu d\'un quiz ou d\'une série de flashcards.'
    },
    {
      question: 'Pour qui est faite l\'app ?',
      answer: 'Pour les lycéens, étudiants, préparationnaires, et plus largement toute personne qui a besoin de mémoriser des notions : vocabulaire, dates, formules, définitions, concepts…'
    },
    {
      question: 'Sur quels appareils puis-je utiliser CARDZ ?',
      answer: 'Tu peux utiliser CARDZ directement depuis ton navigateur. L\'app est pensée pour fonctionner aussi bien sur ordinateur que sur mobile.'
    },
    {
      question: 'Comment vous contacter si j\'ai un problème ou une idée ?',
      answer: 'Tu peux nous contacter via la page "Contact" de l\'app. On lit tous les messages et on se sert de vos retours pour décider des prochaines améliorations.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center group-hover:bg-brand-primary/20 transition-colors">
                <BookOpen className="h-5 w-5 text-brand-primary" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-gray-900">CARDZ</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <Link href="#features" className="px-4 py-2 text-sm lg:text-base text-gray-700 hover:text-brand-primary transition-colors rounded-lg hover:bg-gray-50">
                Fonctionnalités
              </Link>
              <Link href="/search" className="px-4 py-2 text-sm lg:text-base text-gray-700 hover:text-brand-primary transition-colors rounded-lg hover:bg-gray-50">
                Découvrir des sets
              </Link>
              <Link href="#community" className="px-4 py-2 text-sm lg:text-base text-gray-700 hover:text-brand-primary transition-colors rounded-lg hover:bg-gray-50">
                Communauté
              </Link>
              <Link href="#faq" className="px-4 py-2 text-sm lg:text-base text-gray-700 hover:text-brand-primary transition-colors rounded-lg hover:bg-gray-50">
                FAQ
              </Link>
              <Link href="/login" className="px-4 py-2 text-sm lg:text-base text-gray-700 hover:text-brand-primary transition-colors rounded-lg hover:bg-gray-50">
                Se connecter
              </Link>
              <Link href="/register">
                <Button size="sm" className="ml-2">
                  Commencer gratuitement
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-700 hover:text-brand-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-2">
                <Link href="#features" className="px-4 py-2 text-base text-gray-700 hover:text-brand-primary hover:bg-gray-50 rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>
                  Fonctionnalités
                </Link>
                <Link href="/search" className="px-4 py-2 text-base text-gray-700 hover:text-brand-primary hover:bg-gray-50 rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>
                  Découvrir des sets
                </Link>
                <Link href="#community" className="px-4 py-2 text-base text-gray-700 hover:text-brand-primary hover:bg-gray-50 rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>
                  Communauté
                </Link>
                <Link href="#faq" className="px-4 py-2 text-base text-gray-700 hover:text-brand-primary hover:bg-gray-50 rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>
                  FAQ
                </Link>
                <Link href="/login" className="px-4 py-2 text-base text-gray-700 hover:text-brand-primary hover:bg-gray-50 rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>
                  Se connecter
                </Link>
                <Link href="/register" className="px-4 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full">Commencer gratuitement</Button>
                </Link>
              </div>
            </div>
          )}
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden pt-12 sm:pt-16 lg:pt-20 pb-20 sm:pb-24 lg:pb-32">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-secondaryTeal/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div 
              ref={heroRef}
              className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight max-w-4xl mx-auto">
                Réviser ne devrait jamais te coûter de l'argent.
              </h1>
              
              <p className="text-xl sm:text-2xl md:text-3xl text-gray-700 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed font-medium">
                Avec CARDZ, révise tes cours gratuitement grâce à des flashcards et des mini-jeux pensés pour t'aider à réussir tes exams.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-8 sm:mb-12">
                <Link href="/register">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    Commencer gratuitement
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/search">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 border-2 hover:bg-gray-50 transition-all duration-300"
                  >
                    Voir des sets créés par la communauté
                  </Button>
                </Link>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 rounded-full">
                  <Check className="h-4 w-4 text-brand-primary" />
                  <span className="text-sm sm:text-base font-medium text-gray-700">100% gratuit</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 rounded-full">
                  <Check className="h-4 w-4 text-brand-primary" />
                  <span className="text-sm sm:text-base font-medium text-gray-700">Sans pub</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 rounded-full">
                  <Check className="h-4 w-4 text-brand-primary" />
                  <span className="text-sm sm:text-base font-medium text-gray-700">Créée par et pour les étudiants</span>
                </div>
              </div>
            </div>

            {/* Animated Cards Deck */}
            <div className="mt-16 sm:mt-20 lg:mt-24 relative h-64 sm:h-80 lg:h-96 flex items-center justify-center">
              <div className="relative w-full max-w-2xl">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="absolute w-48 sm:w-64 lg:w-80 h-64 sm:h-80 lg:h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 transform transition-all duration-1000 hover:scale-105"
                    style={{
                      left: `${i * 20}%`,
                      top: `${i * 10}px`,
                      transform: `rotate(${i * 5 - 5}deg) translateY(${Math.sin(i) * 10}px)`,
                      animation: `float-${i} 3s ease-in-out infinite`,
                      animationDelay: `${i * 0.3}s`,
                    }}
                  >
                    <div className="p-6 sm:p-8 h-full flex flex-col justify-between">
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Question ?</div>
                      <div className="text-lg sm:text-xl text-gray-600">Réponse</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Promises Banner */}
        <section className="py-8 sm:py-12 bg-gradient-to-r from-brand-primary/5 via-brand-secondaryTeal/5 to-brand-accentPink/5 border-y border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-center">
              <div className="scroll-animate">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Aucune carte bloquée</div>
                <div className="text-base sm:text-lg text-gray-600">derrière un paywall</div>
              </div>
              <div className="scroll-animate">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Aucune pub</div>
                <div className="text-base sm:text-lg text-gray-600">qui coupe ta concentration</div>
              </div>
              <div className="scroll-animate">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Des fonctionnalités</div>
                <div className="text-base sm:text-lg text-gray-600">construites avec les retours de la communauté</div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="features" className="py-16 sm:py-20 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16 scroll-animate">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                Réviser avec CARDZ, c'est simple :
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                Tu ouvres l'app, tu crées tes cartes, tu joues avec les modes de révision, et tu vois ta progression monter.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {[
                {
                  step: '1',
                  title: 'Crée tes sets en quelques secondes',
                  description: 'Ajoute tes notions de cours, tes définitions, tes formules ou ton vocab. Regroupe tout dans des sets pour chaque matière ou chapitre.',
                  icon: BookOpen,
                  color: 'from-blue-500 to-blue-600'
                },
                {
                  step: '2',
                  title: 'Choisis ton mode de révision',
                  description: 'Flashcards, quiz, écriture, associations… Tu sélectionnes le mode qui te convient le mieux pour le moment, ou tu alternes pour mieux mémoriser.',
                  icon: Zap,
                  color: 'from-cyan-500 to-cyan-600'
                },
                {
                  step: '3',
                  title: 'Joue, répète, ancre dans ta tête',
                  description: 'Tu réponds, tu te trompes, tu recommences. Les mini-jeux rendent les révisions moins chiantes et plus efficaces.',
                  icon: Target,
                  color: 'from-yellow-500 to-yellow-600'
                },
                {
                  step: '4',
                  title: 'Suis ta progression',
                  description: 'XP, niveaux, séries de révision, stats… Tu vois concrètement tes progrès et ça te motive à continuer jusqu\'au jour J.',
                  icon: TrendingUp,
                  color: 'from-pink-500 to-pink-600'
                }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="scroll-animate bg-white p-6 sm:p-8 rounded-2xl border-2 border-gray-200 hover:border-brand-primary/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center text-white font-bold text-xl`}>
                        {item.step}
                      </div>
                      <Icon className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                      {item.title}
                    </h3>
                    <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Study Modes */}
        <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16 scroll-animate">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                Des modes de révision qui s'adaptent à ton cerveau
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-4">
                Parce qu'on n'apprend pas tous de la même façon, CARDZ te propose plusieurs types de mini-jeux.
              </p>
              <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
                Tu peux rester sur ton mode préféré ou alterner pour booster ta mémorisation. D'autres modes pourront être ajoutés au fur et à mesure grâce aux retours de la communauté.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {[
                {
                  id: 'flashcard',
                  icon: BookOpen,
                  title: 'Flashcards',
                  description: 'Le classique qui fonctionne toujours. Tu retournes les cartes pour révéler la réponse et vérifier si tu maîtrises bien.',
                  color: 'from-blue-500 to-blue-600',
                  bgColor: 'bg-blue-50',
                  borderColor: 'border-blue-200'
                },
                {
                  id: 'quiz',
                  icon: FileText,
                  title: 'Quiz',
                  description: 'Questions à choix multiples pour tester tes connaissances rapidement. Parfait pour un check express avant un contrôle.',
                  color: 'from-cyan-500 to-cyan-600',
                  bgColor: 'bg-cyan-50',
                  borderColor: 'border-cyan-200'
                },
                {
                  id: 'writing',
                  icon: Zap,
                  title: 'Écriture',
                  description: 'Tu tapes la réponse toi-même. Idéal pour vraiment ancrer les infos dans ta mémoire.',
                  color: 'from-yellow-500 to-yellow-600',
                  bgColor: 'bg-yellow-50',
                  borderColor: 'border-yellow-200'
                },
                {
                  id: 'match',
                  icon: List,
                  title: 'Match',
                  description: 'Associe les termes à leurs définitions. Top pour le vocabulaire, les dates, les concepts clés.',
                  color: 'from-pink-500 to-pink-600',
                  bgColor: 'bg-pink-50',
                  borderColor: 'border-pink-200'
                }
              ].map((mode, index) => {
                const Icon = mode.icon;
                return (
                  <div
                    key={mode.id}
                    className={`scroll-animate ${mode.bgColor} p-6 sm:p-8 rounded-2xl border-2 ${mode.borderColor} hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`w-16 h-16 bg-gradient-to-br ${mode.color} rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                      {mode.title}
                    </h3>
                    <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                      {mode.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* For Students, Not Profit */}
        <section className="py-16 sm:py-20 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16 scroll-animate">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                On a créé CARDZ pour toi, pas pour faire du profit
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-8 sm:mb-12">
              <div className="scroll-animate bg-gradient-to-br from-blue-50 to-indigo-50 p-6 sm:p-8 lg:p-12 rounded-3xl border border-blue-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-brand-primary rounded-xl flex items-center justify-center">
                    <Heart className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                      100% gratuit, pour toujours
                    </h3>
                    <p className="text-lg sm:text-xl font-semibold text-gray-700">
                      Pas de freemium. Pas d'abonnement. Pas de piège.
                    </p>
                  </div>
                </div>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                  Sur CARDZ, tout est débloqué dès le début. Tu peux créer autant de sets que tu veux, réviser avec tous les modes de jeu et accéder aux sets communautaires sans sortir ta carte bancaire. On est convaincus que l'éducation ne devrait pas être un luxe.
                </p>
              </div>

              <div className="scroll-animate bg-gradient-to-br from-cyan-50 to-blue-50 p-6 sm:p-8 lg:p-12 rounded-3xl border border-cyan-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-brand-secondaryTeal rounded-xl flex items-center justify-center">
                    <Sparkles className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                      Sans pub, sans interruption
                    </h3>
                    <p className="text-lg sm:text-xl font-semibold text-gray-700">
                      Ton attention est déjà assez sollicitée comme ça.
                    </p>
                  </div>
                </div>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                  Aucune pub qui surgit en plein milieu d'un exercice. Aucun écran sponsorisé. Tu ouvres l'app, tu révises, point.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* App That Listens */}
        <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16 scroll-animate">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                Une app qui évolue avec tes retours
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                CARDZ est construite avec la communauté. Chaque bug signalé, chaque idée, chaque suggestion compte. On lit tous les messages et on utilise vos retours pour améliorer l'app en continu.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
              {[
                'Service contact réactif : tu peux nous écrire dès que tu as un souci ou une idée.',
                'Mises à jour régulières basées sur les retours des étudiants.',
                'Une app pensée avec vous, pas dans un bureau coupé de la réalité.'
              ].map((point, index) => (
                <div
                  key={index}
                  className="scroll-animate bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <MessageCircle className="h-8 w-8 text-brand-primary mb-4" />
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>

            <div className="scroll-animate bg-gradient-to-br from-brand-primary/10 via-brand-secondaryTeal/10 to-brand-accentPink/10 p-6 sm:p-8 lg:p-12 rounded-3xl border border-brand-primary/20">
              <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed text-center">
                <strong className="text-gray-900">Tu vois un bug ? Tu as une idée de nouvelle fonctionnalité ou d'un mode de jeu ?</strong> Tu peux nous contacter directement : on répond à chaque message.
              </p>
            </div>
          </div>
        </section>

        {/* All You Need */}
        <section className="py-16 sm:py-20 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16 scroll-animate">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                Tous tes cours, rangés au même endroit
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                Des outils simples mais puissants pour organiser tes révisions.
              </p>
            </div>

            <div className="space-y-12 sm:space-y-16 lg:space-y-20">
              {/* Create & Organize */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                <div className="scroll-animate order-2 lg:order-1">
                  <div className="bg-gradient-to-br from-brand-primary/10 to-brand-secondaryTeal/10 p-6 sm:p-8 lg:p-12 rounded-3xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        Crée et organise tes sets
                      </h3>
                    </div>
                    <ul className="space-y-4">
                      {[
                        'Crée tes propres sets à partir de tes cours.',
                        'Ajoute définitions, notions, formules, dates importantes…',
                        'Classe tes sets par matières, chapitres ou dossiers pour t\'y retrouver facilement.',
                        'Interface de création simple et intuitive, pensée pour aller vite.'
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-base sm:text-lg text-gray-700">
                          <Check className="h-5 w-5 text-brand-primary flex-shrink-0 mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="scroll-animate order-1 lg:order-2">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl p-8 sm:p-12 aspect-square flex items-center justify-center">
                    <FolderOpen className="h-32 w-32 sm:h-40 sm:w-40 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Share & Discover */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                <div className="scroll-animate">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl p-8 sm:p-12 aspect-square flex items-center justify-center">
                    <Share2 className="h-32 w-32 sm:h-40 sm:w-40 text-gray-400" />
                  </div>
                </div>
                <div className="scroll-animate">
                  <div className="bg-gradient-to-br from-brand-secondaryTeal/10 to-brand-primary/10 p-6 sm:p-8 lg:p-12 rounded-3xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-brand-secondaryTeal rounded-xl flex items-center justify-center">
                        <Share2 className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        Partage et découvre
                      </h3>
                    </div>
                    <ul className="space-y-4">
                      {[
                        'Partage tes sets avec tes potes en un lien.',
                        'Choisis si tes sets sont publics ou privés.',
                        'Protège certains sets avec un mot de passe si tu veux garder ton contenu pour ton groupe ou ta classe.',
                        'Découvre des sets créés par d\'autres étudiants sur les mêmes matières que toi.'
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-base sm:text-lg text-gray-700">
                          <Check className="h-5 w-5 text-brand-secondaryTeal flex-shrink-0 mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                <div className="scroll-animate order-2 lg:order-1">
                  <div className="bg-gradient-to-br from-brand-accentYellow/10 to-brand-accentPink/10 p-6 sm:p-8 lg:p-12 rounded-3xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-brand-accentYellow to-brand-accentPink rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        Suis ta progression & reste motivé
                      </h3>
                    </div>
                    <ul className="space-y-4">
                      {[
                        'Système d\'XP et de niveaux pour mesurer tes efforts.',
                        'Achievements à débloquer au fur et à mesure de tes révisions.',
                        'Statistiques pour voir ce que tu maîtrises déjà et ce que tu dois encore bosser.',
                        'Séries de révision (streaks) pour garder le rythme jour après jour.'
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-base sm:text-lg text-gray-700">
                          <Check className="h-5 w-5 text-brand-accentPink flex-shrink-0 mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="scroll-animate order-1 lg:order-2">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl p-8 sm:p-12 aspect-square flex items-center justify-center">
                    <TrendingUp className="h-32 w-32 sm:h-40 sm:w-40 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Community & Stats */}
        <section id="community" className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16 scroll-animate">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                Tu n'es pas seul à réviser avec CARDZ
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-4">
                Une communauté d'étudiants qui utilisent l'app pour préparer leurs exams, concours et partiels.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
              {[
                { icon: Users, value: '1000+', label: 'Utilisateurs actifs', color: 'text-brand-primary' },
                { icon: BookOpen, value: '5000+', label: 'Sets créés', color: 'text-brand-secondaryTeal' },
                { icon: Star, value: '4.8 / 5', label: 'Satisfaction moyenne', color: 'text-brand-accentYellow' }
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="scroll-animate bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 text-center"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`w-16 h-16 ${stat.color.replace('text-', 'bg-')}/10 rounded-xl flex items-center justify-center mx-auto mb-4`}>
                      <Icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                    <div className={`text-4xl sm:text-5xl font-bold ${stat.color} mb-2`}>
                      {stat.value}
                    </div>
                    <div className="text-base sm:text-lg text-gray-600">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="scroll-animate text-center">
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                Derrière ces chiffres, il y a des lycéens, des étudiants, des personnes en reconversion… qui ont tous le même objectif : réussir leurs examens sans se ruiner dans des abonnements.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 sm:py-20 lg:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16 scroll-animate">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                Questions fréquentes
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="scroll-animate bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-brand-primary/50 transition-colors"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <button
                    className="w-full p-6 sm:p-8 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <span className="text-lg sm:text-xl font-semibold text-gray-900 flex-1">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${
                        openFaq === index ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                      <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-brand-primary/10 via-brand-secondaryTeal/10 to-brand-accentPink/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="scroll-animate">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                Prêt·e à réviser autrement ?
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
                Crée ton compte en moins d'une minute, commence ton premier set et teste les modes de révision. Tu verras vite si CARDZ te convient… sans dépenser un centime.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
                <Link href="/register">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    Commencer maintenant
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/search">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 border-2 hover:bg-white transition-all duration-300"
                  >
                    Découvrir des sets publics
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-6 w-6 text-brand-primary" />
                <span className="text-xl font-bold">CARDZ</span>
              </div>
              <p className="text-gray-400 text-sm sm:text-base">
                L'app de révision 100% gratuite, créée par et pour la communauté étudiante.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-base sm:text-lg">Produit</h4>
              <ul className="space-y-2 text-sm sm:text-base text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors">Fonctionnalités</Link></li>
                <li><Link href="/search" className="hover:text-white transition-colors">Découvrir des sets</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">S'inscrire</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Se connecter</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-base sm:text-lg">Communauté</h4>
              <ul className="space-y-2 text-sm sm:text-base text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-base sm:text-lg">Légal</h4>
              <ul className="space-y-2 text-sm sm:text-base text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Mentions légales</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a></li>
                <li><a href="#" className="hover:text-white transition-colors">CGU</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm sm:text-base text-gray-400">
            <p>© {new Date().getFullYear()} CARDZ. Tous droits réservés.</p>
            <p className="mt-2">Fait avec ❤️ pour la communauté étudiante</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float-0 {
          0%, 100% { transform: rotate(-5deg) translateY(0px); }
          50% { transform: rotate(-3deg) translateY(-10px); }
        }
        @keyframes float-1 {
          0%, 100% { transform: rotate(0deg) translateY(0px); }
          50% { transform: rotate(2deg) translateY(-10px); }
        }
        @keyframes float-2 {
          0%, 100% { transform: rotate(5deg) translateY(0px); }
          50% { transform: rotate(7deg) translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
