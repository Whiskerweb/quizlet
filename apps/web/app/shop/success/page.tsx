'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight, Package, Mail, Sparkles } from 'lucide-react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [trackingId, setTrackingId] = useState<string | null>(null);

    useEffect(() => {
        // Clear the cart
        localStorage.removeItem('shop_cart');
        window.dispatchEvent(new Event('cart-updated'));

        // Get tracking ID for confirmation
        const clkId = document.cookie.match(/clk_id=([^;]+)/)?.[1] ||
            localStorage.getItem('trac_clk_id') ||
            null;
        setTrackingId(clkId);

        console.log('[TRAC] Checkout completed - Session:', sessionId, 'Click ID:', clkId);
    }, [sessionId]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="relative z-10 max-w-lg w-full">
                {/* Success Card */}
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10 text-center">
                    {/* Animated Checkmark */}
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                        <div className="relative w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-12 h-12 text-white" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-white mb-4">
                        Paiement réussi !
                    </h1>
                    <p className="text-slate-400 mb-8">
                        Merci pour votre achat. Votre abonnement est maintenant actif.
                    </p>

                    {/* Order Details */}
                    <div className="bg-slate-900/50 rounded-2xl p-6 mb-8">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <Sparkles className="w-5 h-5 text-yellow-500" />
                            <span className="text-white font-semibold">Abonnement Premium Activé</span>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between text-slate-400">
                                <span className="flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Session ID
                                </span>
                                <span className="font-mono text-xs truncate max-w-[200px]">
                                    {sessionId || 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                                <span className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Confirmation envoyée
                                </span>
                                <span className="text-green-400">✓</span>
                            </div>
                        </div>
                    </div>

                    {/* Attribution Confirmation */}
                    {trackingId && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-8">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-green-400 font-medium">Attribution enregistrée</span>
                            </div>
                            <p className="text-xs text-slate-500 font-mono">
                                Click ID: {trackingId}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <Link
                            href="/"
                            className="py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02]"
                        >
                            Accéder à mon compte
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            href="/shop"
                            className="py-3 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 font-medium transition-colors"
                        >
                            Retour à la boutique
                        </Link>
                    </div>
                </div>

                {/* Debug Panel */}
                <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-white/10">
                    <h3 className="text-white font-semibold mb-2">🔍 Debug Tracking (Success)</h3>
                    <div className="text-sm text-slate-400 font-mono space-y-1">
                        <p>Session ID: <span className="text-blue-400">{sessionId || 'N/A'}</span></p>
                        <p>Click ID: <span className={trackingId ? 'text-green-400' : 'text-red-400'}>{trackingId || 'Non trouvé'}</span></p>
                        <p>Attribution: <span className="text-green-400">✓ Transmis à Stripe via client_reference_id</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-white">Chargement...</div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
