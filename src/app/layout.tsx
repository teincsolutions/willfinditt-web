import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ClientLayout } from './client-layout';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://willfinditt.com'),
  title: {
    template: '%s | WillfindITT',
    default: 'WillfindITT - Buy and Sell Anything in Ghana',
  },
  description:
    'WillfindITT is the best place to buy and sell cars, phones, electronics, real estate, and more in Ghana. Find great deals near you.',
  keywords: [
    'buy and sell Ghana',
    'marketplace Ghana',
    'cars for sale Ghana',
    'phones for sale',
    'electronics Ghana',
    'real estate Ghana',
    'classifieds Ghana',
    'WillfindITT',
  ],
  authors: [{ name: 'WillfindITT' }],
  creator: 'WillfindITT',
  publisher: 'WillfindITT',
  icons: {
    icon: '/images/logo-favicon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    url: 'https://willfinditt.com',
    siteName: 'WillfindITT',
    title: 'WillfindITT - Buy and Sell Anything in Ghana',
    description:
      'WillfindITT is the best place to buy and sell cars, phones, electronics, real estate, and more in Ghana.',
    images: [
      {
        url: '/images/og-default.png',
        width: 1200,
        height: 630,
        alt: 'WillfindITT - Buy and Sell Anything in Ghana',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WillfindITT - Buy and Sell Anything in Ghana',
    description:
      'WillfindITT is the best place to buy and sell cars, phones, electronics, real estate, and more in Ghana.',
    images: ['/images/og-default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  other: {
    // Safari smart app banner (Open/View in the App Store).
    'apple-itunes-app': 'app-id=6755352985',
    // Some Android browsers/older Chrome use this; App Links still handle
    // content links once the app is installed.
    'google-play-app': 'app-id=com.willfinditt.willfinditt',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
