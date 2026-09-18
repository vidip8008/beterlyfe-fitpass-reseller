import { WhatsAppIcon } from "./WhatsAppIcon";
import { supportWhatsAppUrl } from "@/lib/site";
import { buildSupportMessage } from "@/lib/whatsapp";

export function WhatsAppFloat() {
  return (
    <a
      href={supportWhatsAppUrl(buildSupportMessage())}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with BeterLyfe on WhatsApp"
      className="fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center gap-2 rounded-full bg-whatsapp text-whatsapp-foreground shadow-elevated transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-glow sm:bottom-6 sm:right-6 sm:h-auto sm:w-auto sm:px-5 sm:py-3.5"
    >
      <WhatsAppIcon className="size-7 sm:size-6" />
      <span className="hidden text-sm font-bold sm:inline">Chat with us</span>
    </a>
  );
}
