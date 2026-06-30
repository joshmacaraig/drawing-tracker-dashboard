import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Drawing Tracker Dashboard',
  description: 'Construction drawing status tracking and management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <Providers>
          <Navbar />
          <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
