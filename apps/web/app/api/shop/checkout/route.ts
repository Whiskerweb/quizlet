import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

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

interface CheckoutItem {
    priceId: string;
    quantity: number;
    name: string;
    price: number;
}

interface CheckoutRequest {
    items: CheckoutItem[];
    clkId: string | null;
    userId?: string;    // Link purchase to user account
    userEmail?: string; // Pre-fill Stripe with user email
}

export async function POST(request: NextRequest) {
    try {
        const body: CheckoutRequest = await request.json();
        const { items, clkId, userId, userEmail } = body;

        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: 'Le panier est vide' },
                { status: 400 }
            );
        }

        // Get the origin for redirect URLs
        const origin = request.headers.get('origin') || 'http://localhost:3000';

        console.log('[TRAC] Creating Stripe Checkout Session');
        console.log('[TRAC] Click ID for attribution:', clkId);
        console.log('[TRAC] Items:', items.length);

        // Create line items for Stripe
        // If priceId starts with 'price_demo', create price_data inline
        // Otherwise use the actual Stripe price ID
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(item => {
            if (item.priceId.startsWith('price_demo')) {
                // Demo mode - create inline price
                return {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: item.name,
                        },
                        unit_amount: item.price,
                        recurring: {
                            interval: 'month' as const,
                        },
                    },
                    quantity: item.quantity,
                };
            } else {
                // Production mode - use actual Stripe price ID
                return {
                    price: item.priceId,
                    quantity: item.quantity,
                };
            }
        });

        // Create Checkout Session with tracking attribution
        // Using 'payment' mode for one-time purchases
        // Change to 'subscription' if your products have recurring prices
        const session = await getStripe().checkout.sessions.create({
            mode: 'payment',
            line_items: lineItems,
            success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/shop/cart`,

            // CRITICAL: Inject click_id for first-party attribution
            // This will be available in the webhook checkout.session.completed event
            client_reference_id: clkId || undefined,

            // Pre-fill customer email if logged in
            customer_email: userEmail || undefined,

            // Store all attribution and user data in metadata (Traaaction format)
            metadata: {
                tracClickId: clkId || '',           // For Traaaction attribution
                tracCustomerExternalId: userId || '', // Same ID as trackLead
                clk_id: clkId || '',                // Legacy format
                user_id: userId || '',              // Link to Cardz user account
                source: 'cardz_shop',
                timestamp: new Date().toISOString(),
            },

            // Optional: collect billing address for tax calculation
            billing_address_collection: 'auto',

            // Optional: allow promotion codes
            allow_promotion_codes: true,
        });

        console.log('[TRAC] Checkout Session created:', session.id);
        console.log('[TRAC] client_reference_id:', session.client_reference_id);

        return NextResponse.json({
            url: session.url,
            sessionId: session.id,
        });

    } catch (error: any) {
        console.error('[TRAC] Checkout error:', error);

        // Handle Stripe specific errors
        if (error.type === 'StripeInvalidRequestError') {
            return NextResponse.json(
                { error: `Erreur Stripe: ${error.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}
