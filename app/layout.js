import './globals.css'

export const metadata = {
  title: 'Jalan Ninjaku - Ngobrol soal kerjaan, usaha, arah hidup',
  description: 'Tempat ngobrol santai soal kerjaan, usaha, dan arah hidup. Bukan coaching, bukan konsultasi — lebih kayak ngobrol sama temen.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
