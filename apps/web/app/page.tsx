'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Menu, X, UserPlus, FileText, BookOpen, Gamepad2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [carouselImages] = useState([
    '/caroussel/1.png',
    '/caroussel/2.png',
    '/caroussel/3.png',
    '/caroussel/4.png',
    '/caroussel/5.png',
    '/caroussel/6.png',
    '/caroussel/7.png',
  ]);

  // Infinite scroll carousel with proper loop
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    let animationFrame: number;
    let scrollPosition = 0;
    const scrollSpeed = 0.5;
    let isUserScrolling = false;
    let scrollTimeout: NodeJS.Timeout;

    // Calculate the width of one set of images
    const getSingleSetWidth = () => {
      const firstImage = carousel.querySelector('a');
      if (!firstImage) return 0;
      const imageWidth = (firstImage as HTMLElement).offsetWidth;
      const gap = 16; // gap-4 = 1rem = 16px
      return (imageWidth + gap) * carouselImages.length;
    };

    const scroll = () => {
      if (!isPaused && !isUserScrolling) {
        scrollPosition += scrollSpeed;
        carousel.scrollLeft = scrollPosition;

        const singleSetWidth = getSingleSetWidth();
        // When we've scrolled through one set, reset seamlessly
        if (scrollPosition >= singleSetWidth) {
          scrollPosition = 0;
          carousel.scrollLeft = 0;
        }
      }

      animationFrame = requestAnimationFrame(scroll);
    };

    // Handle user scroll
    const handleScroll = () => {
      isUserScrolling = true;
      scrollPosition = carousel.scrollLeft;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isUserScrolling = false;
      }, 150);
    };

    // Start auto-scroll
    animationFrame = requestAnimationFrame(scroll);
    carousel.addEventListener('scroll', handleScroll);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      carousel.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [isPaused, carouselImages.length]);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header - Barre flottante */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl">
        <nav className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-full shadow-lg px-4 sm:px-6">
          <div className="flex justify-between items-center h-12 sm:h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 flex items-center justify-center transition-opacity group-hover:opacity-80">
                <Image 
                  src="/images/logo.png" 
                  alt="CARDZ Logo" 
                  width={32} 
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-lg sm:text-xl font-bold text-gray-900">CARDZ</span>
            </Link>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center space-x-2">
              <Link href="/register">
                <Button variant="outline" size="sm" className="border-gray-200 text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9 rounded-full">
                  + Créer
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="bg-brand-primary hover:bg-brand-primaryDark text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9 rounded-full">
                  Se connecter
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-700 hover:text-brand-primary transition-colors rounded-full"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-3 border-t border-gray-200 mt-2">
              <div className="flex flex-col space-y-2">
                <Link href="/login" className="px-4 py-2 text-sm text-gray-700 hover:text-brand-primary hover:bg-gray-50 rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>
                  Se connecter
                </Link>
                <Link href="/register" className="px-4 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full rounded-full">+ Créer</Button>
                </Link>
              </div>
            </div>
          )}
        </nav>
      </header>

      <main className="pt-20 sm:pt-24">
        {/* Hero Section */}
        <section className="relative bg-white py-[9px]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Apprendre n'a jamais été aussi simple (ni aussi fun).
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                Transformez vos corvées de révision en sessions de jeu. Flashcards, tests et activités : CARDZ rend l'apprentissage interactif et addictif.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-4">
                <Link href="/register">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 bg-brand-primary hover:bg-brand-primaryDark"
                  >
                    S'inscrire gratuitement
                  </Button>
                </Link>
              </div>
              <Link href="/register" className="text-brand-primary hover:underline text-sm sm:text-base">
                Je suis enseignant
              </Link>
            </div>
          </div>
        </section>

        {/* Carousel Section */}
        <section 
          className="pt-4 pb-20 sm:pb-24 bg-white relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="relative group/carousel py-0">
            {/* Navigation Buttons - Show on hover */}
            <button
              onClick={() => {
                if (carouselRef.current) {
                  const scrollAmount = carouselRef.current.offsetWidth * 0.8;
                  carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                }
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hover:bg-gray-50 hover:shadow-xl"
              aria-label="Précédent"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (carouselRef.current) {
                  const scrollAmount = carouselRef.current.offsetWidth * 0.8;
                  carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                }
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hover:bg-gray-50 hover:shadow-xl"
              aria-label="Suivant"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Infinite Carousel Container */}
            <div className="overflow-hidden">
              <div
                ref={carouselRef}
                className="flex gap-4 scrollbar-hide"
                style={{
                  scrollBehavior: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  overflowX: 'auto',
                  overflowY: 'visible',
                }}
              >
                {/* Duplicate images for infinite scroll (3 sets for seamless loop) */}
                {[...carouselImages, ...carouselImages, ...carouselImages].map((image, index) => {
                  const imageIndex = index % carouselImages.length;
                  return (
                    <Link
                      key={`${image}-${index}`}
                      href="/register"
                      className="group/item flex-shrink-0 relative cursor-pointer block"
                      style={{ 
                        paddingTop: '60px',
                        paddingBottom: '60px',
                      }}
                    >
                      {/* Container that grows with the image - extra padding prevents crop */}
                      <div className="relative w-[280px] h-[350px] sm:w-[320px] sm:h-[400px] lg:w-[360px] lg:h-[450px] transition-all duration-500 ease-out group-hover/item:scale-110 origin-center will-change-transform">
                        <Image
                          src={image}
                          alt={`Carousel image ${imageIndex + 1}`}
                          fill
                          className="object-contain transition-transform duration-500 ease-out"
                          sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 360px"
                          priority={index < 7}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap Section - From Registration to Games */}
        <section className="py-16 sm:py-20 lg:py-24 bg-white relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            {/* Section Header */}
            <header className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Votre parcours d'apprentissage
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                De l'inscription à la maîtrise, découvrez comment CARDZ transforme chaque étape de votre apprentissage en expérience ludique et efficace.
              </p>
            </header>

            {/* Timeline Container */}
            <div className="relative">
              {/* Central Timeline Line */}
              <motion.div 
                className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full hidden md:block overflow-hidden"
                initial={{ opacity: 0, scaleY: 0 }}
                whileInView={{ opacity: 1, scaleY: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ transformOrigin: 'top' }}
              >
                {/* Base line with gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 rounded-full"></div>
                {/* Animated shine effect */}
                <div 
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-transparent rounded-full"
                  style={{
                    animation: 'timeline-shine 3s ease-in-out infinite',
                  }}
                ></div>
              </motion.div>
              

              {/* Timeline Steps */}
              <div className="space-y-12 sm:space-y-16 md:space-y-20">
                {/* Step 1: Inscription - Left Side */}
                <motion.article
                  className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8"
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  {/* Timeline Node */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-900 rounded-full z-10 hidden md:block"></div>
                  
                  {/* Content Card - Left Side */}
                  <div className="w-full md:w-[calc(50%-3rem)] md:pr-8 flex-shrink-0">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8 hover:shadow-xl transition-shadow duration-300 overflow-visible">
                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Image - avec effet qui sort de la box */}
                        <div className="w-full sm:w-52 h-64 rounded-xl flex items-center justify-center flex-shrink-0 relative bg-transparent overflow-visible -ml-4 sm:-ml-6 -mt-4 sm:-mt-6">
                          <div className="relative w-full h-full flex items-center justify-center" style={{ transform: 'rotate(-12deg)' }}>
                            <Image
                              src="/images/parcrours/phone.png"
                              alt="CARDZ app mobile optimisée"
                              width={240}
                              height={240}
                              className="object-contain"
                              style={{
                                filter: 'drop-shadow(0 25px 35px rgba(0, 0, 0, 0.2))',
                              }}
                              priority
                            />
                          </div>
                        </div>
                        
                        {/* Text Content */}
                        <div className="flex-1">
                          <h3 className="text-[16px] font-bold text-gray-900 mb-3">
                            Disponible en app web
                          </h3>
                          <p className="text-[13px] text-gray-600 leading-relaxed mb-6">
                            La version mobile est 100% adaptée mobile. Accédez à tous les outils d'apprentissage CARDZ depuis votre navigateur, où que vous soyez.
                          </p>
                          <Link href="/register">
                            <Button className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold">
                              Je crée mon compte
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Empty space for right side on desktop */}
                  <div className="hidden md:block w-[calc(50%-3rem)]"></div>
                </motion.article>

                {/* Step 2: Création - Right Side */}
                <motion.article
                  className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8"
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  {/* Timeline Node */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-900 rounded-full z-10 hidden md:block"></div>
                  
                  {/* Empty space for left side on desktop */}
                  <div className="hidden md:block w-[calc(50%-3rem)]"></div>
                  
                  {/* Content Card - Right Side */}
                  <div className="w-full md:w-[calc(50%-3rem)] md:pl-8 flex-shrink-0">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8 hover:shadow-xl transition-shadow duration-300 overflow-visible">
                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Text Content */}
                        <div className="flex-1 order-2 sm:order-1">
                          <h3 className="text-[16px] font-bold text-gray-900 mb-3">
                            Créez vos sets de <span className="text-gray-400 line-through decoration-2 decoration-gray-400/70 relative">
                              flashcards
                            </span> <span className="text-gray-900">cardz</span>
                          </h3>
                          <p className="text-[13px] text-gray-600 leading-relaxed mb-6">
                            Créez vos cardz avec du texte, des images et de l'audio. Organisez-les par matière ou explorez ceux de la communauté.
                          </p>
                          <Link href="/register">
                            <Button className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold">
                              Je crée mes flashcards
                            </Button>
                          </Link>
                        </div>
                        
                        {/* Image - avec effet qui sort de la box */}
                        <div className="w-full sm:w-64 h-80 rounded-xl flex items-center justify-center flex-shrink-0 relative bg-transparent overflow-visible -mr-6 sm:-mr-8 -mt-6 sm:-mt-8 order-1 sm:order-2">
                          <div className="relative w-full h-full flex items-center justify-center" style={{ transform: 'rotate(12deg)' }}>
                            <Image
                              src="/images/parcrours/happy.png"
                              alt="Création de cardz"
                              width={320}
                              height={320}
                              className="object-contain"
                              style={{
                                filter: 'drop-shadow(0 25px 35px rgba(0, 0, 0, 0.2))',
                              }}
                              priority
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.article>

                {/* Step 3: Étude - Left Side */}
                <motion.article
                  className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8"
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  {/* Timeline Node */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-900 rounded-full z-10 hidden md:block"></div>
                  
                  {/* Content Card - Left Side */}
                  <div className="w-full md:w-[calc(50%-3rem)] md:pr-8 flex-shrink-0">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8 hover:shadow-xl transition-shadow duration-300 overflow-visible">
                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Image */}
                        <div className="w-full sm:w-48 h-48 rounded-xl flex items-center justify-center flex-shrink-0 order-1 sm:order-1 overflow-visible">
                          <Image
                            src="/images/parcrours/cerveau.png"
                            alt="Apprentissage espacé"
                            width={192}
                            height={192}
                            className="object-contain w-full h-full"
                            priority
                          />
                        </div>
                        
                        {/* Text Content */}
                        <div className="flex-1 order-2 sm:order-2">
                          <h3 className="text-[16px] font-bold text-gray-900 mb-3">
                            Apprentissage espacé
                          </h3>
                          <p className="text-[13px] text-gray-600 leading-relaxed mb-6">
                            Notre système d'apprentissage espacé optimise votre mémorisation en vous faisant réviser au bon moment, pour une rétention à long terme maximale.
                          </p>
                          <Link href="/register">
                            <Button className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold">
                              Je commence à réviser
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Empty space for right side on desktop */}
                  <div className="hidden md:block w-[calc(50%-3rem)]"></div>
                </motion.article>

                {/* Step 4: Jeux - Right Side */}
                <motion.article
                  className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8"
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  {/* Timeline Node */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-900 rounded-full z-10 hidden md:block"></div>
                  
                  {/* Empty space for left side on desktop */}
                  <div className="hidden md:block w-[calc(50%-3rem)]"></div>
                  
                  {/* Content Card - Right Side */}
                  <div className="w-full md:w-[calc(50%-3rem)] md:pl-8 flex-shrink-0">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8 hover:shadow-xl transition-shadow duration-300 overflow-visible">
                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Text Content */}
                        <div className="flex-1 order-2 sm:order-1">
                          <h3 className="text-[16px] font-bold text-gray-900 mb-3">
                            Rejoignez vos classes avec My Class
                          </h3>
                          <p className="text-[13px] text-gray-600 leading-relaxed mb-6">
                            Rejoignez les classes de vos professeurs avec un simple code. Accédez à leurs modules de cardz et étudiez directement depuis votre espace.
                          </p>
                          <Link href="/register">
                            <Button className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold">
                              Découvrir My Class
                            </Button>
                          </Link>
                        </div>
                        
                        {/* Image */}
                        <div className="w-full sm:w-48 h-48 rounded-xl flex items-center justify-center flex-shrink-0 order-1 sm:order-2 overflow-visible">
                          <Image
                            src="/images/parcrours/prof.png"
                            alt="My Class - Rejoindre une classe"
                            width={192}
                            height={192}
                            className="object-contain w-full h-full"
                            priority
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.article>
              </div>
            </div>
          </div>
        </section>

        {/* Section Enseignants - plein écran pastel */}
        <section className="py-14 bg-sky-50 relative">
          <motion.div
            className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-10"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {/* Contenu texte */}
            <div className="flex-1 text-center md:text-left">
              <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 mb-4 shadow-sm">
                Pensé pour l'enseignement
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 leading-tight">
                CARDZ, votre allié pour faire progresser toute la classe.
              </h2>
              <p className="text-base sm:text-lg text-slate-700 mb-8 leading-relaxed max-w-xl mx-auto md:mx-0">
                Créez des classes, partagez vos modules de cardz et vos évaluations à vos élèves en quelques clics, puis suivez leur progression depuis un espace unique, pensé pour les enseignants.
              </p>
              <div className="flex items-center justify-center md:justify-start">
                <Link href="/enseignants">
                  <Button className="bg-slate-900 text-white hover:bg-slate-800 px-7 py-3 text-sm sm:text-base rounded-full font-semibold shadow-md">
                    Découvrir CARDZ pour les enseignants
                  </Button>
                </Link>
              </div>
            </div>

            {/* Image */}
            <div className="w-full md:w-1/2 h-64 md:h-96 relative mt-10 md:mt-0">
              <Image
                src="/images/parcrours/CTAPROF.png"
                alt="CARDZ pour les enseignants"
                fill
                className="object-contain md:object-cover rounded-3xl"
                priority
              />
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white text-gray-900 py-8 sm:py-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-12 lg:gap-16 mb-6">
            {/* Left Section: Logo */}
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center">
                  <Image 
                    src="/images/logo.png" 
                    alt="CARDZ Logo" 
                    width={40} 
                    height={40}
                    className="object-contain"
                  />
                </div>
                <span className="text-2xl font-bold text-gray-900">CARDZ</span>
              </div>
            </div>

            {/* Right Section: Three Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12">
              {/* Contact Column */}
              <div>
                <h4 className="text-gray-700 text-sm font-semibold mb-4">Contact</h4>
                <ul className="space-y-0">
                  <li>
                    <a href="mailto:contact@cardz.app" className="text-gray-800 hover:text-gray-900 transition-colors text-sm">
                      contact@cardz.app
                    </a>
                  </li>
                </ul>
              </div>

              {/* Navigation Column */}
              <div>
                <h4 className="text-gray-700 text-sm font-semibold mb-4">Navigation</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/search" className="text-gray-800 hover:text-gray-900 transition-colors block">
                      Découvrir des Cardz
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="text-gray-800 hover:text-gray-900 transition-colors block">
                      S'inscrire
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="text-gray-800 hover:text-gray-900 transition-colors block">
                      Se connecter
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Social Column */}
              <div>
                <h4 className="text-gray-700 text-sm font-semibold mb-4">Social</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a 
                      href="https://www.linkedin.com/in/lucas-roncey/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-gray-800 hover:text-gray-900 transition-colors inline-flex items-center gap-2"
                    >
                      <span>LinkedIn</span>
                      <span className="inline-flex items-center justify-center w-4 h-4 bg-orange-500 text-white text-[10px] rounded-sm">↗</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CARDZ Image - entre les colonnes et les mentions légales */}
          <div className="flex justify-center items-center -my-6 sm:-my-8">
            <div className="relative w-full max-w-4xl sm:max-w-5xl lg:max-w-6xl">
              <Image 
                src="/images/cardz-watermark.png" 
                alt="CARDZ" 
                width={800} 
                height={200}
                className="w-full h-auto object-contain opacity-30"
                priority={false}
              />
            </div>
          </div>

          {/* Bottom Legal Strip */}
          <div className="pt-2 flex flex-col sm:flex-row justify-center items-start gap-4 text-sm text-gray-700">
            <Link href="/legal/mentions-legales" className="hover:text-gray-900 transition-colors underline">
              Mentions légales
            </Link>
            <p className="text-gray-700">
              © {new Date().getFullYear()} CARDZ, fait avec <span className="text-orange-500">❤️</span> pour la communauté étudiante - Tous droits réservés.
            </p>
          </div>
        </div>

      </footer>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes timeline-shine {
          0% {
            opacity: 0;
            transform: translateY(-100%) scaleY(2);
          }
          50% {
            opacity: 1;
            transform: translateY(0%) scaleY(1);
          }
          100% {
            opacity: 0;
            transform: translateY(100%) scaleY(2);
          }
        }
      `}</style>
    </div>
  );
}
