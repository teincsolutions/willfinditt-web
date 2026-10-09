'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { GA_ID, PIXEL_ID, getConsent, type ConsentChoice } from '@/lib/analytics';

/**
 * Loads GA4 + Meta Pixel only when configured AND consented.
 * Consent Mode v2 defaults to denied; CookieConsent flips to granted.
 */
export function AnalyticsScripts() {
  const [consent, setLocalConsent] = useState<ConsentChoice | null>(null);

  useEffect(() => {
    setLocalConsent(getConsent());
    const onChange = () => setLocalConsent(getConsent());
    window.addEventListener('wf-consent-change', onChange);
    return () => window.removeEventListener('wf-consent-change', onChange);
  }, []);

  if (consent !== 'granted') return null;

  return (
    <>
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('consent', 'default', {
                ad_storage: 'denied',
                analytics_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
              });
              gtag('config', '${GA_ID}', { send_page_view: false });
            `}
          </Script>
        </>
      )}
      {PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
