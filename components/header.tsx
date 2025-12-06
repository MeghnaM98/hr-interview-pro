'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Calendar, Menu, X } from 'lucide-react';

const navLinks = [
  { href: '#about', label: 'About' },
  { href: '#process', label: 'Process' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#booking', label: 'Book' }
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/30 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="#hero" className="font-display text-xl font-semibold tracking-tight text-slate-900">
          HR Interview Pro
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-slate-900">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:block">
          <Link href="#booking" className="button-primary text-sm">
            <Calendar className="mr-2 h-4 w-4" /> Book Now
          </Link>
        </div>
        <button
          type="button"
          className="inline-flex rounded-full border border-slate-200 p-2 text-slate-700 md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-white/30 bg-white/90 px-6 pb-6 pt-2 shadow-lg md:hidden">
          <nav className="flex flex-col gap-4 text-sm font-medium text-slate-700">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link
              href="#booking"
              onClick={() => setOpen(false)}
              className="button-primary w-full justify-center text-center text-sm"
            >
              <Calendar className="mr-2 h-4 w-4" /> Book Now
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
