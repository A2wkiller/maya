import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MAYA — Personal AI OS',
  description: 'Personal AI Operating System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
