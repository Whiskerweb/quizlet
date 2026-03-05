/**
 * Traaaction Lead Tracking Utility (client-side wrapper)
 *
 * Calls the server-side API route which uses the official Traaaction SDK
 * to track leads with click_id from cookies.
 */

interface TrackLeadParams {
    customerExternalId: string;
    customerEmail?: string;
    eventName?: string;
}

export async function trackLead(params: TrackLeadParams): Promise<void> {
    const { customerExternalId, customerEmail, eventName = 'sign_up' } = params;

    console.log('[TRAC] Tracking lead:', { eventName, customerExternalId, customerEmail });

    try {
        const response = await fetch('/api/track/lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerId: customerExternalId,
                customerEmail,
                eventName,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('[TRAC] Lead tracking failed:', error);
        } else {
            console.log('[TRAC] Lead tracked successfully');
        }
    } catch (error) {
        console.error('[TRAC] Lead tracking error:', error);
    }
}
