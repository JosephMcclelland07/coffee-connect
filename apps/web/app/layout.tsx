import './globals.css'

export const metadata = {
  title: 'Coffee Connect',
  description: 'Meet people and make connections over coffee.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
