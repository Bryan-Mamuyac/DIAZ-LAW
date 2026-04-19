import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'DIAZ LAW | Lawyer and Notary Public',
  description: 'Professional legal and notarial services by Atty. Jushua Mari Lumague Diaz. Book an appointment online.',
  keywords: 'lawyer, notary public, legal services, Philippines, Diaz Law',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <Navbar />
          <main>{children}</main>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--toast-bg)',
                color: 'var(--toast-color)',
                border: '1px solid var(--toast-border)',
                borderRadius: '6px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.875rem',
                boxShadow: 'var(--shadow-lg)',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
