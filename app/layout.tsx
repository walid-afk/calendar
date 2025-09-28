import type { Metadata } from 'next'
import '@shopify/polaris/build/esm/styles.css'
import './globals.css'
import { PolarisProvider } from './components/PolarisProvider'

export const metadata: Metadata = {
  title: 'Interface Employés RDV',
  description: 'Interface de réservation pour les employés',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        <PolarisProvider>
          {children}
        </PolarisProvider>
      </body>
    </html>
  )
}
