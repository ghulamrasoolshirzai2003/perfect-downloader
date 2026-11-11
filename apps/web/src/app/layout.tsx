import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  title: 'Perfect Downloader — Universal Media Downloader & Online Media Toolkit',
  description:
    'Download media from Internet Archive, Wikimedia Commons, and supported platforms. Fast, online video converter, audio compressor, image resizer, and PDF tools. No accounts required. 100% zero permanent storage.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'Perfect Downloader — Universal Media Downloader & Online Media Toolkit',
    description:
      'Universal online media utility platform. Fast, privacy-conscious media downloader and video, audio, image, and PDF tools.',
    url: 'https://perfectdownloader.com',
    siteName: 'Perfect Downloader',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Perfect Downloader — Universal Media Downloader & Online Media Toolkit',
    description: 'Fast, privacy-conscious media downloader and conversion toolkit.',
  },
};

export const viewport: Viewport = {
  themeColor: '#090D16',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#090D16] text-slate-100 selection:bg-blue-600 selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
