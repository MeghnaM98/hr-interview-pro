import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/header';
import { FloatingWhatsapp } from '@/components/floating-whatsapp';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export const metadata: Metadata = {
  title: 'HR Interview Pro | Mock Interviews for Students',
  description: 'Ace your HR round with personalized mock interviews, JD-based feedback, and curated question banks.',
  keywords: ['HR Interview', 'MBA Placement', 'Mock Interview', 'Resume Review'],
  openGraph: {
    title: 'HR Interview Pro | Mock Interviews for Students',
    description: 'Ace your HR round with personalized mock interviews, JD-based feedback, and curated question banks.',
    type: 'website',
    url: 'https://hr-interview-pro.example.com'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HR Interview Pro | Mock Interviews for Students',
    description: 'Ace your HR round with personalized mock interviews, JD-based feedback, and curated question banks.'
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
