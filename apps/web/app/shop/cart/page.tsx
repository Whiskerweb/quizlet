'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Plus, Minus, CreditCard, ShieldCheck, Loader2, LogIn, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface CartItem {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    priceId: string;
    quantity: number;
}

function formatPrice(amount: number, currency: string) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(amount / 100);
}

export default function CartPage() {
    const router = useRouter();
    const { user, profile, loading: authLoading, isAuthenticated } = useAuthStore();

    const [cart, setCart] = useState<CartItem[]>([]);
    const [trackingId, setTrackingId] = useState<string | null>(null);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Load cart from localStorage
        const savedCart = JSON.parse(localStorage.getItem('shop_cart') || '[]');
        setCart(savedCart);

        // Get tracking ID
        const clkId = document.cookie.match(/clk_id=([^;]+)/)?.[1] ||
            localStorage.getItem('trac_clk_id') ||
            localStorage.getItem('shop_cart_clk_id') ||
            null;
        setTrackingId(clkId);

        console.log('[TRAC] Cart page loaded - Click ID:', clkId);
    }, []);

    const updateQuantity = (productId: string, delta: number) => {
        const newCart = cart.map(item => {
            if (item.id === productId) {
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0);

        setCart(newCart);
        localStorage.setItem('shop_cart', JSON.stringify(newCart));
        window.dispatchEvent(new Event('cart-updated'));
    };

    const removeItem = (productId: string) => {
        const newCart = cart.filter(item => item.id !== productId);
        setCart(newCart);
        localStorage.setItem('shop_cart', JSON.stringify(newCart));
        window.dispatchEvent(new Event('cart-updated'));
    };

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const currency = cart[0]?.currency || 'eur';

    const handleCheckout = async () => {
        // Check if user is authenticated
        if (!isAuthenticated()) {
            // Redirect to login with return URL
            router.push(`/login?redirect=/shop/cart`);
            return;
        }

        setIsCheckingOut(true);
        setError(null);

        try {
            // Get the click_id for attribution
            const clkId = document.cookie.match(/clk_id=([^;]+)/)?.[1] ||
                localStorage.getItem('trac_clk_id') ||
                localStorage.getItem('shop_cart_clk_id') ||
                null;

            console.log('[TRAC] Initiating checkout with Click ID:', clkId);
            console.log('[SHOP] User ID:', user?.id);

            const response = await fetch('/api/shop/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart.map(item => ({
                        priceId: item.priceId,
                        quantity: item.quantity,
                        name: item.name,
                        price: item.price,
                    })),
                    clkId,
                    userId: user?.id, // Link purchase to user account
                    userEmail: user?.email,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la création du checkout');
            }

            // Redirect to Stripe Checkout
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err: any) {
            console.error('[TRAC] Checkout error:', err);
            setError(err.message);
        } finally {
            setIsCheckingOut(false);
        }
    };

    const handleLoginRedirect = () => {
        router.push(`/login?redirect=/shop/cart`);
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
                            Continuer mes achats
                        </Link>

                        <h1 className="text-xl font-bold text-white">Votre Panier</h1>

                        {/* User Status */}
                        <div className="flex items-center gap-2">
                            {authLoading ? (
                                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                            ) : isAuthenticated() ? (
                                <div className="flex items-center gap-2 text-green-400">
                                    <User className="w-4 h-4" />
                                    <span className="text-sm">{profile?.username || user?.email}</span>
                                </div>
                            ) : (
                                <button
                                    onClick={handleLoginRedirect}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm transition-colors"
                                >
                                    <LogIn className="w-4 h-4" />
                                    Se connecter
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {cart.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-6">🛒</div>
                        <h2 className="text-2xl font-bold text-white mb-4">Votre panier est vide</h2>
                        <p className="text-slate-400 mb-8">Découvrez nos offres et commencez votre abonnement</p>
                        <Link
                            href="/shop"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-medium hover:scale-105 transition-transform"
                        >
                            Voir les offres
                        </Link>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {cart.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 flex gap-6"
                                >
                                    {/* Product Image */}
                                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500/30 to-purple-600/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <span className="text-4xl">💎</span>
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-white mb-1">{item.name}</h3>
                                        <p className="text-slate-400 text-sm mb-4">{item.description}</p>

                                        <div className="flex items-center justify-between">
                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-colors"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="text-white font-medium w-8 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Price & Remove */}
                                            <div className="flex items-center gap-4">
                                                <span className="text-xl font-bold text-white">
                                                    {formatPrice(item.price * item.quantity, item.currency)}
                                                </span>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 sticky top-24">
                                <h2 className="text-xl font-bold text-white mb-6">Récapitulatif</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-slate-400">
                                        <span>Sous-total</span>
                                        <span>{formatPrice(subtotal, currency)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>Taxes</span>
                                        <span>Calculées au paiement</span>
                                    </div>
                                    <div className="border-t border-white/10 pt-4">
                                        <div className="flex justify-between text-white">
                                            <span className="font-semibold">Total</span>
                                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                                {formatPrice(subtotal, currency)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Auth Required Message */}
                                {!authLoading && !isAuthenticated() && (
                                    <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <LogIn className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-amber-400 font-medium text-sm">Connexion requise</p>
                                                <p className="text-slate-400 text-xs mt-1">
                                                    Vous devez être connecté pour finaliser votre achat et accéder à votre contenu.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Checkout Button */}
                                {isAuthenticated() ? (
                                    <button
                                        onClick={handleCheckout}
                                        disabled={isCheckingOut}
                                        className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        {isCheckingOut ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Redirection...
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard className="w-5 h-5" />
                                                Payer avec Stripe
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleLoginRedirect}
                                        disabled={authLoading}
                                        className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02]"
                                    >
                                        <LogIn className="w-5 h-5" />
                                        Se connecter pour payer
                                    </button>
                                )}

                                {/* Trust Badge */}
                                <div className="mt-4 flex items-center justify-center gap-2 text-slate-400 text-sm">
                                    <ShieldCheck className="w-4 h-4" />
                                    Paiement sécurisé par Stripe
                                </div>

                                {/* Attribution Info */}
                                {trackingId && (
                                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                            <span className="text-green-400 text-xs font-medium">Attribution active</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 font-mono truncate">
                                            ID: {trackingId}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Debug Panel */}
                <div className="mt-12 p-4 bg-slate-800/50 rounded-xl border border-white/10">
                    <h3 className="text-white font-semibold mb-2">🔍 Debug Tracking (Cart Page)</h3>
                    <div className="text-sm text-slate-400 font-mono space-y-1">
                        <p>Click ID Cookie: <span className={trackingId ? 'text-green-400' : 'text-red-400'}>{trackingId || 'Non trouvé'}</span></p>
                        <p>LocalStorage Backup: <span className="text-blue-400">{typeof window !== 'undefined' ? (localStorage.getItem('trac_clk_id') || 'N/A') : 'N/A'}</span></p>
                        <p>Cart clk_id Backup: <span className="text-purple-400">{typeof window !== 'undefined' ? (localStorage.getItem('shop_cart_clk_id') || 'N/A') : 'N/A'}</span></p>
                        <p>Articles dans le panier: <span className="text-yellow-400">{cart.length}</span></p>
                        <p>Utilisateur: <span className={isAuthenticated() ? 'text-green-400' : 'text-red-400'}>{isAuthenticated() ? (user?.email || 'Connecté') : 'Non connecté'}</span></p>
                        <p>User ID: <span className="text-cyan-400">{user?.id || 'N/A'}</span></p>
                    </div>
                </div>
            </main>
        </div>
    );
}
