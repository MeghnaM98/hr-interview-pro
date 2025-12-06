import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/header';
import { FloatingWhatsapp } from '@/components/floating-whatsapp';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export const metadata: Metadata = {
  title: 'HR Interview Pro | Mock HR Interviews & JD Feedback',
  description:
    'HR Interview Pro delivers personalized HR mock interviews, JD-based feedback, and curated practice question banks to help students ace placements.',
  metadataBase: new URL('https://hr-interview-pro.example.com'),
  openGraph: {
    title: 'HR Interview Pro',
    description: 'Personalized HR mock interviews for students',
    type: 'website',
    url: 'https://hr-interview-pro.example.com'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="bg-warm-slate text-slate-900 antialiased">
        <Header />
        <main className="pt-24 lg:pt-28">{children}</main>
        <FloatingWhatsapp />
      </body>
    </html>
  );
}
