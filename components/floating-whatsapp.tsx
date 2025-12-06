'use client';

import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '+919875334135';

export function FloatingWhatsapp() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER.replace(/[^\d]/g, '')}?text=${encodeURIComponent('Hi! I would like to book a mock HR interview.')}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 font-semibold text-white shadow-2xl transition hover:scale-105"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-5 w-5" /> Chat on WhatsApp
    </a>
  );
}
