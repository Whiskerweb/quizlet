'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, Check, Star, Shield, Zap } from 'lucide-react';
import { useParams } from 'next/navigation';

// Demo products - same as shop page
const DEMO_PRODUCTS: Record<string, {
    id: string;
    name: string;
    description: string;
    longDescription: string;
    price: number;
    currency: string;
    priceId: string;
    features: string[];
}> = {
    'prod_demo_1': {
        id: 'prod_demo_1',
        name: 'Plan Pro Mensuel',
        description: 'Accès illimité à toutes les fonctionnalités premium',
        longDescription: 'Le Plan Pro Mensuel vous donne un accès complet à toutes nos fonctionnalités avancées. Créez des sets illimités, accédez aux statistiques détaillées, et profitez de notre algorithme d\'apprentissage intelligent.',
        price: 999,
        currency: 'eur',
        priceId: 'price_demo_1',
        features: [
            'Sets de révision illimités',
            'Statistiques avancées',
            'Mode hors-ligne',
            'Synchronisation multi-appareils',
            'Support prioritaire',
            'Pas de publicité',
        ],
    },
    'prod_demo_2': {
        id: 'prod_demo_2',
        name: 'Plan Pro Annuel',
        description: 'Économisez 20% avec le paiement annuel',
        longDescription: 'Notre meilleure offre ! Payez pour l\'année et économisez 20%. Toutes les fonctionnalités Pro, plus des bonus exclusifs pour les abonnés annuels.',
        price: 9590,
        currency: 'eur',
        priceId: 'price_demo_2',
        features: [
            'Tout le Plan Pro Mensuel',
            '2 mois gratuits',
            'Accès anticipé aux nouvelles fonctionnalités',
            'Badge "Supporter" sur votre profil',
            'Exports PDF illimités',
            'API personnelle',
        ],
    },
    'prod_demo_3': {
        id: 'prod_demo_3',
        name: 'Pack Étudiant',
        description: 'Prix spécial pour les étudiants vérifiés',
        longDescription: 'Un prix réduit pour les étudiants. Vérifiez votre statut étudiant et accédez à toutes les fonctionnalités Pro à moitié prix.',
        price: 499,
        currency: 'eur',
        priceId: 'price_demo_3',
        features: [
            'Toutes les fonctionnalités Pro',
            '-50% sur l\'abonnement',
            'Vérification via Student Beans',
            'Renouvellement à prix réduit',
            'Accès aux groupes étudiants',
            'Templates de cours',
        ],
    },
};

function formatPrice(amount: number, currency: string) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(amount / 100);
}

export default function ProductPage() {
    const params = useParams();
    const productId = params.id as string;
    const product = DEMO_PRODUCTS[productId];

    const [isAdded, setIsAdded] = useState(false);
    const [trackingId, setTrackingId] = useState<string | null>(null);

    useEffect(() => {
        // Get tracking ID to confirm persistence
        const clkId = document.cookie.match(/clk_id=([^;]+)/)?.[1] ||
            localStorage.getItem('trac_clk_id') ||
            null;
        setTrackingId(clkId);

        console.log('[TRAC] Product page loaded - Click ID:', clkId);
    }, []);

    if (!product) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">Produit non trouvé</h1>
                    <Link href="/shop" className="text-blue-400 hover:text-blue-300">
                        ← Retour à la boutique
                    </Link>
                </div>
            </div>
        );
    }

    const handleAddToCart = () => {
        const cart = JSON.parse(localStorage.getItem('shop_cart') || '[]');

        const existingIndex = cart.findIndex((item: any) => item.id === product.id);
        if (existingIndex >= 0) {
            cart[existingIndex].quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }

        // Save with clk_id for attribution
        const clkId = document.cookie.match(/clk_id=([^;]+)/)?.[1] ||
            localStorage.getItem('trac_clk_id') ||
            null;

        localStorage.setItem('shop_cart', JSON.stringify(cart));
        localStorage.setItem('shop_cart_clk_id', clkId || '');

        setIsAdded(true);
        window.dispatchEvent(new Event('cart-updated'));

        setTimeout(() => setIsAdded(false), 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Header */}
            <header className="relative z-50 border-b border-white/10 backdrop-blur-xl bg-slate-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link
                            href="/shop"
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Retour à la boutique
                        </Link>

                        <Link
                            href="/shop/cart"
                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300"
                        >
                            <ShoppingCart className="w-5 h-5 text-white" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Product Image */}
                    <div className="relative">
                        <div className="aspect-square bg-gradient-to-br from-blue-500/30 to-purple-600/30 rounded-3xl flex items-center justify-center overflow-hidden border border-white/10">
                            <div className="text-9xl">💎</div>
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                        </div>

                        {/* Trust Badges */}
                        <div className="mt-6 grid grid-cols-3 gap-4">
                            {[
                                { icon: Shield, label: 'Paiement sécurisé' },
                                { icon: Zap, label: 'Activation instantanée' },
                                { icon: Star, label: 'Satisfait ou remboursé' },
                            ].map(({ icon: Icon, label }) => (
                                <div key={label} className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 rounded-xl border border-white/10">
                                    <Icon className="w-6 h-6 text-blue-400" />
                                    <span className="text-xs text-slate-400 text-center">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div>
                        <div className="mb-6">
                            <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium mb-4">
                                Offre populaire
                            </span>
                            <h1 className="text-4xl font-bold text-white mb-4">{product.name}</h1>
                            <p className="text-lg text-slate-400">{product.longDescription}</p>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-8">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                                ))}
                            </div>
                            <span className="text-slate-400">4.9/5 (128 avis vérifiés)</span>
                        </div>

                        {/* Price */}
                        <div className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-white/10 mb-8">
                            <div className="flex items-end gap-2 mb-4">
                                <span className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    {formatPrice(product.price, product.currency)}
                                </span>
                                <span className="text-slate-500 mb-2">/mois</span>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={isAdded}
                                className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${isAdded
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white hover:scale-[1.02]'
                                    }`}
                            >
                                {isAdded ? (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Ajouté au panier !
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="w-5 h-5" />
                                        Ajouter au panier
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Features */}
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-4">Ce qui est inclus :</h2>
                            <ul className="space-y-3">
                                {product.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <Check className="w-3 h-3 text-green-400" />
                                        </div>
                                        <span className="text-slate-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Debug Panel */}
                <div className="mt-12 p-4 bg-slate-800/50 rounded-xl border border-white/10">
                    <h3 className="text-white font-semibold mb-2">🔍 Debug Tracking (Product Page)</h3>
                    <div className="text-sm text-slate-400 font-mono">
                        <p>Click ID survit à la navigation: <span className={trackingId ? 'text-green-400' : 'text-red-400'}>{trackingId ? '✓ Oui' : '✗ Non'}</span></p>
                        <p>Valeur: <span className="text-blue-400">{trackingId || 'N/A'}</span></p>
                    </div>
                </div>
            </main>
        </div>
    );
}
