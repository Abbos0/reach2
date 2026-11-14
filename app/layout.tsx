import './globals.css';

export const metadata = {
  title: '.',
  description: 'Shaxsiy fayl va xabar uzatish tizimi.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
