/**
 * Traaaction Lead Tracking Utility
 * 
 * Call this after user registration to track the signup event
 * and enable automatic attribution for all future purchases.
 */

interface TrackLeadParams {
    customerExternalId: string;  // User ID from your database
    customerEmail?: string;
    eventName?: string;
}

/**
 * Track a lead (signup) event to Traaaction
 * 
 * This enables automatic attribution: once a lead is created,
 * all future sales from this customer are automatically attributed.
 * 
 * @param params - Lead tracking parameters
 * @returns Promise that resolves when tracking is complete
 */
export async function trackLead(params: TrackLeadParams): Promise<void> {
    const { customerExternalId, customerEmail, eventName = 'sign_up' } = params;

    // Get click_id from cookie or localStorage
    const getClickId = (): string | null => {
        if (typeof document !== 'undefined') {
            // Try cookie first
            const match = document.cookie.match(/trac_id=([^;]+)/);
            if (match) return match[1];
        }

        if (typeof localStorage !== 'undefined') {
            // Fallback to localStorage
            return localStorage.getItem('trac_id') ||
                localStorage.getItem('trac_clk_id') ||
                localStorage.getItem('shop_cart_clk_id');
        }

        return null;
    };

    const clickId = getClickId();

    console.log('[TRAC] Tracking lead:', {
        eventName,
        customerExternalId,
        customerEmail,
        clickId,
    });

    try {
        const response = await fetch('/_trac/api/track/lead', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-publishable-key': 'pk_4BiQkq4hhYX25yUoQkYkGO35',
            },
            body: JSON.stringify({
                eventName,
                customerExternalId,
                clickId,
                customerEmail,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('[TRAC] Lead tracking failed:', error);
        } else {
            console.log('[TRAC] Lead tracked successfully');
        }
    } catch (error) {
        // Don't throw - tracking failures shouldn't break signup
        console.error('[TRAC] Lead tracking error:', error);
    }
}

/**
 * Get the current click ID for attribution
 * Use this when creating Stripe checkout sessions
 */
export function getTracClickId(): string | null {
    if (typeof document !== 'undefined') {
        const match = document.cookie.match(/trac_id=([^;]+)/);
        if (match) return match[1];
    }

    if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('trac_id') ||
            localStorage.getItem('trac_clk_id') ||
            localStorage.getItem('shop_cart_clk_id');
    }

    return null;
}
