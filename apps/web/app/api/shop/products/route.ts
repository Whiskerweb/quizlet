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
        const formattedProducts = products.data.map(product => {
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

        return NextResponse.json({ products: formattedProducts });

    } catch (error: any) {
        console.error('[TRAC] Error fetching products:', error);

        return NextResponse.json(
            { error: 'Erreur lors de la récupération des produits' },
            { status: 500 }
        );
    }
}
