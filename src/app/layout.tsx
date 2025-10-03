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
  icons: {
    icon: '/favicon.png',
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