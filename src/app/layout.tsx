import { Montserrat } from 'next/font/google'
import './globals.css'
import '../styles/math.css'
import 'katex/dist/katex.min.css'
import Providers from './providers'

const montserrat = Montserrat({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
})

export const metadata = {
  title: 'PansGPT - AI Academic Assistant',
  description: 'AI-powered academic assistant for students',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PansGPT',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'PansGPT',
    title: 'PansGPT - AI Academic Assistant',
    description: 'AI-powered academic assistant for students',
  },
  twitter: {
    card: 'summary',
    title: 'PansGPT - AI Academic Assistant',
    description: 'AI-powered academic assistant for students',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark">
      <body className={`${montserrat.variable} font-sans h-full`}>
        <Providers>
          <main className="min-h-screen">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
} 