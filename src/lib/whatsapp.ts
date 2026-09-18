import { whatsAppUrlFor } from "./site";

/**
 * WhatsApp fulfilment messaging.
 *
 * Today the admin opens a pre-filled WhatsApp chat and presses Send manually.
 * When WhatsApp Business API automation is introduced later, reuse
 * `buildVoucherMessage` as the template and swap `openVoucherChatUrl`
 * for an API send — the rest of the admin flow stays unchanged.
 */

export interface VoucherMessageInput {
  customer_name: string;
  order_id: string;
  voucher_code?: string | null;
  voucher_instructions?: string | null;
}

export function buildVoucherMessage(o: VoucherMessageInput) {
  return [
    `Hi ${o.customer_name} 👋`,
    "",
    "Your 8-month FITPASS membership voucher is ready.",
    "",
    `Order ID: ${o.order_id}`,
    "",
    `Voucher Code: ${o.voucher_code?.trim() || "(to be added)"}`,
    "",
    "Activation Instructions:",
    o.voucher_instructions?.trim() || "(to be added)",
    "",
    "If you need any help, feel free to contact BeterLyfe Support.",
    "",
    "BeterLyfe",
  ].join("\n");
}

export function openVoucherChatUrl(whatsappNumber: string, input: VoucherMessageInput) {
  return whatsAppUrlFor(whatsappNumber, buildVoucherMessage(input));
}

export function buildSupportMessage(orderId?: string) {
  return orderId
    ? `Hi BeterLyfe, I need help with my FITPASS order. Order ID: ${orderId}`
    : "Hi BeterLyfe, I have a question about the FITPASS 8-month membership.";
}
