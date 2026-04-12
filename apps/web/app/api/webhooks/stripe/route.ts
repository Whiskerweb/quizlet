import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Lazy initialize Stripe
let stripeInstance: Stripe | null = null;
function getStripe(): Stripe {
    if (!stripeInstance) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
        stripeInstance = new Stripe(key, { apiVersion: '2025-04-30.basil' });
    }
    return stripeInstance;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = headers().get('stripe-signature');
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret || !signature) {
            console.warn('[WEBHOOK] Missing secret or signature - skipping verification for dev mode if not set');
            // In production, return an error here. For now, if secret isn't set, we might not be able to verify.
            if (!webhookSecret) {
                return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 400 });
            }
        }

        let event: Stripe.Event;

        try {
            event = getStripe().webhooks.constructEvent(body, signature!, webhookSecret!);
        } catch (err: any) {
            console.error(`[WEBHOOK] Signature verification failed: ${err.message}`);
            return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;

            console.log('💰 [FINANCIAL] Processing Checkout Session:', session.id);

            // Attribution Data
            const clickId = session.client_reference_id || session.metadata?.clk_id || 'N/A';
            console.log('🔗 [TRACKING] Click ID:', clickId);

            // Financial Calculation
            // We need to fetch the PaymentIntent and then the BalanceTransaction to get exact fees
            // Note: PaymentIntent might not be immediate for some payment methods, but usually is for cards.
            let gross = session.amount_total || 0;
            let fee = 0;
            let net = 0;
            let tax = session.total_details?.amount_tax || 0;

            if (session.payment_intent && typeof session.payment_intent === 'string') {
                const paymentIntent = await getStripe().paymentIntents.retrieve(session.payment_intent, {
                    expand: ['latest_charge.balance_transaction'],
                });

                const charge = paymentIntent.latest_charge as Stripe.Charge;
                const balanceTx = charge?.balance_transaction as Stripe.BalanceTransaction;

                if (balanceTx) {
                    fee = balanceTx.fee;
                    net = balanceTx.net; // This is Gross - Fee. Does it deduct Tax? 
                    // Stripe Balance Transaction Net is usually (Amount - Stripe Fees). 
                    // If application_fee is used, it's deducted too.
                    // Tax handling depends on if Stripe Tax is used.

                    // Let's rely on the formula: Revenu_net = Montant_brut - (Frais_Stripe + Taxes)
                    // If 'net' from balanceTx includes tax deduction logic (unlikely unless Platform tax), we should check.
                    // Standard Stripe checkout: Balance Net = Amount - Fee. 
                    // Tax is usually part of the Amount unless it's Stripe Tax API separate calculation.
                    // If we want "True Net Revenue" (profit), we must deduct Tax if it's collected.

                    const calculatedNet = gross - (fee + tax);

                    console.log('\n📊 [REPORT] VALIDATION FINANCIERE');
                    console.log('-----------------------------------');
                    console.log(`Brut (Gross):   ${(gross / 100).toFixed(2)} ${session.currency?.toUpperCase()}`);
                    console.log(`Taxes:          ${(tax / 100).toFixed(2)} ${session.currency?.toUpperCase()}`);
                    console.log(`Frais Stripe:   ${(fee / 100).toFixed(2)} ${session.currency?.toUpperCase()}`);
                    console.log('-----------------------------------');
                    console.log(`REVENU NET:     ${(calculatedNet / 100).toFixed(2)} ${session.currency?.toUpperCase()}`);
                    console.log('-----------------------------------\n');

                } else {
                    console.log('⚠️ [FINANCIAL] Could not retrieve balance transaction details yet.');
                }
            } else {
                console.log('⚠️ [FINANCIAL] No payment_intent found (subscription mode mostly?)');
                // For subscriptions, we look at invoice.
            }
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error(`[WEBHOOK] Error: ${err.message}`);
        return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 });
    }
}
