'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { GA_ID, PIXEL_ID, getConsent, type ConsentPreferences } from '@/lib/analytics';

/**
 * Loads GA4 when analytics consent is granted, Meta Pixel when marketing
 * consent is granted. Consent Mode v2 defaults to denied; CookieConsent
 * (or the /cookie-policy page) flips the stored preferences.
 */
export function AnalyticsScripts() {
  const [consent, setLocalConsent] = useState<ConsentPreferences | null>(null);

  useEffect(() => {
    setLocalConsent(getConsent());
    const onChange = () => setLocalConsent(getConsent());
    window.addEventListener('wf-consent-change', onChange);
    return () => window.removeEventListener('wf-consent-change', onChange);
  }, []);

  return (
    <>
      {GA_ID && consent?.analytics && (
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
              // Re-apply a previously stored grant (update at choose-time
              // no-ops if gtag wasn't loaded yet).
              try {
                var wfStored = JSON.parse(localStorage.getItem('wf-tracking-consent') || 'null');
                if (wfStored && wfStored.analytics) {
                  gtag('consent', 'update', { analytics_storage: 'granted' });
                }
                if (wfStored && wfStored.marketing) {
                  gtag('consent', 'update', {
                    ad_storage: 'granted',
                    ad_user_data: 'granted',
                    ad_personalization: 'granted'
                  });
                }
              } catch (e) {}
              gtag('config', '${GA_ID}', { send_page_view: false });
            `}
          </Script>
        </>
      )}
      {PIXEL_ID && consent?.marketing && (
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
