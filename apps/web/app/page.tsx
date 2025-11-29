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
        <section className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Master any subject, one card at a time
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Create flashcards, study with multiple modes, and share with others.
              The modern way to learn.
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/register">
                <Button size="lg">Get Started Free</Button>
              </Link>
              <Link href="/search">
                <Button variant="outline" size="lg">
                  Explore Sets
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">
              Everything you need to study effectively
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <BookOpen className="h-12 w-12 text-primary-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Multiple Study Modes</h3>
                <p className="text-gray-600">
                  Flashcards, Quiz, Writing, and Match modes to suit your learning style.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <Users className="h-12 w-12 text-primary-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Share & Discover</h3>
                <p className="text-gray-600">
                  Share your sets with others or discover millions of study sets.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <TrendingUp className="h-12 w-12 text-primary-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
                <p className="text-gray-600">
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


