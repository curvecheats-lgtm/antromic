import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { NavigationProgress } from '@/components/page-transition'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const minecraftia = localFont({
  src: '../public/fonts/Minecraftia-Regular.ttf',
  variable: '--font-minecraft',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Curve.cc - Premium Software',
  description: 'Premium software licensing and authentication system',
  icons: {
    icon: '/images/logo.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#dc2626',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${minecraftia.variable} font-sans antialiased bg-background text-foreground`}>
        <AuthProvider>
          <NavigationProgress />
          {children}
        </AuthProvider>
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
