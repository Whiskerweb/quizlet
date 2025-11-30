import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { BookOpen, Users, TrendingUp, Search } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="bg-white py-12 sm:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-[28px] sm:text-[36px] md:text-[42px] lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
              Master any subject, one card at a time
            </h1>
            <p className="text-[16px] sm:text-[18px] lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
              Create flashcards, study with multiple modes, and share with others.
              The modern way to learn.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-[14px] sm:text-[16px] px-6 sm:px-8 py-3 sm:py-4">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/search" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-[14px] sm:text-[16px] px-6 sm:px-8 py-3 sm:py-4">
                  Explore Sets
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-[24px] sm:text-[28px] lg:text-3xl font-bold text-center mb-8 sm:mb-12">
              Everything you need to study effectively
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <div className="bg-white p-5 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-primary-600 mb-3 sm:mb-4" />
                <h3 className="text-[18px] sm:text-xl font-semibold mb-2 text-gray-900">Multiple Study Modes</h3>
                <p className="text-[14px] sm:text-[15px] lg:text-base text-gray-600 leading-relaxed">
                  Flashcards, Quiz, Writing, and Match modes to suit your learning style.
                </p>
              </div>
              <div className="bg-white p-5 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                <Users className="h-10 w-10 sm:h-12 sm:w-12 text-primary-600 mb-3 sm:mb-4" />
                <h3 className="text-[18px] sm:text-xl font-semibold mb-2 text-gray-900">Share & Discover</h3>
                <p className="text-[14px] sm:text-[15px] lg:text-base text-gray-600 leading-relaxed">
                  Share your sets with others or discover millions of study sets.
                </p>
              </div>
              <div className="bg-white p-5 sm:p-6 rounded-lg shadow-sm border border-gray-200 sm:col-span-2 lg:col-span-1">
                <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12 text-primary-600 mb-3 sm:mb-4" />
                <h3 className="text-[18px] sm:text-xl font-semibold mb-2 text-gray-900">Track Progress</h3>
                <p className="text-[14px] sm:text-[15px] lg:text-base text-gray-600 leading-relaxed">
                  Monitor your study sessions and see your improvement over time.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}





