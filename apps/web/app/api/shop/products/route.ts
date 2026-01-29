import Stripe from 'stripe';
import { NextResponse } from 'next/server';

// Lazy initialize Stripe to avoid build-time errors
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
    if (!stripeInstance) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) {
            throw new Error('STRIPE_SECRET_KEY is not configured');
        }
        stripeInstance = new Stripe(key, {
            apiVersion: '2025-04-30.basil',
        });
    }
    return stripeInstance;
}

export async function GET() {
    try {
        // Fetch active products from Stripe
        const products = await getStripe().products.list({
            active: true,
            limit: 10,
            expand: ['data.default_price'],
        });

        // Format products for frontend
        // Format products for frontend
        let formattedProducts = products.data.map(product => {
            const price = product.default_price as Stripe.Price | null;

            return {
                id: product.id,
                name: product.name,
                description: product.description || '',
                image: product.images?.[0] || null,
                priceId: price?.id || null,
                price: price?.unit_amount || 0,
                currency: price?.currency || 'eur',
                recurring: price?.recurring ? {
                    interval: price.recurring.interval,
                    interval_count: price.recurring.interval_count,
                } : null,
            };
        });

        // Fallback: If no products in Stripe (e.g. new test account), return Demo Products
        if (formattedProducts.length === 0) {
            console.log('[TRAC] No products found in Stripe. Serving Demo Products.');
            formattedProducts = [
                {
                    id: 'prod_demo_1',
                    name: 'Plan Basique (Demo)',
                    description: 'Idéal pour commencer les révisions',
                    image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&q=80',
                    priceId: 'price_demo_basic',
                    price: 999, // 9.99€
                    currency: 'eur',
                    recurring: { interval: 'month', interval_count: 1 }
                },
                {
                    id: 'prod_demo_2',
                    name: 'Plan Pro (Demo)',
                    description: 'Pour les étudiants sérieux',
                    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
                    priceId: 'price_demo_pro',
                    price: 1999, // 19.99€
                    currency: 'eur',
                    recurring: { interval: 'month', interval_count: 1 }
                },
                {
                    id: 'prod_demo_3',
                    name: 'Pack Examens (Demo)',
                    description: 'Tout pour réussir vos partiels',
                    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80',
                    priceId: 'price_demo_exam',
                    price: 4999, // 49.99€ (One-time)
                    currency: 'eur',
                    recurring: null
                }
            ];
        }

        return NextResponse.json({ products: formattedProducts });

    } catch (error: any) {
        console.error('[TRAC] Error fetching products:', error);

        return NextResponse.json(
            { error: 'Erreur lors de la récupération des produits' },
            { status: 500 }
        );
    }
}
