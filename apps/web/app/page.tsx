'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import ScrollStack, { ScrollStackItem } from '@/components/ScrollStack';
import ScrollVelocity from '@/components/ScrollVelocity';
import BlurText from '@/components/BlurText';
import DotGrid from '@/components/DotGrid';
import MagicBento from '@/components/MagicBento';
import { MarqueeDemoVertical } from '@/components/MarqueeDemoVertical';
import { BentoDemo } from '@/components/BentoDemo';

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
      answer: 'Oui. Il n\'y a pas de version payante, pas de fonctionnalités cachées derrière un abonnement, pas d\'essai limité dans le temps. Tu peux créer, réviser et partager tes Cardz sans payer.'
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
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
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
        <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden pt-20 sm:pt-28 lg:pt-36 pb-32 sm:pb-40 lg:pb-48">
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
            <div 
              ref={heroRef}
              className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <BlurText
                text="STUDY FOR FREE"
                delay={150}
                animateBy="words"
                direction="top"
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 mb-8 sm:mb-12 md:mb-16 leading-tight max-w-5xl mx-auto uppercase"
              />
              
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-700 mb-12 sm:mb-16 md:mb-20 max-w-4xl mx-auto leading-relaxed font-medium px-4">
                CARDZ, l'app 100% gratuite qui mixe révision et mini-jeux pour t'aider à assurer le jour de l'exam.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-16 sm:mb-20 md:mb-24">
                <Link href="/register">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto text-base sm:text-lg md:text-xl px-10 sm:px-12 md:px-14 py-5 sm:py-6 md:py-7 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    Créer une CARDZ
                    <ArrowRight className="ml-2 h-5 w-5 md:h-6 md:w-6" />
                  </Button>
                </Link>
              </div>

              {/* Scroll Velocity */}
              <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] mt-12 sm:mt-16 md:mt-20 overflow-hidden">
                <ScrollVelocity
                  texts={['100% gratuit ✦ Sans pub ✦ Créée par et pour les étudiants ✦', '100% gratuit ✦ Sans pub ✦ Créée par et pour les étudiants ✦']}
                  velocity={50}
                  className="text-gray-900"
                />
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="features" className="py-24 sm:py-32 lg:py-40 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <ScrollStack
                useWindowScroll={true}
                itemDistance={200}
                itemStackDistance={50}
                stackPosition="25%"
                baseScale={0.88}
                itemScale={0.03}
                rotationAmount={1.5}
                blurAmount={1.5}
              >
                {[
                  {
                    step: '1',
                    title: 'Crée tes Cardz en quelques secondes',
                    description: 'Ajoute tes notions de cours, tes définitions, tes formules ou ton vocab. Regroupe tout dans des Cardz pour chaque matière ou chapitre.',
                    icon: BookOpen,
                    color: 'from-blue-500 to-blue-600',
                    bgColor: 'bg-blue-50'
                  },
                  {
                    step: '2',
                    title: 'Choisis ton mode de révision',
                    description: 'Cardz, quiz, écriture, associations… Tu sélectionnes le mode qui te convient le mieux pour le moment, ou tu alternes pour mieux mémoriser.',
                    icon: Zap,
                    color: 'from-cyan-500 to-cyan-600',
                    bgColor: 'bg-cyan-50'
                  },
                  {
                    step: '3',
                    title: 'Joue, répète, ancre dans ta tête',
                    description: 'Tu réponds, tu te trompes, tu recommences. Les mini-jeux rendent les révisions moins chiantes et plus efficaces.',
                    icon: Target,
                    color: 'from-yellow-500 to-yellow-600',
                    bgColor: 'bg-yellow-50'
                  },
                  {
                    step: '4',
                    title: 'Suis ta progression',
                    description: 'XP, niveaux, séries de révision, stats… Tu vois concrètement tes progrès et ça te motive à continuer jusqu\'au jour J.',
                    icon: TrendingUp,
                    color: 'from-pink-500 to-pink-600',
                    bgColor: 'bg-pink-50'
                  }
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <ScrollStackItem
                      key={index}
                      itemClassName={`${item.bgColor} border-2 border-gray-200`}
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
                    </ScrollStackItem>
                  );
                })}
              </ScrollStack>
            </div>
          </div>
        </section>

        {/* Study Modes */}
        <section className="py-24 sm:py-32 lg:py-40 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 sm:mb-20 md:mb-24 scroll-animate">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 md:mb-10">
                Des modes de révision qui s'adaptent à ton cerveau
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Parce qu'on n'apprend pas tous de la même façon, CARDZ te propose plusieurs types de mini-jeux.
              </p>
            </div>

            <MagicBento
              textAutoHide={false}
              enableStars={true}
              enableSpotlight={true}
              enableBorderGlow={true}
              enableTilt={true}
              enableMagnetism={true}
              clickEffect={true}
              spotlightRadius={300}
              particleCount={12}
              glowColor="96, 165, 250"
              cardData={[
                {
                  color: '#0f172a',
                  title: 'Cardz',
                  description: 'Le classique qui fonctionne toujours. Tu retournes les cartes pour révéler la réponse et vérifier si tu maîtrises bien.',
                  label: 'Mémoire'
                },
                {
                  color: '#0f172a',
                  title: 'Quiz',
                  description: 'Questions à choix multiples pour tester tes connaissances rapidement. Parfait pour un check express avant un contrôle.',
                  label: 'Rapidité'
                },
                {
                  color: '#0f172a',
                  title: 'Écriture',
                  description: 'Tu tapes la réponse toi-même. Idéal pour vraiment ancrer les infos dans ta mémoire.',
                  label: 'Mémorisation'
                },
                {
                  color: '#0f172a',
                  title: 'Match',
                  description: 'Associe les termes à leurs définitions. Top pour le vocabulaire, les dates, les concepts clés.',
                  label: 'Association'
                }
              ]}
            />
          </div>
        </section>

        {/* App That Listens */}
        <section className="py-24 sm:py-32 lg:py-40 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-20 items-center">
              <div className="scroll-animate order-2 lg:order-1">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 md:mb-10">
                  Une app qui évolue avec tes retours
            </h2>
                <p className="text-lg sm:text-xl md:text-2xl text-gray-600 leading-relaxed mb-8 sm:mb-10">
                  CARDZ est construite avec la communauté. Chaque bug signalé, chaque idée, chaque suggestion compte. On lit tous les messages et on utilise vos retours pour améliorer l'app en continu.
                </p>
                <div className="bg-gradient-to-br from-brand-primary/10 via-brand-secondaryTeal/10 to-brand-accentPink/10 p-8 sm:p-10 md:p-12 rounded-3xl border border-brand-primary/20">
                  <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed">
                    <strong className="text-gray-900">Tu vois un bug ? Tu as une idée de nouvelle fonctionnalité ou d'un mode de jeu ?</strong> Tu peux nous contacter directement : on répond à chaque message.
                  </p>
                </div>
              </div>
              <div className="scroll-animate order-1 lg:order-2">
                <MarqueeDemoVertical />
              </div>
            </div>
          </div>
        </section>

        {/* All You Need */}
        <section className="py-24 sm:py-32 lg:py-40 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 sm:mb-20 md:mb-24 scroll-animate">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 md:mb-10">
                Tous tes cours, rangés au même endroit
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Des outils simples mais puissants pour organiser tes révisions.
              </p>
            </div>

            <div className="scroll-animate">
              <BentoDemo />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 sm:py-32 lg:py-40 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 sm:mb-20 md:mb-24 scroll-animate">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 md:mb-10">
                Questions fréquentes
              </h2>
            </div>

            <div className="space-y-6 sm:space-y-8">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="scroll-animate bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-brand-primary/50 transition-colors"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <button
                    className="w-full p-8 sm:p-10 md:p-12 text-left flex items-center justify-between gap-6 hover:bg-gray-50 transition-colors"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <span className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 flex-1 leading-relaxed">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-6 w-6 md:h-7 md:w-7 text-gray-500 flex-shrink-0 transition-transform duration-300 ${
                        openFaq === index ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-8 sm:px-10 md:px-12 pb-8 sm:pb-10 md:pb-12">
                      <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed">
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
        <section className="py-24 sm:py-32 lg:py-40 bg-gradient-to-br from-brand-primary/10 via-brand-secondaryTeal/10 to-brand-accentPink/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="scroll-animate">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 md:mb-10">
                Prêt·e à réviser autrement ?
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-12 sm:mb-16 md:mb-20 max-w-3xl mx-auto leading-relaxed">
                Crée ton compte en moins d'une minute, crée tes premières cardz et teste les modes de révision. Tu verras vite si CARDZ te convient… sans dépenser un centime.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 md:gap-8">
                <Link href="/register">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto text-base sm:text-lg md:text-xl px-10 sm:px-12 md:px-14 py-5 sm:py-6 md:py-7 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    Commencer maintenant
                    <ArrowRight className="ml-2 h-5 w-5 md:h-6 md:w-6" />
                  </Button>
                </Link>
                <Link href="/search">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto text-base sm:text-lg md:text-xl px-10 sm:px-12 md:px-14 py-5 sm:py-6 md:py-7 border-2 hover:bg-white transition-all duration-300"
                  >
                    Découvrir des Cardz publics
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
                <div className="w-6 h-6 flex items-center justify-center">
                  <Image 
                    src="/images/logo.png" 
                    alt="CARDZ Logo" 
                    width={24} 
                    height={24}
                    className="object-contain"
                  />
                </div>
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
                <li><Link href="/search" className="hover:text-white transition-colors">Découvrir des Cardz</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">S'inscrire</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Se connecter</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-base sm:text-lg">Communauté</h4>
              <ul className="space-y-2 text-sm sm:text-base text-gray-400">
                <li><a href="https://www.linkedin.com/in/lucas-roncey/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-base sm:text-lg">Légal</h4>
              <ul className="space-y-2 text-sm sm:text-base text-gray-400">
                <li><Link href="/legal/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link></li>
                <li><Link href="/legal/politique-confidentialite" className="hover:text-white transition-colors">Politique de confidentialité</Link></li>
                <li><Link href="/legal/cgu" className="hover:text-white transition-colors">CGU</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm sm:text-base text-gray-400">
            <p>© {new Date().getFullYear()} CARDZ. Tous droits réservés.</p>
            <p className="mt-2">Fait avec ❤️ pour la communauté étudiante</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
