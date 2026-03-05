'use client';

import { TracAnalytics } from 'traaaction/react';

export function TracAnalyticsWrapper() {
  return (
    <TracAnalytics
      apiHost="/_trac"
      outboundDomains={['app.cardz.dev', 'shop.cardz.dev']}
      cookieDomain=".cardz.dev"
    />
  );
}
