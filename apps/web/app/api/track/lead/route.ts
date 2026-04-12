import { Traaaction } from 'traaaction';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

let trac: Traaaction | null = null;

function getTraaaction() {
  if (!trac) {
    trac = new Traaaction();
  }
  return trac;
}

export async function POST(request: NextRequest) {
  try {
    const { customerId, customerEmail, eventName = 'sign_up' } = await request.json();

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }

    const store = await cookies();
    const clickId = store.get('trac_click_id')?.value;

    console.log('[TRAC] Server-side lead tracking:', { clickId, customerId, customerEmail, eventName });

    await getTraaaction().track.lead({
      clickId,
      customerId,
      eventName,
      customerEmail,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[TRAC] Server-side lead tracking error:', error);
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 });
  }
}
