'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Sparkles, Star, ArrowRight, Loader2 } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    image: string | null;
    priceId: string | null;
    recurring: { interval: string; interval_count: number } | null;
}

function formatPrice(amount: number, currency: string) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(amount / 100);
}

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: () => void }) {
    const [isHovered, setIsHovered] = useState(false);
    const [isAdded, setIsAdded] = useState(false);

    const handleAddToCart = () => {
        onAddToCart();
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 1500);
    };

    return (
        <div
            className="group relative bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/10 transition-all duration-500 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Glow effect */}
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 transition-opacity duration-500 ${isHovered ? 'opacity-100' : ''}`} />

            {/* Badge */}
            <div className="absolute -top-3 -right-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Stripe
            </div>

            {/* Product Image */}
            <div className="relative h-48 bg-gradient-to-br from-blue-500/30 to-purple-600/30 rounded-2xl mb-6 flex items-center justify-center overflow-hidden">
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="text-6xl">💎</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
            </div>

            {/* Product Info */}
            <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{product.description || 'Produit Stripe'}</p>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                    <span className="text-slate-400 text-sm ml-2">(128 avis)</span>
                </div>

                {/* Price */}
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            {formatPrice(product.price, product.currency)}
                        </span>
                        {product.recurring && (
                            <span className="text-slate-500 text-sm">/{product.recurring.interval}</span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Link
                        href={`/shop/product/${product.id}`}
                        className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium text-center transition-all duration-300"
                    >
                        Détails
                    </Link>
                    <button
                        onClick={handleAddToCart}
                        disabled={!product.priceId}
                        className={`flex-1 py-3 px-4 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all duration-300 ${isAdded
                                ? 'bg-green-500'
                                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-105'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <ShoppingCart className="w-4 h-4" />
                        {isAdded ? 'Ajouté !' : 'Ajouter'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ShopPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cartCount, setCartCount] = useState(0);
    const [trackingId, setTrackingId] = useState<string | null>(null);

    useEffect(() => {
        // Fetch products from Stripe
        async function fetchProducts() {
            try {
                const res = await fetch('/api/shop/products');
                const data = await res.json();

                if (data.error) {
                    setError(data.error);
                } else {
                    setProducts(data.products || []);
                }
            } catch (err) {
                setError('Erreur de connexion au serveur');
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();

        // Update cart count
        const updateCartCount = () => {
            if (typeof window !== 'undefined') {
                const cart = JSON.parse(localStorage.getItem('shop_cart') || '[]');
                const count = cart.reduce((acc: number, item: any) => acc + item.quantity, 0);
                setCartCount(count);
            }
        };

        // Get tracking ID
        if (typeof window !== 'undefined') {
            const clkId = document.cookie.match(/clk_id=([^;]+)/)?.[1] ||
                localStorage.getItem('trac_clk_id') ||
                null;
            setTrackingId(clkId);
        }

        updateCartCount();
        window.addEventListener('cart-updated', updateCartCount);
        return () => window.removeEventListener('cart-updated', updateCartCount);
    }, []);

    const addToCart = (product: Product) => {
        if (!product.priceId) return;

        const cart = JSON.parse(localStorage.getItem('shop_cart') || '[]');

        const existingIndex = cart.findIndex((item: any) => item.id === product.id);
        if (existingIndex >= 0) {
            cart[existingIndex].quantity += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                currency: product.currency,
                priceId: product.priceId,
                quantity: 1
            });
        }

        // Save cart with clk_id for attribution
        const clkId = document.cookie.match(/clk_id=([^;]+)/)?.[1] ||
            localStorage.getItem('trac_clk_id') ||
            null;

        localStorage.setItem('shop_cart', JSON.stringify(cart));
        localStorage.setItem('shop_cart_clk_id', clkId || '');

        window.dispatchEvent(new Event('cart-updated'));
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
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            CARDZ Shop
                        </Link>

                        <div className="flex items-center gap-4">
                            {/* Tracking Status Badge */}
                            {trackingId && (
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-green-400 text-xs font-medium">Tracked</span>
                                </div>
                            )}

                            {/* Cart */}
                            <Link
                                href="/shop/cart"
                                className="relative p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300"
                            >
                                <ShoppingCart className="w-5 h-5 text-white" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
                        Passez au{' '}
                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Premium
                        </span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Débloquez toutes les fonctionnalités et boostez votre apprentissage avec nos offres exclusives.
                    </p>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                        <p className="text-slate-400">Chargement des produits depuis Stripe...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-6">⚠️</div>
                        <h2 className="text-2xl font-bold text-white mb-4">Erreur de connexion</h2>
                        <p className="text-slate-400 mb-8">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-medium"
                        >
                            Réessayer
                        </button>
                    </div>
                )}

                {/* Products Grid */}
                {!loading && !error && (
                    <>
                        {products.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-6">📦</div>
                                <h2 className="text-2xl font-bold text-white mb-4">Aucun produit trouvé</h2>
                                <p className="text-slate-400">Créez des produits dans votre dashboard Stripe.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                                {products.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onAddToCart={() => addToCart(product)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* CTA Section */}
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-3xl p-8 border border-white/10 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">
                        Besoin d'aide pour choisir ?
                    </h2>
                    <p className="text-slate-400 mb-6">
                        Notre équipe est là pour vous guider vers l'offre parfaite.
                    </p>
                    <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all duration-300"
                    >
                        Contactez-nous
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Debug Panel */}
                <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-white/10">
                    <h3 className="text-white font-semibold mb-2">🔍 Debug Tracking</h3>
                    <div className="text-sm text-slate-400 font-mono">
                        <p>Click ID: <span className={trackingId ? 'text-green-400' : 'text-red-400'}>{trackingId || 'Not found'}</span></p>
                        <p>Cart Items: <span className="text-blue-400">{cartCount}</span></p>
                        <p>Stripe Products: <span className="text-purple-400">{products.length}</span></p>
                    </div>
                </div>
            </main>
        </div>
    );
}
