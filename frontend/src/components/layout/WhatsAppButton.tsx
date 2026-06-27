/*
 * File:    frontend/src/components/layout/WhatsAppButton.tsx
 * Purpose: Floating WhatsApp chat button shown on every public page —
 *          opens a chat with the Skillship contact number.
 * Owner:   Pranav
 */

const WHATSAPP_NUMBER = "919368408577";
const WHATSAPP_MESSAGE = "Hi Skillship, I'd like to know more about the AI School Program.";

export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] shadow-lg transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-xl"
    >
      <svg
        viewBox="0 0 24 24"
        width={28}
        height={28}
        fill="white"
        aria-hidden
      >
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.87.5 3.62 1.45 5.12L2 22l5.13-1.55a9.84 9.84 0 0 0 4.91 1.31h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.4 17.5 2 12.04 2zm5.78 14.09c-.24.69-1.42 1.32-1.96 1.4-.5.08-1.13.11-1.83-.12-.42-.13-.96-.31-1.65-.6-2.91-1.26-4.81-4.18-4.95-4.37-.14-.19-1.18-1.57-1.18-2.99 0-1.42.74-2.11 1-2.4.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.42-.07.65.5.24.59.81 2.04.88 2.19.07.15.12.32.02.52-.1.19-.15.31-.3.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.78 1.28 1.67 2.07 1.15 1.02 2.13 1.34 2.43 1.49.3.15.48.13.65-.05.18-.18.76-.88.96-1.18.2-.3.4-.25.66-.15.27.1 1.7.8 1.99.95.3.15.49.22.56.34.08.13.08.74-.16 1.43z" />
      </svg>
    </a>
  );
}
