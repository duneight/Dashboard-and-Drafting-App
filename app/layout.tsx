import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Navbar } from './components/Navbar'
import { QueryProvider } from './components/QueryProvider'
import { DevRefreshButton } from './components/DevRefreshButton'
import { DraftNavbarProvider } from './components/DraftNavbarProvider'

// Configure the font
const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  title: 'Fantasy NHL Stats',
  description: 'Hall of Fame and Wall of Shame for your Fantasy NHL leagues',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${jakarta.variable} font-sans`}>
        <QueryProvider>
          <DraftNavbarProvider>
            <div className="relative flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              {/* Dev Refresh Button - Top Right */}
              <DevRefreshButton />
            </div>
          </DraftNavbarProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
