import './globals.css'

export const metadata = {
  title: 'Simple Claude Chat',
  description: 'Testing Claude API on Vercel',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
