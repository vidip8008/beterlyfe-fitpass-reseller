export const SITE = {
  name: "BeterLyfe",
  tagline: "FITPASS Membership Reseller",
  product: "FITPASS 8-Month Membership",
  priceLabel: "₹8,000",
  pricePaise: 800000,
  currency: "INR",
  whatsappDisplay: "+91-9896480241",
  whatsappE164: "919896480241",
  phoneDisplay: "+91-9896480241",
  phoneHref: "tel:+919896480241",
  email: "contact@beterlyfe.com",
  location: "Panipat, Haryana, India",
  voucherEta: "typically within 24–48 hours of payment confirmation (working days)",
  disclaimer:
    "BeterLyfe is an independent reseller of FITPASS memberships and is not the official FITPASS website or FITPASS itself. FITPASS is a trademark of its respective owner. Membership availability, participating gyms and access conditions are subject to applicable FITPASS terms.",
} as const;

/** Official WhatsApp click-to-chat URL for the BeterLyfe support number. */
export function supportWhatsAppUrl(message?: string) {
  const base = `https://wa.me/${SITE.whatsappE164}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** WhatsApp click-to-chat URL for any stored customer number (digits only, with country code). */
export function whatsAppUrlFor(number: string, message?: string) {
  const digits = normalizeWhatsApp(number);
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Normalises Indian WhatsApp numbers to digits with the 91 country code. */
export function normalizeWhatsApp(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) digits = `91${digits.slice(1)}`;
  return digits;
}

export function formatWhatsApp(digits: string) {
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return `+${digits}`;
}

export function formatINR(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export const PAYMENT_STATUS = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
} as const;

export const VOUCHER_STATUS = {
  processing: "Processing",
  voucher_ready: "Voucher Ready",
  sent: "Sent",
  completed: "Completed",
  issue: "Issue",
} as const;

export const WHATSAPP_STATUS = {
  pending: "Pending",
  sent: "Sent",
  failed: "Failed",
} as const;

export type PaymentStatus = keyof typeof PAYMENT_STATUS;
export type VoucherStatus = keyof typeof VOUCHER_STATUS;
export type WhatsAppStatus = keyof typeof WHATSAPP_STATUS;
