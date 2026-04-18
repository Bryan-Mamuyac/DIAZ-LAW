import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'DIAZ LAW | Lawyer and Notary Public',
  description: 'Professional legal services and notarial services by Atty. Jushua Mari Lumague Diaz. Book an appointment online.',
  keywords: 'lawyer, notary public, legal services, Philippines, Diaz Law',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Source+Sans+3:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
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
                fontFamily: "'Source Sans 3', sans-serif",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
